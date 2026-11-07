# 浏览器审查结果 / 2026-11-07

## 基线

- 仓库：`wongolivia336-a11y/zhenru-temple`
- 审查起点：`feat/zhenru-archive-final-handoff`，提交 `d7881754c503ab0f0fce3bd5f853a5deefa76c42`
- 本轮在工作区快照上审查和修复；候选提交会另建分支与 PR，不覆盖现有 PR #2。
- ZIP 交接包只含 handoff 文档；源码和原始照片来自指定 GitHub 分支。

## 基线发现与修复

1. 基线通过 jsDelivr 动态导入 Three.js。本地浏览器对 CDN 请求返回 `ERR_NETWORK_ACCESS_DENIED`，场景一直停在加载态。改为随项目提供官方 Three.js r187 核心、OrbitControls、GLTFExporter 和 MIT 许可文件；现在从本地 HTTP 服务启动，不请求外部脚本。
2. 基线 390px/768px 的视角工具压到首屏说明文字。调整两种断点的工具栏位置，并按狭窄视口调整初始/重置相机距离；390px 下六个热点均能进入画面。
3. 六个热点在桌面默认视角拥挤。增加轻量屏幕空间布局，避开标题、工具、时间轴和说明面板。
4. 补充 Escape 关闭构件说明/退出漫游、触屏方向按钮的键盘按压与 aria-pressed 状态、漫游碰撞时沿可行轴滑动，以及监听器销毁和隐藏标签页暂停渲染。
5. 键盘/触屏用户开始操作时终止相机过渡，避免自动动画覆盖手动控制；reduced-motion 偏好在触发镜头跳转时读取。

## 浏览器实测

使用本地 HTTP 服务与 Microsoft Edge Headless/CDP。Three.js r187 在 SwiftShader WebGL 2 软件后端绘制真实 Mesh；这不是硬件加速或实体手机性能测试。

- 390×844、768×1024、1440×1000 均无水平溢出；首屏标题与工具栏不再交叠。
- 鼠标环绕、滚轮缩放、右键平移改变相机/目标；单指触屏仿真旋转、双指捏合缩放改变相机，页面滚动位置保持不变。
- 四个时间节点实测状态：清代节点显示研究性下檐和外扩轮廓，元/大修/现状节点隐藏它们。
- 六个热点分别弹出对应构件说明和证据级别；关闭按钮、Escape 均可关闭。
- 剖视、构架透视、分解、俯瞰、入殿、WASD、方向键、屏幕方向控制与 Escape 退殿均有场景状态变化。
- WebGL 运行无应用 JavaScript 错误或失败资源请求；资源来源仅为本地 HTTP origin。
- 桌面测得 1,248 draw calls、427,834 triangles、645 geometries、3 textures、799 renderables（场景 814 objects），pixel ratio 1；390px 测得 1,170 draw calls、425,722 triangles。硬件帧率和低端设备表现未测。
- GLB 导出生成 6,205,180 字节 glTF 2.0 Blob，JSON 中 650 nodes、643 meshes、34 materials、2,507 accessors；头、声明长度与 JSON chunk 一致。Edge 自动化下载管理器取消了文件落盘，所以没有可交付文件；本机也没有 Blender，未做往返导入。

## 截图

- `../qa/baseline-desktop.png`：修复前 CDN 被拦截、停留加载页的基线记录。
- `../qa/final-desktop-1440.png`、`../qa/verified-tablet-768.png`、`../qa/verified-mobile-390.png`：1440/768/390 宽度浏览器截图。
- `../qa/cutaway-desktop.png`、`../qa/qing-study-structure.png`：剖视几何与清代研究结构状态。

## 尚待专业/实体环境验证

- Blender 导入、GLB 单位和法线 round-trip；Edge headless 下载落盘被取消。
- 真实手机触摸屏、触控设备上的双指手势与屏幕阅读器体验。
- 带硬件加速的显卡、低端设备的 FPS、显存和热量基准。
- 真如寺原始测绘、清代/1963—64修缮档案及逐构件年代。当前模型仍是证据分级的研究推演，不可视作实测复原。

本地启动：`python -m http.server 8000`，浏览器打开 `http://localhost:8000`。
