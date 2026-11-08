# V7 / photographed dougong density + real eave component geometry

## Motivation
The preceding full Three.js hall had only 16 capital-position bracket assemblies, so front/rear eave structure looked empty at close range. The architecture field survey [The Paper 2024](https://www.thepaper.cn/newsDetail_forward_26636609) records **4 front/rear central bay infill bracket sets and 2 in each lateral bay**. Thus the v7 research model adds 16 distinct infill study assemblies to the existing 16 column-headed assemblies.

## Changes
- Module `reconstruction/bracket-layout.mjs`: deterministic position calculation using current nonuniform X bay widths; 8 infill units on each of the 2 long facades.
- `model-fidelity.js`: distinctive infill bracket family with separately named sill dou, lower gong, cross gong, false ang, upper spread and internal support; the geometries are **not historically verified joinery**.
- `reconstruction/eave-layout.mjs` + `eave-details.js`: 224 desktop stations (128 compact) over all four eave edges. Each station uses a real 3D circular clay tile end and an extruded hanging drip shape. Materials and spacing are deterministic rather than noisy. Two InstancedMeshes in total to manage draw calls.
- Existing roof topology 1+4+4, camera, mobile, cutaway, GLB, Qing speculative layer and 18/26/34 pitch study unchanged.
- Browser QA metrics expose number of extra bracket groups and end/drip tile counts in `getRoofCalibration()`; new pure JS seam/layout checks.

## Limits
Evidence type != measured node morphology. Putuo report's 'single-chao double-xia'ang six-puzuo' conflicts with the field study's 'four-puzuo single false-ang', so we do **not** assert an exact count of internal horizontal layers. No exterior protected photo is copied, and no Sketchfab models / copyrighted Bilibili artist geometry are imported.

## Sources and original licenses
See `reconstruction/REFERENCE_ATLAS_V7.md`. Reusable open-source examples provided as workflow references and not copied into the project.

## QA
`node scripts/check-bracket-layout.mjs`, `node scripts/check-eave-layout.mjs`, `node scripts/check-model-fidelity.mjs`, `node scripts/browser-smoke.mjs` in a Playwright-capable environment.
Three.js CI confirms generated geometry and controls, not historic surface fidelity or accurate unseen mortise-and-tenon dimensions. Need close-up visual review and field photo registration.
