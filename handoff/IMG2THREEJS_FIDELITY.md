# img2threejs × 真如寺｜精细化重建阶段 v4

## 本轮做了什么
从当前 `main`（919ad0efc315）建立独立分支；保留过去的移动端、GLB、离线 Three.js 与 WebGL 修复。
将前轮尚未合并的实体瓦片 + 实体斗栱研究模块按需移植到最新主线：
- 立面相关屋脊方向改为沿正面横向，屋架研究组同向旋转；
- 16 个柱头位置调用 `populateDougongStudy`，独立建模斗、栱、昂；
- 四个屋面采用批处理分片瓦件，移动端缩减瓦件分段；
- `userData` 继续保留研究推定和构件身份，响应剖视、结构分解与 GLB 导出。

## img2threejs 的真实能力与安装状态
https://github.com/img2threejs/img2threejs (Apache-2.0)，本次固定版本 v2.0.1。
它是代码生成的图片到三维建模 Skill，提供 Stage 1 图片 intake、spec、脚本质量门禁、每阶段 reference-vs-render 视觉比较；**不是摄影测量，不会让两张照片自动变成精准古建筑测绘**。

聊天容器中运行了 `npx --yes img2threejs@latest install` 和 `doctor`，两者均因无法访问 npm/GitHub DNS 超时，**本机并未安装成功**。
我们已添加 `.github/workflows/img2threejs-fidelity.yml`：GitHub Actions 的 Linux runner 从公开仓库下载固定 v2.0.1 源码，运行 Stage 1 的 `probe_image.py`（如果 CI 有权限和外网）。这不是对完整 Skill 全流程的通过声明。

### 在本机 Windows 中安装（需要 WSL2）
官方 docs/INSTALL.md 指出原生 Windows CLI 暂不支持，使用 WSL Ubuntu 的 Claude Code / Codex：
```bash
npx --yes img2threejs@latest install
npx --yes img2threejs@latest doctor
```
请重启 coding agent，然后以仓库照片和下面提示词使用 Skill：

> Use img2threejs with assets/hall-eaves.jpg and reconstruction/quality-contract.json. Model only Zhenru main hall's eave and one bracket assembly. Inventory silhouette and landmark features before coding, keep a stage-wise sculpt spec, and compare each render against the reference before approval. Do not infer concealed joinery. Preserve userData provenance, 16-column grid, four-stage timeline, viewer interactions, mobile LOD. Do not confuse neighboring pagoda with main hall. Stop at a blocking gate rather than invent a passing score.

## 用法与验收
- `python -m http.server 8000` → `http://localhost:8000/reconstruction/reference-review.html`
- 并排左图 / 右侧交互模型；用户自行调相机与选照片，审查大中小尺度，并下载人工记录 JSON。
- `node scripts/check-model-fidelity.mjs` 检查工程结构与来源一致性，不代替视觉判断。
- `node scripts/check-model-fidelity.mjs --visual-strict` 预期返回 BLOCKED，因为还没有校准、截图或人工签核，不把参考图相似度“编”出来。

## 目前尚未完成
未安装 chat sandbox 技能、未执行完整 spec/generation 回路；GitHub CI 需运行后才可确认 Stage 1 是否通过。
未有现场测绘、准确斗栱类型认证、相机标定、实机 FPS、Blender 全量 round-trip、完整浏览器回归。所有新几何仍是可编辑的研究性推断；如果对照片不吻合必须调整轮廓，而不是增加随机噪点。


## 浏览器走查（提交 8a95da0）
远程真实浏览器确认：主页面能绘制真实 Three.js 建筑（包含新瓦面/斗栱）、六个热点及四个历史阶段；`reconstruction/reference-review.html` 左侧原图和右侧 WebGL 场景均加载。未发现可见的 JavaScript 启动故障。
初次浏览器测试未展开“结构工具”而误认为没有剖视/拆解；源代码与事件监听证实 `cutawayToggle`、`explodeToggle`、`frameToggle` 均在可展开面板内。新补丁增强菜单文本可发现性、菜单关闭行为，并修复 Reset 后 `aria-pressed` 可能残留的问题。
本轮也将嵌入式查看模式改成 `?viewerOnly=1`，避免右边 iframe 同时缩放全站 UI；需要在更新后的预览里进一步观察窄屏布局、面板触发与四阶段真实动画。
浏览器检查没有提供经校准的照片叠图或真实手机 GPU 数据，因此视觉门禁仍是 PENDING。
