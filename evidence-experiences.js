// Public-facing interpretation, not historical reconstruction.
// Keep the limits and rights of each record attached to the record itself.
export const ARCHIVE_RECORDS = {
  historic: {
    category: "历史影像 / PUBLIC IMAGE LEAD",
    title: "修缮前：曾经多出来的下檐",
    summary: "2024 年研究文章展示东南视角旧照，图注标出档案室来源。原片拍摄年不详；这里只呈现本站新绘的轮廓提示，不转载照片。",
    date: "1963 年修缮前；拍摄年待核",
    holder: "上海现代建筑设计集团档案室（据转载图注）",
    type: "旧照的公开转载线索 · 未获原件",
    rights: "原件与照片转载授权待确认",
    shortRights: "图像未获转载授权",
    plate: "档案线索 / ARCHIVE LEAD",
    href: "https://www.thepaper.cn/newsDetail_forward_26636609",
    features: {
      eave: ["公开旧照的东南角视角可见上、下两层檐的外轮廓。", "拍摄日期、下檐的真实尺寸和 1320 年屋顶原貌，均不能从单张旧照独立推出。"],
      bracket: ["旧照可帮助提出‘下檐与上檐之间如何相接’的问题；研究文章另讨论下檐未施斗栱。", "图像的分辨率不足以逐件判读斗栱构造；后一句属于研究解释，不能当成照片自动测得的事实。"],
      columns: ["斜向外观给出历史建筑的体量与开间的研究线索。", "不能据此确定历史柱网坐标、所有内部柱位或清代是否扩建的争议。"]
    }
  },
  drawing: {
    category: "图档线索 / ARCHIVAL DRAWING LEAD",
    title: "修缮图档：把结构变成可以追问的线",
    summary: "上海院记载 1962 年受托设计、1963—64 年施工并开展古架测绘。2026 年展览报道出现‘真如寺大殿手绘图纸’，但尚不能确认该展品的绘制年份或图纸类型。",
    date: "1962—64 年为工程期；展出图纸年份待核",
    holder: "上海建筑设计研究院／上海市历史博物馆展品线索",
    type: "图纸存在的公开报道 · 图名及档号未得",
    rights: "未取得图纸扫描件及重用授权",
    shortRights: "图名及年代有待核实",
    plate: "当代教学线描 / DRAWING STUDY",
    href: "https://www.thepaper.cn/newsDetail_forward_33190547",
    features: {
      eave: ["可确认修缮工程开展过测绘；若取得立剖面，可检查修缮前后的檐口关系。", "本站蓝图样式是新画的教学草图；未持有 1963 年檐口剖面，不能量读坡度与出檐。"],
      bracket: ["原始详图或构件编号表可能回答斗栱如何拆装、替换，因而是优先追索材料。", "展览报道没有足够信息证明展示的图纸包含斗栱详图，更不能为模型节点提供实测尺寸。"],
      columns: ["原始平面图及编号表可用于逐根识别旧柱、换柱与柱础。", "目前只有‘图纸曾展出’的报道，尚无可读编号与尺寸，不能在模型上标出十根元代旧柱。"]
    }
  },
  present: {
    category: "现场影像 / OBSERVATION",
    title: "今天：修缮后继续使用的单檐",
    summary: "这是项目发起者提供的现场照片。影像可作为现状观察入口，但拍摄日期、焦距与机位未经过测绘标定。",
    date: "项目现状照片；拍摄日期待补元数据",
    holder: "项目发起者提供",
    type: "现场摄影 · 非正射测绘影像",
    rights: "项目提供素材；对外使用范围依提供者授权",
    shortRights: "现状照片 / 非定标影像",
    plate: "现场观察 / PRESENT VIEW",
    href: "#fieldnotes",
    features: {
      eave: ["照片能看到当前的屋面瓦件、檐口与部分屋脊外形。", "今天的单檐不能等同 1320 年原貌，也不能凭像素估计尺寸。"],
      bracket: ["通过屋檐近照可以观察构件所在区域，安排后续定点补拍。", "局部遮挡与视角限制，使铺作层数、年代和榫卯无法由这张照片确认。"],
      columns: ["现场影像能为下次踏勘拟定外部柱网拍摄清单。", "当前屋檐局部照不足以统计全部 16 根柱，也不能识别哪些柱材是元代原物。"]
    }
  },
  model: {
    category: "三维推演 / INTERACTIVE HYPOTHESIS",
    title: "模型：让假设可以被转动、拆开、质疑",
    summary: "三维形制为 Three.js 程序生成，帮助理解空间关系和历史问题。可在本页按需加载第二个视口，也可返回首页完整模型。",
    date: "当代数字研究原型 · 随资料持续迭代",
    holder: "一殿三时项目 · 自编程序几何",
    type: "非实测复原 · 可操作的空间假设",
    rights: "模型代码见项目仓库；历史真实性不由许可决定",
    shortRights: "程序模型 / 非实测",
    plate: "当代三维 / PROCEDURAL MODEL",
    href: "#viewer",
    features: {
      eave: ["切换时间状态可看见‘双檐加建／去除’在空间中的可能关系。", "清代下檐体量、屋顶曲率与真实构造均缺少历史精确测绘依据。"],
      bracket: ["在‘檐下细看’视角可辨识斗与栱的大致位置关系。", "模型铺作和断面是程序化表达，不能替代古架测绘和构件详图。"],
      columns: ["俯瞰视角可学习本模型采用的 4 × 4 柱网及空间分间逻辑。", "十根元代柏木柱与六件旧柱础的具体位置尚无编号依据，模型不作断代标色。"]
    }
  }
};

