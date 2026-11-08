# Zhenru v7 / reference inventory and reuse policy (2026-11-08)

This research uses external photographs as visual observation, **not as texture, training data, or redistributed assets**. Links and copyrights remain with original owners. The project continues to ship only its original two photos.

## Directly relevant photographs / architectural field evidence
1. **Putuo District government, exterior timber bracket photo**: https://www.shpt.gov.cn/zrzjd-jiedaozhen/bmts-zrzjd/20250407/958347.html ; original JPEG https://www.shpt.gov.cn/zrzjd-jiedaozhen/bmts-zrzjd/20250407/958347/c1460bacf6df4152b93e238a2bb6c857.jpeg
   Use: visible repetitive cross-arms, dark weathered wood, carved bearing joins. Official publication; **no permission to redistribute assumed**.
2. **《真如寺：大都市，小元构》/ architectural field survey**: https://www.thepaper.cn/newsDetail_forward_26636609 ; direct observation: **four infill sets in central span and two in each lateral span, on front/back eaves**; four distinct bracket categories: exterior post-headed, infill, corner, and interior ceiling. Correctness of detailed puzuo count disputed vs government summary. Media rights reserved.
3. **爱塔传奇 2018 site visit**: https://www.sohu.com/a/218280655_653164 ; describes front/rear infill, corner bracket and inner back-tail joint, roof framing. Original photos by author; no assets copied.
4. **Putuo 2025 government front photo and reported roof pitch**: https://www.shpt.gov.cn/tupianxinwen/20250416/958655.html . Style/silhouette observation only.
5. **Wikimedia Commons reference pool**: https://commons.wikimedia.org/wiki/Category:Zhenru_Temple_(Shanghai) ; 2019 original photos >5k pixels. CHECK INDIVIDUAL FILE LICENSE, attribution and derivative conditions before including any photo.

## Social / artist model references (not redistributed)
6. **Bilibili: 祥祥祥儿 2023 Zhenru current hall 3D study** https://www.bilibili.com/video/BV1i14y1f7hS/ ; independently made artist reference, **not open-source or an authorized model**.
7. Xiaohongshu search did **not** yield a publicly accessible, reliably attributed close-up of this hall's actual bracket assembly in this research pass. No invented link supplied.

## Open-source technical examples
8. **MIT Three.js interactive dougong didactic prototype**: https://github.com/Coolpai0114/ancient-architecture-3d-demo ; useful for member selection/explode UX but *its generic 一斗三升 is not a measured Zhenru bracket*.
9. **Voxel Chinese Architecture**: https://github.com/Linqiyu-0921/voxel-chinese-architecture ; roof-type, hip-gable procedural topology, fly-eave logic; check license before code reuse. We did not copy source.
10. **threejs-architecture-effects**: https://github.com/lhlGitHub/threejs-architecture-effects ; procedural building assembly with timber and tiles; a workflow example, not heritage evidence. We did not copy source.
11. **img2threejs official skill** https://github.com/img2threejs/img2threejs ; image intake / staged geometry / visual comparison. Existing project CI runs only pinned v2.0.1 Stage 1 image probe; **not** a full multi-stage photogrammetric reconstruction.

## Implementation choices and evidence boundary
- New source-based geometry: `reconstruction/bracket-layout.mjs`, `model-fidelity.js`, `reconstruction/eave-layout.mjs`, `reconstruction/eave-details.js`.
- The bracket counts are published field observations. **The molded arm profiles, false-ang and joint geometry remain hypothetical**; no scientifically validated concealed mortise-and-tenon internals.
- Instanced 3D end-tile discs, repeating water-drip fronts: type is visible in photography but exact historical shapes/sizes have not been surveyed.
- Material wear is deliberately restrained; avoid randomized dirt and generic Qing palace motifs.
- Do not include external reference images in the GitHub repository without explicit license review and attribution.
