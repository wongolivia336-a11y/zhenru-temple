import { createQuietAir } from "./audio/quiet-air.js";
import { createPresenceClient } from "./presence/client.js";
import { PRESENCE_WEBSOCKET_URL } from "./presence/config.js";
import { initEvidenceExperiences } from "./evidence-experiences.js";
import { initScrollLeaf } from "./scroll-leaf.js";
import { initGalleryMotion } from "./gallery-motion.js";

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
    detail: "同一条檐，为什么会在不同年代增减？",
    observe: "看两侧出檐、歇山端部和檐口下瓦当的排列；切换清代阶段找新增下檐。",
    known: "公开资料记载光绪年间改为双檐，1963—64年落架大修后恢复单檐。",
    unknown: "上檐举架、下檐尺寸、瓦件断面和具体新旧比例都缺原始测绘依据。",
    grade: "形制有记载 · 细部待测",
    source: "上海市文旅推广网",
    href: "https://www.meet-in-shanghai.net/cn/national-key-cultural-relics-protection-unit/it-is-really-like-the-main-hall-of-the-temple-415416/"
  },
  frame: {
    question: "梁架与屋架",
    detail: "哪些木头承载屋顶，哪些曾经修换？",
    observe: "切换构架透视，对照柱、梁、枋与屋架的相对关系。",
    known: "上海院回顾了大修中的古架测绘与构件复原工作。",
    unknown: "各根梁枋的断面、榫卯和构件新旧归属需修缮图纸与编号表。",
    grade: "修缮有记录 · 节点待证",
    source: "上海建筑设计研究院",
    href: "https://www.siadr.com/70thdetails/5e7da86e72f5dd06b6d90d03/"
  },
  dougong: {
    question: "斗栱与出檐支承",
    detail: "斗与栱为什么层层叠出？",
    observe: "点「檐下细看」，找柱顶与柱间的层叠木构，观察它们怎样过渡到出檐。",
    known: "公开报道讨论了真如寺大殿的斗栱与梁架；当前模型可帮助辨认位置关系。",
    unknown: "铺作逐层构造、构件实际大小与原件年代不能由程序几何确认。",
    grade: "研究推定",
    source: "上海普陀报道；待补修缮图",
    href: "https://www.shpt.gov.cn/tupianxinwen/20250416/958655.html"
  },
  door: {
    question: "门窗与隔扇",
    detail: "门扇能告诉我们哪一代的建筑语言？",
    observe: "对照门扇分格与檐下柱网，注意现在见到的和建造年代不是一个问题。",
    known: "程序模型用格扇表达内外界面，便于观察空间开合关系。",
    unknown: "历史式样、格心做法、颜色与每次更换的年代尚未核实。",
    grade: "照片观察 · 细节待核",
    source: "项目现场笔记；待补历史照片",
    href: "#fieldnotes"
  },
  columns: {
    question: "柱网与旧木",
    detail: "十根七百年前的木柱，究竟是哪十根？",
    observe: "俯瞰柱网：先数16根柱。不要把模型的颜色当成木料年代编码。",
    known: "公开资料记载16根柱中有10根为元代柏木柱。",
    unknown: "哪10根是旧物，要靠编号、年轮／材料记录和修缮档案核对。",
    grade: "数量有记载 · 位置待证",
    source: "上海市文旅推广网",
    href: "https://www.meet-in-shanghai.net/cn/national-key-cultural-relics-protection-unit/it-is-really-like-the-main-hall-of-the-temple-415416/"
  },
  base: {
    question: "台基与柱础",
    detail: "一块石础如何成为年代证据？",
    observe: "沿柱脚寻找木柱、石础和台基相接的位置。",
    known: "公开资料记载6个石柱础为元代旧物。",
    unknown: "六个旧础的位置、石作纹样与后期换补情况还需逐件记录。",
    grade: "数量有记载 · 形制待核",
    source: "上海市文旅推广网",
    href: "https://www.meet-in-shanghai.net/cn/national-key-cultural-relics-protection-unit/it-is-really-like-the-main-hall-of-the-temple-415416/"
  }
};