export const GUIDE_STOPS = [
  {
    period: "1950 / 从山门到正殿",
    title: "一座拟拆的山门，让调查转向大殿。",
    text: "据公开转引的调查记述，起因是山门与交通的冲突；勘查中，殿内的元延祐七年题记引起注意，后续调查转向正殿。",
    question: "题记首先为我们提供了哪一类可查证据？",
    choices: ["建筑年代的重要文字线索", "每片瓦的原始形状"],
    correct: 0,
    correctText: "是的。文字题记提供纪年线索，但仍需检验构架，不能自动得出完整元代外观。",
    incorrectText: "瓦作细节需要修缮图档或实物测量；题记首先帮助我们认识时间。",
    action: "去档案桌，看题记与旧照为何不能混为一谈 ↗",
    href: "#archiveDesk"
  },
  {
    period: "1950 / 平面与檐下",
    title: "先量平面，再攀檐检查斗栱。",
    text: "同一篇公开转引中提到测量正殿平面、攀登檐部、检验斗栱结构。建筑断代不是凭一个形容词，而是把文字证据与构造特征互相核对。",
    question: "若要判断大殿的结构特征，什么证据更贴近调查方法？",
    choices: ["只看屋瓦颜色", "平面测量与斗栱结构检查"],
    correct: 1,
    correctText: "没错。先观察关系，再回到构件。本站的檐下模型可教学辨认位置，但还不是实测斗栱。",
    incorrectText: "瓦色会随修缮与光照改变。调查重心是可核查的平面与构造。",
    action: "去三维模型的「檐下细看」观察斗栱 ↗",
    href: "#viewer"
  },
  {
    period: "1963—64 / 从调查到修缮",
    title: "一次调查，不能替代一套修缮档案。",
    text: "1950 年的勘查与 1963—64 年的落架大修分属不同事件。后者怎样记录、选择与换配，需要查阅设计图、现场照片及工程清单。",
    question: "可以直接说‘1950年的调查证明1964年每一项复原都准确’吗？",
    choices: ["不能；要查工程图与构件记录", "可以；只要名家做过考察"],
    correct: 0,
    correctText: "严谨！历史调查给出问题和部分证据，具体修缮仍需要独立的档案链。",
    incorrectText: "研究者权威不是每项工程决策的证据。让图纸、照片、编号记录说话。",
    action: "去四重对照追问修缮图档还缺什么 ↗",
    href: "#archiveDesk"
  }
];

