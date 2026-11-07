const stages = [
  {
    period: "元 · 延祐七年",
    title: "移建现址，木上留年",
    description: "现址大殿梁间留有“大元延祐七年”题记。它为建筑年代提供重要线索，也让木构本身成为一份可阅读的档案。",
    question: "此刻值得看",
    detail: "现状三间单檐形制作为观察起点。进深柱列按研究文章所述5.3、5.1、2.6米不等距表达；具体构件年代仍需逐件核对。",
    shape: "单檐歇山 · 形制示意",
    source: 0,
    grade: "史料节点"
  },
  {
    period: "清 · 光绪二十至二十三年",
    title: "重修之后，檐层与开间之变",
    description: "公开资料均记载光绪年间重修与双檐变化。上海文旅推广网称主体结构未变；2024年研究文章依据历史照片，提出旧貌为五间重檐。两种描述在开间变化上并不完全一致。",
    question: "此刻值得看",
    detail: "模型以半透明外扩柱列与下层檐顶呈现“五间重檐说”的研究性叠加。外扩尺寸、构件关系和细部均待原始图档核对。",
    shape: "五间重檐说 · 轮廓推演",
    source: 0,
    grade: "公开记载 + 研究文章推断"
  },
  {
    period: "20世纪 · 落架大修",
    title: "拆解测绘，再作选择",
    description: "1963年1月启动落架大修，1964年10月竣工。工程回顾称采用落架方式进行古架测绘与构件复原；研究文章进一步讨论了清代下檐的拆除与屋面细部调整。",
    question: "此刻值得看",
    detail: "模型回到单檐三间形制。修缮中哪些构件沿用、替换或补配，以及山花、起翘与正脊的具体调整，仍应以原始工程档案校准。",
    shape: "落架大修 · 单檐形制",
    source: 1,
    grade: "修缮记录"
  },
  {
    period: "现状 · 修缮之后",
    title: "仍在使用，也仍可追问",
    description: "今天看到的是1963—64年修缮后延续的单檐三间形制。它保留部分早期木构，也承载了近现代保护工程的判断。",
    question: "此刻值得看",
    detail: "公开资料记载16根柱中有10根元代柏木柱、6个元代旧石柱础；模型不将这些数量信息擅自转换成具体构件位置。",
    shape: "现状 · 修缮后的单檐形制",
    source: 0,
    grade: "现状记录"
  }
];

const partNotes = {
  roof: {
    question: "屋面与檐口",
    detail: "公开资料可确认现状为单檐形制，并记载光绪年间曾改作双檐、1963—64年大修后恢复单檐。模型的举架、起翘、瓦垄与脊饰属于视觉推演。",
    grade: "形制有记载 · 几何待测绘",
    source: "上海市文旅推广网"
  },
  frame: {
    question: "梁架与屋架",
    detail: "上海建筑设计研究院的工程回顾提到落架测绘与构件复原。当前梁架按柱网和屋面关系程序化搭建，断面、榫卯和具体构件编号均未取得原始测绘依据。",
    grade: "修缮方式有记录 · 节点待证",
    source: "上海建筑设计研究院"
  },
  dougong: {
    question: "斗栱与出檐支承",
    detail: "此处以柱头铺作、横向出跳和承托构件表达木构受力层次。尚未取得可供逐件复原的斗栱测绘图，因此构造类型与尺度仅作形态研究，不应视为真如寺原状复原。",
    grade: "形制推定 · 待测绘",
    source: "待补：1963—64年修缮图纸"
  },
  door: {
    question: "门窗与隔扇",
    detail: "模型用木格栅和局部围护表达殿内外的界面关系。现有照片不足以确定所有门窗的历史样式、开合方式和更替年代，格心纹样与分格均为示意。",
    grade: "照片观察 + 视觉推演",
    source: "项目现场照片；待补历史照片"
  },
  columns: {
    question: "柱网与旧木",
    detail: "公开资料记载殿内16根柱中有10根为元代柏木柱。进深方向按研究文章所述5.3、5.1、2.6米不等距关系组织；10根旧柱的具体位置仍无逐柱编号可核。",
    grade: "柱网关系有研究依据 · 旧柱位置待证",
    source: "上海市文旅推广网"
  },
  base: {
    question: "台基与柱础",
    detail: "公开资料记载有6个元代旧石柱础。模型中的台基、踏步和柱础用于表达建筑与地面的关系；具体尺寸、石作形制及旧柱础分布仍待核验。",
    grade: "数量有公开记载 · 形制待核",
    source: "上海市文旅推广网"
  }
};

const timelineButtons = [...document.querySelectorAll(".time-step")];
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
let hallScene = null;

function setStage(index) {
  activeStage = Math.max(0, Math.min(stages.length - 1, index));
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
  if (hallScene) hallScene.setStage(activeStage);
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

document.querySelector("#explodeToggle").addEventListener("click", (event) => {
  if (!hallScene) return;
  const active = hallScene.toggleExploded();
  event.currentTarget.setAttribute("aria-pressed", String(active));
  event.currentTarget.textContent = active ? "收拢结构" : "结构分解";
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
  document.querySelector("#explodeToggle").textContent = "结构分解";
  document.querySelector("#frameToggle").textContent = "构架透视";
  document.querySelector("#cutawayToggle").textContent = "剖视";
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

async function bootModel() {
  const loading = document.querySelector("#viewerLoading");
  const message = document.querySelector("#webglMessage");
  const pinElements = {
    roof: document.querySelector("#pinRoof"),
    frame: document.querySelector("#pinFrame"),
    dougong: document.querySelector("#pinDougong"),
    door: document.querySelector("#pinDoor"),
    columns: document.querySelector("#pinColumns"),
    base: document.querySelector("#pinBase")
  };
  try {
    const { createHallScene } = await import("./hall-model.js");
    hallScene = createHallScene({
      canvas: document.querySelector("#hallCanvas"),
      frame: document.querySelector("#viewerFrame"),
      pins: pinElements,
      onPart: setObservation,
      onReady: () => loading.classList.add("is-hidden")
    });
    hallScene.setStage(activeStage);
  } catch (error) {
    console.error("Three.js scene failed to start:", error);
    loading.classList.add("is-hidden");
    message.hidden = false;
    message.textContent = "三维场景没有启动。请确认浏览器支持 WebGL 2、图形加速已启用，并通过本地服务器打开页面。";
  }
}

bootModel();
