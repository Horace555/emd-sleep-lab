'use strict';
const $=id=>document.getElementById(id),C={cyan:'#62dfdc',yellow:'#f1cf79',pink:'#eb99b5',blue:'#86acff',muted:'#a5b4cc'};
const inputIds=['slow','fast','freq','noise','center','burst'];
let signal,result,iteration=0,modeIndex=0,frame,selected=[],imported=null,baseline=null,analysis=null,mission='amplitude';
const presets={spindle:{slow:30,fast:20,freq:13,noise:2,center:3,burst:true},slow:{slow:65,fast:10,freq:13,noise:1,center:3,burst:true},continuous:{slow:30,fast:20,freq:13,noise:0,center:3,burst:false},noisy:{slow:30,fast:20,freq:13,noise:12,center:3,burst:true}};
const missions={
 amplitude:{title:'變高，不等於變快。',action:'先按「記住目前波形」，再把快波振幅由 20 拉到 40 μV。接著只改快波頻率，由 13 拉到 18 Hz。',meaning:'振幅改變高度；頻率改變每秒重複的次數。兩者不是同一個旋鈕，也不能直接等同睡眠深度。',preset:'continuous'},
 timing:{title:'整段都一樣嗎？找到短暫事件。',action:'先記住波形，再把快波出現時間從 3 秒移到 4 秒。比較原始訊號與整段頻譜，然後往下看 Hilbert 振幅。',meaning:'事件的位置在時域直接可見；整段頻譜不直接給出事件時間。分量的局部振幅可能幫忙描述它。',preset:'spindle'},
 noise:{title:'多拆出幾層，就是更多資訊？',action:'先把雜訊設成 0，記住波形；再把雜訊拉到 12 μV。往下比較分量數與第一層的形狀。',meaning:'高頻起伏可能來自雜訊，也可能是真訊號。不能把 IMF 1 固定當成雜訊，或用分量數判斷睡眠階段。',preset:'spindle'},
 sifting:{title:'扣過一次，為什麼還不停止？',action:'往下點「後一次篩分」，看三張停止檢查卡；再按「看停止的那一步」。最後切換 0.02 與 0.10 門檻。',meaning:'停止來自明確條件，不是看起來平滑。達到次數上限但沒通過的，只能叫候選分量。',preset:'spindle'}
};
function plot(canvas,series,{maxX,fs=signal?.fs||128,spectral=false,positive=false,dots=[]}={}){
 const w=canvas.clientWidth,h=canvas.clientHeight;if(w<1||h<1)return;
 const dpr=window.devicePixelRatio||1;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
 const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);const pad={l:48,r:12,t:12,b:28},pw=w-pad.l-pad.r,ph=h-pad.t-pad.b;
 maxX=maxX||signal?.x.length/fs||6;
 let peak=.01;for(const s of series)for(const v of s.y)if(Number.isFinite(v))peak=Math.max(peak,Math.abs(v));
 const ymax=spectral?1.08:peak*1.13,ymin=spectral||positive?0:-ymax;
 const xx=v=>pad.l+v/maxX*pw,yy=v=>pad.t+(ymax-v)/(ymax-ymin)*ph;
 ctx.font='11px system-ui';ctx.textBaseline='middle';ctx.lineWidth=1;
 for(let k=0;k<=4;k++){const val=ymin+(ymax-ymin)*k/4,y=yy(val);ctx.strokeStyle='#28354a';ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();ctx.fillStyle=C.muted;ctx.textAlign='right';ctx.fillText(Math.abs(ymax)<10?val.toFixed(1):Math.round(val),pad.l-7,y);}
 const ticks=w<400?3:6;
 for(let k=0;k<=ticks;k++){const val=maxX*k/ticks,x=xx(val);ctx.strokeStyle='#202e43';ctx.beginPath();ctx.moveTo(x,pad.t);ctx.lineTo(x,h-pad.b);ctx.stroke();ctx.fillStyle=C.muted;ctx.textAlign='center';ctx.fillText(Number(val.toPrecision(3)),x,h-10);}
 ctx.save();ctx.beginPath();ctx.rect(pad.l,pad.t,pw,ph);ctx.clip();
 for(const s of series){ctx.strokeStyle=s.color;ctx.globalAlpha=s.alpha??1;ctx.lineWidth=s.width||1.5;ctx.setLineDash(s.dash||[]);ctx.beginPath();let drawing=false;
  for(let i=0;i<s.y.length;i++){if(!Number.isFinite(s.y[i])){drawing=false;continue;}const x=xx(s.x?s.x[i]:i/fs),y=yy(s.y[i]);if(drawing)ctx.lineTo(x,y);else ctx.moveTo(x,y);drawing=true;}ctx.stroke();}
 ctx.setLineDash([]);ctx.globalAlpha=1;
 for(const d of dots){ctx.fillStyle=d.color;for(const i of d.indices){ctx.beginPath();ctx.arc(xx(i/fs),yy(d.y[i]),2.4,0,Math.PI*2);ctx.fill();}}ctx.restore();
}
function controls(){
 const p={};for(const id of inputIds.filter(id=>id!=='burst')){p[id]=Number($(id).value);$(id+'-out').textContent=(id==='center'?p[id].toFixed(1):p[id])+(id==='freq'?' Hz':id==='center'?' s':' μV');}
 p.burst=$('burst').checked;for(const id of inputIds)$(id).disabled=!!imported;$('center').disabled=!!imported||!p.burst;return p;
}
function renderMission(p){
 const m=missions[mission];$('mission-title').textContent=m.title;$('mission-action').textContent=m.action;$('mission-meaning').textContent=m.meaning;
 document.querySelectorAll('[data-mission]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mission===mission)));
 let observation=mission==='amplitude'?'目前快波振幅 '+p.fast+' μV、頻率 '+p.freq+' Hz；13 Hz 表示每秒振動 13 次，不是 13 μV。':mission==='timing'?p.burst?'目前事件中心 '+p.center.toFixed(1)+' 秒；事件移位不等於載波頻率改變。':'目前快波持續出現；勾選短暫出現，才有事件中心。':mission==='noise'?'目前雜訊強度 '+p.noise+' μV，取出 '+result.modes.length+' 個分量；此處只是單次 EMD，不是 EEMD。':'目前門檻 '+$('tolerance').value+'，'+result.meta.filter(m=>m.converged).length+'/'+result.modes.length+' 個分量通過教學條件。';
 $('mission-live').textContent=imported?'現在分析本機匯入資料；上方任務對應合成訊號。點任一任務可返回合成實驗。':observation;
}
function update(){
 const p=controls();signal=imported||EMD.generate(p);result=EMD.decompose(signal.x,{tolerance:Number($('tolerance').value)});iteration=0;modeIndex=Math.min(modeIndex,Math.max(0,result.modes.length-1));selected=result.modes.map(()=>true);$('include-residue').checked=true;
 $('mode-count').textContent=result.modes.length+' 層';$('reconstruction-error').textContent=result.rmse.toExponential(1);$('convergence').textContent=result.meta.filter(m=>m.converged).length+'/'+result.modes.length;
 $('source-badge').textContent=imported?'資料：本機匯入（來源未核實）':'資料：合成教學訊號';
 $('sample-info').textContent=(signal.x.length/signal.fs).toFixed(2)+' 秒 · '+signal.fs+' Hz · '+signal.x.length+' 點。'+(imported?'未自動去趨勢、濾波或重取樣。按還原可回到合成訊號。':'慢波固定 1.2 Hz，另加緩慢線性趨勢。不是受試者 EEG。');
 $('signal-note').textContent=imported?'分析你提供的單欄數值；μV 單位與取樣率須由你核實。黃色已知慢波不適用於匯入資料。':p.burst?'短暫快波中心在 '+p.center.toFixed(1)+' 秒。灰色虛線若出現，是你先前記住的對照。':'快波持續整段出現。改振幅看高度，改頻率看波峰的疏密。灰色虛線是你記住的對照。';
 $('raw').setAttribute('aria-label',imported?'本機匯入的訊號時間序列':'合成訊號與已知慢波時間序列');
 const select=$('inspect-mode');select.replaceChildren();result.modes.forEach((_,i)=>{const o=document.createElement('option');o.value=i;o.textContent=modeName(i);select.append(o);});select.value=String(modeIndex);select.disabled=!result.modes.length;
 const container=$('imfs');container.replaceChildren();result.modes.forEach((mode,i)=>{
  const row=document.createElement('div');row.className='imf-row';row.id='row-'+i;
  const info=document.createElement('div'),label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=true;check.id='select-mode-'+i;check.setAttribute('aria-label','重建加入 '+modeName(i));check.addEventListener('change',()=>{selected[i]=check.checked;row.classList.toggle('unselected',!check.checked);drawReconstruction();});label.append(check,document.createTextNode(modeName(i)));info.append(label);
  for(const text of ['峰值 '+Math.max(...mode.map(Math.abs)).toFixed(1)+' μV',result.meta[i].count+' 次篩分']){const small=document.createElement('small');small.textContent=text;info.append(small);}
  const canvas=document.createElement('canvas');canvas.id='mode-'+i;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',modeName(i)+' 的分解波形');row.append(info,canvas);container.append(row);
 });
 const row=document.createElement('div');row.className='imf-row';row.innerHTML='<div><b>殘差</b><small>剩餘變化</small></div><canvas id="residue" role="img" aria-label="EMD 分解後剩餘訊號"></canvas>';container.append(row);
 analysis=result.modes[modeIndex]?Learning.hilbert(result.modes[modeIndex],signal.fs):null;renderMission(p);drawMain();drawSift();drawReconstruction();drawHilbert();
}
function modeName(i){return (result.meta[i].converged?'IMF ':'候選 ')+(i+1);}
function drawMain(){
 const series=[];if(baseline)series.push({y:baseline.x,color:C.muted,dash:[5,4]});if(signal.low)series.push({y:signal.low,color:C.yellow,alpha:.55,width:1});series.push({y:signal.x,color:C.cyan});plot($('raw'),series);
 const p=Learning.spectrum(signal.x,signal.fs).filter(b=>b.f<=Math.min(30,signal.fs/2));plot($('spectrum'),[{y:p.map(v=>v.p),x:p.map(v=>v.f),color:C.blue}],{maxX:Math.min(30,signal.fs/2),spectral:true});
 result.modes.forEach((m,i)=>plot($('mode-'+i),[{y:m,color:[C.cyan,C.blue,C.pink,C.yellow][i%4]}]));plot($('residue'),[{y:result.residue,color:C.muted}]);
}
function drawSift(){
 const trace=result.traces[modeIndex]||[],step=trace[iteration];$('prev').disabled=iteration===0;$('next').disabled=iteration>=trace.length-1;$('last-step').disabled=!trace.length;$('restart').disabled=!trace.length;
 if(!step){$('iteration').textContent='無可篩分振盪';$('sift-caption').textContent='極值不足，無法形成上下包絡。';$('sift-metrics').textContent='目前訊號留在殘差，不強行產生 IMF。';for(const id of ['stop-count','stop-mean','stop-decision'])$(id).textContent='不適用';$('stop-reason').textContent='殘差極值不足，或能量已接近零。';plot($('envelope'),[{y:signal.x,color:C.cyan}]);plot($('sifted'),[]);return;}
 $('iteration').textContent=modeName(modeIndex)+' · '+(iteration+1)+' / '+trace.length+' 次';
 $('sift-caption').textContent=iteration===0?'圓點是局部極值。上、下包絡之間的黃色平均線，是這次要扣掉的局部中心。':'把上次扣除平均後的候選分量當新輸入，再找極值、建立包絡，扣掉新的中心線。';
 plot($('envelope'),[{y:step.input,color:C.cyan},{y:step.upper,color:C.pink},{y:step.lower,color:C.blue},{y:step.mean,color:C.yellow,width:2}],{dots:[{y:step.input,indices:step.extrema.max,color:C.pink},{y:step.input,indices:step.extrema.min,color:C.blue}]});plot($('sifted'),[{y:step.h,color:C.cyan}]);
 const ex=EMD.extrema(step.h),count=ex.max.length+ex.min.length,zc=EMD.zeros(step.h),tolerance=Number($('tolerance').value);
 $('sift-metrics').textContent='扣除後：極值 '+count+' 個，過零 '+zc+' 次。判斷的是右圖新候選分量，不是左圖輸入。';
 $('stop-count').textContent='相差 '+step.difference+' · '+(step.difference<=1?'通過':'未通過');$('stop-count').className=step.difference<=1?'pass':'pending';
 $('stop-mean').textContent=(Number.isFinite(step.meanRatio)?step.meanRatio.toFixed(4):'無法建立包絡')+' · '+(step.meanRatio<tolerance?'通過':'未通過');$('stop-mean').className=step.meanRatio<tolerance?'pass':'pending';
 const final=iteration===trace.length-1,converged=result.meta[modeIndex].converged;
 $('stop-decision').textContent=step.stable>=2?'停止：兩次通過':final?'停止：未收斂':'繼續：'+step.stable+' / 2 次';$('stop-decision').className=step.stable>=2?'pass':'pending';
 $('stop-reason').textContent=step.stable>=2?'本站連續兩次滿足形狀與 RMS 條件，接受此 IMF；接著從殘差取下一層。':final&&!converged?'達到 30 次上限，或無法繼續建立包絡；只保留為候選分量，不冒稱已收斂。':'RMS 比值須小於 '+tolerance+'，兩條件同時連續成立兩次；任何一次失敗便重新計數。';
}
function drawReconstruction(){
 const x=Learning.reconstruct(result,selected,$('include-residue').checked);plot($('reconstruction'),[{y:signal.x,color:C.muted,dash:[5,4]},{y:x,color:C.cyan}]);
 const err=Learning.rmse(signal.x,x);$('subset-error').textContent='已加入 '+selected.filter(Boolean).length+'/'+selected.length+' 個分量'+($('include-residue').checked?'與殘差':'，未加入殘差')+'。相對原始訊號 RMSE = '+(err<.0001?err.toExponential(2):err.toFixed(3))+' μV。這個誤差是「拿掉多少」，不是去雜訊成效分數。';
}
function drawHilbert(){
 $('hht-mode').textContent=analysis?'分析：'+modeName(modeIndex)+' · 橫軸時間 s':'無可分析分量';
 if(!analysis){plot($('hilbert-amplitude'),[]);plot($('hilbert-frequency'),[],{positive:true});$('hht-readout').textContent='沒有分量時不計算瞬時頻率。';return;}
 plot($('hilbert-amplitude'),[{y:result.modes[modeIndex],color:C.cyan},{y:analysis.amplitude,color:C.yellow,width:2}]);plot($('hilbert-frequency'),[{y:analysis.frequency,color:C.blue}],{positive:true});
 const valid=analysis.frequency.filter(Number.isFinite).sort((a,b)=>a-b),median=valid.length?(valid[Math.floor(valid.length/2)]+valid[Math.floor((valid.length-1)/2)])/2:null;
 $('hht-readout').textContent='縱軸 Hz；保留 '+valid.length+'/'+signal.x.length+' 點。'+(median===null?'目前没有符合顯示規則的頻率點。':'保留點的中位數 '+median.toFixed(2)+' Hz。')+'兩端各遮蔽 '+(Math.max(1,analysis.edge)/signal.fs).toFixed(3)+' 秒；不要把局部估計當成固定頻帶或睡眠階段。';
}
function drawAM(){
 const carrier=Number($('carrier').value),modulation=Number($('modulation').value);$('carrier-out').textContent=carrier+' Hz';$('modulation-out').textContent=modulation.toFixed(1)+' Hz';
 const env=Array.from({length:768},(_,i)=>1+.7*Math.cos(2*Math.PI*modulation*i/128)),x=env.map((a,i)=>a*Math.cos(2*Math.PI*carrier*i/128));plot($('am'),[{y:x,color:C.cyan},{y:env,color:C.yellow,width:2}],{maxX:6,fs:128});
 $('am-readout').textContent='快波每秒振 '+carrier+' 次；振幅每 '+(1/modulation).toFixed(2)+' 秒強弱循環一次。每個強弱週期約容納 '+(carrier/modulation).toFixed(1)+' 次快振盪。HHSA 想分開描述這兩個尺度，而不是把兩個 Hz 直接相加。';
}
function clearPin(){baseline=null;$('clear-pin').disabled=true;$('pin-status').textContent='尚未設定對照';}
function setPreset(name){
 imported=null;clearPin();$('csv-file').value='';$('csv-status').textContent='合成訊號模式。檔案僅本機讀取，不上傳、不保存；重新整理即清除。';
 for(const [id,value] of Object.entries(presets[name])){if(id==='burst')$(id).checked=value;else $(id).value=value;}$('preset').value=name;update();
}
for(const id of inputIds)$(id).addEventListener('input',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update);});
$('preset').addEventListener('change',e=>setPreset(e.target.value));$('reset').addEventListener('click',()=>setPreset('spindle'));$('tolerance').addEventListener('change',update);
document.querySelectorAll('[data-mission]').forEach(b=>b.addEventListener('click',()=>{mission=b.dataset.mission;setPreset(missions[mission].preset);if(mission==='noise'||mission==='timing'){$('noise').value=0;update();}}));
$('inspect-mode').addEventListener('change',()=>{modeIndex=Number($('inspect-mode').value);iteration=0;analysis=Learning.hilbert(result.modes[modeIndex],signal.fs);drawSift();drawHilbert();});
$('next').addEventListener('click',()=>{if(iteration<(result.traces[modeIndex]?.length||0)-1){iteration++;drawSift();}});
$('prev').addEventListener('click',()=>{if(iteration>0){iteration--;drawSift();}});$('restart').addEventListener('click',()=>{iteration=0;drawSift();});$('last-step').addEventListener('click',()=>{iteration=Math.max(0,(result.traces[modeIndex]?.length||0)-1);drawSift();});
$('include-residue').addEventListener('change',drawReconstruction);
for(const id of ['select-all','select-none'])$(id).addEventListener('click',()=>{const all=id==='select-all';selected.fill(all);selected.forEach((v,i)=>{$('select-mode-'+i).checked=v;$('row-'+i).classList.toggle('unselected',!v);});$('include-residue').checked=true;drawReconstruction();});
$('pin').addEventListener('click',()=>{baseline={x:signal.x.slice(),fs:signal.fs};$('clear-pin').disabled=false;$('pin-status').textContent='已記住：灰色虛線為對照，與新訊號共用座標。';drawMain();});$('clear-pin').addEventListener('click',()=>{clearPin();drawMain();});
$('csv-file').addEventListener('change',async()=>{
 const file=$('csv-file').files[0];if(!file)return;const fs=Number($('csv-fs').value);
 try{if(file.size>131072)throw Error('檔案過大；請先擷取 128–4096 點的單欄片段。');const text=await file.text();if($('csv-file').files[0]!==file)return;const parsed=Learning.parseCSV(text,fs);imported=parsed;clearPin();update();$('csv-status').textContent='已在本機讀取 '+parsed.x.length+' 點，取樣率 '+parsed.fs+' Hz。未上傳；請核實 μV 單位、資料來源與授權。';}
 catch(error){$('csv-status').textContent='未載入：'+error.message+' 原訊號保持不變。';}
});
$('export-signal').addEventListener('click',()=>{const text='value_uv\n'+signal.x.join('\n')+'\n',url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=(imported?'user-signal':'synthetic-signal')+'-'+signal.fs+'Hz.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});
for(const id of ['carrier','modulation'])$(id).addEventListener('input',drawAM);
const hints={slow:'只改慢波高度；慢波頻率固定 1.2 Hz。',fast:'只改快波高度；不是改每秒振動次數。',freq:'每秒振動幾次；越高，波峰越密。',noise:'固定種子的隨機干擾，強度近似 RMS。',center:'只在「短暫出現」勾選時生效。'};
for(const [id,text] of Object.entries(hints)){const small=document.createElement('small');small.className='control-hint';small.id=id+'-hint';small.textContent=text;$(id).after(small);$(id).setAttribute('aria-describedby',small.id);}
new ResizeObserver(()=>{if(signal){drawMain();drawSift();drawReconstruction();drawHilbert();drawAM();}}).observe(document.querySelector('main'));
setPreset('continuous');drawAM();
