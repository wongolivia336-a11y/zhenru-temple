/**
 * Zhenru hall front/rear eave infill distribution.
 *
 * Scholarly photo survey: front and rear middle span = 4 bracket sets,
 * side spans = 2 each (8 per eave, in addition to post-headed brackets).
 * Actual member section dimensions remain a modeling hypothesis.
 */
export function getFacadeInfillPositions(xs,counts=[2,4,2]) {
  if(xs.length!==4||counts.length!==3)throw new RangeError("Expected three front bays");
  if(!xs.every(Number.isFinite)||xs.some((x,i)=>i>0&&x<=xs[i-1]))throw new RangeError("Invalid column x ordering");
  const stations=[];
  for(let bay=0;bay<3;bay++){
    const count=counts[bay];
    if(!Number.isInteger(count)||count<0||count>10)throw new RangeError("Invalid study count");
    const left=xs[bay],right=xs[bay+1];
    for(let i=1;i<=count;i++)stations.push({bay,x:left+(right-left)*i/(count+1),series:count,slot:i});
  }
  return stations;
}
export const ZHENRU_INFILL_EVIDENCE = Object.freeze({
  spanCounts:[2,4,2],
  visibleBothFacades:true,
  source:"https://www.thepaper.cn/newsDetail_forward_26636609",
  label:"front/back eaves: center 4 infills; side spans 2 each",
  uncertainty:"survey of exact axes and joinery dimensions is unavailable"
});
