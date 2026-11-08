# 真如寺大雄宝殿：开源重建工具与项目路线

## 术语说明

按“water pooling”字面没有找到对应的古建筑三维工具；以下按语音转写可能指向的**摄影测量 / 3D Gaussian Splatting（高斯泼溅）**调研。两者用途不同：摄影测量更适合生成带尺度、可编辑的网格；高斯泼溅更适合现场真实感漫游。

## GitHub 项目

| 项目 | 用途 | 对真如寺项目的价值 | 边界 |
|---|---|---|---|
| [COLMAP](https://github.com/colmap/colmap) | SfM + MVS，从多视角照片估计相机位置、稀疏/稠密点云与网格 | 研究型重建基线；可作为 Nerfstudio 的相机/稀疏点云输入 | 结果质量取决于覆盖、纹理、光照、尺度控制；不能凭照片判断被遮挡的历史构造 |
| [AliceVision Meshroom](https://github.com/alicevision/Meshroom) | 节点式摄影测量流程，输出相机、点云、纹理网格 | 可视化流程便于先做第一份现状模型 | 需要较完整的多视角照片；正式复原仍需量测和档案校准 |
| [Nerfstudio / Splatfacto](https://github.com/nerfstudio-project/nerfstudio) | 训练高斯泼溅，可在其 Viewer 中查看并导出 PLY | 适合生成殿内外的高真实感“现状影像层” | 训练依赖 GPU；项目文档给出的默认模型约需 6GB 显存；Splatfacto 本身不导出可编辑建筑网格 |
| [Spark](https://github.com/sparkjsdev/spark) | Three.js 内渲染 Gaussian Splat，支持多种 splat 格式并与网格同场景 | **推荐作为未来 Web 端现场 splat 图层的候选**，能和本项目的 Three.js 结构模型叠加 | 需要先有拍摄数据和训练好的 splat；splat 不能替代可拆解的建筑构件网格 |
| [GaussianSplats3D](https://github.com/mkkellogg/GaussianSplats3D) | Three.js 高斯泼溅查看器 | 可读 PLY / SPLAT / KSPLAT，可参考其 Three.js 集成 | 仓库 README 标注当前不活跃维护，并推荐 Spark；新集成优先评估 Spark |
| [3DGS for Chinese Heritage Structures](https://github.com/cardinal123456/3DGS-for-Chinese-Heritage-Structures) | 中国古建筑图像数据集 | 可参考其拍摄/数据整理方向 | README 称约 20 座建筑、1500+ 张图片，但因研究与版权原因只开放约四分之一；它不是可直接套用的真如寺模型，使用数据前需单独核对许可 |

## 推荐架构

```text
现场多视角照片 + 尺度控制点
        ├─ COLMAP / Meshroom → 当前状态点云、纹理网格 → GLB → Three.js 构件检查
        └─ Nerfstudio Splatfacto → 当前状态 splat → Spark / Three.js 现场漫游层

历史阶段模型：以测绘图、修缮档案、历史照片与逐件编号建模
        └─ Yuan / Qing / 1963–64 / current 四个分期模型，不从当前照片“倒推”历史
```

建议让**可测量的几何模型与照片级现场层并存**：几何模型负责结构拆解、尺寸、构件热点和时代变化；splat 负责让用户感受今日殿内外材质与光线。两层各自标注来源。不要把 splat 当作梁架结构图，也不要让当前实景 scan 自动变成元代或清代的“复原”。

## 分阶段落地

1. **现在：交互原型。** 保留程序化 Three.js 模型作为研究假设，明确标出清代双檐模型属于推演。
2. **取得许可后：拍现状。** 使用原始照片与视频、保存 EXIF；给主要构件放可撤除的尺度标尺或已知控制点；拍完整外圈与可进入的室内路径。
3. **先跑网格。** 在 Meshroom 做可视化基线，必要时用 COLMAP 检查相机解算和密集重建；用现场尺寸/控制点校准尺度，再清理网格并导出 GLB。
4. **再做真实感漫游。** 同一组高重叠照片进入 Nerfstudio Splatfacto；导出 splat 后用 Spark 与结构网格混合显示。
5. **历史阶段另行考证。** 向寺方、普陀区文物管理部门或修缮单位申请测绘图、1963–64 工程资料、旧照片和构件编号。没有证据的部分保持半透明推定或留空。
6. **公开前复核授权。** 分别确认照片、修缮档案、数据集、重建软件和输出模型的使用许可；GraphDeco 原始 3DGS 仓库采用研究用途限制，不把该实现直接作为商业项目依赖。


