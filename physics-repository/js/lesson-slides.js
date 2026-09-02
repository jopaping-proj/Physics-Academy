/**
 * Slide-deck delivery for lesson pages + worked-example reveal +
 * comprehension gating and completion tracking.
 *
 * Why a deck: the segmenting principle (Mayer, Cambridge Handbook of
 * Multimedia Learning) — people learn complex material better in
 * learner-paced segments than as one continuous unit (10/10 studies,
 * median effect size ~0.79), especially when new to the content. Every
 * lesson shows ONE card at a time with Back / Next, a progress bar, and
 * an escape hatch to "Read as one page" (review, printing, and experts —
 * expertise reversal: scaffolding that helps novices can slow experts).
 *
 * Comprehension gate: with "Require answers" on (default), the Next
 * button on a card that carries a check — the hook prediction, a
 * formative question, an error-analysis response, a worked example —
 * stays disabled until the student has actually engaged with it. It is
 * a nudge against skimming, not a lock: Back and the sidebar are always
 * free. Completion is remembered per lesson (localStorage) and shown as
 * a tick beside each section in the sidebar.
 *
 * Worked examples reveal one subgoal-labelled phase at a time
 * (Catrambone's subgoal effect; Renkl/Atkinson worked-example research)
 * with a self-explanation prompt at the end.
 *
 * Plain script, not an ES module — see js/content-loader.js for why.
 * Wrapped in an IIFE. No dependency on other PA modules.
 */
