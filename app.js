const stages = [
  {
    period: "元 · 延祐七年",
    year: "1320",
    short: "1320，元代题记节点",
    title: "移建现址，木上留年",
    description: "梁间题记为大殿提供重要年代线索。",
    question: "形制边界",
    detail: "1320 是纪年节点；当前形制不能直接等同于元代原貌。",
    shape: "单檐歇山 · 形制示意",
    source: 0,
    grade: "史料节点"
  },
  {
    period: "清 · 光绪二十至二十三年",
    year: "1894—97",
    short: "1894—97，清代改建",
    title: "重修之后，檐层与开间之变",
    description: "资料记载光绪年间改作双檐；开间范围仍有不同说法。",
    question: "研究推定",
    detail: "半透明下檐与外扩柱列呈现一种研究说法，尺寸与节点待档案核验。",
    shape: "清代双檐说 · 研究推定",
    source: 0,
    grade: "公开记载 + 研究文章推断"
  },
  {
    period: "20世纪 · 落架大修",
    year: "1963—64",
    short: "1963—64，落架大修",
    title: "拆解测绘，再作选择",
    description: "落架大修后，殿堂回到单檐形制。",
    question: "修缮记录",
    detail: "模型表现形制变化；构件沿用、替换与补配仍待工程档案核对。",
    shape: "落架大修 · 单檐形制",
    source: 1,
    grade: "修缮记录"
  },
  {
    period: "现状 · 修缮之后",
    year: "现状",
    short: "现状，修缮后延续",
    title: "仍在使用，也仍可追问",
    description: "现状延续了大修后的单檐形制。",
    question: "现状模型",
    detail: "柱网与屋面细部为程序几何；元代旧柱位置未作猜定。",
    shape: "现状 · 修缮后的单檐形制",
    source: 0,
    grade: "现状记录"
  }
];

const partNotes = {
  roof: {
    question: "屋面与檐口",
    detail: "单檐、双檐的变化有公开记载；瓦作与檐口曲线待测绘。",
    grade: "形制有记载 · 细部待测",
    source: "上海市文旅推广网"
  },
  frame: {
    question: "梁架与屋架",
    detail: "大修记录提到落架测绘与构件复原；节点与断面待原图校准。",
    grade: "修缮有记录 · 节点待证",
    source: "上海建筑设计研究院"
  },
  dougong: {
    question: "斗栱与出檐支承",
    detail: "斗栱层级与尺度为形态示意，待测绘图复核。",
    grade: "研究推定",
    source: "待补：1963—64年修缮图纸"
  },
  door: {
    question: "门窗与隔扇",
    detail: "格扇用于表达内外界面；分格与历史样式待核。",
    grade: "照片观察 · 细节待核",
    source: "项目现场照片；待补历史照片"
  },
  columns: {
    question: "柱网与旧木",
    detail: "资料记载16根柱中有10根元代柏木柱；旧柱具体位置未证。",
    grade: "数量有记载 · 位置待证",
    source: "上海市文旅推广网"
  },
  base: {
    question: "台基与柱础",
    detail: "资料记载6个元代旧石柱础；分布与形制待核。",
    grade: "数量有记载 · 形制待核",
    source: "上海市文旅推广网"
  }
};

const timelineButtons = [...document.querySelectorAll(".time-step")];
const stageSlider = document.querySelector("#stageSlider");
const timelinePeriod = document.querySelector("#timelinePeriod");
const timelineYear = document.querySelector("#timelineYear");
const stageFields = {
  period: document.querySelector("#stagePeriod"),
  title: document.querySelector("#stageTitle"),
  description: document.querySelector("#stageDescription"),
  question: document.querySelector("#stageQuestion"),
  detail: document.querySelector("#stageDetail"),
  grade: document.querySelector("#sourceGrade"),
  index: document.querySelector("#stageIndex"),
  viewerEra: document.querySelector("#viewerEra"),
  viewerShape: document.querySelector("#viewerShape")
};
const inspector = {
  root: document.querySelector("#componentInspector"),
  title: document.querySelector("#inspectorTitle"),
  text: document.querySelector("#inspectorText"),
  grade: document.querySelector("#inspectorGrade"),
  source: document.querySelector("#inspectorSource")
};

let activeStage = 0;
let stageProgress = 0;
let hallScene = null;

