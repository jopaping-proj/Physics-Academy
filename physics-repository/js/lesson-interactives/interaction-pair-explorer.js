/**
 * Interaction-Pair Explorer for the "Newton's Third Law" lesson
 * (C2.6 / CED topic 2.3). Self-mounts on DOMContentLoaded into the
 * [data-component-key="interaction-pair-explorer"] section.
 *
 * Pick an interaction. The canvas shows the two interacting objects and
 * the ONE force each exerts on the OTHER — always equal in length,
 * opposite in direction, same type, drawn on two different bodies. A
 * readout names the reaction (type, magnitude, direction, object).
 *
 * The "book on a table" scenario adds the balanced-forces trap: the
 * book's weight and the table's normal force are both drawn on the book
 * (one object, equilibrium) and are explicitly NOT the third-law pair.
 *
 * Plain script, IIFE, Canvas 2D. See js/content-loader.js for why this
 * is not an ES module.
 */
(function () {
  const cssVar = window.PA.panel.cssVar;

  // `mode`: "apart" — the two forces push the bodies away from each other
  // (a contact push); "together" — they pull the bodies toward each other
  // (gravity). The canvas draws the pair schematically; the readout carries
  // the exact real-world direction of each force.
  const SCENARIOS = [
    {
      key: "skater",
      label: "Skater pushes a wall",
      a: "Skater", b: "Wall", mode: "apart",
      type: "a contact (push) force",
      action: "The skater's hands push on the wall.",
      reaction: "The wall pushes back on the skater, away from the wall.",
      note: "The skater accelerates away even though the wall never moves — only the force on the skater is on the skater's free-body diagram.",
    },
    {
      key: "swimmer",
      label: "Swimmer pushes water",
      a: "Swimmer", b: "Water", mode: "apart",
      type: "a contact (push) force",
      action: "The swimmer's arms push the water backward.",
      reaction: "The water pushes the swimmer forward.",
      note: "Propulsion by pushing on something else: push the water back, get pushed forward. Walking (foot on ground) works the same way.",
    },
    {
      key: "rocket",
      label: "Rocket expels gas",
      a: "Rocket", b: "Exhaust gas", mode: "apart",
      type: "a contact (push) force",
      action: "The rocket pushes the exhaust gas out the back.",
      reaction: "The gas pushes the rocket forward — this is the thrust.",
      note: "A rocket needs nothing to 'push against' — it pushes on its own exhaust, and the exhaust pushes back, so it works in empty space.",
    },
    {
      key: "foot",
      label: "Foot kicks a ball",
      a: "Foot", b: "Ball", mode: "apart",
      type: "a contact (push) force",
      action: "The foot pushes forward on the ball.",
      reaction: "The ball pushes backward on the foot — you feel it.",
      note: "The forces are equal in size. The ball flies off fast and the foot barely slows because their masses are very different — equal force, unequal acceleration.",
    },
    {
      key: "earth-moon",
      label: "Earth and Moon",
      a: "Earth", b: "Moon", mode: "together",
      type: "a gravitational force",
      action: "Earth pulls the Moon toward Earth.",
      reaction: "The Moon pulls Earth toward the Moon, with an equal-size force.",
      note: "Gravitational pairs are equal too. The Moon moves far more than the Earth only because the Earth is about 81 times more massive.",
    },
    {
      key: "book",
      label: "Book on a table",
      a: "Book", b: "Table", mode: "apart", trap: true,
      type: "a contact (normal) force",
      action: "The book pushes down on the table.",
      reaction: "The table pushes up on the book — this reaction is what holds the book up.",
      note: "The book's weight (Earth on book) and the table's normal force (table on book) are BALANCED forces on ONE object — not a third-law pair. Toggle the trap below.",
    },
  ];

  function mount({ container, controls, canvasWrap, promptEl, insightEl }) {
    if (!canvasWrap) return;

    const state = { i: 0, showTrap: false };

    const stage = document.createElement("div");
    stage.className = "com__stage";
    const canvas = document.createElement("canvas");
    canvas.width = 520;
    canvas.height = 240;
    canvas.setAttribute("role", "img");
    stage.appendChild(canvas);
    canvasWrap.replaceWith(stage);
    const ctx = canvas.getContext("2d");

    // scenario buttons
    const btnRow = document.createElement("div");
    btnRow.className = "com__buttons ipe__buttons";
    controls.appendChild(btnRow);
    const btns = SCENARIOS.map((s, idx) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "com__btn";
      b.innerHTML = s.label;
      b.addEventListener("click", () => {
        state.i = idx;
        state.showTrap = false;
        sync();
      });
      btnRow.appendChild(b);
      return b;
    });

    // trap toggle
    const trapRow = document.createElement("label");
    trapRow.className = "ipe__toggle";
    const trapBox = document.createElement("input");
    trapBox.type = "checkbox";
    trapBox.addEventListener("change", () => {
      state.showTrap = trapBox.checked;
      sync();
    });
    trapRow.append(trapBox, document.createTextNode(" Show the “balanced forces” trap"));
    controls.appendChild(trapRow);

    const readout = document.createElement("div");
    readout.className = "ipe__readout";
    (promptEl || controls).appendChild(readout);

    function sync() {
      const s = SCENARIOS[state.i];
      btns.forEach((b, idx) => b.setAttribute("aria-pressed", String(idx === state.i)));
      trapRow.hidden = !s.trap;
      if (!s.trap) trapBox.checked = false;
      canvas.setAttribute(
        "aria-label",
        `${s.a} and ${s.b}: ${s.action} ${s.reaction} The two forces are equal in size, opposite in direction, and act on different objects.`
      );
      readout.innerHTML =
        `<p class="ipe__pair"><span class="ipe__k">Interaction</span> ${s.a} &harr; ${s.b} &mdash; ${s.type}.</p>` +
        `<p><span class="ipe__k">Action</span> ${s.action}</p>` +
        `<p><span class="ipe__k">Reaction</span> ${s.reaction}</p>` +
        `<p class="ipe__rule"><strong>Same</strong> type &amp; magnitude &nbsp;·&nbsp; <strong>opposite</strong> direction &nbsp;·&nbsp; acts on <strong>the other object</strong>.</p>` +
        (state.showTrap
          ? `<p class="ipe__trap">The <strong>weight</strong> (Earth on book) and the <strong>normal force</strong> (table on book) are drawn here on the <strong>book alone</strong>. They are equal and opposite only because the book is in <strong>equilibrium</strong> — different force types, one object. The third-law partner of “table pushes book up” is “<strong>book pushes table down</strong>”, not the book's weight.</p>`
          : `<p class="ipe__note">${s.note}</p>`);
      draw();
    }

    function arrow(x1, y1, x2, y2, color, width) {
      const w = width || 4.5;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = w;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.lineCap = "butt";
      const a = Math.atan2(y2 - y1, x2 - x1);
      const h = 14;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - h * Math.cos(a - 0.42), y2 - h * Math.sin(a - 0.42));
      ctx.lineTo(x2 - h * Math.cos(a + 0.42), y2 - h * Math.sin(a + 0.42));
      ctx.closePath();
      ctx.fill();
      // tail dot — marks the object the force acts on
      ctx.beginPath();
      ctx.arc(x1, y1, w * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }

    function label(text, x, y, color, align) {
      ctx.fillStyle = color;
      ctx.font = "600 12.5px system-ui, sans-serif";
      ctx.textAlign = align || "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, x, y);
      ctx.textAlign = "center";
    }

    function bodyShape(cx, cy, name, r) {
      const ink = cssVar("--text-secondary", "#8b96a5");
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.6;
      if (/wall|table|ground/i.test(name)) {
        ctx.fillRect(cx - 16, cy - r, 32, r * 2);
        ctx.strokeRect(cx - 16, cy - r, 32, r * 2);
      } else {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    function draw() {
      const s = SCENARIOS[state.i];
      const muted = cssVar("--text-secondary", "#8b96a5");
      const cA = cssVar("--sim-blue", "#58a6ff");
      const cB = cssVar("--sim-amber", "#f0c27a");
      const cW = cssVar("--sim-grey", "#8b96a5");
      const W = canvas.width;
      ctx.clearRect(0, 0, W, canvas.height);

      const midY = 106;

      if (state.showTrap) {
        // The book ALONE: normal force up + weight down, collinear and
        // opposite, boxed to stress "one object". Labels sit outside the box.
        const cx = W / 2 - 34;
        const cy = midY + 6;
        const AL = 46;
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = muted;
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - 44, cy - 66, 88, 132);
        ctx.setLineDash([]);
        label("one object: the book", cx, cy - 78, muted);
        ctx.fillStyle = "rgba(88,166,255,0.14)";
        ctx.strokeStyle = cA;
        ctx.lineWidth = 1.6;
        ctx.fillRect(cx - 24, cy - 8, 48, 16);
        ctx.strokeRect(cx - 24, cy - 8, 48, 16);
        arrow(cx, cy - 8, cx, cy - 8 - AL, cA, 4.5);
        arrow(cx, cy + 8, cx, cy + 8 + AL, cW, 4.5);
        label("F_N   (table on book)", cx + 58, cy - 30, cA, "left");
        label("F_g   (Earth on book)", cx + 58, cy + 30, cW, "left");
        ctx.fillStyle = muted;
        ctx.font = "12px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("equal only because the book is in equilibrium — not a third-law pair", W / 2, canvas.height - 14);
        return;
      }

      const r = 25;
      const ax = 132, bx = W - 132;
      const gap = 20; // clearance between a body edge and its arrow tail
      const L = 62;   // identical for both arrows

      // faint interaction connector
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(ax + r, midY);
      ctx.lineTo(bx - r, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      bodyShape(ax, midY, s.a, r);
      bodyShape(bx, midY, s.b, r);

      // the pair — equal length, opposite direction, one arrow on each body.
      // "apart": each arrow points away from the other body (a mutual push).
      // "together": each points toward the other body (a mutual pull).
      const outward = s.mode !== "together";
      if (outward) {
        arrow(ax - r - gap, midY, ax - r - gap - L, midY, cB, 4.5); // on A
        arrow(bx + r + gap, midY, bx + r + gap + L, midY, cA, 4.5); // on B
      } else {
        arrow(ax + r + gap, midY, ax + r + gap + L, midY, cB, 4.5); // on A, toward B
        arrow(bx - r - gap, midY, bx - r - gap - L, midY, cA, 4.5); // on B, toward A
      }

      // labels: above each BODY (never near the arrows), name below
      label("F (" + s.b + " on " + s.a + ")", ax, midY - r - 22, cB);
      label("F (" + s.a + " on " + s.b + ")", bx, midY - r - 22, cA);
      label(s.a, ax, midY + r + 20, muted);
      label(s.b, bx, midY + r + 20, muted);

      ctx.fillStyle = muted;
      ctx.font = "12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("equal length  ·  opposite direction  ·  one arrow on each object", W / 2, canvas.height - 14);
    }

    if (insightEl) {
      insightEl.innerHTML =
        "<p>Every force is half of an interaction. Its third-law partner is the <strong>same type</strong>, <strong>equal in magnitude</strong>, <strong>opposite in direction</strong>, and acts on <strong>the other object</strong> — so the two never appear on the same free-body diagram and never cancel. Balanced forces on one object (like a book's weight and the table's push) are a different thing entirely.</p>";
    }

    sync();
    return draw;
  }

  window.PA.panel.register("interaction-pair-explorer", mount);
})();
