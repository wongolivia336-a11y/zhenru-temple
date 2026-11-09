/** V8 ecological time narrative, NOT historical growth-ring measurements. */
export const GINKGO_EVIDENCE = Object.freeze({
  officialTreeId:"0067",
  approximateAgeYears:650,
  heightM:13.2,
  canopyDiameterM:11,
  scope:"present-day documented size; past silhouette and plant coordinates are inferred",
  source:"https://www.shpt.gov.cn/bm-ms/20251203/965629.html"
});
const LEVELS=[0,0.72,0.91,1];
export function ginkgoAtStage(value){
  const stage=Math.min(3,Math.max(0,Number(value)||0));
  const lo=Math.floor(stage),hi=Math.min(3,lo+1),fraction=stage-lo;
  const grow=LEVELS[lo]+(LEVELS[hi]-LEVELS[lo])*fraction;
  return {
    stage, growthScale:grow,
    // The 2025 age estimate does not establish the tree's presence at 1320.
    visible: grow>0.035,documented:stage>=3,
    historicalStatus:stage<0.01?"1320年古树是否已存在：资料不足":"历史树形为可视化推定"
  };
}
export function sanitizeSeason(value){return value==="spring"?"spring":"autumn";}
export function sanitizeExplosion(value){const n=Number(value);return Number.isFinite(n)?Math.min(1,Math.max(0,n)):0;}
export function sanitizeFocus(value){return ["all","roof","frame","columns"].includes(value)?value:"all";}
export function explosionWeights(focus){
 const f=sanitizeFocus(focus);
 return f==="all"?{roof:1,frame:1,columns:1,extension:1}:{
  roof:f==="roof"?1:0.11,
  frame:f==="frame"?1:0.11,
  columns:f==="columns"?1:0.11,
  extension:f==="roof"?1:0.11
 };
}
