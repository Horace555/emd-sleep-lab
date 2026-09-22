/* Original teaching utilities. No network, dependencies, model or diagnosis. */
(function(root){
 'use strict';
 const rms=x=>Math.sqrt(x.reduce((s,v)=>s+v*v,0)/Math.max(1,x.length));
 const rmse=(a,b)=>rms(a.map((v,i)=>v-b[i]));
 function parseCSV(text,fs){
  if(!Number.isFinite(fs)||fs<1||fs>5000)throw Error('取樣率請填 1–5000 Hz 的數值。');
  const rows=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/).filter(s=>s.trim());
  if(rows[0]?.trim()==='value_uv')rows.shift();
  if(rows.length<128||rows.length>4096)throw Error('請提供 128–4096 筆資料；不會自動截斷或重取樣。');
  const x=rows.map((row,i)=>{
   if(!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(row.trim()))throw Error('第 '+(i+1)+' 筆不是單欄數值；只支援單欄 μV，標題可用 value_uv。');
   const v=Number(row);if(!Number.isFinite(v)||Math.abs(v)>1000000)throw Error('數值超出教學範圍，請確認單位為 μV。');return v;
  });
  return {x,fs,low:null};
 }
 // Radix-2 complex FFT. Hilbert analytic signal uses next-power-of-two zero padding.
 function fft(re,im,inverse=false){
  const n=re.length;
  for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]];}}
  for(let size=2;size<=n;size*=2){const angle=(inverse?2:-2)*Math.PI/size;
   for(let offset=0;offset<n;offset+=size){for(let j=0;j<size/2;j++){
    const a=offset+j,b=a+size/2,c=Math.cos(angle*j),s=Math.sin(angle*j),r=re[b]*c-im[b]*s,i=re[b]*s+im[b]*c;
    re[b]=re[a]-r;im[b]=im[a]-i;re[a]+=r;im[a]+=i;
   }}
  }
  if(inverse)for(let i=0;i<n;i++){re[i]/=n;im[i]/=n;}
 }
 function hilbert(x,fs){
  let n=1;while(n<x.length)n*=2;
  const re=Array(n).fill(0),im=Array(n).fill(0);x.forEach((v,i)=>re[i]=v);fft(re,im);
  for(let k=0;k<n;k++){const gain=k===0||k===n/2?1:k<n/2?2:0;re[k]*=gain;im[k]*=gain;}fft(re,im,true);
  const amplitude=x.map((_,i)=>Math.hypot(re[i],im[i])),phase=x.map((_,i)=>Math.atan2(im[i],re[i]));
  for(let i=1;i<phase.length;i++){let d=phase[i]-phase[i-1];phase[i]-=2*Math.PI*Math.round(d/(2*Math.PI));}
  const peak=Math.max(...amplitude),edge=Math.min(Math.ceil(fs*.25),Math.floor(x.length*.1));
  const frequency=phase.map((_,i)=>{
   if(i<Math.max(1,edge)||i>=x.length-Math.max(1,edge)||amplitude[i]<peak*.1||peak<1e-10)return null;
   const f=(phase[i+1]-phase[i-1])*fs/(4*Math.PI);return f>0&&f<fs/2?f:null;
  });
  return {amplitude,frequency,edge};
 }
 function spectrum(x,fs){
  let n=1;while(n<x.length)n*=2;const re=Array(n).fill(0),im=Array(n).fill(0);
  x.forEach((v,i)=>re[i]=v*(.5-.5*Math.cos(2*Math.PI*i/(x.length-1))));fft(re,im);
  const bins=Array.from({length:n/2+1},(_,i)=>({f:i*fs/n,p:re[i]*re[i]+im[i]*im[i]}));
  const peak=Math.max(...bins.map(b=>b.p),1e-30);return bins.map(b=>({...b,p:b.p/peak}));
 }
 function reconstruct(result,selected,residual=true){return result.residue.map((v,i)=>(residual?v:0)+result.modes.reduce((s,m,j)=>s+(selected[j]?m[i]:0),0));}
 const api={rms,rmse,parseCSV,hilbert,spectrum,reconstruct};
 if(typeof module!=='undefined')module.exports=api;else root.Learning=api;
})(typeof window!=='undefined'?window:this);
