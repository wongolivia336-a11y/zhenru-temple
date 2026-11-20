/**
 * One quiet ginkgo leaf connects the reading rooms.
 * Path geometry follows the actual section positions, so it remains aligned
 * when images load, fonts swap, or the viewport changes.
 * No extra canvas/WebGL context and no scroll-jacking.
 */
const ns = "http://www.w3.org/2000/svg";

// Stops follow the whitespace of the actual editorial layout:
// chapter headings, inter-column gutters and breaks between evidence plates.
// The percentages are intentional fallbacks if a grid is stacked or resized.
const storyStops = [
  { selector: "#viewer", at: .16, lane: .90 },
  { selector: ".intro-band", at: .58, lane: .91 },
  { selector: "#chronology .section-heading", at: .62, lane: .58, gap: [":scope > div", ":scope > .section-aside"] },
  { selector: "#chronology .stage-story", at: .53, lane: .68, gap: [".story-copy", ".story-aside"] },
  { selector: "#roofLab .roof-lab-heading", at: .73, lane: .67 },
  { selector: "#roofLab .roof-lab-body", at: .50, lane: .56, gap: [".roof-visual", ".roof-reading"] },
  { selector: "#archiveDesk .archive-head", at: .71, lane: .82 },
  { selector: "#archiveDesk .archive-main", at: .54, lane: .60, gap: [".archive-visual", ".archive-record"] },
  { selector: "#fieldGuide .guide-layout", at: .49, lane: .51, gap: [".guide-intro", ".guide-interactive"] },
  { selector: ".anatomy-section .anatomy-heading", at: .62, lane: .77 },
  { selector: ".anatomy-section .anatomy-grid", at: .48, lane: .50, gap: ["article:nth-child(2)", "article:nth-child(3)"] },
  { selector: "#activation .activation-heading", at: .66, lane: .78 },
  { selector: "#activation .activation-grid", at: .52, lane: .35, gap: ["article:nth-child(1)", "article:nth-child(2)"] },
  { selector: "#evidence .evidence-intro", at: .55, lane: .55, gap: [":scope > div", ":scope > p"] },
  { selector: "#evidence .evidence-cards", at: .48, lane: .68, gap: ["article:nth-child(2)", "article:nth-child(3)"] },
  { selector: "#fieldnotes .field-heading", at: .64, lane: .65 },
  { selector: "#fieldnotes .photo-grid", at: .52, lane: .50, gap: [".photo-roof", ".photo-interior"] },
  { selector: ".next-steps-inner", at: .58, lane: .86 },
  { selector: "#sources .sources-heading", at: .68, lane: .84 },
  { selector: "#sources .source-list", at: .62, lane: .91 }
];

