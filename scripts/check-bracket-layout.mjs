#!/usr/bin/env node
import assert from "node:assert/strict";
import {getFacadeInfillPositions,ZHENRU_INFILL_EVIDENCE} from "../reconstruction/bracket-layout.mjs";
const xs=[-6.7,-3.05,3.05,6.7];
const stations=getFacadeInfillPositions(xs);
assert.equal(stations.length,8);
assert.deepEqual(stations.map(s=>s.bay),[0,0,1,1,1,1,2,2]);
assert.ok(stations[0].x>xs[0]&&stations[7].x<xs[3]);
assert.ok(stations.every((s,i)=>i===0||s.x>stations[i-1].x));
assert.deepEqual(ZHENRU_INFILL_EVIDENCE.spanCounts,[2,4,2]);
assert.throws(()=>getFacadeInfillPositions([3,2,1,0]),RangeError);
console.log("PASS 2+4+2 infill sets per eave = 16 documented front/rear infill groups; geometry dimensions remain inferred");
