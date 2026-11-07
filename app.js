const stages = [
  {
    period: "元 · 延祐七年",
    title: "移建现址，木上留年",
    description: "现址大殿梁间留有“大元延祐七年”题记。它为建筑年代提供重要线索，也让木构本身成为一份可阅读的档案。",
    question: "此刻值得看",
    detail: "屋顶以单檐歇山形制示意。现存木构中有元代构件，但不把整座殿堂都标成“元代原物”。",
    shape: "单檐歇山 · 形制示意",
    source: 0,
    grade: "史料节点"
  },
  {
    period: "清 · 光绪二十至二十三年",
    title: "双檐改制，主体仍在",
    description: "光绪年间重修，大殿由单檐改为双檐。公开介绍称主体结构未变；正梁还留有光绪二十三年重建题记。",
    question: "此刻值得看",
    detail: "三维场景增加一层檐顶，表达“双檐”这一可查证变化。具体构造与比例仍须用旧照片、图纸或修缮档案校准。",
    shape: "双檐 · 形制变化示意",
    source: 0,
    grade: "形制记录"
  },
  {
    period: "20世纪 · 落架大修",
    title: "拆解测绘，再作选择",
    description: "1963年启动落架大修，1964年竣工。修缮采取落架方式进行古架测绘与构件复原，并拆除清代加作的重檐。",
    question: "此刻值得看",
    detail: "恢复元代单檐面貌，是一次有明确方向的保护选择。哪些部件沿用、替换或补配，应继续追索工程档案。",
    shape: "落架修缮 · 单檐形制",
    source: 1,
    grade: "修缮记录"
  },
  {
    period: "现状 · 修缮之后",
    title: "仍在使用，也仍可追问",
    description: "今天看到的单檐大殿，是历代营造、清代改建与20世纪修缮叠合后的现状。它既保存旧构件，也承载近现代的修复判断。",
    question: "此刻值得看",
    detail: "公开资料记载，殿内16根柱中有10根为元代柏木柱，另有6个元代旧石柱础。具体位置仍待逐件核验。",
    shape: "现状形制 · 示意",
    source: 2,
    grade: "现状记录"
  }
];

const partNotes = {
  roof: {
    question: "檐口与屋面",
    detail: "现状为单檐歇山顶。公开记载称光绪年间曾改作双檐，1963—64年大修后恢复单檐形制。模型中的坡度与瓦作细节仍是示意。"
  },
  frame: {
    question: "梁架与斗栱",
    detail: "上海建筑设计研究院回顾：修缮采用落架方式进行古架测绘与构件复原。若取得测绘图，可把具体节点转成可核对模型。"
  },
  columns: {
    question: "柱网与旧木",
    detail: "公开资料记载殿内16根柱中有10根为元代柏木柱。因尚无可靠的逐柱编号资料，场景不擅自标出这10根的位置。"
  },
  base: {
    question: "台基与柱础",
    detail: "公开资料记载有6个石柱础为元代旧物。模型里的柱础只表达柱网关系，位置、形制和更换情况仍需核对。"
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
}

function setObservation(part) {
  const note = partNotes[part];
  if (!note) return;
  stageFields.question.textContent = note.question;
  stageFields.detail.textContent = note.detail;
  document.querySelectorAll(".scene-pin").forEach((pin) => {
    pin.classList.toggle("is-selected", pin.dataset.part === part);
  });
}

timelineButtons.forEach((button) => button.addEventListener("click", () => setStage(Number(button.dataset.stage))));

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

document.querySelector("#resetView").addEventListener("click", () => {
  if (!hallScene) return;
  hallScene.resetView();
  document.querySelector("#explodeToggle").textContent = "结构分解";
  document.querySelector("#frameToggle").textContent = "构架透视";
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
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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
    message.textContent = "三维场景没有启动。请确认浏览器支持 WebGL，并通过本地服务器打开页面；首次加载还需访问 Three.js CDN。";
  }
}

bootModel();
