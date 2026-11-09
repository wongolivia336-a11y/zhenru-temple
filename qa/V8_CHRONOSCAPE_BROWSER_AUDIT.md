# V8｜研究交互与古银杏场景 · 真实浏览器验收记录

**基准代码提交**：`d6cea75b2e6b054c52383506472858df8034e268`
**实际 GitHub Actions 成功运行**：https://github.com/wongolivia336-a11y/zhenru-temple/actions/runs/42551410093
**PR #14**：https://github.com/wongolivia336-a11y/zhenru-temple/pull/14
**可下载真实截图**：CI 运行的 Artifacts > `zhenru-roof-pitch-browser-qa`，包含 `v8-home-desktop-1440.png`、`v8-home-mobile-390.png`、`v8-ginkgo-focus-mobile-390.png`、`v8-exploded-full.png`、`v8-ancient-ginkgo-autumn.png`、`v8-ginkgo-spring.png`、`v8-tablet-768.png` 和 `browser-report.json`。

## 已确认通过
- Playwright Chromium 以软件 WebGL（SwiftShader）加载了真实 Three.js 网格，不是设计图/图像叠加。
- 连续拆解滑杆在 0%、50%、100% 改变屋面与梁架实际位置；屋面重点分层使屋顶位移远大于梁架；视距滑杆设置为135%后场景回传135%；复位恢复模型/按钮/滑杆同步状态。
- 历史阶段为 1320、1894–97、1963–64、现状；0067古银杏在1320阶段隐藏，在后续推定阶段相对生长 0.72 → 0.91 → 1；春绿/秋黄切换和隐藏/显示动作有效。上述历史树形不等于准确年轮或实际冠幅。
- 启动时参考照片能解码，屋面 18° / 26° / 34° 网格最大Y在模型坐标下分别约为 9.852 / 11.256 / 12.867。
- 1440px、768px、390px 浏览器截图已保存；文字/时间轴分离及横向溢出检查、JS页面异常检查通过。
- 桌面 **“一殿三时”标题范围 x≈73–284px**；银杏模型的三维包围盒经相机投影后 x≈1038–1805px，因此不遮住标题。树干中心投影 x≈1392px，确实进入1440px视野；部分树冠在边界外，这属于刻意构图，而不是已经按寺内实测点位摆放。
- `img2threejs v2.0.1` 固定版本上游 **Stage 1** 照片 intake probe 通过，未宣称完成多阶段图像反推建模。

## 可复现
```bash
node scripts/check-ginkgo-story.mjs
node scripts/check-model-fidelity.mjs
node scripts/check-roof-parameters.mjs
node scripts/check-hip-gable-topology.mjs
node scripts/check-bracket-layout.mjs
node scripts/check-eave-layout.mjs
# 已在 CI 中安装 Chromium/Playwright 的条件下：
node scripts/browser-smoke.mjs
```

## 继续研究的限制
- 0067树龄约650年、现状尺寸13.2m高/11m冠幅来自公开资料；**本模型枝条、空间坐标、历史生长曲线不经实测**，1320阶段不凭空显示确定存在的古银杏。
- 院落底图是自行画的 SVG 关系示意，不是历史总平面测绘；相邻建筑形态和位置不可当作复原结论。
- 原有木构榫卯/瓦当与脊饰仍有照片研究推定，不是文物级数字扫描。
- **未验证真实移动端 GPU 帧率、GLB 在 Blender 内往返、精确照片配准或文保专家审核。** CI 仅证明场景功能与UI检查在 Chromium 中通过。
