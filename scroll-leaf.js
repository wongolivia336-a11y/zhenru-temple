/**
 * One quiet ginkgo leaf connects the reading rooms.
 * Path geometry follows the actual section positions, so it remains aligned
 * when images load, fonts swap, or the viewport changes.
 * No extra canvas/WebGL context and no scroll-jacking.
 */
const ns = "http://www.w3.org/2000/svg";

const sectionSelectors = [
  "#viewer", ".intro-band", "#chronology", "#roofLab",
  "#archiveDesk", "#fieldGuide", ".anatomy-section",
  "#activation", "#evidence", "#fieldnotes", ".next-steps", "#sources"
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
  const guide = svgEl("path", { class: "scroll-leaf-guide" });
  const trace = svgEl("path", { class: "scroll-leaf-trace" });
  const leaf = svgEl("g", { class: "scroll-leaf-motif" });
  // A fan-shaped, two-lobed ginkgo leaf: a small, legible sign, not a stock icon.
  leaf.append(
    svgEl("path", {
      class: "ginkgo-body",
      d: "M0 3 C-4 -3 -18 -9 -18 -20 C-18 -27 -14 -33 -8 -31 C-6 -36 -1 -36 0 -32 C2 -37 8 -36 10 -31 C16 -33 20 -27 18 -20 C17 -10 6 -3 0 3 Z"
    }),
    svgEl("path", {
      class: "ginkgo-veins",
      d: "M0 2 Q-12 -12 -14 -25 M0 2 Q-5 -14 -5 -30 M0 2 Q5 -15 7 -30 M0 2 Q12 -12 14 -24 M0 2 L1 10"
    })
  );
  svg.append(guide, trace, leaf);
  wrap.append(svg);
  main.prepend(wrap);

  const sections = sectionSelectors
    .map((selector) => main.querySelector(selector))
    .filter(Boolean);
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

    trace.style.strokeDashoffset = String(Math.max(0, pathLength - current));
    const point = guide.getPointAtLength(Math.max(0, Math.min(pathLength, current)));
    const ahead = guide.getPointAtLength(Math.min(pathLength, current + 9));
    const behind = guide.getPointAtLength(Math.max(0, current - 9));
    const rotation = Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * (180 / Math.PI) - 90;
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
    const isMobile = width < 700;
    const edge = isMobile ? 19 : Math.min(82, Math.max(47, width * 0.062));
    const amplitude = isMobile ? 7 : 23;
    const points = sections.map((section, index) => {
      const rect = section.getBoundingClientRect();
      const top = rect.top - mainRect.top;
      const y = Math.min(height - 95, Math.max(90, top + Math.min(rect.height * (index === 0 ? 0.19 : 0.38), 380)));
      // Gentle lateral drift, analogous to a breeze through the ginkgo.
      const x = width - edge + Math.sin(index * 1.34 + 0.5) * amplitude;
      return { x, y };
    });
    points.push({
      x: width - edge - amplitude * .35,
      y: Math.max((points.at(-1)?.y || 0) + 120, height - 130)
    });
    if (points.length < 2) return;
    const d = [`M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`];
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      const distance = b.y - a.y;
      d.push(`C ${(a.x + (i % 2 ? 14 : -12)).toFixed(2)} ${(a.y + distance * .43).toFixed(2)}, ${(b.x + (i % 2 ? -13 : 12)).toFixed(2)} ${(b.y - distance * .43).toFixed(2)}, ${b.x.toFixed(2)} ${b.y.toFixed(2)}`);
    }
    guide.setAttribute("d", d.join(" "));
    trace.setAttribute("d", d.join(" "));
    pathLength = trace.getTotalLength();
    trace.style.strokeDasharray = String(pathLength);
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
