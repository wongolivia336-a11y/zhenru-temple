/**
 * ZHENRU MAIN HALL / photographed + published roof-pitch study parameters.
 * Not a field-survey, not an engineering or conservation-accurate reconstruction.
 *
 * 2025 Shanghai Putuo govt report describes a gentle ~26-degree existing roof slope.
 * 13.4m x 13.0m are published hall footprint dimensions (not roof eave dimensions).
 * The roof's 17.25m eave span and structural levels are inherited from the
 * artist's illustrative model and must be replaced when survey drawings arrive.
 */
export const ROOF_REFERENCE = Object.freeze({
  hallWidthM: 13.4,
  hallDepthM: 13.0,
  roofEaveSpanM: 17.25,
  roofDepthM: 16.8,
  eaveY: 6.72,
  ridgeHalfM: 6.0,
  referencePitchDeg: 26,
  pitchMinDeg: 18,
  pitchMaxDeg: 34,
  legacyRidgeY: 9.55,
  frameEaveDatumY: 6.16
});
export function parseRoofPitch(raw) {
  if (raw === null || raw === undefined || String(raw).trim() === "") {
    return ROOF_REFERENCE.referencePitchDeg;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) return ROOF_REFERENCE.referencePitchDeg;
  return Math.round(Math.min(ROOF_REFERENCE.pitchMaxDeg, Math.max(ROOF_REFERENCE.pitchMinDeg, n)) * 10) / 10;
}
export function makeRoofStudy(pitchDeg = ROOF_REFERENCE.referencePitchDeg) {
  const pitch = parseRoofPitch(pitchDeg);
  const r = ROOF_REFERENCE;
  const halfRun = r.roofEaveSpanM / 2;
  const rise = Math.tan(pitch * Math.PI / 180) * halfRun;
  const ridgeY = r.eaveY + rise;
  // Gable/rafter-study from the previous revision was drawn for ridge 9.55m;
  // scale it around the wooden-eave datum, not the world origin.
  const frameScaleY = (ridgeY - r.frameEaveDatumY) / (r.legacyRidgeY - r.frameEaveDatumY);
  const frameOffsetY = r.frameEaveDatumY * (1 - frameScaleY);
  return {
    pitchDeg: pitch, width: r.roofEaveSpanM, depth: r.roofDepthM,
    baseY: r.eaveY, ridgeHalf: r.ridgeHalfM, ridgeY,
    frameScaleY, frameOffsetY,
    rise, horizontalHalfRunM: halfRun,
    slopeMethod: "average ridge-to-center-eave, illustrative roof span",
    confidence: "PUBLIC_SOURCE_PITCH_PLUS_INFERRED_GEOMETRY"
  };
}