// A deliberately diagrammatic reading aid, not measured historic elevations.
const roofReadings = [
  {
    phase: "1320 · 形制尚待证",
    title: "1320 是时间证据，未必是外观答案。",
    known: "元延祐七年的木构题记是重要时间线索；它指向建筑的历史年代。",
    unknown: "仍没有足以逐项还原1320年完整立面、檐口和瓦件的测绘与影像证据。图中单檐只是用于比较的形制示意。",
    alt: "元代题记节点的单檐研究示意，形制未经原状测绘确认",
    href: "https://www.meet-in-shanghai.net/cn/national-key-cultural-relics-protection-unit/it-is-really-like-the-main-hall-of-the-temple-415416/"
  },
  {
    phase: "1894—97 · 记载中的双檐",
    title: "下檐增加，建筑的外轮廓也随之改变。",
    known: "上海市文旅推广网记载光绪重修时将单檐改为双檐；研究文章据旧照讨论过五间重檐形态。",
    unknown: "关于主体是否扩建，公开资料有不同表述。红色下檐的伸出范围、尺度与柱位都只是说明性画法。",
    alt: "清代双檐研究示意，新增下檐用红色突出，比例与柱位未按历史测绘复原",
    href: "https://www.thepaper.cn/newsDetail_forward_26636609"
  },
  {
    phase: "1963—64 · 去除后加下檐",
    title: "一次修缮，也是一种历史选择。",
    known: "1963年开始落架大修，1964年竣工；相关资料明确提到去除后世下檐、恢复单檐形式。",
    unknown: "恢复单檐不等于每根构件都回到1320年。沿用、替换、补配的清单仍应核对修缮档案。",
    alt: "1963至1964年修缮后的单檐示意，虚线提示已去除的下檐历史层次",
    href: "https://www.siadr.com/70thdetails/5e7da86e72f5dd06b6d90d03/"
  },
  {
    phase: "现在 · 单檐可见",
    title: "眼前的单檐，是多次修缮的结果。",
    known: "今天可通过现场照片观察单檐歇山的外观、瓦件与色彩，并与档案中的修缮节点对照。",
    unknown: "现状照片不是元代照片；当前视觉效果也不能逐项证明旧木、旧础或瓦件的年代。",
    alt: "现状单檐示意，以虚线提醒清代下檐曾存在但今天已去除",
    href: "#fieldnotes"
  }
];

const timelineButtons = [...document.querySelectorAll(".time-step")];
const stageSlider = document.querySelector("#stageSlider");
const timelinePeriod = document.querySelector("#timelinePeriod");
const timelineYear = document.querySelector("#timelineYear");
const ginkgoEra = document.querySelector("#ginkgoEra");
const ginkgoStageNotes = [
  "1320年是否已植，史料不足",
  "清代树形 · 研究性生长模拟",
  "1963年前后 · 生长状态推定",
  "现状尺寸参照 · 树形研究模拟"
];
const stageFields = {
  period: document.querySelector("#stagePeriod"),
  title: document.querySelector("#stageTitle"),
  description: document.querySelector("#stageDescription"),
  question: document.querySelector("#stageQuestion"),
  detail: document.querySelector("#stageDetail"),
  grade: document.querySelector("#sourceGrade"),
  index: document.querySelector("#stageIndex"),
  viewerShape: document.querySelector("#viewerShape")
};
const inspector = {
  root: document.querySelector("#componentInspector"),
  title: document.querySelector("#inspectorTitle"),
  text: document.querySelector("#inspectorText"),
  grade: document.querySelector("#inspectorGrade"),
  source: document.querySelector("#inspectorSource"),
  observe: document.querySelector("#inspectorObserve"),
  known: document.querySelector("#inspectorKnown"),
  unknown: document.querySelector("#inspectorUnknown"),
  link: document.querySelector("#inspectorLink")
};

let activeStage = 0;
let stageProgress = 0;
let hallScene = null;
let timelineSettleFrame = 0;

function stopTimelineSettle() {
  if (timelineSettleFrame) cancelAnimationFrame(timelineSettleFrame);
  timelineSettleFrame = 0;
}

