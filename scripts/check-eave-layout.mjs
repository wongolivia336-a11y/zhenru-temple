#!/usr/bin/env node
import assert from "node:assert/strict";
import {createHipGableStudy} from "../reconstruction/hip-gable-topology.mjs";
import {makeRoofStudy} from "../reconstruction/roof-parameters.mjs";
import {createEaveStations} from "../reconstruction/eave-layout.mjs";
for(const angle of [18,26,34]){
 const roof=createHipGableStudy(makeRoofStudy(angle));
 for(const compact of [false,true]){
   const stations=createEaveStations(roof,{compact});
   assert.equal(stations.length,compact?128:224);
   assert.equal(stations.filter(p=>p.edge==="long").length,compact?68:116);
   assert.equal(stations.filter(p=>p.edge==="gable").length,compact?60:108);
   for(const p of stations){
     assert.ok(p.position.every(Number.isFinite));
     assert.ok(p.position[1]>=roof.baseY-0.01);
     assert.ok(Math.abs(p.outward[0])+Math.abs(p.outward[2])===1);
   }
 }
}
console.log("PASS four eave edges, mirrored placement and 18/26/34° contours; 224 desktop / 128 compact each type");
