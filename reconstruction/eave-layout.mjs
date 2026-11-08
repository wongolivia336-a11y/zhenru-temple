/**
 * Repeatable clay tile ends and hanging drip borders; no random procedural noise.
 * Counts and coordinates are a research level-of-detail expression.
 * All coordinates are roof-local, before the 90deg world-axis rotation.
 */
export function createEaveStations(roof,{compact=false}={}) {
  const longCount=compact?34:58, endCount=compact?30:54;
  const result=[];
  for(const sign of [-1,1]){
    for(let i=0;i<longCount;i++){
      const z=-roof.halfD+2*roof.halfD*(i+0.5)/longCount;
      const p=roof.mainEave(sign,z);
      result.push({edge:"long",side:sign,position:p,outward:[sign,0,0],course:i});
    }
    for(let i=0;i<endCount;i++){
      const u=-1+2*(i+0.5)/endCount;
      const p=roof.endEave(sign,u);
      result.push({edge:"gable",side:sign,position:p,outward:[0,0,sign],course:i});
    }
  }
  return result;
}
