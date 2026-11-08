# ZHENRU Main Hall · v6 Hip-gable WebGL audit

**Date:** 2026-11-08  
**Branch:** `feat/zhenru-roof-pitch-calibration-v5`  
**Verified geometry commit:** `5c9c273475cd7baffae5a0fa42ca493749613915`  
**PR:** https://github.com/wongolivia336-a11y/zhenru-temple/pull/11  
**Successful full CI:** https://github.com/wongolivia336-a11y/zhenru-temple/actions/runs/42481527787

## Changes and verified evidence
Replaced four-face hipped roof with 8 connected surface patches: 2 broad main roof slopes, 2 hipped-end trapezoids below the vertical gables, and 4 triangular wing transitions. The roof study now draws two explicit gable walls and a named nine-ridge system (1 main / 4 descending / 4 diagonal).

Validated 18°, 26°, 34° seam continuity via `scripts/check-hip-gable-topology.mjs`.  
Validated **real Three.js/WebGL** scene at 26° through `scripts/browser-smoke.mjs`; the exposed `roofTopology` returned:

```json
{"mainRidges":1,"descendingRidges":4,"hipRidges":4,
 "gableTriangles":2,"cornerWings":4,
 "shoulderFraction":0.58,"cornerLiftM":0.29}
```

Browser geometry results from `browser-report.json`:
- 18° mesh roof maximum height 9.8520 model units
- 26° mesh roof maximum height 11.2563 model units
- 34° mesh roof maximum height 12.8672 model units

Ridge study elevations are 9.5224 / 10.9267 / 12.5376; mesh bounding height includes roof-tile/ornamental protrusion. These are **illustrative local model coordinates, not measured heights**.

Other checks passed: photo natural size 1280×1707 decoded, model re-render after applying pitch, 3D structural tool panel / cutaway / explosion / reset, 390px and 1440px horizontal overflow, no uncaught page exceptions. Software WebGL (Chromium/SwiftShader) only; performance on actual mobile GPUs unverified.

## Browser screenshot comparisons
CI stores the 18°/26°/34°/reset/mobile captures as `zhenru-roof-pitch-browser-qa` in run [42481527787](https://github.com/wongolivia336-a11y/zhenru-temple/actions/runs/42481527787). Comparing previous v5 and v6 **at the same 26° camera** confirms a visible triangular gable and lower hip surface on v6; there was no such gable structure on the v5 four-slope roof.

## History and remaining visual debt
Source: Shanghai official roof typology https://lhsr.sh.gov.cn/jnylwh/20230630/0094cb59991d466fa526dec9408723ec.html ; Zhenru building https://www.meet-in-shanghai.net/cn/national-key-cultural-relics-protection-unit/it-is-really-like-the-main-hall-of-the-temple-415416/ ; account of 1963 roof redesign https://m.thepaper.cn/newsDetail_forward_26636609 .

Gable width, gable height, hip run, wing lift, tile profiles and finial materials remain **research assumptions**. The present-day visible roof was partly redesigned in 1963, so do not equate these shapes to intact 1320 Yuan fabric. Side-view photograph perspective registration and expert review are still PENDING. The underlying 16-column grid and Qing speculative layer were not redrawn.

## First CI failure and correction
Initial v6 workflow run [42481460668](https://github.com/wongolivia336-a11y/zhenru-temple/actions/runs/42481460668) failed the **obsolete v5 quality-gate assertion requiring four tile calls**. The new roof uses three batched-generator loop sites yielding eight faces; update at `5c9c2734` corrected the assertion. All relevant checks passed in run 42481527787. This failure does not mean visual accuracy was established in the succeeding run.
