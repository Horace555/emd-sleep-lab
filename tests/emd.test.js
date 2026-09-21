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
