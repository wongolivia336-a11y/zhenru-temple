# 真如寺大雄宝殿 · 第六轮单檐歇山屋顶结构重建

研究起点：`feat/zhenru-roof-pitch-calibration-v5`。不删改既有 Three.js 时间轴、入殿、剖视、拆解、构架透视、GLB 导出或屋面坡度校准。

## 为什么必须重写
旧屋顶用四个从屋脊向檐口逐渐展开的斜坡，实际上更像庑殿式坡面几何，而**真如寺现状为单檐歇山顶**，其标志是两侧的山花及上下屋面组合。
- 官方上海绿化/市容屋顶典型结构：https://lhsr.sh.gov.cn/jnylwh/20230630/0094cb59991d466fa526dec9408723ec.html
- 真如寺 3间x3间、现状单檐：https://www.meet-in-shanghai.net/cn/national-key-cultural-relics-protection-unit/it-is-really-like-the-main-hall-of-the-temple-415416/
- 真如寺1963修缮中山花、正脊和脊兽细部被重做（非元代实存原貌）：https://m.thepaper.cn/newsDetail_forward_26636609

## 新的显式拓扑
- 两个主坡面 `main(signX,u,v)`，沿屋脊 Z 双向展开。
- 两个低位端部歇山坡 `end(signZ,u,v)`，以山花底缘（博脊）为上边界，向檐口铺展。
- 四个转角翼面 `wing(signX,signZ,u,v)`，与主体和端坡共享完全相同的边界点公式，避免几何裂缝。
- 两个独立的深色木质山花板，带克制的竖向线条；依据照片可见的侧立面，但板缝并非测绘结果。
- **1 正脊 + 4 垂脊 + 4 戗脊** 的曲线型脊部；转角翘起参考可见形态但数值为研究推定。
- 所有屋面继续用三维实体板瓦与筒瓦，沿八片表面分批绘制（不逐瓦创建数百个 Mesh）。
- 原有18°–34° 坡度、屋架结构研究层和清代加檐层保留。

**坐标**：局部 Z 为主脊轴，屋顶组在场景旋转 90° 后横跨正立面。分缝面在 ±ridgeHalf 处，旧模型的 17.25m 外檐跨度和6m半脊长均为**研究模型假定参数**。`shoulderFraction=0.58` / `cornerLift=0.29` / `curvatureExponent=1.12` 也都不是测绘尺寸。

## 验证
- `node scripts/check-hip-gable-topology.mjs` 测试 18/26/34° 各参数、翼面与主坡/端坡的共边和山花边界。
- `node scripts/browser-smoke.mjs` 通过真实 Chromium/WebGL 查到生成的 1+4+4 脊系、2 山花、4 翼面，并保留 3 档坡度、剖视/拆解/复位及390px屏幕验收。
- 还需根据经授权的高质量同机位照片，比对左右山花尖、翼角、挑檐、垂戗脊落点；没有相机标定不得声称像素精确。室内梁架、斗栱具体铺作仍属研究推演。