function settleTimeline() {
  stopTimelineSettle();
  const start = stageProgress;
  const target = Math.round(start);
  if (Math.abs(target - start) < .005 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setStage(target);
    return;
  }
  const startTime = performance.now();
  const duration = 280;
  function animate(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    setStage(start + (target - start) * eased);
    if (t < 1) timelineSettleFrame = requestAnimationFrame(animate);
    else timelineSettleFrame = 0;
  }
  timelineSettleFrame = requestAnimationFrame(animate);
}

function setStage(value) {
  stageProgress = Math.max(0, Math.min(stages.length - 1, Number(value) || 0));
  const previousStage = activeStage;
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
  stageFields.viewerShape.textContent = stage.shape;
  if (stageSlider) {
    stageSlider.value = String(stageProgress);
    stageSlider.style.setProperty("--progress", String(stageProgress / (stages.length - 1) * 100) + "%");
    stageSlider.setAttribute("aria-valuetext", stage.short);
  }
  if (timelinePeriod) timelinePeriod.textContent = stage.period;
  if (timelineYear) timelineYear.textContent = stage.year;
  if (hallScene) hallScene.setStage(stageProgress);
  if (ginkgoEra) ginkgoEra.textContent = ginkgoStageNotes[activeStage];
  const roofLab = document.querySelector("#roofLab");
  const reading = roofReadings[activeStage];
  if (roofLab) roofLab.dataset.stage = String(activeStage);
  document.querySelectorAll("[data-roof-stage]").forEach(button => {
    const selected = Number(button.dataset.roofStage) === activeStage;
    button.setAttribute("aria-pressed", String(selected));
  });
  document.querySelector("#roofDiagramPhase").textContent = reading.phase;
  document.querySelector("#roofDiagram").setAttribute("aria-label", reading.alt);
  document.querySelector("#roofReadingTitle").textContent = reading.title;
  document.querySelector("#roofReadingKnown").textContent = reading.known;
  document.querySelector("#roofReadingUnknown").textContent = reading.unknown;
  const readingSource = document.querySelector("#roofReadingSource");
  readingSource.href = reading.href;
  if (reading.href.startsWith("#")) {
    readingSource.removeAttribute("target");
  } else {
    readingSource.target = "_blank";
  }
  if (activeStage !== previousStage && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (const target of [document.querySelector(".stage-story"), document.querySelector(".roof-reading")]) {
      target?.classList.remove("is-turning");
      if (target) {
        void target.offsetWidth;
        target.classList.add("is-turning");
      }
    }
  }
  closeInspector();
}

let activeComponentPart = null;
let lastComponentPin = null;
function closeInspector({ restoreFocus = false } = {}) {
  if (inspector.root) inspector.root.hidden = true;
  document.querySelector("#viewerFrame")?.classList.remove("has-inspector");
  document.querySelectorAll(".scene-pin").forEach(pin => {
    pin.classList.remove("is-selected");
    pin.setAttribute("aria-expanded", "false");
  });
  activeComponentPart = null;
  if (restoreFocus) {
    const target = lastComponentPin?.classList.contains("is-visible") ?
      lastComponentPin : document.querySelector("#hallCanvas");
    target?.focus({ preventScroll: true });
  }
}
function setObservation(part) {
  const note = partNotes[part];
  if (!note) return;
  if (activeComponentPart === part && inspector.root && !inspector.root.hidden) {
    closeInspector();
    return;
  }
  // Only the component inspector changes; the history-stage narrative does not.
  const tools = document.querySelector("#modelTools");
  if (tools && !tools.hidden) {
    tools.hidden = true;
    document.querySelector("#toolsToggle")?.setAttribute("aria-expanded", "false");
    document.querySelector("#viewerFrame")?.classList.remove("has-research-panel");
  }
  activeComponentPart = part;
  lastComponentPin = document.querySelector(`.scene-pin[data-part="${part}"]`);
  document.querySelectorAll(".scene-pin").forEach(pin => {
    const selected = pin.dataset.part === part;
    pin.classList.toggle("is-selected", selected);
    pin.setAttribute("aria-expanded", String(selected));
  });
  inspector.title.textContent = note.question;
  inspector.text.textContent = note.detail;
  inspector.observe.textContent = note.observe;
  inspector.known.textContent = note.known;
  inspector.unknown.textContent = note.unknown;
  inspector.grade.textContent = note.grade;
  inspector.source.textContent = note.source;
  inspector.link.href = note.href;
  if (note.href.startsWith("#")) inspector.link.removeAttribute("target");
  else inspector.link.target = "_blank";
  inspector.root.hidden = false;
  document.querySelector("#viewerFrame")?.classList.add("has-inspector");
}

