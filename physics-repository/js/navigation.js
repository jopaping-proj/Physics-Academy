/**
 * Sidebar behavior: scrollspy (highlight the current section's TOC link),
 * mobile drawer toggle, and reduced-motion-aware smooth scrolling.
 * Loads on every page (see docs/architecture-proposal.md §5).
 */

function initScrollspy() {
  const sections = Array.from(document.querySelectorAll(".lesson-main > section[id]"));
  const links = Array.from(document.querySelectorAll(".toc-list a[href^='#']"));
  if (!sections.length || !links.length) return;

  const linkFor = (id) => links.find((a) => a.getAttribute("href") === `#${id}`);

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const link = linkFor(entry.target.id);
        if (!link) continue;
        if (entry.isIntersecting) {
          links.forEach((a) => a.removeAttribute("aria-current"));
          link.setAttribute("aria-current", "true");
        }
      }
    },
    { rootMargin: "-20% 0px -70% 0px" }
  );

  sections.forEach((s) => observer.observe(s));
}

function initMobileDrawer() {
  const toggle = document.querySelector(".sidebar-toggle");
  const sidebar = document.querySelector(".lesson-sidebar");
  if (!toggle || !sidebar) return;

  // Start collapsed on small screens only.
  const mq = window.matchMedia("(max-width: 900px)");
  const applyInitialState = () => {
    sidebar.dataset.collapsed = mq.matches ? "true" : "false";
  };
  applyInitialState();
  mq.addEventListener("change", applyInitialState);

  toggle.addEventListener("click", () => {
    const collapsed = sidebar.dataset.collapsed === "true";
    sidebar.dataset.collapsed = collapsed ? "false" : "true";
    toggle.setAttribute("aria-expanded", String(collapsed));
  });
}

export function initNavigation() {
  initScrollspy();
  initMobileDrawer();
}

document.addEventListener("DOMContentLoaded", initNavigation);
