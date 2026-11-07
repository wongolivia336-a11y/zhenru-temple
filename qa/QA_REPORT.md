# 真如寺大雄宝殿 · 浏览器验收记录

**日期：** 2026-11-07  
**代码起点：** `feat/zhenru-archive-final-handoff` @ `d7881754c503ab0f0fce3bd5f853a5deefa76c42`  
**环境：** 本地 `python -m http.server` + Microsoft Edge Headless/CDP，WebGL 2 / SwiftShader 软件后端。浏览器确实创建并绘制 Three.js 场景；本环境数据不代表实体 GPU 或手机表现。

## 结果摘要

| 检查 | 结果 | 实测依据 |
| --- | --- | --- |
| Three.js 启动 | 通过 | Three.js r187、本地模块加载，画布实际绘制建筑几何；没有外部请求失败或应用 JS 错误 |
| 时间线 | 通过 | 1320、1894—97、1963—64、现状逐项切换；仅清代研究阶段显示额外下檐和外扩轮廓 |
| 六类构件档案 | 通过 | 屋面、梁架、斗栱、隔扇、柱网、台基逐个打开匹配说明和证据等级；关闭键与 Escape 可用 |
| 相机与漫游 | 通过 | 鼠标环绕/滚轮缩放/右键平移、俯瞰、入殿、WASD、移动端方向按钮、方向键、Escape 退殿均改变场景状态 |
| 触控仿真 | 通过 | CDP 单指拖动改变相机；双指捏合改变距离；页面 `scrollY` 保持 0。未在实体手机测试 |
| 剖视、分解与构架透视 | 通过 | 剖视实景切开屋面并显露内部梁架（无截面封口）；屋面表层显隐、主檐抬升和清代下檐偏移都在场景状态中变化 |
| 响应式 | 通过 | 390×844、768×1024、1440×1000 均无水平溢出；手机/平板标题与工具栏留有间距；窄屏相机自动拉远 |
| 键盘/焦点/动效 | 通过/部分通过 | Enter 时间线、方向键相机、WASD、Escape 与 reduced-motion 下镜头跳转实测；焦点样式已实现。完整 Tab 顺序和屏幕阅读器仍需人工验收 |
| GLB | 部分通过 | 生成的 Blob 是 glTF 2.0，文件长度和 JSON chunk 可解析；Edge 自动化取消落盘，Blender 未安装 |

## 浏览器渲染诊断

| 视口 | Draw calls | Triangles | Geometries | Textures | Renderables | Pixel ratio | 横向溢出 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 390×844 | 1,170 | 425,722 | 645 | 3 | 799 | 1 | 否，scrollWidth=390 |
| 768×1024 | 1,246 | 427,810 | 645 | 3 | 799 | 1 | 否，scrollWidth=768 |
| 1440×1000 | 1,248 | 427,834 | 645 | 3 | 799 | 1 | 否；页面内容宽1425px，另有15px纵向滚动条 |

桌面场景为 814 个 Three.js 对象。软件光栅器下没有把 FPS 当作硬件性能指标；应在带硬件加速的桌面和实体移动设备补测帧率、显存与热量。

## GLB 结构检查

点击界面“下载 GLB”后，导出器生成 6,205,180 字节 Blob。浏览器内读取并解析：

- Magic：`glTF`；版本：2；声明长度与实际长度一致：6,205,180 字节；
- JSON chunk type：`JSON`；
- 650 nodes、643 meshes、34 materials、2,507 accessors；BIN buffer：5,537,712 字节。

Edge CDP 报告下载状态 `canceled`，目录没有文件，因此未对磁盘文件或 Blender 导入作声称。GLTFExporter 对 LineBasicMaterial 和法线归一化发出非致命提示，但 Blob 生成、JSON 解析成功。

## 控件与工程行为

- 相机轨道控制事件改变 position；右键拖动改变 controls target；滚轮改变距离。
- 清代阶段 `qingRoofVisible` / `qingExtensionVisible=true`；其它三个阶段均为 `false`。
- “构架透视”隐藏主屋面和下檐表层；“结构分解”把主屋面抬高 1.75、清代下檐抬高 1.37；复位恢复。
- 漫游开始位置可用；WASD 和屏幕方向按钮改变相机位置；Escape 退出漫游。触屏仿真没有改变页面滚动位置。
- 六个热点的证据文本明确区分公开记载、照片观察、结构推定与待测绘，不把10根元代柱或6个旧础擅自定位。
- 场景资源通过 `destroy()` 遍历释放 geometry/material，事件以 `AbortController` 清理，`ResizeObserver` 断开；实际 UI 是单场景页，本轮未做重复挂载泄漏压力测。
- `prefers-reduced-motion` 在镜头切换时读取当前偏好；样式层也关闭主要滚动显现过渡。软件后端已验证场景可运行，偏好切换时长仍建议在实体设备复测。
- reduced-motion 仿真切换后，俯瞰镜头到达约 `[0.43, 23.98, 0.86]`，返回外部回到 `[19, 13.5, 22]`；不等待完整 850ms 过渡。

## 截图索引

- [1440×1000 最终桌面场景](./final-desktop-1440.png)
- [实际 WebGL 剖视](./cutaway-desktop.png)
- [清代外扩轮廓的构架研究态](./qing-study-structure.png)
- [768×1024 平板](./verified-tablet-768.png)
- [390×844 手机](./verified-mobile-390.png)
- [修复前 CDN 阻断的加载状态](./baseline-desktop.png)

## 明确限制

1. 触屏只由 Edge CDP 触控事件仿真，不能替代真实 iOS/Android 浏览器和两指触屏测试。
2. Blender 不在本机；没有 glTF Validator 或 Blender round-trip。自动化 Edge 取消了下载落盘，GLB 只在页面 Blob 中做了结构验证。
3. SwiftShader 软件 WebGL 的 draw-call/triangle 统计有参考价值，但 FPS、显存和温度不可外推到硬件。
4. 当前模型不是实测复原。斗栱、屋架细部、瓦件、檐口曲线、门窗分格、清代外扩细节及构件年代位置仍待寺方/修缮档案和测绘确认。
