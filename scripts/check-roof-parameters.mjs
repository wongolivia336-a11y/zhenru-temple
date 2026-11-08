#!/usr/bin/env node
import assert from "node:assert/strict";
import { ROOF_REFERENCE, makeRoofStudy, parseRoofPitch } from "../reconstruction/roof-parameters.mjs";
function near(actual, target, tolerance = 1e-8) { assert.ok(Math.abs(actual-target) <= tolerance, `${actual} != ${target}`); }
const baseline = makeRoofStudy();
const pitchFromGeometry = Math.atan2(baseline.ridgeY - baseline.baseY, baseline.horizontalHalfRunM) * 180 / Math.PI;
near(pitchFromGeometry, 26);
near(baseline.ridgeY, 10.926693576380554);
near(ROOF_REFERENCE.hallWidthM,13.4);
near(ROOF_REFERENCE.hallDepthM,13.0);
near(ROOF_REFERENCE.roofEaveSpanM,17.25);
near(6.16 * baseline.frameScaleY + baseline.frameOffsetY,6.16);
const legacyPitch = Math.atan2(9.55-6.72,17.25/2)*180/Math.PI;
assert.ok(legacyPitch < 19 && legacyPitch > 18, "legacy mismatch baseline");
for (const n of [18,21.5,26,30,34]) {
 const s = makeRoofStudy(n);
 near(s.pitchDeg,n);
 near(Math.atan2(s.rise,s.horizontalHalfRunM)*180/Math.PI,n);
 near(6.16*s.frameScaleY+s.frameOffsetY,6.16);
}
assert.equal(parseRoofPitch(null),26);
assert.equal(parseRoofPitch("not-a-number"),26);
assert.equal(parseRoofPitch("42"),34);
assert.equal(parseRoofPitch("-10"),18);
console.log("PASS published 26° pitch mapped to roof rise, frame anchored at eave, URL bounds and historical baseline.");
console.log("NOTE these checks do not validate actual measured roof height or physical joinery.");
