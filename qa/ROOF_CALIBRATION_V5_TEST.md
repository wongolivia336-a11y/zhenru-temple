# 第五轮 / 屋顶坡度参数化校准 · Chromium 验收记录

**执行时间**：2026-11-08（GitHub Actions UTC 12:12–12:13）  
**验证提交**：`e894d0aa9145849cb9e6b2bae720badd6115209d`  
**CI 记录**：https://github.com/wongolivia336-a11y/zhenru-temple/actions/runs/42479156323  
**下载截图与 JSON 报告**：登录 GitHub 后，在运行页面的 Artifacts 下载 `zhenru-roof-pitch-browser-qa`。

## 确认通过
自动化在真实 Linux Chromium（软件 WebGL / SwiftShader）中启动 `python3 -m http.server` 与 `reconstruction/reference-review.html?qa=1`。

- 26° 默认：Three.js 屋面实际网格包围盒最高点约 **10.9267**（模型坐标），计算与 `reconstruction/roof-parameters.mjs` 一致；
- 点击滑杆应用 **18°**：场景重新加载，网格最高点 **9.5224**；
- 点击滑杆应用 **34°**：场景重新加载，网格最高点 **12.5376**；
- 从34°恢复到26°，数据再次匹配；
- 真实点击“结构 · 剖视”面板、剖视和分层拆解，两项场景状态同步变化；
- 点击复位后，`cutaway` 与 `exploded` 变回 false，按钮 `aria-pressed` 同步恢复；
- 1440px 和 390px 视口无横向溢出、测试期间没有未捕获 JavaScript 异常；
- 官方 img2threejs v2.0.1 **Stage 1 图片 probe** 与本地几何源代码门禁通过。

CI 实际输出摘录：
```
PASS actual WebGL roof bounds 9.522432327270508 10.9266939163208 12.537635803222656
PASS popup, cutaway, explode, reset, narrow view and no JS exceptions
```

## 本轮确认的是“可用的几何联动”，不是“真实建筑测绘”
- 26° 来源于上海普陀区公开介绍：https://www.shpt.gov.cn/tupianxinwen/20250416/958655.html
- 13.4 × 13 m 是公开的殿身平面尺寸；`17.25m` 是已有研究模型的屋面跨度，尚未经实测。
- 绝对屋脊/檐口高、椽架断面、斗栱铺作、山花形制及具体柱件身份**均未实测核对**。
- 无多视角相机标定、照片关键点配准或历史专家签核，因此视觉/历史准确性门禁仍为 PENDING。
- 软件光栅器通过不能代表低端手机 GPU 性能；Blender GLB 重导入仍待验收。

## 可复现
```bash
python -m http.server 8000
# http://localhost:8000/reconstruction/reference-review.html
node scripts/check-roof-parameters.mjs
node scripts/check-model-fidelity.mjs
# 在具有 Playwright Chromium 的环境：
node scripts/browser-smoke.mjs
```

截图在 Actions Artifacts 中，未主动将大体积图片提交到仓库。照片评审记录可以通过校准页导出 JSON，但默认状态仍是 PENDING。
