'use strict';
const $=id=>document.getElementById(id),C={cyan:'#62dfdc',yellow:'#f1cf79',pink:'#eb99b5',blue:'#86acff',muted:'#a5b4cc'};
let signal,result,iteration=0,frame;
const presets={spindle:{slow:30,fast:20,freq:13,noise:2,center:3,burst:true},slow:{slow:65,fast:10,freq:13,noise:1,center:3,burst:true},continuous:{slow:30,fast:20,freq:13,noise:0,center:3,burst:false},noisy:{slow:30,fast:20,freq:13,noise:12,center:3,burst:true}};
function plot(canvas,series,{maxX=6,spectral=false,dots=[]}={}){
 const w=canvas.clientWidth,h=canvas.clientHeight,dpr=window.devicePixelRatio||1;canvas.width=w*dpr;canvas.height=h*dpr;
 const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);const pad={l:44,r:12,t:12,b:28},pw=w-pad.l-pad.r,ph=h-pad.t-pad.b;
 let ymax=Math.max(.01,...series.flatMap(s=>s.y.map(Math.abs)))*1.13,ymin=spectral?0:-ymax;
 if(spectral)ymax=1.08;
 const xx=v=>pad.l+v/maxX*pw,yy=v=>pad.t+(ymax-v)/(ymax-ymin)*ph;
 ctx.font='12px system-ui';ctx.textBaseline='middle';ctx.lineWidth=1;
 for(let k=0;k<=4;k++){const val=ymin+(ymax-ymin)*k/4,y=yy(val);ctx.strokeStyle='#28354a';ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();ctx.fillStyle=C.muted;ctx.textAlign='right';ctx.fillText(spectral?val.toFixed(1):Math.abs(ymax)<10?val.toFixed(1):Math.round(val),pad.l-7,y);}
 for(let k=0;k<=6;k++){const val=maxX*k/6,x=xx(val);ctx.strokeStyle='#202e43';ctx.beginPath();ctx.moveTo(x,pad.t);ctx.lineTo(x,h-pad.b);ctx.stroke();ctx.fillStyle=C.muted;ctx.textAlign='center';ctx.fillText(Number(val.toFixed(1)),x,h-10);}
 ctx.save();ctx.beginPath();ctx.rect(pad.l,pad.t,pw,ph);ctx.clip();
 for(const s of series){ctx.strokeStyle=s.color;ctx.globalAlpha=s.alpha||1;ctx.lineWidth=s.width||1.5;ctx.setLineDash(s.dash||[]);ctx.beginPath();for(let i=0;i<s.y.length;i++){const x=xx(s.x?s.x[i]:i/128),y=yy(s.y[i]);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();}
 ctx.setLineDash([]);ctx.globalAlpha=1;
 for(const d of dots){ctx.fillStyle=d.color;for(const i of d.indices){ctx.beginPath();ctx.arc(xx(i/128),yy(d.y[i]),2.4,0,Math.PI*2);ctx.fill();}}
 ctx.restore();
}
function controls(){const p={};for(const id of ['slow','fast','freq','noise','center']){p[id]=Number($(id).value);$(id+'-out').textContent=(id==='center'?p[id].toFixed(1):p[id])+(id==='freq'?' Hz':id==='center'?' s':' μV');}p.burst=$('burst').checked;$('center').disabled=!p.burst;return p;}
function update(){
 const p=controls();signal=EMD.generate(p);result=EMD.decompose(signal.x);iteration=0;
 $('mode-count').textContent=result.modes.length+' 層';$('reconstruction-error').textContent=result.rmse.toExponential(1);$('convergence').textContent=result.meta.filter(m=>m.converged).length+'/'+result.modes.length;
 $('signal-note').textContent=p.burst?'短暫快波中心在 '+p.center.toFixed(1)+' 秒。拖動出現時間，觀察時域位置與整段頻譜的差異。':'快波持續整段出現。切換短暫快波後，觀察 EMD 的分解是否仍然一樣乾淨。';
 const container=$('imfs');container.replaceChildren();
 result.modes.forEach((mode,i)=>{const row=document.createElement('div');row.className='imf-row';const info=document.createElement('div');const b=document.createElement('b');b.textContent=result.meta[i].converged?'IMF '+(i+1):'候選 '+(i+1);info.append(b);const amplitude=document.createElement('small');amplitude.textContent='峰值 '+Math.max(...mode.map(Math.abs)).toFixed(1)+' μV';const count=document.createElement('small');count.textContent=result.meta[i].count+' 次篩分';info.append(amplitude,count);const canvas=document.createElement('canvas');canvas.id='mode-'+i;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',b.textContent+' 的分解波形');row.append(info,canvas);container.append(row);});
 const row=document.createElement('div');row.className='imf-row';row.innerHTML='<div><b>殘差</b><small>剩餘變化</small></div><canvas id="residue" role="img" aria-label="EMD 分解後剩餘訊號"></canvas>';container.append(row);
 drawMain();drawSift();
}
function drawMain(){plot($('raw'),[{y:signal.low,color:C.yellow,alpha:.45,width:1},{y:signal.x,color:C.cyan}]);
 const p=EMD.spectrum(signal.x,128),peak=Math.max(...p.map(v=>v.p),1e-20);plot($('spectrum'),[{y:p.map(v=>v.p/peak),x:p.map(v=>v.f),color:C.blue}],{maxX:30,spectral:true});
 result.modes.forEach((m,i)=>plot($('mode-'+i),[{y:m,color:[C.cyan,C.blue,C.pink,C.yellow][i%4]}]));plot($('residue'),[{y:result.residue,color:C.muted}]);
}
function drawSift(){const step=result.trace[iteration];$('prev').disabled=iteration===0;$('next').disabled=iteration>=result.trace.length-1;
 if(!step){$('iteration').textContent='無可篩分振盪';$('sift-caption').textContent='極值不足，無法形成上下包絡。';$('sift-metrics').textContent='目前訊號只剩趨勢或常數。';plot($('envelope'),[{y:signal.x,color:C.cyan}]);plot($('sifted'),[{y:signal.x,color:C.muted}]);return;}
 $('iteration').textContent='篩分 '+(iteration+1)+' / '+result.trace.length;
 $('sift-caption').textContent=iteration===0?'圓點是局部極值。穿過極大值和極小值的曲線，形成上下包絡。':'以上一次扣除平均後的候選分量為新輸入，再找極值、建立包絡與扣除平均。';
 plot($('envelope'),[{y:step.input,color:C.cyan},{y:step.upper,color:C.pink},{y:step.lower,color:C.blue},{y:step.mean,color:C.yellow,width:2}],{dots:[{y:step.input,indices:step.extrema.max,color:C.pink},{y:step.input,indices:step.extrema.min,color:C.blue}]});plot($('sifted'),[{y:step.h,color:C.cyan}]);
 $('sift-metrics').textContent='扣除後：極值數與過零數差 '+step.difference+'；包絡平均 RMS 比值 '+step.meanRatio.toFixed(4)+'（門檻 < 0.05）。';
}
function drawAM(){const carrier=Number($('carrier').value),modulation=Number($('modulation').value);$('carrier-out').textContent=carrier+' Hz';$('modulation-out').textContent=modulation.toFixed(1)+' Hz';const env=Array.from({length:768},(_,i)=>1+.7*Math.cos(2*Math.PI*modulation*i/128)),x=env.map((a,i)=>a*Math.cos(2*Math.PI*carrier*i/128));plot($('am'),[{y:x,color:C.cyan},{y:env,color:C.yellow,width:2}]);}
function setPreset(name){const p=presets[name];for(const [id,value] of Object.entries(p)){if(id==='burst')$(id).checked=value;else $(id).value=value;}$('preset').value=name;update();}
for(const id of ['slow','fast','freq','noise','center','burst'])$(id).addEventListener('input',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update);});
$('preset').addEventListener('change',e=>setPreset(e.target.value));$('reset').addEventListener('click',()=>setPreset('spindle'));
$('next').addEventListener('click',()=>{if(iteration<result.trace.length-1){iteration++;drawSift();}});$('prev').addEventListener('click',()=>{if(iteration>0){iteration--;drawSift();}});$('restart').addEventListener('click',()=>{iteration=0;drawSift();});
for(const id of ['carrier','modulation'])$(id).addEventListener('input',drawAM);
new ResizeObserver(()=>{if(signal){drawMain();drawSift();drawAM();}}).observe(document.querySelector('main'));
update();drawAM();
