import * as THREE from "three";
import {ginkgoAtStage, GINKGO_EVIDENCE, sanitizeSeason} from "./ginkgo-phases.mjs";
/**
 * 0067 Ginkgo / research representation.
 * Approximate present height/crown referenced to Putuo 2025;
 * position, unseen wood branching and earlier stages are NOT measured.
 * All leaves are true 3D instanced fan meshes (not photo cards).
 */
export function createGinkgoStudy(scene,{compact=false}={}){
 const root=new THREE.Group();
 root.name="0067-ginkgo-chronoscape-schematic";
 root.userData={part:"environment",evidence:"PRESENT_TREE_DIMENSIONS_DOCUMENTED__PAST_SHAPE_INFERRED",source:GINKGO_EVIDENCE.source};
 // Forecourt illustration only. Never use this location as measured mapping.
 // The foreground tree must be visible in the default exterior study view.
 // This x/z is an intentionally staged relative position, NOT a measured survey coordinate.
 // East-side courtyard study position. NOT a survey-grade tree coordinate.
 root.position.set(13.8,0,-7.0);
 scene.add(root);
 const bark=new THREE.MeshStandardMaterial({color:0x665844,roughness:0.98});
 const underBark=new THREE.MeshStandardMaterial({color:0x786951,roughness:0.98});
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.62,8.3,11),bark);
 trunk.position.y=4.15;trunk.castShadow=true;root.add(trunk);
 const trunkCore=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.34,5.2,9),underBark);
 trunkCore.position.set(0.12,8.1,0);trunkCore.rotation.z=-0.045;trunkCore.castShadow=true;root.add(trunkCore);
 // Branches are cylindrical instanced segments. Local positions are stable.
 let seed=96167;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const branches=[];
 const start=new THREE.Vector3(),end=new THREE.Vector3();
 for(let arm=0;arm<13;arm++){
   const theta=arm*Math.PI*2/13+random()*0.31;
   const height=3.9+random()*4.5;
   start.set(Math.sin(theta)*0.19,height,Math.cos(theta)*0.17);
   const reach=1.6+random()*2.1,up=1.45+random()*2.0;
   end.set(Math.cos(theta)*reach,height+up,Math.sin(theta)*reach);
   branches.push({a:start.clone(),b:end.clone(),r:0.22-0.09*height/9});
   for(let twig=0;twig<5;twig++){
     const t=0.24+twig*0.15;
     const a=start.clone().lerp(end,t);
     const b=end.clone().add(new THREE.Vector3((random()-.5)*2.4,0.4+random()*1.6,(random()-.5)*2.4));
     branches.push({a,b,r:0.07*(1-t)+0.019});
   }
 }
 const stickGeom=new THREE.CylinderGeometry(1,1,1,6);
 const stickMesh=new THREE.InstancedMesh(stickGeom,bark,branches.length);
 stickMesh.name="银杏枝桠 / procedural branches";
 const yAxis=new THREE.Vector3(0,1,0),obj=new THREE.Object3D();
 branches.forEach(({a,b,r},i)=>{
   const direction=b.clone().sub(a);
   obj.position.copy(a).add(b).multiplyScalar(0.5);
   obj.quaternion.setFromUnitVectors(yAxis,direction.clone().normalize());
   obj.scale.set(r,direction.length(),r);obj.updateMatrix();
   stickMesh.setMatrixAt(i,obj.matrix);
 });
 stickMesh.instanceMatrix.needsUpdate=true;
 stickMesh.castShadow=false;root.add(stickMesh);
 const leafShape=new THREE.Shape();
 // Two lobes, a central notch and a narrow petiole make a recognizable fan.
 leafShape.moveTo(0,-0.09);leafShape.lineTo(-0.016,-0.005);
 for(let j=0;j<=9;j++){
   const a=Math.PI*0.13+(Math.PI*0.88)*j/9;
   const scallop=0.16*(0.95+0.05*Math.cos(j*2.4));
   leafShape.lineTo(Math.cos(a)*scallop,Math.sin(a)*scallop);
 }
 leafShape.lineTo(0.013,0.010);leafShape.closePath();
 const leafGeom=new THREE.ShapeGeometry(leafShape,7);
 const leafMaterial=new THREE.MeshStandardMaterial({color:0xffffff,side:THREE.DoubleSide,roughness:0.96,metalness:0});
 // Denser but still single-draw-call canopy; modest golden fans, no billboards.
 const count=compact?540:1450;
 const leaves=new THREE.InstancedMesh(leafGeom,leafMaterial,count);
 leaves.name="银杏扇叶 / instanced fan silhouettes";
 leaves.userData.evidence="PHOTO_OBSERVED_LEAF_SHAPE__DISTRIBUTION_INFERRED";
 const colorsSpring=[0x697c52,0x7a885b,0x879266,0x9b9d68],colorsAutumn=[0xb49a4e,0xc5a65c,0xd3bb73,0xa58d51];
 const indices=[];
 for(let i=0;i<count;i++){
   // Broad crown centred ~9m, maximum 13.2m high, <=11m projected spread.
   const azimuth=2*Math.PI*random(),radius=Math.sqrt(random())*5.2;
   const norm=Math.min(1,radius/5.2);
   const y=8.6+((random()-.5)*6.0)*(1-0.25*norm);
   const xx=Math.sin(azimuth)*radius,zz=Math.cos(azimuth)*radius;
   obj.position.set(xx,Math.min(13.0,Math.max(5.7,y)),zz);
   obj.rotation.set((random()-.5)*1.45,(random()-.5)*5.8,(random()-.5)*1.7);
   const scale=0.78+0.85*random();obj.scale.setScalar(scale);
   obj.updateMatrix();leaves.setMatrixAt(i,obj.matrix);
   indices.push(Math.floor(random()*4));
 }
 leaves.instanceMatrix.needsUpdate=true;
 leaves.frustumCulled=false;
 root.add(leaves);
 const fallenCount=compact?25:64;
 const groundLeaves=new THREE.InstancedMesh(leafGeom,leafMaterial,fallenCount);
 groundLeaves.name="银杏落叶 / near ground";
 for(let i=0;i<fallenCount;i++){
   const azimuth=random()*Math.PI*2,spread=Math.sqrt(random())*5.2;
   obj.position.set(Math.cos(azimuth)*spread,0.045+random()*0.006,Math.sin(azimuth)*spread);
   obj.rotation.set(-Math.PI/2,0,random()*Math.PI*2);obj.scale.setScalar(0.48+random()*0.4);
   obj.updateMatrix();groundLeaves.setMatrixAt(i,obj.matrix);
   groundLeaves.setColorAt(i,new THREE.Color(colorsAutumn[i%colorsAutumn.length]));
 }
 groundLeaves.instanceMatrix.needsUpdate=true;
 if(groundLeaves.instanceColor)groundLeaves.instanceColor.needsUpdate=true;
 root.add(groundLeaves);
 let stage=0,season="autumn",enabled=true;
 function setSeason(value){
   season=sanitizeSeason(value);
   const colors=season==="spring"?colorsSpring:colorsAutumn;
   for(let i=0;i<count;i++)leaves.setColorAt(i,new THREE.Color(colors[indices[i]]));
   leaves.instanceColor.needsUpdate=true;
   groundLeaves.visible=season==="autumn" && root.visible;
   return season;
 }
 function setStage(value){
   stage=Number(value)||0;
   const phase=ginkgoAtStage(stage);
   const scale=phase.growthScale;
   root.scale.setScalar(Math.max(scale,0.001));
   root.visible=enabled&&phase.visible;
   groundLeaves.visible=root.visible&&season==="autumn"&&stage>=2.95;
   root.userData.stageNote=phase.historicalStatus;
   return phase;
 }
 function setEnabled(value){
   enabled=Boolean(value);setStage(stage);return enabled;
 }
 function tick(seconds,reducedMotion){
   if(!root.visible)return;
   leaves.rotation.y=reducedMotion?0:0.004*Math.sin(seconds*0.65);
   leaves.rotation.z=reducedMotion?0:0.003*Math.sin(seconds*0.52+0.5);
 }
 function getState(){
   const phase=ginkgoAtStage(stage);
   return {treeId:GINKGO_EVIDENCE.officialTreeId,visible:root.visible,
    approximateHeightM:GINKGO_EVIDENCE.heightM*phase.growthScale,
    growthScale:phase.growthScale,season,enabled,
    leafInstances:count,fallenVisible:groundLeaves.visible,locationConfidence:"UNSURVEYED_STAGE_PLACEMENT"};
 }
 setSeason("autumn");setStage(0);
 return {root,setSeason,setStage,setEnabled,tick,getState};
}
