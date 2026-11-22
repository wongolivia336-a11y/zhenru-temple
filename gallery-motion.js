/**
 * Reading-room transitions.
 * No scroll hijacking; text remains available when JS, IntersectionObserver
 * or motion preferences disable this optional enhancement.
 */
export function initGalleryMotion() {
  if (document.documentElement.classList.contains("viewer-only")) return;
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const selectors = [
    ".intro-band > p",
    "#chronology .section-heading",
    "#chronology .stage-story",
    "#roofLab .roof-lab-heading",
    "#roofLab .roof-visual",
    "#archiveDesk .archive-head",
    "#archiveDesk .archive-comparison",
    "#fieldGuide .guide-intro",
    "#fieldGuide .guide-interactive",
    ".anatomy-section .anatomy-heading",
    ".anatomy-grid article",
    "#activation .activation-heading",
    ".activation-grid article",
    "#evidence .evidence-intro",
    "#evidence .evidence-card",
    "#fieldnotes .field-heading",
    "#sources .sources-heading"
  ];
  const targets = Array.from(new Set(
    selectors.flatMap((selector) => [...document.querySelectorAll(selector)])
  ));
  if (!targets.length) return;

  const viewHeight = window.innerHeight || 800;
  for (const element of targets) {
    const bounds = element.getBoundingClientRect();
    element.classList.add("gallery-reveal");
    // A user arriving via deep link must never see an invisible heading.
    if (bounds.top < viewHeight * .92) element.classList.add("is-in-view");
  }

  const observer = new IntersectionObserver((entries, self) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-in-view");
      self.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px -9% 0px", threshold: .07 });

  targets.filter((element) => !element.classList.contains("is-in-view"))
    .forEach((element) => observer.observe(element));
  document.documentElement.classList.add("gallery-motion-ready");

  // Layout changes and page restores must not leave content hidden.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) targets.forEach((element) => element.classList.add("is-in-view"));
  });
}