/**
 * Sidebar mobile-drawer toggle. Loads on every page.
 *
 * The sidebar's active-section highlight and all in-page navigation are
 * owned by js/lesson-slides.js (the deck controller), which knows which
 * card is showing; this file only handles collapsing the sidebar into a
 * drawer on narrow screens.
 *
 * Plain script, not an ES module — see js/content-loader.js for why.
 * Wrapped in an IIFE so its internals don't leak into the shared
 * top-level scope every plain <script> on the page shares.
 */
(function () {
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

  document.addEventListener("DOMContentLoaded", initMobileDrawer);
})();
