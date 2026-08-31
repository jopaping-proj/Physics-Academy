# AP Physics 1 · Unit 2: Force and Translational Dynamics — Curriculum Architecture

**Document ID:** PA-AP1-U02-ARCH-001
**Version:** 0.2.0
**Status:** Draft — for review. Not yet the controlled Unit 2 authority.
**Scope of this document:** the pedagogical and structural specification for AP Physics 1 Unit 2 — outcome register, dependency order, cognitive-demand progression, lesson sequence, misconception priorities, assessment evidence contract, and the indexed unit test-bank architecture. It is the guide that the Unit 2 lesson blueprint, the individual lessons, the assessment blueprint and rubrics, the unit test bank, and supporting resources are all built against.
**Parent authority:** `docs/master-project-prompt.md` (architecture, layout, process), `docs/rigor-standard-addendum.md` (intellectual quality bar, cognitive-demand scale, canonical difficulty scale), `docs/architecture-proposal.md` (repository build model), `data/taxonomies.json` (controlled vocabulary), and the current official College Board *AP Physics 1: Algebra-Based Course and Exam Description* (CED).
**Precedent:** structural model adapted from an external Grade-8 "Unit 3 Curriculum Architecture" sample. Governance apparatus specific to that project (corporate approval chain, decision-record IDs, tutorial-sprint pacing, 1:1 diagnostic-routing engine, tutor guides) is deliberately **not** carried over. What is carried over: the outcome-register-with-observable-evidence format, the dependency diagram, the cognitive-demand progression table, the module sequence, the misconception-priority list, the assessment evidence contract, the coverage matrix, the content-production contract, the open-decisions register, and the revision history.
**Pilot status:** Unit 2 is the first unit built end-to-end. Its structures are expected to change as later units expose gaps; changes here propagate to every downstream unit, so this document is the place to get the shape right before scaling.

---

## 0. How this document is used, and what it does not decide

This architecture is a **content and assessment specification**, not a rewrite of the governing documents. Where it appears to conflict with `master-project-prompt.md` or `rigor-standard-addendum.md`, flag it — do not silently pick one.

It does **not** decide:

- the lesson-page HTML/JSON schema (owned by `build/build.js` and `docs/architecture-proposal.md`);
- the five-tier difficulty vocabulary (owned by `rigor-standard-addendum.md` §21 / `data/taxonomies.json` — this document only *applies* it);
- the eight-level cognitive-demand hierarchy (owned by `rigor-standard-addendum.md` §2);
- the design system, navigation, or component library.

It **does** decide, for Unit 2 specifically: which outcomes exist, what counts as evidence of each, the order they are taught in, how deep each must go, which misconceptions are load-bearing, how the test bank is indexed (including the `courses` reuse index) and calibrated, how the pre-instruction concept-inventory diagnostic is built and read, and what a finished lesson package must contain.

**What "CED" means.** The **Course and Exam Description** is College Board's official specification for an AP course — the one authoritative document defining the units, the topics within each unit, the Learning Objectives and Essential Knowledge statements, the science practices, the exam format and weighting, and the FRQ task models. "Align to the CED" means: the outcomes we teach and test are the ones the current official *AP Physics 1: Algebra-Based Course and Exam Description* actually lists, so mastering this unit measurably helps a student on the real exam.

**Curriculum-verification caveat (`master-project-prompt.md` §32).** Every alphanumeric CED reference in this document — topic numbers, Learning Objective codes, Essential Knowledge codes, exam weighting, FRQ task-model names — is marked *[verify CED]* and must be checked against the current official CED before any lesson or test-bank item citing it is approved. The physics is stable; the framework's labelling is not — which is exactly why per-item exam-framework tagging was dropped in favour of a course-reuse index (see §1).

---

## 1. Curriculum framing

### Purpose

Build a connected understanding of **why objects move the way they do** — the transition from Unit 1's kinematic description ("how is it moving?") to a causal account ("what interactions produce this motion?"). A student who has completed Unit 2 should treat the following as one reasoning chain, not five separate procedures:

1. define the **system**;
2. identify **every** force acting on it (and no invented ones);
3. draw the **free-body diagram**;
4. resolve and **sum** the forces to a net force;
5. apply **Newton's second law** to get acceleration, or impose **equilibrium** ($\vec{F}_{net}=0$) when acceleration is zero.

Across four linked representations: **verbal** situation descriptions, **free-body / vector diagrams**, **signed algebraic** force and acceleration work, and **graphs** (force–acceleration, force–mass, force–extension, and force-as-a-function-of-time or position where relevant).

### Learner and delivery context

