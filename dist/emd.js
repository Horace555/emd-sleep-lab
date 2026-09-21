/* Educational EMD. Natural cubic splines, mirrored extrema, bounded sifting. */
(function(root){
 'use strict';
 const energy=x=>x.reduce((s,v)=>s+v*v,0);
 function extrema(x){
  const max=[],min=[];let i=1;
  while(i<x.length-1){let j=i;while(j<x.length-1&&x[j+1]===x[i])j++;
   const k=Math.floor((i+j)/2);
   if(j<x.length-1){if(x[i]>x[i-1]&&x[j]>x[j+1])max.push(k);if(x[i]<x[i-1]&&x[j]<x[j+1])min.push(k);}i=j+1;
  }return {max,min};
 }
 function zeros(x){let n=0,last=0;for(const v of x){const s=Math.sign(v);if(s&&last&&s!==last)n++;if(s)last=s;}return n;}
 function envelope(x,idx){
  const n=x.length;
  const knots=[...idx.slice(0,2).reverse().map(i=>[-i,x[i]]),...idx.map(i=>[i,x[i]]),...idx.slice(-2).reverse().map(i=>[2*(n-1)-i,x[i]])];
  const m=knots.length,z=Array(m).fill(0),u=Array(m).fill(0);
  for(let i=1;i<m-1;i++){
   const d=knots[i+1][0]-knots[i-1][0],sig=(knots[i][0]-knots[i-1][0])/d,p=sig*z[i-1]+2;
   z[i]=(sig-1)/p;
   const slope=(knots[i+1][1]-knots[i][1])/(knots[i+1][0]-knots[i][0])-(knots[i][1]-knots[i-1][1])/(knots[i][0]-knots[i-1][0]);
   u[i]=(6*slope/d-sig*u[i-1])/p;
  }
  for(let i=m-2;i>=0;i--)z[i]=z[i]*z[i+1]+u[i];
  let k=0;return x.map((_,i)=>{while(k<m-2&&knots[k+1][0]<i)k++;const h=knots[k+1][0]-knots[k][0],a=(knots[k+1][0]-i)/h,b=1-a;return a*knots[k][1]+b*knots[k+1][1]+((a*a*a-a)*z[k]+(b*b*b-b)*z[k+1])*h*h/6;});
 }
 function sift(x){const e=extrema(x);if(e.max.length<2||e.min.length<2)return null;
  const upper=envelope(x,e.max),lower=envelope(x,e.min),mean=upper.map((v,i)=>(v+lower[i])/2),h=x.map((v,i)=>v-mean[i]);
  const next=extrema(h),up2=envelope(h,next.max.length>=2?next.max:e.max),lo2=envelope(h,next.min.length>=2?next.min:e.min);
  const meanRatio=Math.sqrt(energy(up2.map((v,i)=>(v+lo2[i])/2))/(energy(h)+1e-30));
  const sd=energy(mean)/(energy(x)+1e-30),difference=Math.abs(next.max.length+next.min.length-zeros(h));
  return {input:x.slice(),upper,lower,mean,h,extrema:e,sd,meanRatio,difference};
 }
 function decompose(x,{maxModes=6,maxSift=30,tolerance=.05}={}){
  let residue=x.slice();const modes=[],meta=[],trace=[];
  for(let m=0;m<maxModes;m++){
   const e=extrema(residue);if(e.max.length<2||e.min.length<2||energy(residue)<1e-20)break;
   let h=residue.slice(),last=null,stable=0,converged=false,count=0;
   for(let k=0;k<maxSift;k++){
    const step=sift(h);if(!step)break;count++;if(m===0)trace.push(step);h=step.h;last=step;
    stable=step.meanRatio<tolerance&&step.difference<=1?stable+1:0;
    if(stable>=2){converged=true;break;}
   }
   if(!last)break;modes.push(h);meta.push({count,converged,meanRatio:last.meanRatio,difference:last.difference});residue=residue.map((v,i)=>v-h[i]);
  }
  const reconstruction=residue.map((v,i)=>v+modes.reduce((s,c)=>s+c[i],0));
  const rmse=Math.sqrt(energy(x.map((v,i)=>v-reconstruction[i]))/x.length);
  return {modes,residue,meta,trace,reconstruction,rmse};
 }
 function generate({slow=30,fast=20,freq=13,noise=2,burst=true,center=3,seed=42}={}){
  const fs=128,n=768;let state=seed>>>0;
  const random=()=>{state=(1664525*state+1013904223)>>>0;return state/4294967296;};
  const low=[],high=[],trend=[],x=[];
  for(let i=0;i<n;i++){const t=i/fs,a=burst?Math.exp(-.5*((t-center)/.28)**2):1;
   low.push(slow*Math.sin(2*Math.PI*1.2*t));high.push(fast*a*Math.sin(2*Math.PI*freq*t));trend.push(2*(t-3));
   x.push(low[i]+high[i]+trend[i]+noise*(random()+random()+random()+random()-2)*Math.sqrt(3));
  }return {x,low,high,trend,fs};
 }
 function spectrum(x,fs){const n=x.length,p=[];for(let k=0;k<=Math.floor(30*n/fs);k++){let re=0,im=0;for(let i=0;i<n;i++){const w=.5-.5*Math.cos(2*Math.PI*i/(n-1));re+=x[i]*w*Math.cos(2*Math.PI*k*i/n);im-=x[i]*w*Math.sin(2*Math.PI*k*i/n);}p.push({f:k*fs/n,p:(re*re+im*im)/n});}return p;}
 const api={extrema,zeros,envelope,sift,decompose,generate,spectrum,energy};
 if(typeof module!=='undefined')module.exports=api;else root.EMD=api;
})(typeof window!=='undefined'?window:this);
