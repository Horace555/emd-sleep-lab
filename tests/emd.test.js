'use strict';
const assert=require('node:assert/strict'),E=require('../dist/emd');
const fs=128,n=768;
const sin=(f,a=1)=>Array.from({length:n},(_,i)=>a*Math.sin(2*Math.PI*f*i/fs));
const corr=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0)/Math.sqrt(E.energy(a)*E.energy(b));
const pure=E.decompose(sin(13));
assert.ok(pure.modes.length>=1);assert.ok(corr(pure.modes[0].slice(128,-128),sin(13).slice(128,-128))>.98);
const high=sin(13,20),low=sin(1.2,30),mix=high.map((v,i)=>v+low[i]);
const r=E.decompose(mix);assert.ok(r.rmse<1e-10);assert.ok(corr(r.modes[0].slice(128,-128),high.slice(128,-128))>.9,'separated scale recovery');
assert.equal(E.decompose(Array(n).fill(2)).modes.length,0);assert.equal(E.decompose(Array.from({length:n},(_,i)=>i)).modes.length,0);
for(const p of [{},{noise:15},{slow:80,fast:50},{slow:0,fast:0,noise:0},{burst:false,noise:0}]){
 const x=E.generate(p).x,r=E.decompose(x);assert.ok(r.rmse<1e-9);assert.ok(r.modes.length<=6);assert.ok(r.meta.every(m=>m.count<=30));assert.ok([...r.modes.flat(),...r.residue].every(Number.isFinite));
}
assert.deepEqual(E.generate({noise:4}),E.generate({noise:4}));
console.log('PASS: sinusoid recovery, separated scales, reconstruction, degenerate signals, finite bounded output, reproducibility');

const L=require('../dist/learning');
for(const tolerance of [.02,.05,.1]){
 const d=E.decompose(E.generate({noise:4}).x,{tolerance});
 assert.equal(d.traces.length,d.modes.length);assert.deepEqual(d.trace,d.traces[0]);
 d.traces.forEach((trace,j)=>{
  assert.equal(trace.length,d.meta[j].count);let stable=0;
  trace.forEach(step=>{stable=step.meanRatio<tolerance&&step.difference<=1?stable+1:0;assert.equal(step.stable,stable);});
  assert.equal(d.meta[j].converged,stable>=2);
 });
 assert.ok(L.rmse(L.reconstruct(d,d.modes.map(()=>true)),d.reconstruction)<1e-10);
 assert.deepEqual(L.reconstruct(d,d.modes.map(()=>false)),d.residue);
 assert.ok(L.reconstruct(d,d.modes.map(()=>false),false).every(v=>v===0));
}
const periodic=Array.from({length:1024},(_,i)=>3*Math.cos(2*Math.PI*13*i/128));
const analytic=L.hilbert(periodic,128);
assert.ok(analytic.amplitude.every(a=>Math.abs(a-3)<1e-10));
assert.ok(analytic.frequency.filter(Number.isFinite).every(f=>Math.abs(f-13)<1e-9));
assert.equal(analytic.frequency[0],null);assert.equal(analytic.frequency.at(-1),null);
const amEnv=periodic.map((_,i)=>1+.7*Math.cos(2*Math.PI*i/128));
const am=L.hilbert(amEnv.map((v,i)=>v*Math.cos(2*Math.PI*16*i/128)),128);
assert.ok(L.rmse(am.amplitude,amEnv)<1e-10,'AM envelope recovery');
assert.ok(L.hilbert(Array(768).fill(0),128).frequency.every(f=>f===null));
const odd=L.hilbert(E.generate({noise:15}).x,128);assert.ok(odd.amplitude.every(Number.isFinite));assert.ok(odd.frequency.every(f=>f===null||Number.isFinite(f)));
const peak=L.spectrum(periodic,128).reduce((a,b)=>a.p>b.p?a:b);assert.equal(peak.f,13);
assert.deepEqual(L.parseCSV('value_uv\n'+periodic.join('\n'),128).x,periodic);
assert.deepEqual(L.parseCSV('\uFEFFvalue_uv\r\n'+Array(128).fill(' 2e-3 ').join('\r\n'),100).x,Array(128).fill(.002));
for(const text of ['',Array(127).fill(1).join('\n'),Array(4097).fill(1).join('\n'),Array(128).fill('NaN').join('\n'),Array(128).fill('1,2').join('\n'),Array(128).fill('=1+1').join('\n'),Array(128).fill('1e20').join('\n')])assert.throws(()=>L.parseCSV(text,128));
for(const rate of [0,-1,NaN,5001])assert.throws(()=>L.parseCSV(periodic.join('\n'),rate));
const html=require('node:fs').readFileSync(require('node:path').join(__dirname,'../dist/index.html'),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'unique IDs');
for(const m of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(m[1]),'anchor '+m[1]);
for(const m of html.matchAll(/(?:src|href)="([^"#:]+\.(?:js|css|svg))"/g))assert.ok(require('node:fs').existsSync(require('node:path').join(__dirname,'../dist',m[1])),'asset '+m[1]);
console.log('PASS: all-mode traces, stop decisions, selected reconstruction, Hilbert frequency and AM envelope, zero and noisy signals, CSV validation, page anchors/assets');
