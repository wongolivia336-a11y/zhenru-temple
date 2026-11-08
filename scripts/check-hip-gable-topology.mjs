#!/usr/bin/env node
import assert from "node:assert/strict";
import {createHipGableStudy} from "../reconstruction/hip-gable-topology.mjs";
import {makeRoofStudy} from "../reconstruction/roof-parameters.mjs";
const near=(a,b,eps=1e-7)=>assert.ok(Math.abs(a-b)<=eps,`surface seam: ${a} != ${b}`);
const vec=(a,b)=>a.forEach((x,i)=>near(x,b[i]));
for(const pitch of [18,26,34]){
 const data=makeRoofStudy(pitch);
 const s=createHipGableStudy(data);
 near(s.ridgeY,data.ridgeY);
 near(s.gableTop(s.shoulderX),s.shoulderY);
 near(s.main(1,0,0)[1],data.ridgeY);
 near(s.end(1,0,0)[1],s.shoulderY);
 // The top of the upper gable and top of the hip connect at the shoulder.
 for (const signX of [-1,1]) for(const signZ of [-1,1]) {
   for(let i=0;i<=20;i++) {
     const t=i/20;
     vec(s.wing(signX,signZ,-1,t),s.hipLine(signX,signZ,t));
     const wingMain=s.wing(signX,signZ,-1+2*t,0);
     const main=s.main(signX,signZ,(s.shoulderX+(s.halfW-s.shoulderX)*t)/s.halfW);
     vec(wingMain,main);
     vec(s.wing(signX,signZ,-1,t),s.end(signZ,signX,t));
   }
   // Four wing end points close at identical eave corners.
   vec(s.wing(signX,signZ,1,1),s.end(signZ,signX,1));
   vec(s.main(signX,signZ,1),s.wing(signX,signZ,1,0));
   vec(s.gableRim(signX,signZ,1),s.hipLine(signX,signZ,0));
 }
 for(let i=0;i<=20;i++){
   const t=-1+2*i/20;
   near(s.end(1,t,0)[1],s.shoulderY);
 }
 assert.ok(s.cornerLift>0);
}
assert.throws(()=>createHipGableStudy({width:10,depth:10,baseY:5,ridgeY:4,ridgeHalf:2}),RangeError);
console.log("PASS 18/26/34: two gables, 4 hip wings, all parametric roof-face seams close and ridge topology is coherent");
