# V9｜构件档案与时间轴 UI 视觉回归

**用户标注截图**：2026-11-09，已指出首页左下重复阶段标签、底部键盘提示叠层、点击构件标签后左下档案遮罩、研究面板原生 select 下拉遮挡。

**通过测试的源代码提交**：`799689f0d1b9c9322a66cf42dfb5f228b2848993`  
**完整 CI / WebGL 记录**：https://github.com/wongolivia336-a11y/zhenru-temple/actions/runs/42553751808  
**PR #15**：https://github.com/wongolivia336-a11y/zhenru-temple/pull/15  
**Chromium 截图**：运行页面 > Artifacts > `zhenru-roof-pitch-browser-qa`；重点看：
- `v9-part-dock-desktop.png`：1440px 档案卡右侧停驻，标题与时间轴不遮挡。
- `v9-inline-focus-desktop.png`：结构侧重变成两列四个内联选项，不外弹。
- `v9-part-dock-mobile.png`：390px 窄屏卡片位于单条时间轴上方。
- `v8-home-desktop-1440.png`：默认视图，单条时间轨，左下无额外浮动摘要。
- `browser-report.json`：实际 DOM 尺寸、构件联动、屋面坡度/树木状态和检查结果。

## 最终改变
1. 把现有独立 `viewer-caption` 的阶段文本迁入 `timeline-readout`，合并历史时期、形制与年号，移除原先占据左下角的重复白色浮条。
2. 原先底部 `viewer-instruction` 绝对定位在时间轨附近，导致重复操作提示。现改为 `sr-only` 辅助说明，并通过 `aria-describedby` 关联 3D canvas；视角切换仍更新动态 `#exploreHint`。
3. 构件热点仅更新右侧 `#componentInspector`，不再更改历史阶段文章；卡片与“结构工具”互斥，支持标签点击、关闭按钮与 Escape；`aria-expanded` 同步。
4. 真正的研究面板保留 0–100% 3D 拆解与视距滑杆，把会覆盖按钮的 `select` 替换为 2×2 受控按钮组（全体/屋面/梁架/柱网），选中通过 `aria-pressed` 传达。
5. 不变更已有大殿、斗栱、银杏、历史形制及导出数据。

## 本轮经过浏览器验证
- 既有三档坡度的真实 Three.js 网格变化及本地参考照片加载保持通过。
- 结构拆解、局部分层、剖视、重置、时间阶段、银杏显隐/春秋和移动端水平溢出检查均通过。
- 1440px 首页时间线只包含一个阶段文案结构；右侧档案卡与标题留有间距，且卡片底部高于时间轴顶部。
- 390px 手机卡片位于时间线之上；点击事件、关闭按钮、Escape 和进入其他研究模式均触发预期 UI 状态。
- 结构选项卡片没有使用会溢出的浏览器原生选项弹层。

## 测试边界
完整网页截图可能使 headless WebGL 的 `.scene-pin.is-visible` 类暂时消失。为了对卡片布局做稳定几何回归，新增检查在 Chromium 中调用**实际绑定在构件标签上的 DOM click 事件处理器**（`HTMLElement.click()`），并检查卡片真实世界坐标、隐藏状态及正文保留。**这不等于已经对所有相机角度做完真实鼠标命中测试**；用户截图已显示前一版热点可操作。
- 自动化使用 Linux Chromium/SwiftShader，不代表物理移动端 GPU 性能。
- 此任务仅为 UI/UX 修复，不解决真实建筑测绘与榫卯准确性；`img2threejs` 仍是 Stage 1 图像 intake，不能声称完整重建。