timelineButtons.forEach((button) => button.addEventListener("click", () => {
  stopTimelineSettle();
  setStage(Number(button.dataset.stage));
}));
document.querySelectorAll("[data-roof-stage]").forEach(button => {
  button.addEventListener("click", () => {
    stopTimelineSettle();
    setStage(Number(button.dataset.roofStage));
  });
});
document.querySelector("#roofToModel")?.addEventListener("click", () => {
  hallScene?.setView("outside");
  document.querySelector("#viewer")?.scrollIntoView({ behavior: "smooth", block: "start" });
});
document.querySelectorAll("[data-learn-part]").forEach(button => {
  button.addEventListener("click", () => {
    if (!hallScene) return;
    hallScene.setView(button.dataset.learnView || "outside");
    setObservation(button.dataset.learnPart);
    document.querySelector("#viewer")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
stageSlider?.addEventListener("input", (event) => {
  stopTimelineSettle();
  setStage(Number(event.currentTarget.value));
});
stageSlider?.addEventListener("change", settleTimeline);
stageSlider?.addEventListener("keydown", (event) => {
  const direction = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1
    : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 0;
  if (direction) {
    event.preventDefault();
    event.stopPropagation();
    stopTimelineSettle();
    setStage(Math.max(0, Math.min(stages.length - 1, activeStage + direction)));
  } else if (event.key === "Home") {
    event.preventDefault();
    event.stopPropagation();
    stopTimelineSettle();
    setStage(0);
  } else if (event.key === "End") {
    event.preventDefault();
    event.stopPropagation();
    stopTimelineSettle();
    setStage(stages.length - 1);
  }
});
function clearObservation({ restoreFocus = false } = {}) {
  closeInspector({ restoreFocus });
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
function setResearchOpen(expanded) {
  if (!modelTools) return;
  if (expanded) closeInspector();
  modelTools.hidden = !expanded;
  toolsToggle?.setAttribute("aria-expanded", String(expanded));
  document.querySelector("#viewerFrame")?.classList.toggle("has-research-panel", expanded);
}
toolsToggle?.addEventListener("click", () => {
  setResearchOpen(toolsToggle.getAttribute("aria-expanded") !== "true");
});
// Close the structure popover when interacting with the model or other UI.
document.addEventListener("pointerdown", (event) => {
  if (modelTools && !modelTools.hidden && !event.target.closest(".view-tools")) {
    setResearchOpen(false);
  }
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modelTools && !modelTools.hidden) {
    setResearchOpen(false);
    toolsToggle?.focus({ preventScroll: true });
  }
});

const explodeSlider = document.querySelector("#explodeSlider");
const explodeValue = document.querySelector("#explodeValue");
const zoomSlider = document.querySelector("#zoomSlider");
const zoomValue = document.querySelector("#zoomValue");
const focusSelect = document.querySelector("#explodeFocus");
function syncExplodeUI(value) {
  const numeric = Math.max(0,Math.min(100,Math.round(value)));
  if (explodeSlider) explodeSlider.value=String(numeric);
  if (explodeValue) explodeValue.textContent=numeric+"%";
  const btn=document.querySelector("#explodeToggle");
  btn.setAttribute("aria-pressed",String(numeric>0));
  btn.textContent=numeric>0 ? "合拢结构" : "分层拆解";
}
explodeSlider?.addEventListener("input",event=>{
  const value=Number(event.currentTarget.value);
  if(hallScene) hallScene.setExplosion(value/100);
  syncExplodeUI(value);
});
function setFocus(value) {
  const focus = ["all", "roof", "frame", "columns"].includes(value) ? value : "all";
  if (focusSelect) focusSelect.value = focus;
  document.querySelectorAll("[data-explode-focus]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.explodeFocus === focus));
  });
  hallScene?.setExplosionFocus(focus);
}
document.querySelectorAll("[data-explode-focus]").forEach(button => {
  button.addEventListener("click", () => setFocus(button.dataset.explodeFocus));
});
zoomSlider?.addEventListener("input",event=>{
  const value=Number(event.currentTarget.value);
  if(hallScene) hallScene.setZoomPercent(value);
  zoomValue.textContent=value+"%";
});
document.querySelector("#explodeToggle").addEventListener("click", (event) => {
  if (!hallScene) return;
  const active = hallScene.toggleExploded();
  syncExplodeUI(active ? 100 : 0);
});
let treeEnabled=true,seasonMode="autumn";
const treeToggle=document.querySelector("#treeToggle");
const seasonToggle=document.querySelector("#seasonToggle");
treeToggle?.addEventListener("click",()=>{
  treeEnabled=!treeEnabled;
  hallScene?.setTreeVisible(treeEnabled);
  treeToggle.setAttribute("aria-pressed",String(treeEnabled));
  treeToggle.textContent=treeEnabled?"古树 · 显示":"古树 · 隐藏";
});
seasonToggle?.addEventListener("click",()=>{
  seasonMode=seasonMode==="autumn"?"spring":"autumn";
  hallScene?.setSeason(seasonMode);
  seasonToggle.setAttribute("aria-pressed",String(seasonMode==="autumn"));
  seasonToggle.textContent=seasonMode==="autumn"?"秋色":"春绿";
});
document.querySelector("#treeView")?.addEventListener("click",()=>{
  if(!hallScene)return;
  hallScene.setView("courtyard");
  document.querySelectorAll(".view-button[data-view]").forEach(button=>button.classList.remove("is-selected"));
  document.querySelector("#hallCanvas")?.focus({preventScroll:true});
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
  syncExplodeUI(0);
  if (zoomSlider) zoomSlider.value="100";
  if (zoomValue) zoomValue.textContent="100%";
  setFocus("all");
  document.querySelector("#frameToggle").textContent = "构架透视";
  document.querySelector("#cutawayToggle").textContent = "剖视";
  setResearchOpen(false);
  // Reset both visual state and accessibility semantics.
  for (const id of ["explodeToggle", "frameToggle", "cutawayToggle"]) {
    document.getElementById(id)?.setAttribute("aria-pressed", "false");
  }
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
initEvidenceExperiences();
initScrollLeaf();
initGalleryMotion();

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
      onVisitZone: onVisitZoneChanged,
      onReady: () => loading.classList.add("is-hidden")
    });
    startupStage = "setting initial history stage";
    hallScene.setStage(activeStage);
    hallScene.setSeason(seasonMode);
    hallScene.setTreeVisible(treeEnabled);
    hallScene.setExplosionFocus(focusSelect?.value||"all");
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


/* V10 / Enter Temple: a complete, private first-person visit before any social UI.
   No fake players or remotely stored routes. The archive remains available. */
let visitActive = false;
let visitZone = "courtyard";
let visitPoseTimer = null;
let visitClockTimer = null;
const visitHud = document.querySelector("#visitHud");
const visitShare = document.querySelector("#visitShare");
const visitPresenceState = document.querySelector("#visitPresenceState");
const visitMoment = document.querySelector("#visitMoment");
const visitSound = document.querySelector("#visitSound");
const quietAir = createQuietAir();
const presence = createPresenceClient({
  url: PRESENCE_WEBSOCKET_URL,
  onState({ status, detail, joined }) {
    if (!joined) hallScene?.clearRemoteVisitors();
    if (visitPresenceState) {
      visitPresenceState.textContent = joined
        ? "共在中 · 仅同步匿名位置与动作"
        : status === "connecting" ? "正在加入共享庭院…"
        : detail && status === "error" ? "连接失败 · 仍可独处参访"
        : "独处参访 · 不上传位置";
    }
    if (visitShare) {
      visitShare.disabled = !joined && (!presence.available || visitZone!=="eave");
      visitShare.textContent = joined ? "退出共在"
        : presence.available ? visitZone==="eave" ? "进入共在" : "檐下可共在"
        : "共在 · 尚未开放";
      visitShare.setAttribute("aria-pressed", String(joined));
    }
  },
  onPeer(peer) { if (visitActive) hallScene?.setRemoteVisitor(peer); },
  onLeave(id) { hallScene?.removeRemoteVisitor(id); },
  onTrace(data) {
    if (visitActive && data && ["dougong","roof","ginkgo"].includes(data.part)
      && typeof data.key==="string") {
      const seconds=Number.isFinite(data.expires)
        ? Math.min(85,Math.max(0,(data.expires-Date.now())/1000)):85;
      if(seconds>0)hallScene?.addVisitTrace(data.part,"shared-"+data.key,seconds);
    }
  }
});
if (visitShare) {
  visitShare.disabled = !presence.available;
  visitShare.title = presence.available
    ? "进入共享庭院后，其他访客可以看到你的匿名化身；可随时退出，不保存路径"
    : "共在后端尚未部署。本版本不会虚构其他在线访客。";
}

function updateShanghaiClock() {
  const node=document.querySelector("#visitClock");
  if (!node) return;
  const time=new Intl.DateTimeFormat("zh-CN",{
    timeZone:"Asia/Shanghai",hour:"2-digit",minute:"2-digit",hour12:false
  }).format(new Date());
  node.textContent="上海时间 · "+time+" · 现状研究场景";
}
function onVisitZoneChanged(zone) {
  if (!visitActive) return;
  visitZone=zone;
  const title=document.querySelector("#visitZoneTitle");
  const text=document.querySelector("#visitZoneText");
  const annotation=document.querySelector(".visit-annotation");
  const actions=document.querySelector("#visitEaveActions");
  // Threshold consent: sharing is offered only under the eaves. Walking
  // back into the courtyard leaves shared presence without a goodbye.
  if(zone!=="eave"&&presence.joined)presence.disconnect();
  if(visitShare && !presence.joined) {
    visitShare.disabled = !presence.available || zone!=="eave";
    visitShare.textContent = presence.available
      ? zone==="eave" ? "进入共在" : "檐下可共在"
      : "共在 · 尚未开放";
  }
  if (zone==="eave") {
    annotation.textContent="02 / UNDER THE EAVES";
    title.textContent="抬头，看木构如何相互承托。";
    text.textContent="靠近屋檐，注意斗栱的出跳关系。若想了解证据，可以打开构件档案；也可以只是站在这里。";
    actions.hidden=false;
  } else if(zone==="interior") {
    annotation.textContent="03 / THE MAIN HALL";
    title.textContent="从殿中重新感受空间的尺度。";
    text.textContent="这是建筑研究性的室内空间。仅保留不带造像的祭台体量示意；陈设未经测绘或寺方核验，不代表真实原状。";
    actions.hidden=true;
    if (presence.joined) presence.disconnect();
  } else {
    annotation.textContent="01 / COURTYARD";
    title.textContent="从庭院，望向大殿。";
    text.textContent="拖动转头，用 WASD 或方向按键缓缓向前。这里的庭院铺装与周边环境属于研究性表达，非现场测绘。";
    actions.hidden=true;
  }
  document.querySelectorAll("[data-visit-view]").forEach(button=>{
    const value=button.dataset.visitView;
    const active=zone==="interior" ? value==="interior-walk"
      : zone==="eave" ? value==="threshold" : value==="walk";
    button.setAttribute("aria-current",String(active));
  });
}

function enterTemple() {
  if (!hallScene) {
    const enter=document.querySelector("#enterVisit");
    if(enter)enter.textContent="三维空间正在准备…";
    return;
  }
  // First-person visit intentionally starts from a present-day study phase.
  // It does not pretend the 1320 structure or the garden was measured.
  visitActive=true;
  setResearchOpen(false);
  closeInspector();
  setStage(3);
  hallScene.resetView();
  hallScene.setView("walk");
  document.documentElement.classList.add("visit-mode");
  visitHud.hidden=false;
  visitMoment.textContent="";
  visitZone="courtyard";
  onVisitZoneChanged("courtyard");
  updateShanghaiClock();
  if (visitClockTimer) window.clearInterval(visitClockTimer);
  visitClockTimer=window.setInterval(updateShanghaiClock,60000);
  if (visitPoseTimer) window.clearInterval(visitPoseTimer);
  visitPoseTimer=window.setInterval(()=>{
    if(visitActive && visitZone!=="interior" && presence.joined)
      presence.sendPose(hallScene.getVisitPose());
  },155);
  document.querySelector("#visitExit")?.focus({preventScroll:true});
}
function leaveTemple({ openStudy=false }={}) {
  if (!visitActive) return;
  visitActive=false;
  presence.disconnect();
  quietAir.stop();
  if(visitSound){visitSound.textContent="风声 · 关闭";visitSound.setAttribute("aria-pressed","false");}
  if(visitClockTimer)window.clearInterval(visitClockTimer);
  if(visitPoseTimer)window.clearInterval(visitPoseTimer);
  visitClockTimer=null;visitPoseTimer=null;
  document.documentElement.classList.remove("visit-mode");
  visitHud.hidden=true;
  hallScene?.clearRemoteVisitors();
  hallScene?.resetView();
  if(openStudy) {
    hallScene?.setView("eave");
    setObservation("dougong");
  }
  document.querySelector(openStudy ? "#closeInspector" : "#enterVisit")
    ?.focus({preventScroll:true});
}
document.querySelector("#enterVisit")?.addEventListener("click",enterTemple);
document.querySelector("#visitExit")?.addEventListener("click",()=>leaveTemple());
document.querySelector("#visitStudy")?.addEventListener("click",()=>leaveTemple({openStudy:true}));
document.querySelectorAll("[data-visit-view]").forEach(button=>button.addEventListener("click",()=>{
  if(!visitActive||!hallScene)return;
  const view=button.dataset.visitView;
  if(view==="interior-walk"&&presence.joined)presence.disconnect();
  hallScene.setView(view);
  onVisitZoneChanged(view==="interior-walk"?"interior":view==="threshold"?"eave":"courtyard");
  visitMoment.textContent="";
  document.querySelector("#hallCanvas")?.focus({preventScroll:true});
}));
document.querySelector("#visitMark")?.addEventListener("click",()=>{
  if(!visitActive||!hallScene||visitZone!=="eave")return;
  hallScene.addVisitTrace("dougong","local-attention");
  presence.leaveTrace("dougong");
  visitMoment.textContent=presence.joined
    ? "这处观察线索会在约 85 秒后消失，共在访客可短暂看见。"
    : "已留意此处 · 仅在本机本次参访短暂显现，约 85 秒后消散。";
});
visitShare?.addEventListener("click",()=>{
  if(!visitActive||!presence.available)return;
  if(presence.joined)presence.disconnect();
  else if(visitZone!=="interior")presence.connect();
});
visitSound?.addEventListener("click",async()=>{
  if(quietAir.playing) {
    quietAir.stop();
    visitSound.textContent="风声 · 关闭";
    visitSound.setAttribute("aria-pressed","false");
  }else{
    const success=await quietAir.start();
    visitSound.textContent=success?"风声 · 开启":"当前设备不支持音频";
    visitSound.setAttribute("aria-pressed",String(success));
  }
});
document.addEventListener("visibilitychange",()=>{
  if(document.hidden&&quietAir.playing){
    quietAir.stop();
    visitSound.textContent="风声 · 关闭";
    visitSound.setAttribute("aria-pressed","false");
  }
});
window.addEventListener("pagehide",()=>{presence.disconnect();quietAir.stop();});
window.addEventListener("keydown",(event)=>{
  if(event.key==="Escape"&&visitActive) {
    const inspector=document.querySelector("#componentInspector");
    if(!inspector?.hidden)return;
    leaveTemple();
  }
});
// QA-only extension exposes coherent UI state without affecting regular visitors.
if(new URLSearchParams(location.search).get("qa")==="1") {
  window.__zhenruVisitQA={
    getState:()=>({active:visitActive,zone:visitZone,presenceAvailable:presence.available,
      sharing:presence.joined, audio:quietAir.playing})
  };
}