function updateLink(link, href) {
  link.href = href;
  if (href.startsWith("#")) {
    link.removeAttribute("target");
    link.removeAttribute("rel");
  } else {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
}

function initArchiveDesk() {
  const tabs = [...document.querySelectorAll("[data-archive-layer]")];
  if (!tabs.length) return;
  const featureButtons = [...document.querySelectorAll("[data-archive-feature]")];
  const panel = document.querySelector("#archive-panel");
  const modelEmbed = document.querySelector("#archiveModelEmbed");
  const modelLoad = document.querySelector("#archiveLoadModel");
  const keys = Object.keys(ARCHIVE_RECORDS);
  let layer = "historic";
  let feature = "eave";

  function clearEmbeddedModel() {
    modelEmbed.querySelector("iframe")?.remove();
    modelEmbed.classList.remove("is-loaded");
  }

  function drawRecord() {
    const record = ARCHIVE_RECORDS[layer];
    const index = keys.indexOf(layer);
    tabs.forEach(tab => {
      const selected = tab.dataset.archiveLayer === layer;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", `archive-tab-${layer}`);
    document.querySelectorAll("[data-archive-plate]").forEach(plate => {
      const selected = plate.dataset.archivePlate === layer;
      plate.hidden = !selected;
      plate.classList.toggle("is-visible", selected);
    });
    const fields = {
      archivePlateLabel: record.plate,
      archivePlateNumber: `PLATE 0${index + 1} / 04`,
      archiveRightsShort: record.shortRights,
      archiveRecordCategory: record.category,
      archiveRecordIndex: `0${index + 1} / 04`,
      archiveRecordTitle: record.title,
      archiveRecordSummary: record.summary,
      archiveCanProve: record.features[feature][0],
      archiveCannotProve: record.features[feature][1],
      archiveMetadataDate: record.date,
      archiveMetadataHolder: record.holder,
      archiveMetadataType: record.type,
      archiveMetadataRights: record.rights
    };
    Object.entries(fields).forEach(([id, value]) => {
      document.getElementById(id).textContent = value;
    });
    featureButtons.forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.archiveFeature === feature));
    });
    updateLink(document.querySelector("#archiveOriginalLink"), record.href);
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      if (layer === "model" && tab.dataset.archiveLayer !== "model") clearEmbeddedModel();
      layer = tab.dataset.archiveLayer;
      drawRecord();
    });
    tab.addEventListener("keydown", event => {
      const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 :
        event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
      if (!delta && event.key !== "Home" && event.key !== "End") return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + delta + tabs.length) % tabs.length;
      tabs[next].click();
      tabs[next].focus();
    });
  });
  featureButtons.forEach(button => {
    button.addEventListener("click", () => {
      feature = button.dataset.archiveFeature;
      drawRecord();
    });
  });
  modelLoad?.addEventListener("click", () => {
    if (modelEmbed.querySelector("iframe")) return;
    const iframe = document.createElement("iframe");
    iframe.src = "./index.html?viewerOnly=1";
    iframe.title = "真如寺大殿可操作的 Three.js 研究模型（非历史测绘）";
    iframe.loading = "lazy";
    iframe.allow = "fullscreen";
    modelEmbed.appendChild(iframe);
    modelEmbed.classList.add("is-loaded");
  });
  drawRecord();
}

function initFieldGuide() {
  const tabs = [...document.querySelectorAll("[data-guide-step]")];
  if (!tabs.length) return;
  const panel = document.querySelector("#guide-panel");
  const choices = document.querySelector("#guideChoices");
  const feedback = document.querySelector("#guideFeedback");
  let active = 0;

  function showStop(index) {
    active = Math.max(0, Math.min(GUIDE_STOPS.length - 1, index));
    const stop = GUIDE_STOPS[active];
    tabs.forEach((tab, tabIndex) => {
      tab.setAttribute("aria-selected", String(tabIndex === active));
      tab.tabIndex = tabIndex === active ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", `guide-tab-${active}`);
    document.querySelector("#guidePeriod").textContent = stop.period;
    document.querySelector("#guideChapterTitle").textContent = stop.title;
    document.querySelector("#guideChapterText").textContent = stop.text;
    document.querySelector("#guideQuestion").textContent = stop.question;
    choices.replaceChildren();
    stop.choices.forEach((label, choiceIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", () => {
        choices.querySelectorAll("button").forEach(option => {
          option.setAttribute("aria-pressed", String(option === button));
        });
        const correct = choiceIndex === stop.correct;
        feedback.textContent = correct ? stop.correctText : stop.incorrectText;
        feedback.classList.toggle("is-correct", correct);
        feedback.classList.toggle("is-incorrect", !correct);
      });
      button.setAttribute("aria-pressed", "false");
      choices.appendChild(button);
    });
    feedback.textContent = "选择一个答案，看哪些判断有证据。";
    feedback.classList.remove("is-correct", "is-incorrect");
    document.querySelector("#guidePrev").disabled = active === 0;
    const next = document.querySelector("#guideNext");
    next.textContent = active === GUIDE_STOPS.length - 1 ? "回到第一站 ↺" : "下一站，沿着证据走 →";
    const action = document.querySelector("#guideAction");
    action.textContent = stop.action;
    action.href = stop.href;
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => showStop(index));
    tab.addEventListener("keydown", event => {
      const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 :
        event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
      if (!delta && event.key !== "Home" && event.key !== "End") return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + delta + tabs.length) % tabs.length;
      showStop(next);
      tabs[next].focus();
    });
  });
  document.querySelector("#guidePrev").addEventListener("click", () => showStop(active - 1));
  document.querySelector("#guideNext").addEventListener("click", () => showStop(active === GUIDE_STOPS.length - 1 ? 0 : active + 1));
  showStop(0);
}

export function initEvidenceExperiences() {
  initArchiveDesk();
  initFieldGuide();
}