- **Learners:** students preparing for a score of **5** on the AP Physics 1 exam, consistent with the target-performance standard in `rigor-standard-addendum.md` (Target Student Performance). Materials are designed for that ceiling and scaffold up to it; they are not designed merely to pass the course.
- **Delivery:** self-paced interactive lessons in the Physics Academy web repository — sidebar-navigated lesson pages with embedded formative checks, a Formula Explorer, at least one simulation with a prediction gate, misconception diagnostics, error-analysis tasks, and a lesson-level assessment (`master-project-prompt.md` §4).
- **Prior learning assumed:** Unit 1 (Kinematics), including signed one-dimensional motion, the slope/area relationships among $x(t)$, $v(t)$, $a(t)$, and vector components via trigonometry. Unit 2 **reuses** graph-slope literacy (for force–extension graphs and for $a$ as the slope of a $v$–$t$ graph produced by a constant net force) and vector-component skill (for inclined planes and angled forces); it does **not** reteach either from zero.
- **Cross-course note:** this unit is authored for **AP Physics 1**. Several clusters (Newton's laws, gravitation, friction, springs, equilibrium) are shared physics with **AP Physics 2** and **IB Physics SL/HL**. Extraction of shared concept content into `content/shared-concepts/` and cross-listing to IB is a **later pass** (§12, §13) — do not block Unit 2 on it, but author explanations so that the physics is not gratuitously AP-1-specific.

### Scope

**Included** (subject to *[verify CED]* on exact topic boundaries):

- systems and the center of mass as the point that responds to the net external force;
- forces as interactions; the contact forces in this course (normal, tension, applied, friction, spring) and the one field force (gravitation);
- constructing free-body diagrams (both the box/force-diagram and dot-diagram conventions accepted by AP);
- Newton's first law: the zero-net-force condition; inertia and inertial mass; static and dynamic equilibrium; the zero-acceleration criterion;
- Newton's second law, $\vec{F}_{net}=m\vec{a}$, applied along one axis and along two perpendicular axes, conceptually and via FBDs, including proportional reasoning without full calculation;
- Newton's third law: identifying action–reaction pairs, that they act on two different objects, and contrasting them with balanced forces on one object;
- gravitational force near a planet's surface ($|\vec{F}_g| = mg$) and Newton's law of universal gravitation ($F_G = G\dfrac{m_1 m_2}{r^2}$) for direct force calculation and proportional reasoning;
- weight vs. mass; apparent weight and scale readings in accelerating frames (elevators, etc.);
- static and kinetic friction, $|\vec{f}_s| \le \mu_s |\vec{N}|$ and $|\vec{f}_k| = \mu_k |\vec{N}|$, including friction opposing the *tendency* to slide, not only actual sliding;
- spring force via Hooke's law in its **signed restoring-force form** $F_s = -k x$, and reading $k$ from the slope of a force–extension graph;
- connected-object systems: two or more objects linked by ropes/contact, analyzed both as a single system and as individual FBDs;
- inclined planes, with and without friction, as the synthesis task that integrates vector decomposition, FBDs, and Newton's second law;
- uniform circular motion as an *application of Newton's second law* — centripetal acceleration as $v^2/r$ and the net force as the cause — **pending the §12 scope decision on whether this lives in Unit 2 or a later unit.**

**Excluded:**

- energy, work, and power (later unit);
- momentum, impulse, and collisions (later unit) — except Newton's-third-law *force*-pair reasoning, which stays here;
- torque, rotational dynamics, and rotational kinematics;
- angular momentum;
- oscillation dynamics and the period of a mass–spring system (spring *force* is in scope; SHM is not);
- spring potential energy;
- orbital mechanics and applications of universal gravitation beyond direct force calculation and proportional reasoning;
- fluid statics and buoyancy;
- non-inertial reference frames and pseudo-forces (apparent weight is handled in the ground frame);
- pulleys that change the *magnitude* of tension, multi-pulley mechanical-advantage systems, and Atwood-machine variants beyond a single ideal massless-rope, massless-frictionless-pulley redirect — unless explicitly added in §12.

### Conventions and notation

Aligned to the AP Physics 1 equation sheet and the existing Unit 2 prototype lesson. *[verify CED]* against the current official equation sheet.

| Quantity | Symbol | Notes |
|---|---|---|
| Net force (single axis) | $\vec{F}_{net} = \sum \vec{F}$ | signed sum along the chosen axis |
| Weight / near-surface gravity | $\vec{F}_g$, $|\vec{F}_g| = mg$ | field force; distinct from $F_G$ below |
| Universal gravitation | $F_G = G\dfrac{m_1 m_2}{r^2}$ | capital-$G$ subscript; $G = 6.67\times10^{-11}\ \mathrm{N\,m^2/kg^2}$ *[verify CED sheet precision]* |
| Normal force | $\vec{F}_N$ | perpendicular to the contact surface |
| Tension | $\vec{F}_T$ | along the rope, away from the object |
| Friction (kinetic) | $\vec{f}_k$, $|\vec{f}_k| = \mu_k |\vec{F}_N|$ | opposes relative sliding |
| Friction (static) | $\vec{f}_s$, $|\vec{f}_s| \le \mu_s |\vec{F}_N|$ | opposes the tendency to slide; magnitude set by equilibrium up to the maximum |
| Spring force | $F_s = -kx$ | **signed restoring-force form**; $k>0$ always; $x$ signed from natural length |
| Free-fall magnitude | $g$ | $|g| = 9.8\ \mathrm{m/s^2}$ near Earth's surface (carried from Unit 1; *[verify CED sheet value: 9.8 vs 10]*) |

- **$g$ vs $G$:** local gravitational field strength / free-fall acceleration $g$ is not the universal constant $G$. Lessons must separate them visually and conceptually, not merely with a reminder (Misconception 4, §6).
- **Sign convention:** every one-dimensional force/acceleration task states its positive direction explicitly. Every answer key records the canonical value **and** an acceptance interval consistent with the stated rounding (see §9, numerical-precision rule).
- **Vector components:** decomposition via trigonometry carries forward from Unit 1 as a prerequisite skill, *except* when first applied to incline-aligned axes, which is taught as new context in the inclined-plane module.
- **FBD conventions:** both AP-accepted styles are taught — the box/force diagram (field forces from the center, contact forces from the surface of action) and the dot diagram (all forces from the edge of the dot; parallel-offset co-directional forces). Either is acceptable in student work and on the exam.
- **Calculator / equation sheet:** the AP Physics 1 exam permits an approved calculator and provides the official equation sheet throughout. All lesson and test-bank tasks assume both are available. The one exception in this repository is any explicitly labelled closed-sheet retrieval check, which must be marked as such.

### Course indexing, and the retired exam-framework tag — **resolved 2026-08-31**

The existing Unit 2 question bank previously tagged each item's `apIbConnection` with codes from a **seven-practice** AP Physics 1 model (e.g. "AP1 SP 6.D", "SP 2.C"), which no longer matched the College Board's current consolidated practice model — a live mismatch that would have compounded as the bank grew.

**Resolution:** the `apIbConnection` field is **retired** across the whole repository. There is nothing to reconcile because the exam-framework axis is gone. What it was trying to capture — the *kind of reasoning* an item exercises — was always redundant with the course-neutral `skill`, `representation`, and `cognitiveLevel` tags, which stay.

In its place every question, lesson, and topic carries a **`courses` reuse index**: an array of the courses it can be used in as-is, drawn from `data/taxonomies.json` (`ap-physics-1`, `ap-physics-2`, `ib-physics-sl`, `ib-physics-hl`). Building or reviewing for a course selects only material whose `courses` contains it, so shared physics (Newton's laws, gravitation, friction, springs, equilibrium) is authored once and reused whenever the target course changes. The migration is done: all ~65 existing Unit 2 items and the prototype lesson's embedded questions now carry `courses: ["ap-physics-1"]`; cross-tagging shared items to IB is a per-item pass tracked in §12.8. `master-project-prompt.md` §27, `data/taxonomies.json`, and `build/build.js` are updated to match.

---

## 2. Approved outcome register

Outcomes are grouped into **ten clusters**, numbered **2.1–2.10**. These cluster numbers are **internal Physics Academy identifiers**, inherited verbatim from the `objective` field already carried by all ~65 existing question-bank items — keeping them means zero re-tagging of that axis. **They are not College Board CED topic numbers and must never be conflated with them.** Each cluster maps to one or more CED topics and Learning Objectives, filled in during the §12 CED-verification pass.

Sub-outcome letters (2.1a, 2.1b, …) are assigned here for traceability into the coverage matrix (§8) and the test bank (§9); they did not previously exist.

Observable evidence is written so a formative check or FRQ part can be mapped directly to it.

### Cluster 2.1 — Newton's First Law and Equilibrium

| ID | Outcome | Observable evidence |
|---|---|---|
| 2.1a | Define inertia and inertial mass. | States that inertia is an object's resistance to a change in its velocity, and that inertial mass is the quantitative measure of that resistance. |
| 2.1b | State Newton's first law and its zero-net-force condition. | States that an object's velocity is constant (in magnitude and direction) if and only if the net force on it is zero. |
| 2.1c | Distinguish static from dynamic equilibrium. | Classifies a described situation as static equilibrium (at rest), dynamic equilibrium (constant nonzero velocity), or non-equilibrium, and states that both equilibrium types share $\vec{F}_{net}=0$ and $\vec{a}=0$. |
| 2.1d | Apply the equilibrium condition to solve for an unknown force. | Sets $\sum F_x = 0$ and $\sum F_y = 0$ from an FBD and solves for a missing force magnitude or direction, including cases with angled forces. |
| 2.1e | Justify that an object at rest still has forces acting on it. | Explains, for a specific scenario, why "not accelerating" means "balanced forces," not "no forces." |

### Cluster 2.2 — Forces and Free-Body Diagrams

| ID | Outcome | Observable evidence |
|---|---|---|
| 2.2a | Identify every force acting on a defined system from a verbal or pictorial description. | Lists each force by type and direction, with no omitted real force and no invented force (no "force of motion"). |
| 2.2b | Define the system and distinguish internal from external forces. | States which object(s) are in the system and which listed forces are external (and therefore relevant to the system's acceleration). |
| 2.2c | Construct a correct free-body diagram in either AP-accepted style. | Draws all and only the external forces, each with a defensible direction and roughly correct relative length, using consistent box- or dot-diagram conventions. |
| 2.2d | Calculate the net force along a single axis from an FBD. | Chooses a positive direction, sums signed force components along one axis, reports $\vec{F}_{net}$ with magnitude, direction, and units. |
| 2.2e | Resolve angled forces into components along two perpendicular axes. | Produces correct component expressions (correct sine/cosine assignment) for forces at an angle to the chosen axes. |

### Cluster 2.3 — Newton's Second Law: the relationship

| ID | Outcome | Observable evidence |
|---|---|---|
| 2.3a | State Newton's second law verbally and symbolically. | States that acceleration is proportional to net force and inversely proportional to mass, and writes $\vec{F}_{net} = m\vec{a}$ with $\vec{a}$ parallel to $\vec{F}_{net}$. |
| 2.3b | Calculate any one of net force, mass, or acceleration given the other two. | Correctly rearranges and solves, with units and direction, from an FBD-derived net force. |
| 2.3c | Reason proportionally about $\vec{F}_{net}=m\vec{a}$ without full calculation. | Predicts the factor by which $a$ changes when $F_{net}$ and/or $m$ are scaled, e.g. "$F_{net}$ doubled, $m$ tripled $\Rightarrow$ $a \times \tfrac{2}{3}$," framed through $a = F_{net}/m$. |
| 2.3d | Identify Newton's first law as the $\vec{F}_{net}=0$ special case of the second. | States and shows that substituting $\vec{F}_{net}=0$ into $\vec{F}_{net}=m\vec{a}$ yields $\vec{a}=0$. |

### Cluster 2.4 — Newton's Second Law: reasoning from descriptions

| ID | Outcome | Observable evidence |
|---|---|---|
| 2.4a | Reason from a verbal force/mass description to the direction and relative magnitude of acceleration. | Without an FBD drawn for them, determines whether $\vec{a}$ is zero or nonzero and its direction, and compares magnitudes across two described scenarios. |
| 2.4b | Connect a constant net force to the resulting $v$–$t$ graph and motion. | States that a constant nonzero net force produces constant acceleration (linear $v$–$t$), and reconstructs the described motion. |
| 2.4c | Refute the claim that motion requires a sustaining force in its direction. | Identifies and corrects Aristotelian "impetus" reasoning in a specific scenario. |

### Cluster 2.5 — Newton's Second Law: multi-force and two-axis problems

| ID | Outcome | Observable evidence |
|---|---|---|
| 2.5a | Solve for acceleration from an FBD with three or more forces along one axis. | Sums all signed forces, applies $a = F_{net}/m$, reports signed acceleration with units. |
| 2.5b | Apply Newton's second law independently along two perpendicular axes. | Uses $\sum F_y = 0$ (no perpendicular acceleration) to find the normal force, and $\sum F_x = ma_x$ along the motion axis. |
| 2.5c | Solve for an unknown force given the measured acceleration. | Works backward: $F_{net} = ma$, then isolates the unknown force from the signed sum of known forces. |

### Cluster 2.6 — Newton's Third Law

| ID | Outcome | Observable evidence |
|---|---|---|
| 2.6a | Identify the reaction force to a stated action force. | Names the reaction's type, magnitude (equal), direction (opposite), and — critically — the object it acts on. |
| 2.6b | State that an action–reaction pair acts on two different, interacting objects. | Explicitly attributes the two forces to two different objects, never to the same object. |
| 2.6c | Contrast an action–reaction pair with balanced forces on one object. | Distinguishes a third-law pair (two objects, same interaction, same force type, no equilibrium implication) from balanced forces (one object, possibly different force types, implies $\vec{a}=0$ for that object). Correctly rejects "weight and normal force are a third-law pair." |
| 2.6d | Apply the third law to equal-force / unequal-acceleration reasoning. | States that the mutual forces are equal in magnitude regardless of the objects' masses, and that the *accelerations* differ because the masses differ. |

### Cluster 2.7 — Connected Objects and Systems

| ID | Outcome | Observable evidence |
|---|---|---|
| 2.7a | Analyze a connected system as a single object to find its common acceleration. | Treats linked objects as one system of total mass $M$, sums only external forces, finds $a = F_{net,ext}/M$. |
| 2.7b | Analyze an individual object within the system to find an internal force. | Draws the FBD for one object, applies $\vec{F}_{net}=m\vec{a}$ with the common $a$, solves for the connecting tension or contact force. |
| 2.7c | Explain why tension in a connecting rope is not equal to the weight of the hanging mass (when the system accelerates). | Shows that $F_T \ne m_{hang}\,g$ whenever $a \ne 0$, and gives the correct relationship. |
| 2.7d | Handle an ideal pulley that redirects a rope without changing tension magnitude. | Applies equal tension throughout a single massless rope over a massless, frictionless pulley, with correct sign bookkeeping around the redirect. |

### Cluster 2.8 — Friction (static and kinetic)

| ID | Outcome | Observable evidence |
|---|---|---|
| 2.8a | Distinguish static from kinetic friction and state each model. | States $|\vec{f}_k| = \mu_k |\vec{F}_N|$ (fixed, once sliding) and $|\vec{f}_s| \le \mu_s |\vec{F}_N|$ (variable, up to a maximum). |
| 2.8b | Determine the direction of friction as opposing relative sliding or its tendency. | Correctly directs friction for a stationary object on the verge of sliding, a sliding object, and an object being pushed but not moving. |
| 2.8c | Calculate friction force and resulting acceleration in horizontal and inclined contexts. | Computes $F_N$ first, then $f$, then applies Newton's second law along the motion axis. |
| 2.8d | Determine whether a described object slides or stays put. | Compares the required static friction to $\mu_s F_N$ and concludes correctly. |
| 2.8e | Reason about how changing $\mu$, $F_N$, or applied force changes the motion. | Predicts qualitative changes in acceleration or in the slide/no-slide outcome without full calculation. |

### Cluster 2.9 — Inclined Planes (synthesis)

| ID | Outcome | Observable evidence |
|---|---|---|
| 2.9a | Identify all forces on an object on an incline, with and without friction. | Lists weight (vertical), normal force (perpendicular to the incline surface), friction (along the surface, opposing sliding tendency), and any applied force, each correctly directed. |
| 2.9b | Resolve weight into incline-parallel and incline-perpendicular components. | Assigns $mg\sin\theta$ (parallel) and $mg\cos\theta$ (perpendicular) correctly, with a justification for the trig assignment, not a memorized pattern. |
| 2.9c | Determine the normal force on an incline. | Uses perpendicular-axis equilibrium: $F_N = mg\cos\theta$ (plus/minus components of any other forces), and explains why $F_N < mg$. |
| 2.9d | Calculate net force and acceleration along the incline, with and without friction. | Combines the parallel weight component, friction, and any applied force into $F_{net,\parallel}$, then $a = F_{net,\parallel}/m$, with correct signs. |
| 2.9e | Solve a full incline problem end to end for an unfamiliar angle, mass, or friction condition (transfer). | Produces system, FBD, decomposition, net force, and acceleration without procedural cueing. |

### Cluster 2.10 — Gravitation, Springs, and Apparent Weight

| ID | Outcome | Observable evidence |
|---|---|---|
| 2.10a | Distinguish mass from weight, and $g$ from $G$. | States that mass is inertial and location-independent; weight $|\vec{F}_g| = mg$ depends on local $g$; $g$ is a field strength, $G$ is the universal constant. |
| 2.10b | Describe gravity as a center-of-mass-directed interaction, and reason proportionally with $F_G = G\dfrac{m_1 m_2}{r^2}$. | States the direction; predicts the qualitative change in $F_G$ when a mass or $r$ changes (including the inverse-square dependence), without calculating. |
| 2.10c | Solve $F_G = G\dfrac{m_1 m_2}{r^2}$ for any one variable. | Rearranges and computes $F_G$, a mass, or $r$, with units. |
| 2.10d | State Hooke's law mathematically and conceptually. | Writes $F_s = -kx$; explains spring force as proportional in magnitude to displacement from natural length and always opposite to it (restoring); states $k>0$ always and that the negative sign encodes direction, not the sign of $k$. |
| 2.10e | Calculate spring force, spring constant, or displacement given the other two; read $k$ from a force–extension graph. | Solves for $F_s$ (signed), $k$ (positive), or $x$ (signed); reads $k$ as the magnitude of the graph's slope. |
| 2.10f | Analyze apparent weight (scale reading) for an object with vertical acceleration. | Applies $F_N - mg = ma$ (elevator frame handled in the ground frame) to find the scale reading; explains apparent weightlessness as $F_N = 0$ during free fall, not absence of gravity. |

**Outcome count:** 44 sub-outcomes across 10 clusters.

---

## 3. Dependency architecture

```
Unit 1 carryover:  signed 1-D motion  ·  vector components (trig)  ·  slope/area graph literacy
        |
        v
  [2.2] Forces & Free-Body Diagrams   <-- single most load-bearing cluster
   2.2a -> 2.2b -> 2.2c -> 2.2d -> 2.2e
        |
        +----------------------------+----------------------------+
        v                            v                            v
  [2.1] Newton's First Law      [2.3] Newton's Second Law    (2.2e feeds every
   & Equilibrium                 (the relationship)           later cluster that
   2.1a -> 2.1b -> 2.1c          2.3a -> 2.3b -> 2.3c          uses angled forces)
      -> 2.1d -> 2.1e               -> 2.3d
        |                            |
        |   2.1d (equilibrium as     v
        |   Fnet = 0) and 2.3d     [2.4] N2 from descriptions
        |   connect explicitly      2.4a -> 2.4b -> 2.4c
        |                            |
        +-------------+--------------+
                      v
                [2.5] N2: multi-force & two-axis
                 2.5a -> 2.5b -> 2.5c
                      |
        +-------------+---------------------------+
        v                                        v
  [2.6] Newton's Third Law                 [2.8] Friction
   2.6a -> 2.6b -> 2.6c -> 2.6d             2.8a -> 2.8b -> 2.8c -> 2.8d -> 2.8e
   (placed after students have                    |
   handled several multi-force                    |
   FBDs, so the pair/balanced                     |
   contrast has real cases to                     |
   contrast against)                              |
        |                                         |
        v                                         v
  [2.7] Connected Objects & Systems  <----  needs 2.5 (two-axis) + 2.6 (tension
   2.7a -> 2.7b -> 2.7c -> 2.7d              as an internal third-law pair)
        |
        v
  [2.9] Inclined Planes (synthesis)  <----  needs 2.2e (components), 2.5b
   2.9a -> 2.9b -> 2.9c -> 2.9d -> 2.9e      (perpendicular-axis normal force),
        |                                    2.8 (incline friction)
        v
  [2.10] Gravitation, Springs, Apparent Weight
   2.10a/b/c (gravitation)  --  most independent strand; needs only 2.3
   2.10d/e   (springs)      --  reuses Unit 1 graph-slope literacy in new context
   2.10f     (apparent wt)  --  needs 2.5b (two-axis N2) and 2.2c (FBD)
        |
        v
  Unit 2 synthesis & transfer  (see §5 Module 10 and §9 unit test bank)
```

**Notes on the ordering.**

- **[2.2] Forces & FBDs is the spine.** Equilibrium, both Newton's-second-law clusters, friction, connected systems, and inclines all consume it directly. It is taught first (after Unit 1 carryover) and every later cluster practises it.
- **[2.1] and [2.3] are siblings, taught close together and cross-linked.** The prototype lesson already teaches Newton's second law with equilibrium as its $\vec{F}_{net}=0$ special case; the first-law/equilibrium lesson should point forward to that framing. A founder- or reviewer-directed swap of their order does not break the chain, but the cross-link (2.1d $\leftrightarrow$ 2.3d) must survive whichever order is chosen.
- **[2.6] Newton's third law is placed late** — after equilibrium, second-law multi-force work, and friction — so the action–reaction / balanced-forces contrast (Misconceptions 8–10, §6, the highest-value misconception cluster in the unit) is taught against concrete multi-force cases the student has already analyzed, not in the abstract.
- **[2.9] Inclined planes is the designed synthesis capstone** for the mechanics core: it is the first task that forces the student to integrate vector decomposition, two-axis FBD analysis, friction, and Newton's second law in one problem with no cue about which to use.
- **[2.10] is three loosely-coupled strands** bundled for scheduling convenience. Gravitation depends only on [2.3]; springs depend only on Unit 1 graph literacy; apparent weight depends on [2.5b]. It is placed last as synthesis-friendly material that revisits proportional reasoning (gravitation), graph-slope reading (springs), and two-axis Newton's second law (apparent weight) in fresh contexts.

**Existing prototype lesson** (`newtons-second-law.json`, internal id `ap1-u2-l3`) sits at cluster **[2.3]/[2.4]** and is the reference implementation. Its `objective` field is currently `undefined` and should be set to `2.3` during the §12 alignment pass.

---

## 4. Cognitive-demand progression by outcome cluster

The eight-level cognitive-demand hierarchy is defined in `rigor-standard-addendum.md` §2 (1 Recognition · 2 Direct Application · 3 Conceptual Reasoning · 4 Multi-Representation Reasoning · 5 Multi-Step Modeling · 6 Transfer · 7 Synthesis · 8 Evaluation & Argumentation). Materials for an AP-5 target must **regularly reach Levels 5–8** (`rigor-standard-addendum.md` §2, closing line).

This table replaces the external sample's proprietary six-phase learning cycle. For each cluster it states the **entry level** (where instruction begins), the **required ceiling** (the highest level every student must reach for mastery), and the **stretch level** (reached by Distinction-Stretch items, not required for mastery).

| Cluster | Entry | Required ceiling | Stretch | What the ceiling looks like |
|---|:--:|:--:|:--:|---|
| 2.1 First law & equilibrium | 1 | **5** | 8 | Solve an unfamiliar multi-force equilibrium (angled forces) end to end; justify a nonzero force that "isn't doing anything." |
| 2.2 Forces & FBDs | 1 | **5** | 6 | Build a complete, correct FBD and two-axis net force for an unfamiliar scenario with no forces named in the prompt. |
| 2.3 N2 relationship | 1 | **4** | 6 | Predict a graph shape ($a$ vs $F$, $a$ vs $m$) before viewing it; reason proportionally through combined changes. |
| 2.4 N2 from descriptions | 2 | **4** | 6 | Given a verbal scenario, produce direction + relative magnitude of $\vec{a}$ and the matching $v$–$t$ sketch. |
| 2.5 N2 multi-force / two-axis | 2 | **5** | 7 | Solve a two-axis FBD for acceleration and an unknown force in an unfamiliar configuration. |
| 2.6 Third law | 1 | **5** | 8 | Attribute every force in an unfamiliar two-object interaction; evaluate a flawed "equal and opposite therefore equilibrium" argument. |
| 2.7 Connected systems | 3 | **5** | 7 | Solve an unfamiliar two-body system both ways (system + individual) and reconcile the results. |
| 2.8 Friction | 2 | **5** | 7 | Determine slide/no-slide and resulting acceleration for an unfamiliar incline-plus-applied-force case. |
| 2.9 Inclined planes | 3 | **6** | 8 | Full end-to-end solution for an unfamiliar angle/mass/friction condition, plus a far-transfer variant (e.g. banked surface, accelerating incline). |
| 2.10 Gravitation / springs / apparent weight | 1 | **5** | 7 | Proportional reasoning about $F_G$ for unfamiliar mass/distance pairs; predict spring force at an untested displacement from graph-read $k$; solve an unfamiliar elevator apparent-weight problem. |

Every lesson's practice set is laid out in the three page-level tiers from `rigor-standard-addendum.md` §3 (**Foundation** / **Examination Readiness** / **Mastery-Distinction**), which group the five canonical difficulty tags per the mapping in `data/taxonomies.json` (`lessonThreeTier`). Cognitive level and difficulty tag are **separate axes** (`master-project-prompt.md` §27) — a Level-3 conceptual item can be `foundation` or `ap5-ib7-target` depending on scenario demand.

---

## 5. Instructional sequence

Each module is one lesson page unless noted. Every lesson follows the flow in `master-project-prompt.md` §4 (hook → objectives → prior knowledge → concept chunks with per-chunk formative checks → interactive component → simulation → misconceptions → error analysis → representation connections → lesson-level assessment → exam connection → summary → exit retrieval → further practice), with chunk depth set by the topic, not a fixed count. The page is delivered as a **slide deck** — one card at a time, learner-paced, with a "Read as one page" fallback and a default-on comprehension gate that holds Next until each check card is engaged with (`master-project-prompt.md` §4, slide-delivery note) — so each concept chunk becomes four cards (idea / representation / worked example / check) and every misconception and assessment question gets its own card. Worked examples are authored as subgoal-labelled `phases` revealed one at a time (`master-project-prompt.md` §10). Diagrams that the text refers to are authored as SVG under `assets/diagrams/` and shown on the card (`master-project-prompt.md` §11) — never referenced without being drawn. The content-production contract for each package is in §11.

### Module 0 — Unit 2 entry diagnostic and orientation

Two instruments, both before Module 1, neither graded:

**A. Concept inventory (§10).** The 25-item, calculator-free, purely conceptual Force-Concept-Inventory-style diagnostic. Its job is to surface the misconceptions and prior conceptions the student brings in, reported as a per-misconception profile with a watch-list pointing at the modules that address each. Full specification in §10.

**B. Unit 1 carryover retrieval** *(short; optional)*. A handful of mixed retrieval items (`rigor-standard-addendum.md` §17: recent/spaced/interleaved/generative) checking the **procedural** Unit 1 skills this unit depends on — signed 1-D motion, vector components, slope/area graph literacy. Involves small calculations (unlike the concept inventory). A student who misses these is pointed back to the relevant Unit 1 lessons.

Neither is a placement engine — the self-paced repository has no 1:1 routing. Their combined output is a starting picture for the student, not a gate on content (see §12 for the gate-vs-optional decision on instrument A).

### Module 1 — Forces and Free-Body Diagrams · Cluster 2.2

**Progression:** forces as interactions → the contact forces of this course + the one field force → define the system; internal vs external → construct an FBD (both AP styles) → sum signed forces on one axis → resolve angled forces on two axes.
**Interactive:** an FBD builder — pick forces, place them, check completeness and direction against a known scenario.
**Boundary:** single-object FBDs; connected systems deferred to Module 7; incline-aligned axes deferred to Module 9.
**Mastery evidence:** a complete, correct FBD and two-axis net force for an unfamiliar scenario with no forces named in the prompt (Level 5).

### Module 2 — Newton's First Law, Inertia, and Equilibrium · Cluster 2.1

**Progression:** inertia as resistance to a change in velocity → inertial mass as its measure → the first law as the biconditional zero-net-force condition → static vs dynamic equilibrium, both with $\vec{a}=0$ → solve for an unknown force from $\sum F_x = \sum F_y = 0$, including angled forces → justify that equilibrium means balanced, not absent, forces.
**Cross-link:** explicitly forward-references Module 3's framing of equilibrium as the $\vec{F}_{net}=0$ case of the second law.
**Mastery evidence:** unfamiliar multi-force (angled) equilibrium solved end to end; a "does nothing" force correctly justified as nonzero (Level 5).

### Module 3 — Newton's Second Law: Force, Mass, and Acceleration · Clusters 2.3, 2.4  *(prototype lesson `ap1-u2-l3` — reference implementation)*

**Progression:** the verbal and symbolic statement → system/forces/net-force chain before the equation → solve for any one of $F_{net}$, $m$, $a$ → proportional reasoning through combined changes → $F$–$a$ and $F$–$m$ graphs, predicted before viewed → first law as the $\vec{F}_{net}=0$ special case → refute "motion needs a sustaining force."
**Interactive:** Formula Explorer (mass/acceleration sliders → force; $F$-vs-$a$ and $F$-vs-$m$ graphs) — already built.
**Simulation:** "Cart on a Track" with a prediction gate — already built.
**Mastery evidence:** predict both graph shapes correctly before viewing; solve an unfamiliar multi-force scenario (Level 4, stretch 6).
**Status:** built and verified. Its embedded questions have had `apIbConnection` stripped and `courses: ["ap-physics-1"]` added; its `objective` still needs setting to `2.3` (§12).

### Module 4 — Newton's Second Law: Multi-Force and Two-Axis Problems · Cluster 2.5

**Progression:** three-or-more-force FBDs on one axis → the perpendicular axis: $\sum F_y = 0$ gives the normal force → $\sum F_x = ma_x$ along the motion axis → work backward from a measured acceleration to an unknown force.
**Mastery evidence:** unfamiliar two-axis FBD solved for acceleration and an unknown force (Level 5).

### Module 5 — Newton's Third Law: Interaction Pairs vs Balanced Forces · Cluster 2.6

**Progression:** revisit force pairs already met in Modules 1–4 (gravity/normal, pushes, tension) → identify the reaction to a stated action (type, magnitude, direction, **object**) → the pair acts on two different objects → contrast with balanced forces on one object, explicitly rejecting "weight and normal force are a third-law pair" → equal forces, unequal accelerations when masses differ.
**Rationale for placement:** students need several prior multi-force scenarios so the pair/balanced contrast (Misconceptions 8–10) has concrete cases to work from.
**Mastery evidence:** attribute every force in an unfamiliar two-object interaction; evaluate a flawed "equal and opposite $\Rightarrow$ equilibrium" argument (Level 5, stretch 8).

### Module 6 — Friction: Static and Kinetic · Cluster 2.8

**Progression:** two friction regimes and their models ($f_k$ fixed once sliding; $f_s$ variable up to a maximum) → direction: opposing relative sliding *or its tendency* → compute $F_N$ first, then $f$, then Newton's second law → slide-or-stay decisions → qualitative reasoning about changing $\mu$, $F_N$, applied force.
**Boundary:** horizontal surfaces and simple applied-force cases here; the incline-plus-friction synthesis is Module 9.
**Mastery evidence:** unfamiliar slide/no-slide-plus-acceleration case (Level 5).

### Module 7 — Connected Objects and Systems · Cluster 2.7

**Progression:** the system method (linked objects as one mass; external forces only) → the individual-object method (one FBD, common $a$, solve for tension/contact force) → why rope tension $\ne$ hanging weight when $a\ne0$ → the ideal redirecting pulley (equal tension through a massless rope over a massless frictionless pulley).
**Prerequisites consumed:** Module 4 (two-axis), Module 5 (tension as an internal interaction pair).
**Mastery evidence:** unfamiliar two-body system solved both ways with reconciled results (Level 5).

### Module 8 — Gravitation, Springs, and Apparent Weight · Cluster 2.10

Delivered as one lesson with three chunked strands (they are independent; see §3).
**Strand A — Gravitation:** mass vs weight; $g$ vs $G$ → gravity as a center-of-mass-directed interaction → proportional reasoning with $F_G = G\,m_1 m_2 / r^2$, including inverse-square → solve for any one variable.
**Strand B — Springs:** spring force proportional to and opposite the displacement from natural length → $F_s = -kx$, stated and explained (why the negative sign; why $k>0$ always) → solve for $F_s$/$k$/$x$ → read $k$ from a force–extension graph's slope.
**Strand C — Apparent weight:** $F_N - mg = ma$ in the ground frame → scale readings in accelerating elevators → apparent weightlessness as $F_N=0$, not zero gravity.
**Interactive:** a force–extension graph explorer (slope $\to$ $k$; predict force at an untested displacement).
**Mastery evidence:** proportional $F_G$ reasoning for an unfamiliar pair; spring-force prediction from graph-read $k$; unfamiliar elevator apparent-weight problem (Level 5).

### Module 9 — Inclined Planes · Cluster 2.9  *(synthesis capstone)*

**Part A — Frictionless incline:** identify forces (weight vertical, normal perpendicular to the surface) → resolve weight into incline-parallel ($mg\sin\theta$) and incline-perpendicular ($mg\cos\theta$) components, with the trig assignment *justified* → normal force from perpendicular equilibrium; why $F_N < mg$ → net force and acceleration along the incline.
**Part B — Incline with friction:** add friction opposing the sliding tendency → net force and acceleration with the friction term → slide-or-stay on an incline.
**Transfer:** at least one far-transfer item where the incline framing is only recognizable through conceptual understanding (e.g. a banked road, an accelerating wedge, a block on a block).
**Mastery evidence:** full end-to-end solution for an unfamiliar angle/mass/friction condition (Level 6), plus a far-transfer variant (stretch 8).

### Module 10 — Unit 2 Synthesis and Transfer

Not new content — a consolidation lesson and the on-ramp to the unit test bank.
**Force task:** an unfamiliar multi-force scenario (e.g. an object on a rough incline with an applied force at an angle) — system, FBD, net force, acceleration — integrating 2.2, 2.5, 2.8, 2.9.
**Interaction task:** an unfamiliar multi-object interaction — attribute all forces, distinguish any third-law pairs from any balanced forces — integrating 2.6 with 2.2.
**Spring/graph task:** an unfamiliar force–extension dataset — find $k$, predict a force or displacement for an untested value — integrating 2.10 with Unit 1 graph transfer.
**Interleaving note (`rigor-standard-addendum.md` §14):** items here and in the unit test bank must not be grouped by subtopic; the student decides which framework applies.

### Optional circular-motion module — **pending §12 scope decision**

If uniform circular motion stays in Unit 2 per the current CED, it slots after Module 9 as a second application-of-Newton's-second-law synthesis: centripetal acceleration $v^2/r$ directed toward the center; the net force (a real force or sum of real forces) is the cause; "centripetal force" is not a new force to add to an FBD (Misconception 13). If the CED places it in a later unit, this module moves there and Module 9 becomes the sole synthesis capstone.

---

## 6. Misconception priorities

Ordered roughly by instructional weight for an AP-5 target. Items 1 and 8–10 are the highest-value: they are pervasive, exam-relevant, and directly diagnosable. All eighteen already appear (by `misconceptionTested` slug) in the existing question bank or are physics-canonical; the slugs below are the controlled identifiers to use in item metadata. This list is also the coverage target for the §10 concept-inventory diagnostic.

1. **Motion requires a sustaining force.** A moving object is believed to need a continuous forward "force of motion"; constant velocity is wrongly thought to require a net forward force. (Aristotelian impetus; directly violates the first law.) Slugs: `motion-requires-a-sustaining-force-in-its-direction`, `constant-velocity-implies-a-net-forward-force`.
2. **Motionless implies no forces.** An object at rest is believed to have no forces on it, rather than balanced forces. Slugs: `motionless-implies-no-forces-act`, `zero-velocity-implies-zero-force`, `equilibrium-requires-absence-of-forces`.
3. **Net force = a single applied force.** Forces are combined without regard to direction/sign, or only the "obvious" force is counted. Related: `extra-given-numbers-must-all-be-used`.
4. **$g$ and $G$ are the same quantity**, and relatedly, **mass and weight are the same** (same value, same unit).
5. **Newton's second law is "just a formula."** $\vec{F}_{net}=m\vec{a}$ is applied by substitution without first defining the system and finding the net force from an FBD.
6. **Proportional changes always compound additively / in the same direction.** For $a = F_{net}/m$, students add rather than multiply factors, or assume two changes always reinforce. Slugs: `treats-combined-proportional-changes-as-additive-rather-than-multiplicative`, `proportional-changes-in-same-direction-always-compound`, `inverse-proportional-changes-always-compound-multiplicatively-in-same-direction`.
7. **Heavier objects need more force to have the same acceleration** — conflating "more force for the same $a$" (true) with "heavier things are harder to get moving therefore accelerate less under the same net force" stated as if $F_{net}$ were fixed by the object. Slug: `heavier-objects-require-more-force-for-same-net-force-scenario`.
8. **A third-law pair acts on the same object.** The action and reaction are both placed on one object rather than on the two interacting objects. Slug: `confuses-a-force-and-its-effect-with-a-third-law-pair`.
9. **Any equal-and-opposite pair is a third-law pair.** Balanced forces on one object (e.g. weight and normal force on a book) are misidentified as an action–reaction pair. Slug: `weight-and-normal-force-are-a-third-law-pair`.
10. **Equal forces imply equal effects.** In an interaction, the more massive object is thought to exert a larger force, or the mutual forces are thought to produce equal accelerations. Slugs: `larger-object-exerts-larger-force-in-collision`, `third-law-implies-equal-accelerations`.
11. **Friction only opposes actual motion** (not the tendency to move), **always acts**, **always opposes weight**, or **only acts horizontally**. Slugs: `friction-only-opposes-motion-not-tendency-to-move`, `friction-always-acts-and-opposes-weight`, `friction-direction-fixed-rather-than-opposing-actual-motion`, `friction-only-acts-horizontally-on-horizontal-surfaces`, `static-and-kinetic-friction-coefficients-are-always-equal`.
12. **Normal force always equals full weight**, regardless of incline angle or other vertical forces. On an incline, the $\sin\theta$/$\cos\theta$ components are also frequently swapped — the Unit 1 trig error recurring in a new context.
13. **"Centripetal force" is a separate force** to be added to a free-body diagram, rather than the name for the net force in circular motion. (Applies only if the circular-motion module is in Unit 2.)
14. **The spring constant changes with how hard you pull**, and relatedly, **the negative sign in $F_s=-kx$ makes $k$ negative** rather than encoding that the force opposes the displacement; **a stretched spring "has" negative force as a property**. Slug: `spring-constant-changes-with-applied-force` (add to `data/taxonomies.json` if not present).
15. **Tension in a multi-object rope system supports the whole system's weight** / **the hanging mass is in free fall**. Slugs: `tension-in-a-multi-object-string-system-must-support-the-whole-system`, `treats-heavier-hanging-mass-as-being-in-free-fall`.
16. **A scale always reads true weight**; **apparent weightlessness requires zero gravity**. Slugs: `scale-always-reads-true-weight`, `apparent-weightlessness-requires-zero-gravity`.
17. **Objects need something external to push against to accelerate** (a rocket "can't work in space"). Slug: `objects-need-something-external-to-push-against-to-accelerate`.
18. **Steeper incline always means greater final speed**, ignoring friction and distance. Slug: `steeper-incline-always-means-faster-final-speed`.

Distractors in the test bank should represent authentic misconceptions wherever possible (`rigor-standard-addendum.md` §12), and feedback must address the *reasoning* behind each, not just mark it wrong (`master-project-prompt.md` §8).

---

## 7. Assessment evidence contract

| Use | Instrument | Evidence required | Decision it supports |
|---|---|---|---|
| Entry — conceptions | Concept inventory (§10), pre-instruction | Which §6 misconceptions the student holds, consistent vs mixed, as a profile | Student's watch-list; (post) conceptual-gain measure $\langle g\rangle$ |
| Entry — carryover | Module 0 Unit 1 retrieval | Procedural Unit 1 skill checks (signed motion, trig, graph slopes) | Which Unit 1 lessons (if any) to revisit before starting |
| Per-chunk formative | 1–4 items at the end of each concept chunk (`master-project-prompt.md` §8) | Targeted check on that chunk's sub-outcome, with distractor-specific feedback | Proceed to the next chunk, or re-read this one |
| Per-lesson | Lesson-level formative assessment (`master-project-prompt.md` §9) | A mix of conceptual, quantitative, graphical, multi-representation, and justification items mapped to the lesson's sub-outcomes; **≥1 near-transfer and ≥1 far-transfer item** (`rigor-standard-addendum.md` §19); progressive hint→solution disclosure | Lesson mastered, or specific sub-outcomes to revisit |
| Per-lesson | Exit retrieval question | One generative or spaced-retrieval item | Spacing schedule for later units |
| Unit | Unit 2 cumulative assessment / test bank draw (§9) | Conceptual reasoning, quantitative modeling, graphs, representations, experimental reasoning, error analysis, unfamiliar application, synthesis — **not grouped by subtopic** (`rigor-standard-addendum.md` §20) | Unit mastery; readiness signal for the AP-style unit exam |
| Transfer | Far-transfer items embedded in lesson and unit assessments | Recognizable-only-through-concept scenarios (banked road, accelerating wedge, rocket in space, block-on-block) | Durable, flexible understanding vs. rehearsed template use |

**Objective-level reporting.** Because every item carries `objective` + `skill` + `misconceptionTested` + correctness (`master-project-prompt.md` §27), a completed quiz can eventually report **Mastered / Developing / Needs Review by sub-outcome** rather than only a percentage (`rigor-standard-addendum.md` §18). The data model supports this now; the reporting UI is a later phase.

**Proposed lesson-mastery rule** (mirrors nothing external; proposed here, pending pilot evidence): a student has mastered a lesson when they reach ≥ 80% on the lesson-level assessment, answer **every** item mapped to a Level-5-or-higher sub-outcome correctly, and trigger **no** Priority 1 or Priority 8–10 misconception on a transfer item. Revisit after any single failed criterion.

---

## 8. Outcome coverage matrix

"Introduced" = the module that first teaches the cluster; "Practised" = modules with formative items on it; "Mastery evidence" = the module whose lesson-level assessment certifies it; "Transfer" = where it appears in an unfamiliar context.

| Cluster | Introduced | Practised | Mastery evidence | Transfer |
|---|:--:|:--:|:--:|:--:|
| 2.1 First law & equilibrium | M2 | M2, M4, M7, M9, M10 | M2 | M9, M10 |
| 2.2 Forces & FBDs | M1 | M1, M2, M3, M4, M5, M6, M7, M9, M10 | M1 | M9, M10 |
| 2.3 N2 relationship | M3 | M3, M4, M8, M10 | M3 | M10 |
| 2.4 N2 from descriptions | M3 | M3, M4, M10 | M3 | M10 |
| 2.5 N2 multi-force / two-axis | M4 | M4, M6, M7, M9, M10 | M4 | M9, M10 |
| 2.6 Third law | M5 | M5, M7, M10 | M5 | M7, M10 |
| 2.7 Connected systems | M7 | M7, M10 | M7 | M10 |
| 2.8 Friction | M6 | M6, M9, M10 | M6 | M9, M10 |
| 2.9 Inclined planes | M9 | M9, M10 | M9 | M9 (far-transfer part), M10 |
| 2.10 Gravitation / springs / apparent weight | M8 | M8, M10 | M8 | M10 |

Every cluster is introduced once, practised in at least two modules, has a single certifying assessment, and reappears as transfer in Module 10. Clusters 2.2 and 2.5 (the FBD and two-axis spine) are practised in nearly every subsequent module by design.

---

## 9. Unit test-bank architecture

The Unit 2 test bank is the first of one indexed bank per unit. Its job: **solidly prepare an AP-5-targeting student for the AP Physics 1 exam** — MCQ and FRQ, at the exam's cognitive demand, with authentic-misconception distractors and full reasoning-model solutions. Every item also carries the `courses` reuse index (§1), so items whose physics is shared can be pulled into an IB question set later without re-authoring.

### 9.1 Files and existing state

- `data/question-bank/ap1-u2-dynamics.json` — 50 MCQ, currently all tagged `ap1-u2-l3-fp01 … fp50` (a lesson-scoped "further practice" scheme).
- `data/question-bank/ap1-u2-dynamics-frq.json` — 15 FRQ, `ap1-u2-frq-01 … 15`, with `frqType` values `multi-part-quantitative`, `quantitative-qualitative-translation`, `graph-and-justify`, `error-analysis`, `experimental-design`, `paragraph-argument`.

These ~65 items are the **seed**. They are re-indexed and expanded per below.

### 9.2 Identifier scheme

```
AP1-U2-MCQ-###     unit test-bank multiple choice, zero-padded, cluster-agnostic sequence
AP1-U2-FRQ-###     unit test-bank free response
```

Lesson-embedded formative checks keep their lesson-scoped ids (`ap1-u2-l3-q01`, etc.) and are **not** renamed — the unit bank and the lesson formative checks are different pools with different purposes (`master-project-prompt.md` §27). The existing 50 `fp` items are promoted into the `AP1-U2-MCQ-###` sequence during the §12 migration; the 15 FRQ get an `AP1-U2-` prefix. A `clusterId` field (`2.1`–`2.10`) is added to every item so the bank can be filtered by cluster without parsing `objective`.

### 9.3 Target composition

Item counts are targets for the stabilized Unit 2 bank, not a cap.

| Cluster | MCQ target | FRQ involvement |
|---|:--:|---|
| 2.1 First law & equilibrium | 14 | appears in ≥1 multi-part quantitative + ≥1 paragraph-argument |
| 2.2 Forces & FBDs | 16 | ≥1 translation-between-representations (verbal → FBD) |
| 2.3 N2 relationship | 12 | ≥1 quantitative-qualitative translation |
| 2.4 N2 from descriptions | 10 | folded into 2.3/2.5 FRQs |
| 2.5 N2 multi-force / two-axis | 16 | ≥1 multi-part quantitative |
| 2.6 Third law | 12 | ≥1 paragraph-argument + ≥1 error-analysis |
| 2.7 Connected systems | 12 | ≥1 multi-part quantitative |
| 2.8 Friction | 14 | ≥1 experimental-design (measuring $\mu$) |
| 2.9 Inclined planes | 14 | ≥1 multi-part quantitative + ≥1 graph-and-justify |
| 2.10 Gravitation / springs / apparent weight | 16 | ≥1 graph-and-justify (force–extension), ≥1 quantitative-qualitative (gravitation proportionality) |
| **MCQ total** | **≈ 146** | |
| **FRQ total** | **≈ 30–36** | across all six `frqType`s, every cluster represented |

### 9.4 Difficulty and cognitive-level calibration

Difficulty tags are the five canonical values (`rigor-standard-addendum.md` §21). Target distribution across the MCQ bank, calibrated so the bank *builds toward* exam readiness rather than front-loading maximal difficulty (`rigor-standard-addendum.md` §3, §21):

| Difficulty tag | Share of MCQ bank | Role |
|---|:--:|---|
| `foundation` | ~10% | prerequisite and definitional on-ramp |
| `developing` | ~20% | single-principle application in familiar contexts |
| `ap-ib-standard` | ~35% | the modal AP MCQ: principle selection, one or two representations, a short reasoning step |
| `ap5-ib7-target` | ~28% | multi-step, unfamiliar context, justification, proportional reasoning without calculation |
| `distinction-stretch` | ~7% | non-routine synthesis, limiting cases, model evaluation — used **sparingly**; olympiad-style problems must not distort AP preparation (`rigor-standard-addendum.md` §21) |

Cognitive level (`master-project-prompt.md` §27, integer 1–8) is tagged independently. The bank as a whole must place **the majority of `ap-ib-standard` and `ap5-ib7-target` items at Levels 4–6**, with Levels 7–8 concentrated in FRQs and `distinction-stretch` MCQs.

### 9.5 Per-item requirements

Every bank item carries the full §27 schema. Non-negotiables:

- `objective` (sub-outcome, e.g. `2.9b`) and `clusterId` (`2.9`);
- `skill` and `representation` from `data/taxonomies.json` — no inline invention;
- `difficulty` (one of five canonical) and `cognitiveLevel` (1–8);
- `misconceptionTested` where the item is diagnostic (empty otherwise);
- `courses` — the reuse index (§1): every course the item is usable in as-is, from `data/taxonomies.json`. New Unit 2 items default to `["ap-physics-1"]`; add IB values only when the item genuinely fits that course's demand and scope;
- for MCQ: distractor-specific `feedback.incorrect` for **every** wrong option, each naming the misconception or error it represents (`master-project-prompt.md` §8);
- for FRQ: a part-by-part `modelResponse` showing the **minimum complete reasoning for full credit** (`rigor-standard-addendum.md` §5), a point breakdown, and `scoringNotes` covering common partial-credit cases;
- **numerical-precision rule** (adopted from the external sample, applicable here): every numerical item states whether the final answer is given to one or two decimal places, and every answer key records the canonical rounded value plus the matching acceptance interval — $[x-0.05, x+0.05)$ for one decimal place, $[x-0.005, x+0.005)$ for two — with explicit equivalent-form rules (e.g. symbolic answers, unit variants). No false precision.

### 9.6 FRQ reasoning modes

`frqType` stays a **course-neutral reasoning-mode** tag, not an exam-framework code. The existing bank uses six: `multi-part-quantitative`, `quantitative-qualitative-translation`, `graph-and-justify`, `error-analysis`, `experimental-design`, `paragraph-argument`. The bank as a whole must contain enough of each to build a practice set that resembles the current AP Physics 1 Section II demand *[verify CED for the current official task-model names and count]* — but that alignment is a **composition target for the bank**, checked when a course-specific practice exam is assembled, not a per-item tag. The same six modes serve an IB practice set drawn from `courses`-tagged items.

### 9.7 Review protocol

No bank item is "approved" until it has passed, independently of its author (`master-project-prompt.md` §31 items 14–19, §32):

1. **Physics check** — principle, assumptions, equation, signs, units, limiting cases.
2. **Numerical check** — the answer recomputed from scratch; the acceptance interval verified.
3. **Distractor check** — every distractor is reachable by a *specific* wrong reasoning path, and the feedback names it.
4. **Alignment check** — `objective`, `skill`, `representation`, `difficulty`, `cognitiveLevel` match the item as written.
5. **Course-index check** — `courses` is correct: the item genuinely works, as written, in every course listed (right scope, right demand, no course-specific phrasing that breaks elsewhere).
6. **Rigor check** — would mastering this item materially help a student earn a 5? (`rigor-standard-addendum.md` §22.)

A lightweight build-time validator should enforce checks 3–5 mechanically (every distractor has feedback; every `skill`/`representation`/`difficulty`/`courses` value is in `taxonomies.json`; `courses` is non-empty); checks 1, 2, 6 and the *judgement* part of 5 are human review.

---

## 10. Unit diagnostic (concept inventory)

Separate from the exam-preparation test bank (§9), each unit has a **concept-inventory diagnostic**: a short, purely conceptual, calculator-free multiple-choice instrument given **before instruction** to surface what prior understanding and which misconceptions a student brings into the unit. It is modeled on the **Force Concept Inventory** (`resources/FCIv95_cannon.pdf`) — its *design method*, not its items. It is not graded and it does not prepare for the exam; its only job is to make the student's starting mental model visible, to the student and (later) to the reporting layer.

### 10.1 What it is and is not

| | Concept inventory (§10) | Unit test bank (§9) | Module 0 entry retrieval (§5) | Lesson formative checks (§7) |
|---|---|---|---|---|
| Timing | Before Module 1 (pre); optional re-take after Module 10 (post) | During/after each module; unit review | Before Module 1 | Throughout each lesson |
| Purpose | Reveal prior conceptions & misconceptions | Build & certify AP-exam readiness | Refresh Unit 1 carryover skills | Check the chunk just taught |
| Format | MC only, qualitative, **no calculator, no equation sheet, no numeric options** | MC + FRQ, quantitative and qualitative, calculator + sheet assumed | MC + short numeric | MC / multi-select / numeric / short response |
| Cognitive level | 1–3 (recognition, conceptual reasoning) | 1–8, majority 4–6 | 1–3 | 1–6 |
| Scored? | No — reported as a misconception profile | Yes | No — pointer back to Unit 1 | Yes, formatively |
| Stakes | None | None (practice) | None | None |

Module 0's entry retrieval (§5) stays distinct: it checks **procedural Unit 1 carryover** (signed motion, trig components, graph slopes) and *does* involve small calculations. The concept inventory checks **force-and-motion intuitions** and involves none.

### 10.2 Design rules

Drawn from concept-inventory research (FCI, and the Force and Motion Conceptual Evaluation as a secondary reference — design principles only, no item text):

1. **100% qualitative.** No calculation is required or possible. No answer option is a number. A student who cannot yet draw a free-body diagram or do the algebra can still answer every item by reasoning about the physical situation.
2. **Concrete, everyday scenarios** in plain language — carts, books on tables, a puck on ice, a ball tossed upward, a person in an elevator, a tug-of-war, a truck hitting a car. Minimal notation, no jargon that instruction hasn't established, no FBD-reading skill assumed.
3. **Forced choice, one Newtonian-correct answer.** Every distractor is a *specific documented misconception* from §6, phrased as the "common-sense" answer a student holding that misconception would confidently choose.
4. **Distractors must out-poll the key, pre-instruction, on the hard items.** An item nearly every novice answers correctly carries no diagnostic information and should be cut in item analysis (§10.5). Target pre-instruction facility 0.20–0.65 on most items.
5. **Paired / clustered probing.** Each Priority-1 and Priority-8–10 misconception (§6) is probed by **at least two items** in different surface contexts, linked by a `pairId`. A student who picks the misconception answer on both is showing a stable alternative model, not a slip.
6. **Stable form.** Once piloted and fixed, the item set does not change between administrations, so pre/post comparison and cross-cohort comparison stay valid. Revisions bump a form version (`AP1-U2-DIAG` → `AP1-U2-DIAG-v2`) and reset the comparison baseline.
7. **A few Newtonian-anchor items** (no misconception tested) check correct baseline understanding — constant velocity ⇔ balanced forces, free-fall objects of different mass share acceleration, an object at rest has forces on it — so the profile distinguishes "holds a misconception" from "has no stable model either way."

### 10.3 Blueprint — AP Physics 1 Unit 2, 25 items

Item count is a proposal pending pilot item analysis (§10.5). Twenty-five items sit comfortably in one ~30-minute untimed sitting; the FCI uses 30 for all of introductory mechanics, so a single unit needs fewer.

| §6 misconception | Items | Sample probe contexts |
|---|:--:|---|
| 1 — motion requires a sustaining force | 3 | puck sliding on ice; spacecraft coasting engine-off; ball rolling across a level floor |
| 2 — motionless implies no forces | 2 | book on a table; picture frame on a wall |
| 3 — net force = one applied force | 2 | two people pushing a crate in opposite directions; box pushed at constant velocity |
| 4 — $g$ vs $G$ / mass vs weight | 2 | same object on the Moon; "which quantity changes?" |
| 7 — heavier ⇒ smaller acceleration under the same net force | 2 | identical pushes on a full vs empty cart; two blocks, stated equal net force |
| 8 — third-law pair acts on one object | 2 | hand pushing a wall; Earth–ball |
| 9 — any equal-and-opposite pair is a third-law pair | 2 | book on table (weight vs normal); hanging lamp |
| 10 — equal forces ⇒ bigger object exerts more / equal accelerations | 2 | truck hits car; two skaters push apart |
| 11 — friction only opposes actual motion / always acts | 2 | box on the verge of sliding; block sliding to rest |
| 12 — normal force always equals full weight | 1 | block on a ramp; "is the normal force equal to $mg$?" |
| 17 — need something to push against to accelerate | 1 | rocket in deep space |
| Newtonian anchor (no misconception) | 4 | constant-velocity elevator; two dropped balls of different mass; ball at the top of its toss; steady tow at constant speed |

**Springs (§6 item 14) and detailed gravitation proportionality are deliberately light here** — they are less loaded with intuitive-physics preconceptions and are well covered by the test bank. One anchor-style item may touch "which way does a stretched spring pull," no more.

### 10.4 Item schema and file

- **File:** `data/question-bank/ap1-u2-diagnostic.json` (build already copies `data/` wholesale, so no build change).
- **IDs:** `AP1-U2-DIAG-01 … 25`.
- **Schema:** the §9.5 / `master-project-prompt.md` §27 object, with these constraints and additions:
  - `type: "multiple-choice"`; 3–5 options; exactly one `correctAnswer`.
  - `diagnosticForm: "AP1-U2-DIAG"` and, where paired, `pairId`.
  - `calculatorFree: true`; **no option may be a bare numeric value** — validator-enforced.
  - `misconceptionTested` is **required and non-empty** for every item except those tagged `newtonianAnchor: true`.
  - `cognitiveLevel` 1–3; `difficulty` is still tagged but read as *pre-instruction attractiveness*, not exam difficulty.
  - `feedback.incorrect` for every distractor names the misconception and explains the correct reasoning — but the diagnostic UI **withholds all feedback until the student finishes the whole instrument** (config flag `revealFeedback: "on-completion"`), so early items don't teach the later ones.
  - `objective` / `clusterId` still point at the sub-outcome(s) the item's correct answer depends on, so the profile can say "watch this in Module N."
- `data/taxonomies.json`: add `spring-constant-changes-with-applied-force` (also flagged in §6 item 14) and any new misconception slugs the anchor items need; add `newtonianAnchor`, `calculatorFree`, `diagnosticForm`, `pairId`, `revealFeedback` to the documented schema field list.

### 10.5 Administration, scoring, reporting

- **Pre:** presented at unit start, before Module 1. May be **gated** (must attempt before Module 1 unlocks) or **optional** — see §12. Untimed, or ~30 minutes soft.
- **Post (optional):** the identical form after Module 10, to compute the **normalized gain** $\langle g\rangle = \dfrac{\text{post}\% - \text{pre}\%}{100\% - \text{pre}\%}$, the standard concept-inventory effectiveness measure.
- **Not graded.** The student sees:
  1. an overall **Newtonian score** (percent of items with the correct answer);
  2. a **per-misconception verdict** — *consistent* (picked the misconception answer on all paired items), *mixed* (some), or *not shown* — this is the primary output;
  3. a **watch-list**: "You currently reason like [misconception] in these situations. This is addressed directly in Module [N] — revisit this diagnostic after it."
- **Newtonian threshold:** FCI research treats roughly 60% as a common pre-instruction ceiling for the "entry to Newtonian thinking" and ~85% as the coherent-Newtonian-model threshold. These are **reference points from other populations**; this project must calibrate its own thresholds from pilot data (§12) before showing any "you have / have not reached" language.
- **Item analysis before the form is fixed:** on pilot data, compute each item's difficulty (facility), discrimination (point-biserial), and distractor function (does each distractor draw responses, and do low scorers pick it more than high scorers?). Cut or rewrite items with discrimination < 0.2 or a dead distractor. Only then freeze the form.

### 10.6 Repository-wide

Every unit gets its own concept inventory built to §10.2 and defined in that unit's architecture document. Together they form a Physics Academy concept-inventory suite. Cross-unit design consistency (option count, tone, reporting format) is owned here and inherited; per-unit blueprints (§10.3-equivalents) are owned by each unit's architecture.

---

## 11. Content-production contract

Each module package (one lesson + its share of the test bank) must include:

1. controlled header and outcome alignment (which clusters/sub-outcomes, mapped to the current CED);
2. the module's slice of the §4 cognitive-demand table (entry / ceiling / stretch), with the specific Level-5+ tasks named;
3. prerequisite check and pointers back to the Unit 1 or earlier-Unit-2 lessons a struggling student should revisit;
4. concept-and-representation sequence following `master-project-prompt.md` §7 (physical intuition → qualitative → representation → model → worked example → independent reasoning → transfer);
5. worked-example progression: the 13-step reasoning of `master-project-prompt.md` §10 grouped into 3–4 subgoal-labelled `phases` with a `problem` line and a `keyMove` self-explanation answer, plus deliberate scaffold fade across the lesson (`rigor-standard-addendum.md` §16);
6. per-chunk formative checks with distractor-specific feedback;
7. the interactive component and/or simulation, with a prediction gate where pedagogically appropriate (`rigor-standard-addendum.md` §10);
8. misconception diagnostics drawn from §6, each as a real question with reasoning feedback — and, for every §6 misconception this module is the designated remediation for, confirm the §10 diagnostic's watch-list points here;
9. ≥1 error-analysis task (`rigor-standard-addendum.md` §13) in modules where the cluster ceiling is Level 5+;
10. representation-connections section;
11. lesson-level assessment with ≥1 near- and ≥1 far-transfer item (`rigor-standard-addendum.md` §19);
12. course-neutral exam-connection note (which FRQ reasoning modes and MCQ reasoning patterns this lesson feeds; framed by reasoning demand, not by a course's framework — the lesson-page "Exam Connection" section is written this way too);
13. exit retrieval question and a spacing note (which later module should re-retrieve this);
14. the module's contribution to the unit test bank (§9.3 targets), each item review-signed per §9.7;
15. required assets (diagrams, graph SVGs) and platform notes.

---

## 12. Open decisions before full production

**Highest priority — blocks test-bank expansion:**

1. **Exam-framework tagging — RESOLVED 2026-08-31.** The `apIbConnection` field is retired repository-wide and replaced by the `courses` reuse index (§1). No science-practice reconciliation is needed — the axis is gone; reasoning type lives in `skill`/`representation`/`cognitiveLevel`. Migration of the ~65 existing items and the prototype lesson is complete. Remaining sub-task: cross-tag genuinely shared items with IB course values (folded into §12.8).
2. **CED outcome mapping.** Fill the §2 register's "maps to CED topic / Learning Objective / Essential Knowledge" column from the current official CED. Confirm the cluster boundaries (especially: is "systems and center of mass" a Unit 2 topic here? is apparent weight explicit in the CED or a derived application?).
3. **Circular-motion scope.** Determine from the current CED whether uniform circular motion / centripetal force is in this unit ("Force and Translational Dynamics") or a later one. Drives whether §5's optional module, §6's Misconception 13, and §10.3's blueprint row for it are in Unit 2.

**Standard — before the corresponding module ships:**

4. **Equation-sheet value of $g$** (9.8 vs 10 m/s²) and the precision of $G$ on the current official sheet.
5. **Pulley scope.** Confirm the single-ideal-redirect boundary in §1 is sufficient for AP Physics 1, or widen it.
6. **ID migration.** Execute the §9.2 re-indexing (promote `fp01–fp50` → `AP1-U2-MCQ-###`, prefix the FRQs, add `clusterId`) as one scripted migration, and set the prototype lesson's `objective` to `2.3`.
7. **Build-time validator scope.** Decide whether the §9.7 checks 3–4 validator lands before or alongside the bank expansion (recommended: before).
8. **IB cross-listing.** When Unit 2 is stable, decide which clusters (Newton's laws, gravitation, friction, springs, equilibrium) get extracted into `content/shared-concepts/` with IB SL/HL assessment variants, and which stay AP-1-only.
9. **Unit exam form.** Whether the repository ships a fixed AP-style Unit 2 practice exam (fixed form) in addition to the filterable bank, and its blueprint (MCQ count, FRQ selection, timing).
10. **Concept-inventory gating.** Whether attempting the §10 diagnostic is *required* before Module 1 unlocks, or purely optional. Recommendation: optional but strongly prompted, with the post-instruction re-take prompted at Module 10.
11. **Concept-inventory post-test.** Whether to surface the normalized-gain $\langle g\rangle$ figure to students, or use it only for internal calibration.
12. **Concept-inventory calibration.** Final item count (25 proposed), and the Newtonian-score thresholds shown to students — both frozen only after the §10.5 pilot item analysis on this project's population, not carried over from published FCI norms.
13. **Diagnostic schema fields.** Confirm `data/taxonomies.json` and the `build/build.js` schema comment are extended with `diagnosticForm`, `pairId`, `calculatorFree`, `newtonianAnchor`, `revealFeedback`, and the new misconception slugs (§10.4) as part of Open Decision 7's validator work.

---

## 13. Downstream implementation order

1. Resolve Open Decisions 1–3 (§12) against the current official CED. Record the answers in this document (bump to v0.2.0) before writing new content.
2. Land the §9.7 build-time validator (checks 3–4, plus the §10.4 diagnostic constraints) and the §12.6 ID migration.
3. Bring the existing prototype lesson (`ap1-u2-l3`, Module 3) into full compliance with this architecture: set `objective` to `2.3`, add lesson-level `courses`, confirm the §11 checklist. (`apIbConnection` already stripped, `courses` already added on its embedded questions.)
4. Produce the Unit 2 concept-inventory diagnostic (§10) — 25 items to the §10.3 blueprint — so it exists before Module 1 ships. Freeze its form only after the §10.5 pilot item analysis.
5. Produce the spine modules in dependency order: **M1 (FBDs) → M2 (First law) → M4 (Multi-force/two-axis) → M5 (Third law)**, each with its lesson and its test-bank slice.
6. Produce **M6 (Friction) → M7 (Connected systems) → M8 (Gravitation/springs/apparent weight)**.
7. Produce **M9 (Inclined planes)** — the synthesis capstone — and the optional circular-motion module if §12.3 keeps it in Unit 2.
8. Produce **M10 (Synthesis & transfer)** and assemble the interleaved unit cumulative assessment.
9. Expand the test bank to the §9.3 targets; run every item through the §9.7 protocol.
10. Pilot the unit; calibrate the §7 mastery rule, the §9.4 difficulty distribution, and the §10.5 diagnostic thresholds against observed student performance; compute pre/post $\langle g\rangle$ on the concept inventory.
11. Retrospective: what in this architecture broke or bent under Unit 2? Fix it here before starting Unit 3, since every later unit inherits these structures.

---

## 14. Revision history

| Version | Date | Status | Summary |
|---|---|---|---|
| 0.1.0 | 2026-08-31 | Draft — for review | Initial AP Physics 1 Unit 2 architecture, modeled structurally on an external Grade-8 unit-architecture sample (governance/tutorial-sprint/diagnostic-routing apparatus deliberately dropped). Defines 10 internal outcome clusters / 44 sub-outcomes inheriting the existing question bank's `objective` numbering; dependency order with Forces & FBDs as the spine and Inclined Planes as the synthesis capstone; a cognitive-demand progression table mapped to `rigor-standard-addendum.md` §2 (replacing the sample's proprietary learning cycle); an 11-module instructional sequence on the `master-project-prompt.md` §4 lesson flow; 18 prioritized misconceptions (slugs reconciled to the existing bank); an assessment evidence contract; a full unit test-bank architecture (ID scheme, ~146 MCQ / ~30–36 FRQ targets, difficulty calibration, per-item requirements, review protocol); a per-unit **concept-inventory diagnostic** spec (§10) modeled on the Force Concept Inventory — 25 calculator-free qualitative items, misconception-mapped blueprint, forced-choice design rules, item-analysis and normalized-gain reporting; and an open-decisions register headed by CED verification. No content approved; CED references unverified. |
| 0.2.0 | 2026-08-31 | Draft — for review | Retired the per-item `apIbConnection` exam-framework tag repository-wide (it no longer matched College Board's current practice model and duplicated `skill`/`representation`/`cognitiveLevel`). Replaced it with a **`courses` reuse index** — `ap-physics-1` / `ap-physics-2` / `ib-physics-sl` / `ib-physics-hl` in `data/taxonomies.json` — on every question, lesson, and topic, so shared physics is authored once and filtered per course. Migrated all ~65 Unit 2 bank items and the prototype lesson's 12 embedded questions to `courses: ["ap-physics-1"]`; updated `master-project-prompt.md` §27 (both copies), `data/taxonomies.json`, and `build/build.js` (the lesson `apIbConnection` field → course-neutral `examConnection`; section renamed "Exam Connection"). Science-practice reconciliation (was §12.1) closed as resolved. Added a plain-language definition of "CED". No outcome, scope, sequencing, or difficulty change. |