function setStage(value) {
  stageProgress = Math.max(0, Math.min(stages.length - 1, Number(value) || 0));
  activeStage = Math.round(stageProgress);
  const stage = stages[activeStage];
  timelineButtons.forEach((button, buttonIndex) => {
    const selected = buttonIndex === activeStage;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  stageFields.period.textContent = stage.period;
  stageFields.title.textContent = stage.title;
  stageFields.description.textContent = stage.description;
  stageFields.question.textContent = stage.question;
  stageFields.detail.textContent = stage.detail;
  stageFields.grade.textContent = stage.grade;
  stageFields.index.textContent = String(activeStage + 1).padStart(2, "0");
  stageFields.viewerEra.textContent = stage.period;
  stageFields.viewerShape.textContent = stage.shape;
  if (stageSlider) {
    stageSlider.value = String(stageProgress);
    stageSlider.style.setProperty("--progress", String(stageProgress / (stages.length - 1) * 100) + "%");
    stageSlider.setAttribute("aria-valuetext", stage.short);
  }
  if (timelinePeriod) timelinePeriod.textContent = stage.period;
  if (timelineYear) timelineYear.textContent = stage.year;
  if (hallScene) hallScene.setStage(stageProgress);
  if (inspector.root) inspector.root.hidden = true;
  document.querySelectorAll(".scene-pin").forEach((pin) => pin.classList.remove("is-selected"));
}

function setObservation(part) {
  const note = partNotes[part];
  if (!note) return;
  stageFields.question.textContent = note.question;
  stageFields.detail.textContent = note.detail;
  document.querySelectorAll(".scene-pin").forEach((pin) => {
    pin.classList.toggle("is-selected", pin.dataset.part === part);
  });
  inspector.title.textContent = note.question;
  inspector.text.textContent = note.detail;
  inspector.grade.textContent = note.grade;
  inspector.source.textContent = note.source;
  inspector.root.hidden = false;
}

timelineButtons.forEach((button) => button.addEventListener("click", () => setStage(Number(button.dataset.stage))));
stageSlider?.addEventListener("input", (event) => setStage(Number(event.currentTarget.value)));
stageSlider?.addEventListener("change", (event) => setStage(Math.round(Number(event.currentTarget.value))));
stageSlider?.addEventListener("keydown", (event) => {
  const direction = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1
    : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 0;
  if (direction) {
    event.preventDefault();
    event.stopPropagation();
    setStage(Math.max(0, Math.min(stages.length - 1, activeStage + direction)));
  } else if (event.key === "Home") {
    event.preventDefault();
    event.stopPropagation();
    setStage(0);
  } else if (event.key === "End") {
    event.preventDefault();
    event.stopPropagation();
    setStage(stages.length - 1);
  }
});
function clearObservation({ restoreFocus = false } = {}) {
  setStage(activeStage);
  if (restoreFocus) document.querySelector("#hallCanvas")?.focus({ preventScroll: true });
}
document.querySelector("#closeInspector")?.addEventListener("click", () => clearObservation({ restoreFocus: true }));
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && inspector.root && !inspector.root.hidden) {
    event.preventDefault();
    event.stopImmediatePropagation();
    clearObservation({ restoreFocus: true });
  }
});

document.querySelectorAll(".view-button[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!hallScene) return;
    hallScene.setView(button.dataset.view);
  });
});

const toolsToggle = document.querySelector("#toolsToggle");
const modelTools = document.querySelector("#modelTools");
toolsToggle?.addEventListener("click", () => {
  const expanded = toolsToggle.getAttribute("aria-expanded") !== "true";
  toolsToggle.setAttribute("aria-expanded", String(expanded));
  modelTools.hidden = !expanded;
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modelTools && !modelTools.hidden) {
    modelTools.hidden = true;
    toolsToggle?.setAttribute("aria-expanded", "false");
    toolsToggle?.focus({ preventScroll: true });
  }
});

document.querySelector("#explodeToggle").addEventListener("click", (event) => {
  if (!hallScene) return;
  const active = hallScene.toggleExploded();
  event.currentTarget.setAttribute("aria-pressed", String(active));
  event.currentTarget.textContent = active ? "合拢结构" : "分层拆解";
});

document.querySelector("#frameToggle").addEventListener("click", (event) => {
  if (!hallScene) return;
  const active = hallScene.toggleFrame();
  event.currentTarget.setAttribute("aria-pressed", String(active));
  event.currentTarget.textContent = active ? "恢复屋面" : "构架透视";
});

document.querySelector("#cutawayToggle").addEventListener("click", (event) => {
  if (!hallScene) return;
  const active = hallScene.toggleCutaway();
  event.currentTarget.setAttribute("aria-pressed", String(active));
  event.currentTarget.textContent = active ? "恢复全景" : "剖视";
});

