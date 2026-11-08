# V7 · true Three.js component fidelity browser QA
**Date:** 2026-11-08  
**Validated commit:** `fbc3a6d72367b3db2f94ea465add566a8cccc14b`  
**CI run:** https://github.com/wongolivia336-a11y/zhenru-temple/actions/runs/42485645284  
**Stacked PR:** https://github.com/wongolivia336-a11y/zhenru-temple/pull/12

## Run evidence
Real headless Chromium with software WebGL/SwiftShader loaded the photo-comparison page and embedded Three.js model. Browser checks PASSED. The original project photo decoded as 1280×1707.

Observed scene in half-width comparison viewport:
- 16 additional **infill bracket assemblies** at 2+4+2 per front/rear side; existing column-head brackets preserved.
- 128 separate **瓦当 tile-end** instances, 128 **滴水 drip** instances; 3 instanced draw batches, including a shallow circular rim.
- The full-width independent viewer uses 224 instances per type by rule; this full-width count was checked by pure JS layout tests, **not this embedded-viewer runtime**.
- Roof topology still: 1 main ridge + 4 descending ridges + 4 hip ridges; 2 gable faces + 4 corner-wing faces.
- Actual 18/26/34° roof mesh upper bounds changed from approx 9.852 to 11.256 to 12.867 (model-coordinate units); returned to 26° when reset.
- Clickable close-up camera **檐下细看**, structural menu, cutaway, exploded, frame mode, reset, narrow desktop/mobile viewport and JS exception checks passed.

## What screenshot review found
First v7 screenshot showed overly large gray round tile heads and hanging teardrops. Follow-up source commit `fbc3a6d` reduced the modeled cross-section, made drips shallower, and added understated rim relief. This was re-tested and the final near-eave screenshot was archived.

Appearance is **still schematic**: brackets lack confirmed historic member sections/tenons, roof tile texture remains visually regular, and light/occlusion partly hides far-side details. The front photographic reference and the oblique 3D camera are NOT camera-registered: their pixel edges are not comparable as metrology.

## File sources and rights
Links and evidence grades: `reconstruction/REFERENCE_ATLAS_V7.md`.
The photos from Putuo, The Paper, Sohu and artist's Bilibili model are **references**; no copyrighted external asset or code has been incorporated.
Open-source references are linked, not copied.

## History and interpretation
The Paper reports 4 intermediate bracket sets in the central bay and 2 in each lateral bay on both front/back eaves. Putuo public account and this field survey differ on exact puzuo/ang nomenclature, so current bracket section geometry remains explicitly tagged as conjectural. No scanned or surveyed mortise-and-tenon nodes.

## Reproduce
```bash
node scripts/check-bracket-layout.mjs
node scripts/check-eave-layout.mjs
node scripts/check-model-fidelity.mjs
python -m http.server 8000
# http://localhost:8000/reconstruction/reference-review.html
```
In CI, `node scripts/browser-smoke.mjs` loads actual WebGL with Playwright, checks geometry metadata and preserves the screenshot files in the `zhenru-roof-pitch-browser-qa` artifact.

The automated suite **does not** prove precise heritage reconstruction, measured building height, Blender/GLB round-trip, physical mobile GPU performance or full img2threejs image-to-sculpt execution. The only upstream img2threejs step run in GitHub Actions remains Stage 1 image probing.
