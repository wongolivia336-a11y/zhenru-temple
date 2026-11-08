/**
 * Zhenru main hall / modeled individual eave tile terminations.
 * One instanced ring/disk course and one instanced drip-shaped undercourse.
 * These are distinguishable 3D meshes, NOT photo textures nor verified tile molds.
 */
import * as THREE from "three";
import { createEaveStations } from "./eave-layout.mjs";
export function addEaveTerminations(roofSkin, roof, materials, options={}) {
  const stations=createEaveStations(roof,options);
  const endGeom=new THREE.CylinderGeometry(0.095,0.100,0.080,12,1,false);
  const dripShape=new THREE.Shape();
  dripShape.moveTo(-0.092,0.020);
  dripShape.lineTo(0.092,0.020);
  dripShape.quadraticCurveTo(0.070,-0.076,0.035,-0.087);
  dripShape.lineTo(0,-0.153);
  dripShape.lineTo(-0.035,-0.087);
  dripShape.quadraticCurveTo(-0.070,-0.076,-0.092,0.020);
  dripShape.closePath();
  const dripGeom=new THREE.ExtrudeGeometry(dripShape,{depth:0.026,steps:1,bevelEnabled:true,bevelSegments:1,bevelSize:0.006,bevelThickness:0.006});
  dripGeom.translate(0,0,-0.013);
  const tileMat=materials.roofSide.clone();
  tileMat.color.multiplyScalar(0.91);
  tileMat.roughness=0.94;
  const dripMat=materials.roof.clone();
  dripMat.color.multiplyScalar(0.91);
  dripMat.roughness=0.95;
  const tileEnds=new THREE.InstancedMesh(endGeom,tileMat,stations.length);
  const dripTiles=new THREE.InstancedMesh(dripGeom,dripMat,stations.length);
  tileEnds.name="瓦当 / individual cylindrical tile ends [research]";
  dripTiles.name="滴水 / tapered eave drips [research]";
  const up=new THREE.Vector3(0,1,0),front=new THREE.Vector3(0,0,1);
  const pos=new THREE.Vector3(),out=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3(),matrix=new THREE.Matrix4();
  stations.forEach((station,i)=>{
    out.fromArray(station.outward);
    const v=station.position;
    const size=0.96+(i%9)*0.008;
    pos.set(v[0],v[1]-0.085,v[2]).addScaledVector(out,0.042);
    q.setFromUnitVectors(up,out);
    scale.set(size,size,size);
    matrix.compose(pos,q,scale);
    tileEnds.setMatrixAt(i,matrix);
    pos.set(v[0],v[1]-0.100,v[2]).addScaledVector(out,0.072);
    q.setFromUnitVectors(front,out);
    scale.set(size,size,size);
    matrix.compose(pos,q,scale);
    dripTiles.setMatrixAt(i,matrix);
  });
  for(const mesh of [tileEnds,dripTiles]){
    mesh.userData.part="roof";
    mesh.userData.evidence="PHOTO_OBSERVED_TERMINATION_TYPE__SCHEMATIC_PROFILES";
    mesh.castShadow=true;mesh.receiveShadow=true;
    mesh.instanceMatrix.needsUpdate=true;
    roofSkin.add(mesh);
  }
  const counts={tileEnds:stations.length,dripTiles:stations.length,
    longEaveStations:stations.filter(s=>s.edge==="long").length,
    gableEaveStations:stations.filter(s=>s.edge==="gable").length,
    batching:"2 instanced meshes total"};
  roofSkin.userData.eaveFidelity=counts;
  return counts;
}
