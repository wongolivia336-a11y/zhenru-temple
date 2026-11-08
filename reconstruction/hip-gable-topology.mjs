/**
 * ZHENRU / Hip-gable (歇山) topology study.
 * Geometry axes: local Z = longitudinal main ridge; local X = cross-slope.
 * The enclosing scene rotates the roof 90° so the ridge runs along the photographed facade.
 *
 * Historical facts: one main ridge, four descending gable-edge ridges (垂脊), four
 * diagonal hip ridges (戗脊), and vertical gable triangles above the end hip roof.
 * Derived parameters and surface cross-sections are NOT surveyed heritage fabric.
 */
export function createHipGableStudy({
  width, depth, baseY, ridgeY, ridgeHalf,
  shoulderFraction = 0.58,
  cornerLift = 0.29,
  curvatureExponent = 1.12
}) {
  const halfW = width / 2, halfD = depth / 2;
  if (![halfW,halfD,baseY,ridgeY,ridgeHalf].every(Number.isFinite) ||
      halfW <= 0 || halfD <= 0 || ridgeHalf <= 0 || ridgeHalf >= halfD ||
      ridgeY <= baseY || !(shoulderFraction > 0.3 && shoulderFraction < 0.85)) {
    throw new RangeError("Invalid research roof dimensions");
  }
  const shoulderX = halfW * shoulderFraction;
  const yAcross = s => baseY + (ridgeY - baseY) * Math.pow(Math.max(0,1 - s),curvatureExponent);
  const shoulderY = yAcross(shoulderFraction);
  const mix=(a,b,t)=>a*(1-t)+b*t;
  const quad = (sx,u,v) => [sx*halfW*v, yAcross(v), ridgeHalf*u];
  // Hip-end trapezoid: the upper flat boji (博脊) is the lower edge of a
  // vertical timber gable; the outer eave lifts lightly towards its corners.
  const end = (sz,u,v) => [
    u*mix(shoulderX,halfW,v),
    mix(shoulderY,baseY+cornerLift*Math.pow(Math.abs(u),2),v),
    sz*mix(ridgeHalf,halfD,v)
  ];
  // The four triangular wing surfaces close all seams between main roofs and
  // each end hip. Exact boundary math (no floating topology gaps).
  const wing = (sx,sz,u,v) => {
    const s=(u+1)/2;
    const innerX=mix(shoulderX,halfW,v);
    const xi=mix(innerX,halfW,s);
    const yi=mix(shoulderY,baseY+cornerLift,v);
    const yo=baseY+cornerLift*v*v;
    const bend=(yAcross(mix(shoulderFraction,1,s))-mix(shoulderY,baseY,s))*(1-v);
    return [sx*xi, mix(yi,yo,s)+bend, sz*mix(ridgeHalf,halfD,v)];
  };
  const gableTop = x => yAcross(Math.abs(x)/halfW);
  const ridge=[0,ridgeY,0];
  const gableRim=(sx,sz,t)=>[sx*shoulderX*t,yAcross(shoulderFraction*t),sz*ridgeHalf];
  const hipLine=(sx,sz,t)=>[
    sx*mix(shoulderX,halfW,t),
    mix(shoulderY,baseY+cornerLift,t),
    sz*mix(ridgeHalf,halfD,t)
  ];
  const mainEave=(sx,t)=>[sx*halfW,baseY+cornerLift*Math.pow(Math.max(0,Math.abs(t)-ridgeHalf)/(halfD-ridgeHalf),2),t];
  const endEave=(sz,t)=>[halfW*t,baseY+cornerLift*t*t,sz*halfD];
  return {
    halfW,halfD,shoulderX,shoulderY,baseY,ridgeY,ridgeHalf,cornerLift,curvatureExponent,
    main:quad,end,wing,gableTop,gableRim,hipLine,mainEave,endEave,ridge
  };
}
