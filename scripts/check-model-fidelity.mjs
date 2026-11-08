#!/usr/bin/env node
import fs from "node:fs";
const root=new URL("../",import.meta.url);
const file=(p)=>fs.readFileSync(new URL(p,root),"utf8");
const spec=JSON.parse(file("reconstruction/quality-contract.json")),hall=file("hall-model.js"),model=file("model-fidelity.js");
const check=[
["reference files accessible",spec.sourceImages.every(x=>fs.existsSync(new URL(x.path,root)))],
["seven evidence-backed feature requirements",spec.identityDetails.length>=7],
["16-post research grid",hall.includes("const POST_X = [-6.7, -3.05, 3.05, 6.7]")&&hall.includes("const POST_Z = [-6.5, -3.9, 1.2, 6.5]")],
["facade-parallel ridge",hall.includes("roofGroup.rotation.y = Math.PI / 2")],
["four batches of solid roof tiles",(hall.match(/addRoofTileStudy\(skin/g)||[]).length===4],
["shaped brackets connected",hall.includes("populateDougongStudy(group, xs, zs")&&model.includes("ExtrudeGeometry")],
["mobile tile complexity tier",hall.includes("const compact = window.innerWidth <= 720")],
["research inference labeled",model.includes("GEOMETRIC_STUDY_NOT_SURVEY")],
["review signoff not invented",spec.review.every(x=>x.status==="PENDING")]
];
check.forEach(([n,pass])=>console.log((pass?"PASS ":"FAIL ")+n));
if(check.some(x=>!x[1]))process.exit(1);
console.log("Structural gates passed; photographic match and architectural accuracy NOT yet verified.");
if(process.argv.includes("--visual-strict")){console.error("BLOCKED: no signed photo-versus-render comparison available.");process.exit(2);}
