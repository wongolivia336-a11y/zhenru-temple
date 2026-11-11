// A local-only, decaying response to a visitor's nearby movement.
// No browser storage, network, person identifiers or persistent footpaths.
export function makeLeafSeed(index) {
  const n=(index*73+19)%997;
  return {x:((n*47)%997)/997*10-5,z:9.3+((n*283)%997)/997*19.1,
    angle:((n*113)%997)/997*Math.PI*2,scale:.72+((n*17)%41)/100,
    offsetX:0,offsetZ:0,motionX:0,motionZ:0};
}
export function advanceLeaf(leaf,visitor,dt) {
  const step=Math.max(0,Math.min(.05,dt));
  const speed=visitor?Math.hypot(visitor.vx||0,visitor.vz||0):0;
  const dx=leaf.x-(visitor?.x??1e5),dz=leaf.z-(visitor?.z??1e5);
  const distance=Math.hypot(dx,dz);
  if(visitor&&speed>.08&&speed<5&&distance<1.25) {
    const force=(1-distance/1.25)*Math.min(1,speed/1.5)*step;
    leaf.motionX+=((distance>.001?dx/distance:1)*.42+visitor.vx*.15)*force;
    leaf.motionZ+=((distance>.001?dz/distance:0)*.42+visitor.vz*.15)*force;
  }
  const drag=Math.exp(-4.5*step),settle=Math.exp(-.8*step);
  leaf.motionX*=drag;leaf.motionZ*=drag;
  leaf.offsetX=Math.max(-.17,Math.min(.17,(leaf.offsetX+leaf.motionX*step)*settle));
  leaf.offsetZ=Math.max(-.17,Math.min(.17,(leaf.offsetZ+leaf.motionZ*step)*settle));
  return Math.hypot(leaf.offsetX,leaf.offsetZ);
}
