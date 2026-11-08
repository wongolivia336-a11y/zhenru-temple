/**
 * Zhenru main hall / modeled individual eave tile terminations.
 * One instanced ring/disk course and one instanced drip-shaped undercourse.
 * These are distinguishable 3D meshes, NOT photo textures nor verified tile molds.
 */
import * as THREE from "three";
import { createEaveStations } from "./eave-layout.mjs";
export function addEaveTerminations(roofSkin, roof, materials, options={}) {
  const stations=createEaveStations(roof,options);
  // Subtle fired-clay tile head with a shallow relief ring, rather than a
  // full-sized ornamental coin. Diameter remains an inferred study dimension.
  const endGeom=new THREE.CylinderGeometry(0.067,0.070,0.045,16,1,false);
  const rimGeom=new THREE.TorusGeometry(0.052,0.008,5,16);
  const dripShape=new THREE.Shape();
  dripShape.moveTo(-0.068,0.018);
  dripShape.lineTo(0.068,0.018);
  dripShape.quadraticCurveTo(0.052,-0.041,0.024,-0.054);
  dripShape.quadraticCurveTo(0,-0.102,-0.024,-0.054);
  dripShape.quadraticCurveTo(-0.052,-0.041,-0.068,0.018);
  dripShape.closePath();
  const dripGeom=new THREE.ExtrudeGeometry(dripShape,{depth:0.026,steps:1,bevelEnabled:true,bevelSegments:1,bevelSize:0.006,bevelThickness:0.006});
  dripGeom.translate(0,0,-0.013);
  const tileMat=materials.roofSide.clone();
  tileMat.color.multiplyScalar(0.86);
  tileMat.roughness=0.94;
  const dripMat=materials.roofSide.clone();
  dripMat.color.multiplyScalar(0.86);
  dripMat.roughness=0.95;
  const tileEnds=new THREE.InstancedMesh(endGeom,tileMat,stations.length);
  const tileRims=new THREE.InstancedMesh(rimGeom,tileMat,stations.length);
  const dripTiles=new THREE.InstancedMesh(dripGeom,dripMat,stations.length);
  tileEnds.name="瓦当 / slender round clay tile ends [research]";
  tileRims.name="瓦当边缘 / shallow relief circumference [research]";
  dripTiles.name="滴水 / small tapered clay drip members [research]";
  const up=new THREE.Vector3(0,1,0),front=new THREE.Vector3(0,0,1);
  const pos=new THREE.Vector3(),out=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3(),matrix=new THREE.Matrix4();
  stations.forEach((station,i)=>{
    out.fromArray(station.outward);
    const v=station.position;
    const size=0.96+(i%9)*0.008;
    pos.set(v[0],v[1]-0.073,v[2]).addScaledVector(out,0.030);
    q.setFromUnitVectors(up,out);
    scale.set(size,size,size);
    matrix.compose(pos,q,scale);
    tileEnds.setMatrixAt(i,matrix);
    // Torus XY plane faces outwards; offset a fraction beyond the disc.
    pos.set(v[0],v[1]-0.073,v[2]).addScaledVector(out,0.056);
    q.setFromUnitVectors(front,out);
    matrix.compose(pos,q,scale);
    tileRims.setMatrixAt(i,matrix);
    pos.set(v[0],v[1]-0.115,v[2]).addScaledVector(out,0.066);
    matrix.compose(pos,q,scale);
    dripTiles.setMatrixAt(i,matrix);
  });
  for(const mesh of [tileEnds,tileRims,dripTiles]){
    mesh.userData.part="roof";
    mesh.userData.evidence="PHOTO_OBSERVED_TERMINATION_TYPE__SCHEMATIC_PROFILES";
    mesh.castShadow=true;mesh.receiveShadow=true;
    mesh.instanceMatrix.needsUpdate=true;
    roofSkin.add(mesh);
  }
  const counts={tileEnds:stations.length,dripTiles:stations.length,
    longEaveStations:stations.filter(s=>s.edge==="long").length,
    gableEaveStations:stations.filter(s=>s.edge==="gable").length,
    batching:"3 instanced meshes: heads, rim relief, drips"};
  roofSkin.userData.eaveFidelity=counts;
  return counts;
}
