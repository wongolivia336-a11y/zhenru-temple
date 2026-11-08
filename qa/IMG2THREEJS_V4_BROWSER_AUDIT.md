# Image-guided Fidelity v4 · Browser audit

## Tested head
`8a95da042209eff0db7e87ae0d56708a861d943a`

## Verified remotely (TinyFish browser)
- WebGL scene renders a Chinese timber hall with roof tiles, dougong, lattice screens and stone base; first loading state resolves.
- Both exterior main viewer and reference-review left photo/right embedded model load.
- Six part hotspots and four chronological stages are visible.
- No startup error or visible uncaught JavaScript error reported.

## Limitations / source audit correction
- Initial automated browsing claimed cutaway and breakdown were missing; static source confirms these buttons exist inside the initially collapsed `modelTools` panel, with live click handlers in `app.js`. The run did **not** expand and exercise all these controls, so report their existence as source-verified rather than end-to-end browser-verified.
- A11y/reset bug: existing UI did not always reset `aria-pressed` after resetting the viewer. Fixed in this patch, untested in the audited browser session.
- The embedded reference lab originally shrank the full website into half a panel; now loads a dedicated single-viewer layout (`?viewerOnly=1`).
- No same-perspective pixel comparison, signed photographic QA, physical GPU profiling, or Blender GLB round-trip completed.

## Run
https://agent.tinyfish.ai/runs/32648a67-a131-432c-a918-9d57949129c8

## Action
Re-run visual regression after this patch, with focus on structure tool toggles, reference-only viewport, responsive heights and GLB output. Architectural accuracy remains conjectural until drawings/measurements are available.