document.querySelector("#resetView").addEventListener("click", () => {
  if (!hallScene) return;
  hallScene.resetView();
  document.querySelector("#explodeToggle").textContent = "分层拆解";
  document.querySelector("#frameToggle").textContent = "构架透视";
  document.querySelector("#cutawayToggle").textContent = "剖视";
  modelTools.hidden = true;
  toolsToggle?.setAttribute("aria-expanded", "false");
  clearObservation();
  document.querySelectorAll(".view-button[data-view]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.view === "outside");
  });
});

document.querySelector("#modelDownload").addEventListener("click", async (event) => {
  if (!hallScene) return;
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = "正在生成…";
  try {
    const blob = await hallScene.exportGLB();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "zhenru-main-hall-study-stage-" + (activeStage + 1) + ".glb";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    button.textContent = "GLB 已下载";
    window.setTimeout(() => { button.textContent = "下载 GLB"; }, 1800);
  } catch (error) {
    console.error("GLB export failed:", error);
    button.textContent = "导出失败";
    window.setTimeout(() => { button.textContent = "下载 GLB"; }, 2200);
  } finally {
    button.disabled = false;
  }
});

document.querySelector("#stageSource").addEventListener("click", () => {
  const sourceLink = document.querySelectorAll(".source-list > a")[stages[activeStage].source];
  if (sourceLink) window.open(sourceLink.href, "_blank", "noopener,noreferrer");
});

const revealItems = document.querySelectorAll(".anatomy-grid article, .evidence-card, .photo-card, .steps-list > div, .source-list > a");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  revealItems.forEach((item, index) => {
    item.classList.add("reveal");
    item.style.transitionDelay = String((index % 4) * 55) + "ms";
    observer.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

setStage(0);

function prepareWebGL2Context(canvas) {
  // Prefer a lightweight context first; Three.js reuses this canvas context.
  const attempts = [
    { alpha: false, antialias: false, depth: true, stencil: false, powerPreference: "low-power", failIfMajorPerformanceCaveat: false },
    { alpha: false, antialias: false, depth: true, stencil: false, powerPreference: "default", failIfMajorPerformanceCaveat: false },
    { alpha: false, antialias: false, depth: true, stencil: false, powerPreference: "high-performance", failIfMajorPerformanceCaveat: false }
  ];
  let lastError = null;

  for (const attributes of attempts) {
    try {
      const context = canvas.getContext("webgl2", attributes);
      if (context) return context;
    } catch (error) {
      lastError = error;
    }
  }

  const detail = lastError instanceof Error ? `: ${lastError.message}` : "";
  throw new Error(`无法创建 WebGL 2 图形上下文${detail}`, { cause: lastError });
}

async function bootModel() {
  const loading = document.querySelector("#viewerLoading");
  const message = document.querySelector("#webglMessage");
  const canvas = document.querySelector("#hallCanvas");
  const pinElements = {
    roof: document.querySelector("#pinRoof"),
    frame: document.querySelector("#pinFrame"),
    dougong: document.querySelector("#pinDougong"),
    door: document.querySelector("#pinDoor"),
    columns: document.querySelector("#pinColumns"),
    base: document.querySelector("#pinBase")
  };
  let startupStage = "WebGL 2 context";
  try {
    prepareWebGL2Context(canvas);

    startupStage = "Three.js core";
    await import("three");
    startupStage = "OrbitControls";
    await import("three/addons/controls/OrbitControls.js");
    startupStage = "GLTFExporter";
    await import("three/addons/exporters/GLTFExporter.js");

    startupStage = "hall-model.js module";
    const { createHallScene } = await import("./hall-model.js");
    startupStage = "building Three.js scene";
    hallScene = createHallScene({
      canvas,
      frame: document.querySelector("#viewerFrame"),
      pins: pinElements,
      onPart: setObservation,
      onReady: () => loading.classList.add("is-hidden")
    });
    startupStage = "setting initial history stage";
    hallScene.setStage(activeStage);
  } catch (error) {
    console.error(`Three.js scene failed during ${startupStage}:`, error);
    loading.classList.add("is-hidden");
    message.hidden = false;
    const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    const stack = error instanceof Error && error.stack ? error.stack.split("\n").slice(1, 3).join(" | ").slice(0, 220) : "";
    message.dataset.startupStage = startupStage;
    message.title = stack ? `${detail} | ${stack}` : detail;
    message.textContent = `三维场景启动失败（${startupStage}）：${detail.slice(0, 160)}。可查看浏览器控制台定位模块。`;
  }
}

bootModel();