function svgEl(tag, attrs = {}) {
  const node = document.createElementNS(ns, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
  return node;
}

export function initScrollLeaf() {
  const main = document.querySelector("main#top");
  if (!main || document.documentElement.classList.contains("viewer-only")) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches) return;

  const wrap = document.createElement("div");
  wrap.className = "scroll-leaf-route";
  wrap.setAttribute("aria-hidden", "true");
  const svg = svgEl("svg", { class: "scroll-leaf-svg", preserveAspectRatio: "none" });
  const defs = svgEl("defs");
  const fade = svgEl("linearGradient", {
    id: "zhenru-ginkgo-shade", x1: "0%", y1: "0%", x2: "92%", y2: "100%"
  });
  fade.append(
    svgEl("stop", { offset: "0%", "stop-color": "#d2a18d" }),
    svgEl("stop", { offset: "100%", "stop-color": "#9d6253" })
  );
  const clip = svgEl("clipPath", {
    id: "zhenru-leaf-reveal", clipPathUnits: "userSpaceOnUse"
  });
  const reveal = svgEl("rect", { x: 0, y: 0, width: 0, height: 0 });
  clip.append(reveal);
  defs.append(fade, clip);
  const guide = svgEl("path", { class: "scroll-leaf-guide" });
  const trace = svgEl("path", {
    class: "scroll-leaf-trace", "clip-path": "url(#zhenru-leaf-reveal)"
  });
  const leaf = svgEl("g", { class: "scroll-leaf-motif" });
  // The notched fan leads the falling motion; the long petiole trails behind.
  leaf.append(
    svgEl("path", {
      class: "ginkgo-body",
      d: "M0 1 C-4 -5 -10 -9 -17 -16 C-24 -23 -24 -32 -15 -34 Q-8 -38 -2 -34 L0 -28 L2 -34 Q8 -38 15 -34 C24 -32 24 -23 17 -16 C10 -9 4 -5 0 1 Z"
    }),
    svgEl("path", {
      class: "ginkgo-veins",
      d: "M0 0 Q-14 -16 -18 -27 M0 0 Q-7 -17 -9 -32 M0 0 L-2 -30 M0 0 L3 -31 M0 0 Q8 -17 10 -32 M0 0 Q14 -16 18 -27 M0 1 Q2 8 -1 16"
    })
  );
  svg.append(defs, guide, trace, leaf);
  wrap.append(svg);
  main.prepend(wrap);

  const stops = storyStops
    .map((stop) => ({ ...stop, node: main.querySelector(stop.selector) }))
    .filter((stop) => stop.node);
  const sections = stops.map((stop) => stop.node);
  const ro = "ResizeObserver" in window ? new ResizeObserver(() => scheduleGeometry()) : null;
  ro?.observe(main);
  sections.forEach((section) => ro?.observe(section));

  let pathLength = 0;
  let current = 0;
  let desired = 0;
  let frame = 0;
  let geometryFrame = 0;
  let lastTime = 0;

  function draw(time) {
    frame = 0;
    const delta = Math.min(time - (lastTime || time), 50);
    lastTime = time;
    current += (desired - current) * (1 - Math.exp(-delta / 115));
    if (Math.abs(current - desired) < 0.25) current = desired;

    const point = guide.getPointAtLength(Math.max(0, Math.min(pathLength, current)));
    const ahead = guide.getPointAtLength(Math.min(pathLength, current + 9));
    const behind = guide.getPointAtLength(Math.max(0, current - 9));
    const direction = Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * (180 / Math.PI);
    const rotation = direction + 90 + Math.sin(current * .012) * 10;
    reveal.setAttribute("height", Math.max(0, point.y + 1).toFixed(2));
    leaf.setAttribute("transform", `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)}) rotate(${rotation.toFixed(2)}) scale(${window.innerWidth < 700 ? .72 : 1})`);

    if (Math.abs(current - desired) > 0.25) frame = requestAnimationFrame(draw);
  }

  function progress() {
    if (!pathLength) return;
    const mainTop = main.getBoundingClientRect().top + window.scrollY;
    const focusY = window.scrollY + Math.min(window.innerHeight * 0.52, 480) - mainTop;
    // Path is top-to-bottom, but its horizontal curves make its length
    // different from its height. Find the exact point at the reader's Y.
    let low = 0;
    let high = pathLength;
    for (let i = 0; i < 13; i += 1) {
      const mid = (low + high) / 2;
      if (guide.getPointAtLength(mid).y < focusY) low = mid;
      else high = mid;
    }
    desired = Math.min(pathLength, Math.max(0, (low + high) / 2));
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function buildGeometry() {
    geometryFrame = 0;
    const mainRect = main.getBoundingClientRect();
    const width = Math.round(mainRect.width);
    const height = Math.round(main.scrollHeight);
    if (!width || !height) return;
    wrap.style.height = `${height}px`;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    reveal.setAttribute("width", width);
    const isNarrow = width < 950;
    const points = stops.map((stop, index) => {
      const rect = stop.node.getBoundingClientRect();
      const top = rect.top - mainRect.top;
      const y = Math.max(100, Math.min(height - 120, top + rect.height * stop.at));
      let x = width * stop.lane;
      if (!isNarrow && stop.gap) {
        const left = stop.node.querySelector(stop.gap[0]);
        const right = stop.node.querySelector(stop.gap[1]);
        if (left && right) {
          const a = left.getBoundingClientRect();
          const b = right.getBoundingClientRect();
          if (b.left - a.right >= 30) x = (a.right + b.left) / 2 - mainRect.left;
        }
      }
      if (isNarrow) {
        // On stacked mobile layouts there is no middle gutter: keep text clear.
        x = width - (width < 700 ? 23 : 36) + Math.sin(index * 1.55) * (width < 700 ? 10 : 18);
      }
      return { x: Math.min(width - 18, Math.max(22, x)), y };
    });
    points.push({ x: isNarrow ? width - 25 : width * .9, y: height - 90 });
    if (points.length < 2) return;
    const d = [`M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`];
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      const previous = points[i - 2] || a;
      const next = points[i + 1] || b;
      const distance = Math.max(10, b.y - a.y);
      // An S-curve through the gutters, with monotonically increasing Y.
      const sway = isNarrow ? 7 : Math.min(28, distance * .065);
      const direction = i % 2 ? 1 : -1;
      const c1x = a.x + (b.x - previous.x) * .28 + sway * direction;
      const c2x = b.x - (next.x - a.x) * .28 - sway * direction;
      d.push(`C ${c1x.toFixed(2)} ${(a.y + distance * .43).toFixed(2)}, ${c2x.toFixed(2)} ${(b.y - distance * .43).toFixed(2)}, ${b.x.toFixed(2)} ${b.y.toFixed(2)}`);
    }
    guide.setAttribute("d", d.join(" "));
    trace.setAttribute("d", d.join(" "));
    pathLength = trace.getTotalLength();
    // Recalculate without animating a potentially large layout shift.
    progress();
    current = desired;
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function scheduleGeometry() {
    if (!geometryFrame) geometryFrame = requestAnimationFrame(buildGeometry);
  }

  window.addEventListener("scroll", progress, { passive: true });
  window.addEventListener("resize", scheduleGeometry, { passive: true });
  document.fonts?.ready.then(scheduleGeometry);
  scheduleGeometry();

  reducedMotion.addEventListener?.("change", ({ matches }) => {
    wrap.hidden = matches;
    if (!matches) scheduleGeometry();
  });
}