(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ------------------------------------------------- worked examples

  /** @param {(slide: Element) => void} onComplete */
  function initWorkedExamples(root, onComplete) {
    root.querySelectorAll(".worked-example").forEach((we) => {
      const phases = Array.from(we.querySelectorAll(".we-phase"));
      const nextBtn = we.querySelector(".worked-example__next");
      const showAllBtn = we.querySelector(".worked-example__showall");
      const keyMove = we.querySelector(".worked-example__keymove");
      const keyMoveToggle = we.querySelector(".worked-example__keymove-toggle");
      const keyMoveText = we.querySelector(".worked-example__keymove-text");

      const finish = () => {
        if (we.dataset.done === "true") return;
        we.dataset.done = "true";
        if (nextBtn) nextBtn.hidden = true;
        if (showAllBtn) showAllBtn.hidden = true;
        if (keyMove) keyMove.hidden = false;
        if (typeof onComplete === "function") onComplete(we.closest(".slide"));
      };
      const revealAll = () => {
        phases.forEach((p) => (p.hidden = false));
        finish();
      };
      const updateNextLabel = () => {
        const shown = phases.filter((p) => !p.hidden).length;
        if (nextBtn) nextBtn.textContent = `Reveal next part ▸  (${shown + 1} of ${phases.length})`;
      };

      if (phases.length <= 1) {
        finish();
      } else {
        updateNextLabel();
        nextBtn?.addEventListener("click", () => {
          const hiddenPhase = phases.find((p) => p.hidden);
          if (!hiddenPhase) return;
          hiddenPhase.hidden = false;
          if (!prefersReducedMotion) hiddenPhase.scrollIntoView({ behavior: "smooth", block: "nearest" });
          if (phases.every((p) => !p.hidden)) finish();
          else updateNextLabel();
        });
        showAllBtn?.addEventListener("click", revealAll);
      }

      keyMoveToggle?.addEventListener("click", () => {
        if (keyMoveText) keyMoveText.hidden = !keyMoveText.hidden;
        keyMoveToggle.setAttribute("aria-expanded", String(keyMoveText && !keyMoveText.hidden));
      });
    });
  }

  // ---------------------------------------------------------------- deck

  function initDeck() {
    const shell = document.querySelector(".lesson-shell");
    const deck = document.getElementById("lesson-deck");
    const viewport = document.getElementById("deck-viewport");
    if (!shell || !deck || !viewport) return;

    const slides = Array.from(viewport.querySelectorAll(":scope > .slide"));
    if (!slides.length) return;

    const prevBtn = document.getElementById("deck-prev");
    const nextBtn = document.getElementById("deck-next");
    const modeBtn = document.getElementById("deck-mode");
    const gateBtn = document.getElementById("deck-gate");
    const groupEl = document.getElementById("deck-group");
    const countEl = document.getElementById("deck-count");
    const liveEl = document.getElementById("deck-live");
    const progressEl = deck.querySelector(".deck__progress");
    const fillEl = deck.querySelector(".deck__progress-fill");
    const tocLinks = Array.from(document.querySelectorAll(".toc-list a[href^='#']"));

    slides.forEach((s) => s.setAttribute("tabindex", "-1"));

    const storeKey = `pa:deck:${location.pathname}`;
    const store = {
      get() {
        try {
          return JSON.parse(localStorage.getItem(storeKey) || "{}");
        } catch (_) {
          return {};
        }
      },
      set(obj) {
        try {
          localStorage.setItem(storeKey, JSON.stringify({ ...this.get(), ...obj }));
        } catch (_) {
          /* private mode / file:// — non-fatal */
        }
      },
    };

    const saved = store.get();
    let index = 0;
    let mode = "slides"; // "slides" | "scroll"
    let requireAnswers = saved.requireAnswers !== false; // default on
    const done = new Set(Array.isArray(saved.done) ? saved.done : []);

    const slideIndexById = (id) => slides.findIndex((s) => s.id === id);
    const groupFirstIndex = (group) => slides.findIndex((s) => s.dataset.group === group);

    // ---- completion ----

    function slideKind(slide) {
      if (slide.querySelector(".hook-card__quiz")) return "hook";
      // A quiz-mount is gateable only if it rendered an answerable
      // multiple-choice question. Free-response / self-check items
      // (FRQs) have a mount but no .quiz__choice — treat them as
      // content the student is trusted to work through.
      if (slide.querySelector(".quiz-mount")) {
        return slide.querySelector(".quiz__choice") ? "quiz" : "content";
      }
      if (slide.querySelector(".error-analysis__response")) return "error-analysis";
      const we = slide.querySelector(".worked-example");
      if (we && Number(we.dataset.phases || 1) > 1) return "worked-example";
      return "content";
    }
    function isGateable(slide) {
      if (slide.dataset.group === "practice") return false; // extension work, never gated
      return ["hook", "quiz", "error-analysis", "worked-example"].includes(slideKind(slide));
    }
    function markDone(slide) {
      if (!slide || !slide.id || done.has(slide.id)) return;
      done.add(slide.id);
      store.set({ done: [...done] });
      refreshNav();
      refreshToc();
    }
    // Content cards count as done once seen. Gateable cards count once
    // their check is satisfied — including a check restored from a
    // previous visit by js/assessment.js (buttons already disabled,
    // worked example already fully revealed).
    function autoComplete(slide) {
      if (!slide) return;
      switch (slideKind(slide)) {
        case "content":
          markDone(slide);
          break;
        case "hook":
          if (slide.querySelector(".hook-card__submit")?.disabled) markDone(slide);
          break;
        case "quiz":
          if (slide.querySelector(".quiz__choice[disabled]")) markDone(slide);
          break;
        case "error-analysis":
          if (slide.querySelector(".error-analysis__submit")?.disabled) markDone(slide);
          break;
        case "worked-example":
          if (slide.querySelector(".worked-example")?.dataset.done === "true") markDone(slide);
          break;
      }
    }

    document.addEventListener("formative-check:answered", (e) => {
      markDone(e.target.closest(".slide"));
    });
    // hook + error-analysis submit buttons lock themselves; watch for that
    viewport.querySelectorAll(".hook-card__submit, .error-analysis__submit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const slide = btn.closest(".slide");
        setTimeout(() => {
          if (btn.disabled) markDone(slide);
        }, 0);
      });
    });

    // ---- rendering ----

    function scrollViewportClear() {
      const headerH = document.querySelector(".site-header")?.getBoundingClientRect().height || 0;
      const barH = deck.querySelector(".deck__bar")?.getBoundingClientRect().height || 0;
      const y = viewport.getBoundingClientRect().top + window.scrollY - headerH - barH - 20;
      window.scrollTo({ top: Math.max(0, y), behavior: prefersReducedMotion ? "auto" : "smooth" });
    }

    function nextBlocked() {
      const s = slides[index];
      return mode === "slides" && requireAnswers && isGateable(s) && !done.has(s.id);
    }

    const unitIndexHref = deck.dataset.unitIndex || "";

    function refreshNav() {
      const atEnd = index === slides.length - 1;
      if (prevBtn) prevBtn.disabled = index === 0;
      if (!nextBtn) return;
      const blocked = nextBlocked();
      // On the last card the "Next" button becomes "Back to the unit" and
      // navigates to the unit index page (kept enabled, not a dead end).
      const endLink = atEnd && !!unitIndexHref;
      nextBtn.dataset.end = endLink ? "true" : "";
      nextBtn.disabled = (atEnd && !endLink) || blocked;
      nextBtn.textContent = atEnd
        ? (endLink ? "Back to the unit ▸" : "End of lesson")
        : blocked
        ? gateLabel(slideKind(slides[index]))
        : "Next ▸";
    }
    function gateLabel(kind) {
      if (kind === "worked-example") return "Reveal the steps to continue";
      if (kind === "error-analysis") return "Submit your response to continue";
      return "Answer to continue";
    }

    function refreshToc() {
      const totals = {};
      slides.forEach((s) => {
        const g = s.dataset.group;
        totals[g] = totals[g] || { done: 0, total: 0 };
        totals[g].total++;
        if (done.has(s.id)) totals[g].done++;
      });
      const activeGroup = slides[index]?.dataset.group;
      tocLinks.forEach((a) => {
        const g = a.dataset.group;
        if (g === activeGroup) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
        const status = a.closest("li")?.querySelector(".toc-status");
        const t = totals[g];
        if (status && t) {
          const complete = t.done >= t.total;
          status.textContent = complete ? "✓" : t.done > 0 ? `${t.done}/${t.total}` : "";
          status.dataset.complete = String(complete);
        }
      });
    }

    function applyMode(next, { focus = false } = {}) {
      mode = next;
      shell.dataset.lessonMode = mode;
      if (modeBtn) {
        modeBtn.setAttribute("aria-pressed", String(mode === "scroll"));
        modeBtn.textContent = mode === "scroll" ? "Slide view" : "Read as one page";
      }
      if (mode === "scroll") {
        slides.forEach((s) => (s.hidden = false));
      } else {
        show(index, { scroll: focus, focus });
      }
      store.set({ mode });
      refreshNav();
      refreshToc();
    }

    function applyGate(next) {
      requireAnswers = next;
      if (gateBtn) {
        gateBtn.setAttribute("aria-pressed", String(requireAnswers));
        gateBtn.textContent = requireAnswers ? "Require answers: on" : "Require answers: off";
      }
      store.set({ requireAnswers });
      refreshNav();
    }

    function show(i, { scroll = true, focus = true } = {}) {
      index = Math.max(0, Math.min(slides.length - 1, i));
      if (mode === "slides") slides.forEach((s, n) => (s.hidden = n !== index));
      const slide = slides[index];
      const total = slides.length;

      const pct = Math.round(((index + 1) / total) * 100);
      if (fillEl) fillEl.style.width = pct + "%";
      if (progressEl) progressEl.setAttribute("aria-valuenow", String(pct));
      if (groupEl) groupEl.textContent = slide.dataset.groupLabel || "";
      if (countEl) countEl.textContent = `${index + 1} / ${total}`;
      if (liveEl) liveEl.textContent = `Card ${index + 1} of ${total}: ${slide.dataset.slideTitle || ""}`;

      slide.dispatchEvent(new CustomEvent("slide:shown", { bubbles: true }));
      autoComplete(slide);
      refreshNav();

      if (mode === "slides") {
        if (scroll) scrollViewportClear();
        if (focus) slide.focus({ preventScroll: true });
      }
      store.set({ index });
      refreshToc();
      if (history.replaceState) history.replaceState(null, "", `#${slide.id}`);
    }

    function go(delta) {
      if (delta > 0 && nextBtn && nextBtn.disabled) return;
      show(index + delta);
    }

    // ---- wiring ----

    prevBtn?.addEventListener("click", () => go(-1));
    nextBtn?.addEventListener("click", () => {
      if (nextBtn.dataset.end === "true") window.location.href = unitIndexHref;
      else go(1);
    });
    modeBtn?.addEventListener("click", () =>
      applyMode(mode === "slides" ? "scroll" : "slides", { focus: true })
    );
    gateBtn?.addEventListener("click", () => applyGate(!requireAnswers));

    tocLinks.forEach((a) => {
      const li = a.closest("li");
      if (li && !li.querySelector(".toc-status")) {
        const s = document.createElement("span");
        s.className = "toc-status";
        li.appendChild(s);
      }
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href").slice(1);
        const target =
          slideIndexById(id) >= 0 ? slideIndexById(id) : groupFirstIndex(a.dataset.group || "");
        if (target < 0) return;
        if (mode === "slides") {
          e.preventDefault();
          show(target);
        } else {
          setTimeout(() => {
            index = target;
            refreshToc();
          }, 0);
        }
        const sidebar = document.querySelector(".lesson-sidebar");
        if (sidebar && window.matchMedia("(max-width: 900px)").matches) {
          sidebar.dataset.collapsed = "true";
          document.querySelector(".sidebar-toggle")?.setAttribute("aria-expanded", "false");
        }
      });
    });

    document.addEventListener("keydown", (e) => {
      if (mode !== "slides") return;
      const t = e.target;
      if (
        t &&
        (t.tagName === "TEXTAREA" ||
          (t.tagName === "INPUT" && t.type !== "range") ||
          t.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Home") {
        e.preventDefault();
        show(0);
      } else if (e.key === "End") {
        e.preventDefault();
        show(slides.length - 1);
      }
    });

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (mode !== "scroll") return;
          for (const entry of entries) {
            if (entry.isIntersecting) {
              index = slides.indexOf(entry.target);
              autoComplete(entry.target);
              refreshToc();
            }
          }
        },
        { rootMargin: "-30% 0px -60% 0px" }
      );
      slides.forEach((s) => io.observe(s));
    }

    // worked examples mark their own slide done when fully revealed
    initWorkedExamples(viewport, (slide) => markDone(slide));

    // ---- initial state ----
    applyGate(requireAnswers);
    const hashIndex = location.hash ? slideIndexById(location.hash.slice(1)) : -1;
    if (hashIndex >= 0) index = hashIndex;
    else if (Number.isInteger(saved.index)) index = Math.min(saved.index, slides.length - 1);

    if (saved.mode === "scroll") applyMode("scroll", { focus: false });
    else {
      shell.dataset.lessonMode = "slides";
      show(index, { scroll: false, focus: false });
    }
    refreshToc();
  }

  document.addEventListener("DOMContentLoaded", initDeck);
})();
