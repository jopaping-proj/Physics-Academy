# AP Physics 1 · Unit 2: Force and Translational Dynamics — Curriculum Architecture

**Document ID:** PA-AP1-U02-ARCH-001
**Version:** 0.9.8
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

**CED verification (`master-project-prompt.md` §32) — done 2026-08-31.** The framework facts below were checked against College Board's AP Central *AP Physics 1: Algebra-Based* course page and corroborating summaries ([AP Central](https://apcentral.collegeboard.org/courses/ap-physics-1), [UWorld unit/topic guide](https://collegeprep.uworld.com/ap/ap-physics-1/units-topics-and-key-concepts/), [UWorld exam-format guide](https://collegeprep.uworld.com/ap/ap-physics-1/exam-format-and-information/)). What is now **confirmed** (the earlier `[verify CED]` markers are cleared where these apply):

- **Unit 2 is "Force and Translational Dynamics", 18–23% of the exam** (tied with Unit 3 for the heaviest unit; the 2024 framework, first exam May 2025).
- **Unit 2 CED topics:** 2.1 Systems and Center of Mass · 2.2 Forces and Free-Body Diagrams · 2.3 Newton's Third Law · 2.4 Newton's First Law · 2.5 Newton's Second Law · 2.6 Gravitational Force · 2.7 Kinetic and Static Friction · 2.8 Spring Forces · **2.9 Circular Motion**. (Note the CED order: Third Law precedes First Law.)
- **Three science practices:** 1 Creating Representations · 2 Mathematical Routines · 3 Scientific Questioning and Argumentation. (This project does not tag items with practice codes — see §1 — but lessons should exercise all three.)
- **Exam, May 2026:** Section I — 40 single-select multiple-choice, 50%; Section II — 4 free-response, 50%, the task models being **Mathematical Routines, Translation Between Representations, Experimental Design and Analysis, Qualitative/Quantitative Translation**. Digital MCQ in Bluebook, handwritten FRQ. **The MCQ count and section timing change for the May 2027 exam** — details not yet public; re-check the CED before building a fixed practice exam (§12.9).
- **Table of Information:** $g = 9.8\ \mathrm{m/s^2}$, $G = 6.67\times10^{-11}\ \mathrm{N\,m^2/kg^2}$.

Learning-Objective and Essential-Knowledge *codes* (e.g. "2.5.A.1") are still not transcribed here — the CED PDF is the authority for those, and this document maps to CED *topics*, not sub-codes.

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

**Included** (all nine CED Unit 2 topics — §0):

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
- **uniform circular motion (CED topic 2.9)** as an *application of Newton's second law* — centripetal acceleration as $a_c = v^2/r$ directed toward the centre, produced by the net of the real forces; "centripetal force" is not a separate force to add to an FBD.

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

Aligned to the AP Physics 1 Table of Information / equation sheet (verified 2026-08-31 — §0) and the existing Unit 2 prototype lesson.

| Quantity | Symbol | Notes |
|---|---|---|
| Net force (single axis) | $\vec{F}_{net} = \sum \vec{F}$ | signed sum along the chosen axis |
| Weight / near-surface gravity | $\vec{F}_g$, $|\vec{F}_g| = mg$ | field force; distinct from $F_G$ below |
| Universal gravitation | $F_G = G\dfrac{m_1 m_2}{r^2}$ | capital-$G$ subscript; $G = 6.67\times10^{-11}\ \mathrm{N\,m^2/kg^2}$ (Table of Information) |
| Normal force | $\vec{F}_N$ | perpendicular to the contact surface |
| Tension | $\vec{F}_T$ | along the rope, away from the object |
| Friction (kinetic) | $\vec{f}_k$, $|\vec{f}_k| = \mu_k |\vec{F}_N|$ | opposes relative sliding |
| Friction (static) | $\vec{f}_s$, $|\vec{f}_s| \le \mu_s |\vec{F}_N|$ | opposes the tendency to slide; magnitude set by equilibrium up to the maximum |
| Spring force | $F_s = -kx$ | **signed restoring-force form**; $k>0$ always; $x$ signed from natural length |
| Free-fall magnitude | $g$ | $|g| = 9.8\ \mathrm{m/s^2}$ near Earth's surface (Table of Information; carried from Unit 1) |

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

Outcomes are grouped into **twelve clusters**, `C2.1`–`C2.12`. The `C` prefix is deliberate: the bare numbers collide with CED topic numbers and mean something different. A cluster is a *pedagogical* unit (one lesson-sized chunk); a CED topic is a *coverage* checkbox. The `objective` field on the ~65 existing question-bank items still reads `"2.1"`…`"2.10"` — those are the same as `C2.1`…`C2.10` here; **re-tagging `objective` to the `C`-prefixed form (and adding a `cedTopic` field) is a tracked migration, §12.10** — it was not done in the CED-verification pass to keep that pass bounded.

Every cluster now maps to a **verified CED topic** (§0):

| Cluster | CED topic | Note |
|---|---|---|
| C2.1 Newton's First Law & Equilibrium | **2.4** Newton's First Law | equilibrium problem-solving is the applied form |
| C2.2 Forces & Free-Body Diagrams | **2.2** Forces and Free-Body Diagrams | direct match |
| C2.3 Newton's Second Law: the relationship | **2.5** Newton's Second Law | |
| C2.4 Newton's Second Law: from descriptions | **2.5** Newton's Second Law | |
| C2.5 Newton's Second Law: multi-force / two-axis | **2.5** Newton's Second Law | |
| C2.6 Newton's Third Law | **2.3** Newton's Third Law | |
| C2.7 Connected Objects & Systems | **2.5** Newton's Second Law | CED treats this as an N2L application, not its own topic |
| C2.8 Friction | **2.7** Kinetic and Static Friction | direct match |
| C2.9 Inclined Planes | **2.5** Newton's Second Law | N2L application; the designed synthesis capstone |
| C2.10 Gravitation, Springs, Apparent Weight | **2.6** Gravitational Force + **2.8** Spring Forces | apparent weight is an N2L (2.5) application |
| C2.11 Systems & Center of Mass | **2.1** Systems and Center of Mass | *new — no bank items yet* |
| C2.12 Circular Motion | **2.9** Circular Motion | *new — resolved in the CED pass; formerly "optional"* |

So all nine CED Unit 2 topics are covered. The clusters over-decompose CED topic 2.5 (six clusters) on purpose — Newton's second law is the unit's core and 18–23% of the exam leans on it.

Sub-outcome letters (`C2.1a`, `C2.1b`, …) trace into the coverage matrix (§8) and the test bank (§9). Observable evidence is written so a formative check or FRQ part can be mapped directly to it. Cluster headers below carry their CED topic in the title.

### C2.1 — Newton's First Law and Equilibrium · CED topic 2.4

| ID | Outcome | Observable evidence |
|---|---|---|
| 2.1a | Define inertia and inertial mass. | States that inertia is an object's resistance to a change in its velocity, and that inertial mass is the quantitative measure of that resistance. |
| 2.1b | State Newton's first law and its zero-net-force condition. | States that an object's velocity is constant (in magnitude and direction) if and only if the net force on it is zero. |
| 2.1c | Distinguish static from dynamic equilibrium. | Classifies a described situation as static equilibrium (at rest), dynamic equilibrium (constant nonzero velocity), or non-equilibrium, and states that both equilibrium types share $\vec{F}_{net}=0$ and $\vec{a}=0$. |
| 2.1d | Apply the equilibrium condition to solve for an unknown force. | Sets $\sum F_x = 0$ and $\sum F_y = 0$ from an FBD and solves for a missing force magnitude or direction, including cases with angled forces. |
| 2.1e | Justify that an object at rest still has forces acting on it. | Explains, for a specific scenario, why "not accelerating" means "balanced forces," not "no forces." |

### C2.2 — Forces and Free-Body Diagrams · CED topic 2.2

| ID | Outcome | Observable evidence |
|---|---|---|
| 2.2a | Identify every force acting on a defined system from a verbal or pictorial description. | Lists each force by type and direction, with no omitted real force and no invented force (no "force of motion"). |
| 2.2b | Define the system and distinguish internal from external forces. | States which object(s) are in the system and which listed forces are external (and therefore relevant to the system's acceleration). |
| 2.2c | Construct a correct free-body diagram in either AP-accepted style. | Draws all and only the external forces, each with a defensible direction and roughly correct relative length, using consistent box- or dot-diagram conventions. |
| 2.2d | Calculate the net force along a single axis from an FBD. | Chooses a positive direction, sums signed force components along one axis, reports $\vec{F}_{net}$ with magnitude, direction, and units. |
| 2.2e | Resolve angled forces into components along two perpendicular axes. | Produces correct component expressions (correct sine/cosine assignment) for forces at an angle to the chosen axes. |

### C2.3 — Newton's Second Law: the relationship · CED topic 2.5

| ID | Outcome | Observable evidence |
|---|---|---|
| 2.3a | State Newton's second law verbally and symbolically. | States that acceleration is proportional to net force and inversely proportional to mass, and writes $\vec{F}_{net} = m\vec{a}$ with $\vec{a}$ parallel to $\vec{F}_{net}$. |
| 2.3b | Calculate any one of net force, mass, or acceleration given the other two. | Correctly rearranges and solves, with units and direction, from an FBD-derived net force. |
| 2.3c | Reason proportionally about $\vec{F}_{net}=m\vec{a}$ without full calculation. | Predicts the factor by which $a$ changes when $F_{net}$ and/or $m$ are scaled, e.g. "$F_{net}$ doubled, $m$ tripled $\Rightarrow$ $a \times \tfrac{2}{3}$," framed through $a = F_{net}/m$. |
| 2.3d | Identify Newton's first law as the $\vec{F}_{net}=0$ special case of the second. | States and shows that substituting $\vec{F}_{net}=0$ into $\vec{F}_{net}=m\vec{a}$ yields $\vec{a}=0$. |

### C2.4 — Newton's Second Law: reasoning from descriptions · CED topic 2.5

| ID | Outcome | Observable evidence |
|---|---|---|
| 2.4a | Reason from a verbal force/mass description to the direction and relative magnitude of acceleration. | Without an FBD drawn for them, determines whether $\vec{a}$ is zero or nonzero and its direction, and compares magnitudes across two described scenarios. |
| 2.4b | Connect a constant net force to the resulting $v$–$t$ graph and motion. | States that a constant nonzero net force produces constant acceleration (linear $v$–$t$), and reconstructs the described motion. |
| 2.4c | Refute the claim that motion requires a sustaining force in its direction. | Identifies and corrects Aristotelian "impetus" reasoning in a specific scenario. |

### C2.5 — Newton's Second Law: multi-force and two-axis problems · CED topic 2.5

| ID | Outcome | Observable evidence |
|---|---|---|
| 2.5a | Solve for acceleration from an FBD with three or more forces along one axis. | Sums all signed forces, applies $a = F_{net}/m$, reports signed acceleration with units. |
| 2.5b | Apply Newton's second law independently along two perpendicular axes. | Uses $\sum F_y = 0$ (no perpendicular acceleration) to find the normal force, and $\sum F_x = ma_x$ along the motion axis. |
| 2.5c | Solve for an unknown force given the measured acceleration. | Works backward: $F_{net} = ma$, then isolates the unknown force from the signed sum of known forces. |

### C2.6 — Newton's Third Law · CED topic 2.3

| ID | Outcome | Observable evidence |
|---|---|---|
| 2.6a | Identify the reaction force to a stated action force. | Names the reaction's type, magnitude (equal), direction (opposite), and — critically — the object it acts on. |
| 2.6b | State that an action–reaction pair acts on two different, interacting objects. | Explicitly attributes the two forces to two different objects, never to the same object. |
| 2.6c | Contrast an action–reaction pair with balanced forces on one object. | Distinguishes a third-law pair (two objects, same interaction, same force type, no equilibrium implication) from balanced forces (one object, possibly different force types, implies $\vec{a}=0$ for that object). Correctly rejects "weight and normal force are a third-law pair." |
| 2.6d | Apply the third law to equal-force / unequal-acceleration reasoning. | States that the mutual forces are equal in magnitude regardless of the objects' masses, and that the *accelerations* differ because the masses differ. |

### C2.7 — Connected Objects and Systems · CED topic 2.5 (application)

| ID | Outcome | Observable evidence |
|---|---|---|
| 2.7a | Analyze a connected system as a single object to find its common acceleration. | Treats linked objects as one system of total mass $M$, sums only external forces, finds $a = F_{net,ext}/M$. |
| 2.7b | Analyze an individual object within the system to find an internal force. | Draws the FBD for one object, applies $\vec{F}_{net}=m\vec{a}$ with the common $a$, solves for the connecting tension or contact force. |
| 2.7c | Explain why tension in a connecting rope is not equal to the weight of the hanging mass (when the system accelerates). | Shows that $F_T \ne m_{hang}\,g$ whenever $a \ne 0$, and gives the correct relationship. |
| 2.7d | Handle an ideal pulley that redirects a rope without changing tension magnitude. | Applies equal tension throughout a single massless rope over a massless, frictionless pulley, with correct sign bookkeeping around the redirect. |

### C2.8 — Friction (static and kinetic) · CED topic 2.7

| ID | Outcome | Observable evidence |
|---|---|---|
| 2.8a | Distinguish static from kinetic friction and state each model. | States $|\vec{f}_k| = \mu_k |\vec{F}_N|$ (fixed, once sliding) and $|\vec{f}_s| \le \mu_s |\vec{F}_N|$ (variable, up to a maximum). |
| 2.8b | Determine the direction of friction as opposing relative sliding or its tendency. | Correctly directs friction for a stationary object on the verge of sliding, a sliding object, and an object being pushed but not moving. |
| 2.8c | Calculate friction force and resulting acceleration in horizontal and inclined contexts. | Computes $F_N$ first, then $f$, then applies Newton's second law along the motion axis. |
| 2.8d | Determine whether a described object slides or stays put. | Compares the required static friction to $\mu_s F_N$ and concludes correctly. |
| 2.8e | Reason about how changing $\mu$, $F_N$, or applied force changes the motion. | Predicts qualitative changes in acceleration or in the slide/no-slide outcome without full calculation. |

### C2.9 — Inclined Planes (synthesis) · CED topic 2.5 (application)

| ID | Outcome | Observable evidence |
|---|---|---|
| 2.9a | Identify all forces on an object on an incline, with and without friction. | Lists weight (vertical), normal force (perpendicular to the incline surface), friction (along the surface, opposing sliding tendency), and any applied force, each correctly directed. |
| 2.9b | Resolve weight into incline-parallel and incline-perpendicular components. | Assigns $mg\sin\theta$ (parallel) and $mg\cos\theta$ (perpendicular) correctly, with a justification for the trig assignment, not a memorized pattern. |
| 2.9c | Determine the normal force on an incline. | Uses perpendicular-axis equilibrium: $F_N = mg\cos\theta$ (plus/minus components of any other forces), and explains why $F_N < mg$. |
| 2.9d | Calculate net force and acceleration along the incline, with and without friction. | Combines the parallel weight component, friction, and any applied force into $F_{net,\parallel}$, then $a = F_{net,\parallel}/m$, with correct signs. |
| 2.9e | Solve a full incline problem end to end for an unfamiliar angle, mass, or friction condition (transfer). | Produces system, FBD, decomposition, net force, and acceleration without procedural cueing. |

### C2.10 — Gravitation, Springs, and Apparent Weight · CED topics 2.6 + 2.8

| ID | Outcome | Observable evidence |
|---|---|---|
| 2.10a | Distinguish mass from weight, and $g$ from $G$. | States that mass is inertial and location-independent; weight $|\vec{F}_g| = mg$ depends on local $g$; $g$ is a field strength, $G$ is the universal constant. |
| 2.10b | Describe gravity as a center-of-mass-directed interaction, and reason proportionally with $F_G = G\dfrac{m_1 m_2}{r^2}$. | States the direction; predicts the qualitative change in $F_G$ when a mass or $r$ changes (including the inverse-square dependence), without calculating. |
| 2.10c | Solve $F_G = G\dfrac{m_1 m_2}{r^2}$ for any one variable. | Rearranges and computes $F_G$, a mass, or $r$, with units. |
| 2.10d | State Hooke's law mathematically and conceptually. | Writes $F_s = -kx$; explains spring force as proportional in magnitude to displacement from natural length and always opposite to it (restoring); states $k>0$ always and that the negative sign encodes direction, not the sign of $k$. |
| 2.10e | Calculate spring force, spring constant, or displacement given the other two; read $k$ from a force–extension graph. | Solves for $F_s$ (signed), $k$ (positive), or $x$ (signed); reads $k$ as the magnitude of the graph's slope. |
| 2.10f | Analyze apparent weight (scale reading) for an object with vertical acceleration. | Applies $F_N - mg = ma$ (elevator frame handled in the ground frame) to find the scale reading; explains apparent weightlessness as $F_N = 0$ during free fall, not absence of gravity. |

### C2.11 — Systems and Center of Mass · CED topic 2.1

*New in the CED-verification pass. No question-bank items yet; scheduled as Lesson 1 in §5.*

| ID | Outcome | Observable evidence |
|---|---|---|
| C2.11a | Define a system and its boundary, and distinguish internal from external forces. | Names the object(s) in a chosen system and classifies each force on it as internal or external. |
| C2.11b | Locate the center of mass of a simple system qualitatively, and for two point masses quantitatively. | States that the center of mass is mass-weighted toward the heavier object; computes $x_{cm} = \dfrac{m_1 x_1 + m_2 x_2}{m_1 + m_2}$. |
| C2.11c | State that the center of mass of a system responds only to the net external force. | Predicts the motion of a system's center of mass when only internal forces act (it does not change) versus when a net external force acts. |
| C2.11d | Treat an extended object or multi-object system as a point particle at its center of mass for translational dynamics. | Applies $\vec{F}_{net,ext} = M\vec{a}_{cm}$ to a system, using total mass $M$. |

### C2.12 — Circular Motion · CED topic 2.9

*Resolved from "optional" in the CED-verification pass — circular motion is CED Unit 2 topic 2.9. Delivered as Lesson 11 in §5. No question-bank items yet.*

| ID | Outcome | Observable evidence |
|---|---|---|
| C2.12a | State that an object in uniform circular motion has centripetal acceleration $a_c = v^2/r$ directed toward the centre. | Gives magnitude and direction of the acceleration for a described uniform circular motion; notes speed is constant but velocity is not. |
| C2.12b | Identify the real force(s) whose net provides the centripetal acceleration in a described scenario. | Names the actual forces (tension, friction, normal force, gravity, …) and states that their net points toward the centre; does **not** add a separate "centripetal force" to the FBD. |
| C2.12c | Apply Newton's second law along the radial direction: $\sum F_r = m v^2/r$. | Sets the net radial force equal to $mv^2/r$ and solves for a force, the speed, or the radius. |
| C2.12d | Reason about how $v$, $r$, or $m$ changes the required net force, and about limiting cases. | Predicts, e.g., the speed at which a car loses traction on a curve, or the tension at the top vs. bottom of a vertical circle. |

**Outcome count:** 52 sub-outcomes across 12 clusters (C2.1–C2.10: 44; C2.11: 4; C2.12: 4).

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
  Unit 2 synthesis & transfer  (see §5 Lesson 12 and §9 unit test bank)
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
| 2.3 N2 relationship | 1 | **4** | 6 | Predict the shape of an $F$-vs-$m$ graph before viewing it and read its slope as the acceleration; reason proportionally through combined changes. |
| 2.4 N2 from descriptions | 2 | **4** | 6 | Given a verbal scenario, produce direction + relative magnitude of $\vec{a}$ and the matching $v$–$t$ sketch. |
| 2.5 N2 multi-force / two-axis | 2 | **5** | 7 | Solve a two-axis FBD for acceleration and an unknown force in an unfamiliar configuration. |
| 2.6 Third law | 1 | **5** | 8 | Attribute every force in an unfamiliar two-object interaction; evaluate a flawed "equal and opposite therefore equilibrium" argument. |
| 2.7 Connected systems | 3 | **5** | 7 | Solve an unfamiliar two-body system both ways (system + individual) and reconcile the results. |
| 2.8 Friction | 2 | **5** | 7 | Determine slide/no-slide and resulting acceleration for an unfamiliar incline-plus-applied-force case. |
| 2.9 Inclined planes | 3 | **6** | 8 | Full end-to-end solution for an unfamiliar angle/mass/friction condition, plus a far-transfer variant (e.g. banked surface, accelerating incline). |
| 2.10 Gravitation / springs / apparent weight | 1 | **5** | 7 | Proportional reasoning about $F_G$ for unfamiliar mass/distance pairs; predict spring force at an untested displacement from graph-read $k$; solve an unfamiliar elevator apparent-weight problem. |
| 2.11 Systems & center of mass | 1 | **4** | 6 | Predict the motion of a system's centre of mass under internal-only vs. net-external forces; compute the centre of mass of two point masses. |
| 2.12 Circular motion | 2 | **5** | 8 | Identify the real forces providing the centripetal net force in an unfamiliar scenario and solve $\sum F_r = mv^2/r$; reason about a limiting case (loss of traction, top of a vertical circle). |

Every lesson's practice set is laid out in the three page-level tiers from `rigor-standard-addendum.md` §3 (**Foundation** / **Examination Readiness** / **Mastery-Distinction**), which group the five canonical difficulty tags per the mapping in `data/taxonomies.json` (`lessonThreeTier`). Cognitive level and difficulty tag are **separate axes** (`master-project-prompt.md` §27) — a Level-3 conceptual item can be `foundation` or `ap5-ib7-target` depending on scenario demand.

---

## 5. Instructional sequence

Each module is one lesson page unless noted. Every lesson follows the flow in `master-project-prompt.md` §4 (hook → objectives → prior knowledge → concept chunks with per-chunk formative checks → interactive component → simulation → misconceptions → error analysis → representation connections → lesson-level assessment → exam connection → summary → exit retrieval → further practice), with chunk depth set by the topic, not a fixed count. The page is delivered as a **slide deck** — one card at a time, learner-paced, with a "Read as one page" fallback and a default-on comprehension gate that holds Next until each check card is engaged with (`master-project-prompt.md` §4, slide-delivery note) — so each concept chunk becomes four cards (idea / representation / worked example / check) and every misconception and assessment question gets its own card. Worked examples are authored as subgoal-labelled `phases` revealed one at a time (`master-project-prompt.md` §10). Diagrams that the text refers to are authored as SVG under `assets/diagrams/` and shown on the card (`master-project-prompt.md` §11) — never referenced without being drawn. The content-production contract for each package is in §11.

### Module 0 — Unit 2 entry diagnostic and orientation

Two instruments, both before Lesson 2, neither graded:

**A. Concept inventory (§10) — built (draft) 2026-09-01.** `content/ap-physics-1/unit-2-dynamics/unit-2-concept-check.json` (27 items to the §10.3 blueprint) + `build/templates/concept-inventory.html` + `js/concept-inventory.js`. Calculator-free, purely conceptual, FCI-style. It shuffles the questions *and* the answer choices on every load; on submit it reports **only the score and percentage** — no per-question feedback, no review, and an explicit notice that item analysis is not provided and that the same check is taken again at the end of the unit. Each attempt's score is stored in `localStorage` (`pa:ci:ap1-u2`) so pre/post can be compared internally; the gain is not shown to the student. The per-misconception *profile* and *watch-list* described below in §10.5 are **not yet built** — the current version is score-only per the delivery decision; the profile view is a later enhancement. **Items not yet pilot-analysed (§10.5).**

**B. Unit 1 carryover retrieval** *(short; optional)*. A handful of mixed retrieval items (`rigor-standard-addendum.md` §17: recent/spaced/interleaved/generative) checking the **procedural** Unit 1 skills this unit depends on — signed 1-D motion, vector components, slope/area graph literacy. Involves small calculations (unlike the concept inventory). A student who misses these is pointed back to the relevant Unit 1 lessons.

Neither is a placement engine — the self-paced repository has no 1:1 routing. Their combined output is a starting picture for the student, not a gate on content (see §12 for the gate-vs-optional decision on instrument A).

> **Numbering (renumbered 2026-09-01).** The lessons below are numbered in teaching order (**Lesson 1 … Lesson 12**); the number is the `lessonNumber` field shown as "Lesson N" in the UI and on the unit index page. "Module 0" is not a lesson — it is the pre-instruction concept check (§10) plus the Unit 1 retrieval check. Circular Motion (C2.12) is **Lesson 11**, before Synthesis (**Lesson 12**). Cross-references elsewhere in this document (and in §12.1–3 / the revision history) that still say "Module N" predate this renumber and refer to the same content.

### Lesson 1 — Systems and Center of Mass · C2.11 *(built — approved 2026-09-01)*

**Progression:** what a *system* is and where its boundary is drawn → internal vs external forces → the centre of mass as the mass-weighted average position (qualitatively, then $x_{cm}$ for two point masses) → the centre of mass responds only to the **net external** force → so a system can be treated as a point particle at its centre of mass, $\vec{F}_{net,ext} = M\vec{a}_{cm}$.
**Interactive:** a two-mass slider — move the masses and their values, watch the centre-of-mass marker; toggle an external force and see the centre of mass accelerate, vs. an internal "explosion" that leaves it unmoved.
**Mastery evidence:** predict the centre-of-mass motion for an unfamiliar system under internal-only vs. net-external forcing; compute a two-mass centre of mass (Level 4).

### Lesson 2 — Forces and Free-Body Diagrams · C2.2 (CED topic 2.2)  *(built — approved 2026-09-01)*

**Progression:** forces as interactions → the contact forces of this course + the one field force → define the system; internal vs external → construct an FBD (both AP styles) → sum signed forces on one axis → resolve angled forces on two axes.
**Interactive:** an FBD builder (`js/lesson-interactives/fbd-builder.js`) — pick a scenario, toggle the forces and set directions, Canvas redraws the diagram, "Check" reports missing / mis-directed / doesn't-belong.
**Boundary:** single-object FBDs; connected systems deferred to Lesson 8; incline-aligned axes deferred to Lesson 10.
**Mastery evidence:** a complete, correct FBD and two-axis net force for an unfamiliar scenario with no forces named in the prompt (Level 5).
**Status:** `content/ap-physics-1/unit-2-dynamics/forces-and-free-body-diagrams.json` + the FBD items now in `data/question-bank/ap1-u2-forces-fbd.json` (`AP1-U2-MCQ-051…058`). **Approved 2026-09-01** (`docs/reviews/2026-09-01-unit-2-forces-fbd-review.md`).

### Lesson 3 — Newton's First Law, Inertia, and Equilibrium · Cluster 2.1  *(built — approved 2026-09-01)*

**Progression:** inertia as resistance to a change in velocity → inertial mass as its measure → the first law as the biconditional zero-net-force condition → static vs dynamic equilibrium, both with $\vec{a}=0$ → solve for an unknown force from $\sum F_x = \sum F_y = 0$, including angled forces → justify that equilibrium means balanced, not absent, forces.
**Cross-link:** explicitly forward-references Lesson 4's framing of equilibrium as the $\vec{F}_{net}=0$ case of the second law.
**Mastery evidence:** unfamiliar multi-force (angled) equilibrium solved end to end; a "does nothing" force correctly justified as nonzero (Level 5).

### Lesson 4 — Newton's Second Law: Force, Mass, and Acceleration · Clusters 2.3, 2.4  *(prototype lesson `ap1-u2-l3` — reference implementation; approved 2026-09-02)*

**Progression:** the verbal and symbolic statement → system/forces/net-force chain before the equation → solve for any one of $F_{net}$, $m$, $a$ → proportional reasoning through combined changes → $F$–$a$ and $F$–$m$ graphs, predicted before viewed → first law as the $\vec{F}_{net}=0$ special case → refute "motion needs a sustaining force."
**Interactive:** Formula Explorer (mass/acceleration sliders → force; $F$-vs-$a$ and $F$-vs-$m$ graphs) — already built.
**Simulation:** "Cart on a Track" with a prediction gate — already built.
**Mastery evidence:** predict both graph shapes correctly before viewing; solve an unfamiliar multi-force scenario (Level 4, stretch 6).
**Status:** built and verified. Its embedded questions have had `apIbConnection` stripped and `courses: ["ap-physics-1"]` added; its `objective` still needs setting to `2.3` (§12).

### Lesson 5 — Newton's Second Law: Multi-Force and Two-Axis Problems · Cluster 2.5  *(built — approved 2026-09-01)*

**Progression:** three-or-more-force FBDs on one axis → the perpendicular axis: $\sum F_y = 0$ gives the normal force → $\sum F_x = ma_x$ along the motion axis → work backward from a measured acceleration to an unknown force.
**Mastery evidence:** unfamiliar two-axis FBD solved for acceleration and an unknown force (Level 5).

### Lesson 6 — Newton's Third Law: Interaction Pairs vs Balanced Forces · Cluster 2.6  *(built — approved 2026-09-01)*

**Progression:** revisit force pairs already met in Lessons 2–5 (gravity/normal, pushes, tension) → identify the reaction to a stated action (type, magnitude, direction, **object**) → the pair acts on two different objects → contrast with balanced forces on one object, explicitly rejecting "weight and normal force are a third-law pair" → equal forces, unequal accelerations when masses differ.
**Rationale for placement:** students need several prior multi-force scenarios so the pair/balanced contrast (Misconceptions 8–10) has concrete cases to work from.
**Mastery evidence:** attribute every force in an unfamiliar two-object interaction; evaluate a flawed "equal and opposite $\Rightarrow$ equilibrium" argument (Level 5, stretch 8).
**Built as** `newtons-third-law.json` (`ap1-u2-n3l`, lessonNumber 6): 3 chunks (name the reaction · the pair acts on two objects · pair vs balanced forces + equal-force/unequal-acceleration); a new **Interaction-Pair Explorer** interactive (`interaction-pair-explorer` — 6 interactions + a book-on-table "balanced-forces trap" toggle); 3 hand-authored diagrams (`third-law/hand-crate.svg`, `pair-vs-balanced.svg`, `equal-force-unequal-accel.svg`); horse-and-cart error-analysis; bank `ap1-u2-third-law.json` (`AP1-U2-MCQ-077…082`).

### Lesson 7 — Friction: Static and Kinetic · Cluster 2.8  *(built — approved 2026-09-02)*

**Progression:** two friction regimes and their models ($f_k$ fixed once sliding; $f_s$ variable up to a maximum) → direction: opposing relative sliding *or its tendency* → compute $F_N$ first, then $f$, then Newton's second law → slide-or-stay decisions → qualitative reasoning about changing $\mu$, $F_N$, applied force.
**Boundary:** horizontal surfaces and simple applied-force cases here; the incline-plus-friction synthesis is Lesson 10.
**Mastery evidence:** unfamiliar slide/no-slide-plus-acceleration case (Level 5).
**Built as** `friction-static-and-kinetic.json` (`ap1-u2-fric`, lessonNumber 7): 3 chunks (two regimes + the friction-vs-applied graph · once sliding: $f_k$ and $a$ · slide-or-stay + change reasoning); a new **Friction Explorer** interactive (`friction-explorer`, on `PA.panel`) whose static-friction arrow grows to match the push then snaps to the shorter kinetic value at the $\mu_s F_N$ threshold; diagrams `friction/fbd-push-not-sliding.svg`, `fbd-sliding.svg`, hand-authored `friction-vs-applied.svg`; 4-part FRQ (incl. the stacked-mass twist); bank `ap1-u2-friction.json` (`AP1-U2-MCQ-083…088`).

### Lesson 8 — Connected Objects and Systems · Cluster 2.7  *(built — draft, 2026-09-02)*

**Progression:** the system method (linked objects as one mass; external forces only) → the individual-object method (one FBD, common $a$, solve for tension/contact force) → why rope tension $\ne$ hanging weight when $a\ne0$ → the ideal redirecting pulley (equal tension through a massless rope over a massless frictionless pulley).
**Built as** `connected-objects-and-systems.json` (`ap1-u2-connected`, lessonNumber 8, C2.7 / CED 2.5): 3 chunks (system method · individual-object method + reconcile · hanging masses / pulleys / $F_T = m(g-a)$ + Atwood); a new **Connected-Systems Explorer** (`connected-systems-explorer`, on `PA.panel` — table block + pulley + hanging block, solved both ways with the two tensions reconciled live); diagrams `connected/setup-table-pulley.svg`, `atwood.svg` (hand-authored) + `fbd-table-block.svg`, `fbd-hanging-block.svg` (generated); elevator/scale transfer FRQ + a 4-part table-and-pulley FRQ; bank `ap1-u2-connected.json` (`AP1-U2-MCQ-089…094`). `data/taxonomies.json` gained the two connected-systems misconception slugs (`tension-in-a-multi-object-string-system-must-support-the-whole-system`, `treats-heavier-hanging-mass-as-being-in-free-fall`).
**Prerequisites consumed:** Lesson 5 (two-axis), Lesson 6 (tension as an internal interaction pair).
**Mastery evidence:** unfamiliar two-body system solved both ways with reconciled results (Level 5).

### Lesson 9 — Gravitation, Springs, and Apparent Weight · Cluster 2.10

Delivered as one lesson with three chunked strands (they are independent; see §3).
**Strand A — Gravitation:** mass vs weight; $g$ vs $G$ → gravity as a center-of-mass-directed interaction → proportional reasoning with $F_G = G\,m_1 m_2 / r^2$, including inverse-square → solve for any one variable.
**Strand B — Springs:** spring force proportional to and opposite the displacement from natural length → $F_s = -kx$, stated and explained (why the negative sign; why $k>0$ always) → solve for $F_s$/$k$/$x$ → read $k$ from a force–extension graph's slope.
**Strand C — Apparent weight:** $F_N - mg = ma$ in the ground frame → scale readings in accelerating elevators → apparent weightlessness as $F_N=0$, not zero gravity.
**Interactive:** a force–extension graph explorer (slope $\to$ $k$; predict force at an untested displacement).
**Mastery evidence:** proportional $F_G$ reasoning for an unfamiliar pair; spring-force prediction from graph-read $k$; unfamiliar elevator apparent-weight problem (Level 5).

### Lesson 10 — Inclined Planes · Cluster 2.9  *(synthesis capstone)*

**Part A — Frictionless incline:** identify forces (weight vertical, normal perpendicular to the surface) → resolve weight into incline-parallel ($mg\sin\theta$) and incline-perpendicular ($mg\cos\theta$) components, with the trig assignment *justified* → normal force from perpendicular equilibrium; why $F_N < mg$ → net force and acceleration along the incline.
**Part B — Incline with friction:** add friction opposing the sliding tendency → net force and acceleration with the friction term → slide-or-stay on an incline.
**Transfer:** at least one far-transfer item where the incline framing is only recognizable through conceptual understanding (e.g. a banked road, an accelerating wedge, a block on a block).
**Mastery evidence:** full end-to-end solution for an unfamiliar angle/mass/friction condition (Level 6), plus a far-transfer variant (stretch 8).
**Interactive — DONE:** the shared **FBD builder** (`js/lesson-interactives/fbd-builder.js`, `componentKey: "fbd-builder"`) carries two 45° ramp scenarios — *block sliding down a frictionless ramp* (`forces: {gravity, normal}`) and *block sliding down a rough ramp at constant velocity* (`+ friction`). The box tilts to sit on the ramp; the ground is drawn in the box's own frame so contact forces (F_N ⟂, friction ∥) anchor exactly on the ramp surface and gravity from the centre; the ↖/↗ direction buttons align exactly with perpendicular/parallel. These are **live now** in Lessons 3 and 5 (which embed the same builder — Lesson 5's interactive prompt already says "Then try the ramp scenarios"). When Lesson 10 is authored it just reuses `componentKey: "fbd-builder"`. Contact-force tails on the box diagram now land on the actual surface for **every** scenario, diagonal ropes/pushes included (`edgeOffset()` — a ray/box-edge intersection).

### Lesson 11 — Circular Motion · C2.12 (CED topic 2.9)

**Confirmed in Unit 2** by the CED-verification pass (CED topic 2.9). A second application-of-Newton's-second-law synthesis, after inclines.
**Progression:** uniform circular motion — speed constant, velocity not → centripetal acceleration $a_c = v^2/r$ directed toward the centre → the net of the *real* forces (tension, friction, normal, gravity) provides it; "centripetal force" is **not** a separate FBD arrow (Misconception 13) → apply $\sum F_r = mv^2/r$ radially → limiting cases: a car on a flat curve losing traction, tension at the top vs. bottom of a vertical circle.
**Interactive:** a puck-on-a-string / car-on-a-curve simulation — vary $v$, $r$, $m$; show the velocity vector (tangent), the acceleration vector (radial), and the FBD's real forces, with a "break free" threshold when the required net force exceeds what the real forces can supply.
**Boundary:** uniform circular motion only; non-uniform (changing speed) and vertical-circle energy analysis are later-unit material.
**Mastery evidence:** identify the real centripetal-providing forces and solve $\sum F_r = mv^2/r$ for an unfamiliar scenario; reason through one limiting case (Level 5, stretch 8).

### Lesson 12 — Unit 2 Synthesis and Transfer

Not new content — a consolidation lesson and the on-ramp to the unit test bank.
**Force task:** an unfamiliar multi-force scenario (e.g. an object on a rough incline with an applied force at an angle) — system, FBD, net force, acceleration — integrating C2.2, C2.5, C2.8, C2.9.
**Interaction task:** an unfamiliar multi-object interaction — attribute all forces, distinguish any third-law pairs from any balanced forces — integrating C2.6 with C2.2.
**Circular task:** an unfamiliar circular-motion scenario — name the real forces, apply $\sum F_r = mv^2/r$, evaluate a limiting case — integrating C2.12 with C2.2.
**Spring/graph task:** an unfamiliar force–extension dataset — find $k$, predict a force or displacement for an untested value — integrating C2.10 with Unit 1 graph transfer.
**Interleaving note (`rigor-standard-addendum.md` §14):** items here and in the unit test bank must not be grouped by subtopic; the student decides which framework applies.

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
13. **"Centripetal force" is a separate force** to be added to a free-body diagram, rather than the name for the net (radially inward) sum of the *real* forces in circular motion. (CED topic 2.9 — Lesson 11.)
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
| Entry — conceptions | Concept inventory (§10), pre-instruction, retaken post | Score only (to the student); per-item misconception data kept for internal analytics | Internal pre/post $\langle g\rangle$; **no** student-facing profile or watch-list (§10.5) |
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

*Coverage rows for C2.11 (Lesson 1 → Lesson 12) and C2.12 (Lesson 11 → Lesson 12) follow the teaching order above.*

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

Every cluster is introduced once, practised in at least two modules, has a single certifying assessment, and reappears as transfer in Lesson 12. Clusters 2.2 and 2.5 (the FBD and two-axis spine) are practised in nearly every subsequent module by design.

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

Lesson-embedded formative checks keep their lesson-scoped ids (`ap1-u2-l3-q01`, etc.) and are **not** renamed — the unit bank and the lesson formative checks are different pools with different purposes (`master-project-prompt.md` §27). A `clusterId` field (`2.1`–`2.10`, the bare cluster number) is on every item so the bank can be filtered by cluster without parsing `objective`.

**Done 2026-09-01** (`build/migrations/2026-09-01-id-reindex.js`, idempotent): `ap1-u2-dynamics.json` `ap1-u2-l3-fpNN` → `AP1-U2-MCQ-001…050`; `ap1-u2-forces-fbd.json` `ap1-u2-l1-fpNN` → `AP1-U2-MCQ-051…058` (the FBD practice pool folds into the one MCQ sequence); `ap1-u2-dynamics-frq.json` `ap1-u2-frq-NN` → `AP1-U2-FRQ-001…015`. `furtherPracticeQuestionIds` in both lessons rewritten to match; `clusterId` added to all 81 bank items and the 23 lesson-embedded items and both lesson headers. `build/validate.js` checks `clusterId` agrees with `objective`.

### 9.3 Target composition

Item counts are targets for the stabilized Unit 2 bank, not a cap. *Predates the CED pass — add **C2.11 Systems & Center of Mass ≈ 8 MCQ** and **C2.12 Circular Motion ≈ 14 MCQ** (both with ≥1 FRQ), raising the MCQ total to ≈ 168, in the §12.11 pass.*

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

`frqType` stays a **course-neutral reasoning-mode** tag, not an exam-framework code. The existing bank uses six: `multi-part-quantitative`, `quantitative-qualitative-translation`, `graph-and-justify`, `error-analysis`, `experimental-design`, `paragraph-argument`. These map onto the **four verified AP Physics 1 Section II task models** (§0): Mathematical Routines, Translation Between Representations, Experimental Design and Analysis, Qualitative/Quantitative Translation — `multi-part-quantitative` ≈ Mathematical Routines, `graph-and-justify` ≈ Translation Between Representations, `experimental-design` ≈ Experimental Design and Analysis, `quantitative-qualitative-translation` ≈ Qualitative/Quantitative Translation; `error-analysis` and `paragraph-argument` are AP-relevant reasoning modes that appear *within* those FRQ types. The bank must hold enough of each to assemble a Section-II-shaped practice set — a **composition target**, checked at exam-assembly time, not a per-item tag. **The May 2027 exam changes the MCQ count and section timing** (§0); re-check before building a fixed practice exam (§12.9). The same six modes serve an IB practice set drawn from `courses`-tagged items.

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
| Timing | Before Lesson 1 (pre); optional re-take after Lesson 11 (post) | During/after each module; unit review | Before Module 1 | Throughout each lesson |
| Purpose | Reveal prior conceptions (to researchers); show the student only how much they moved, pre → post | Build & certify AP-exam readiness | Refresh Unit 1 carryover skills | Check the chunk just taught |
| Format | MC only, qualitative, **no calculator, no equation sheet, no numeric options** | MC + FRQ, quantitative and qualitative, calculator + sheet assumed | MC + short numeric | MC / multi-select / numeric / short response |
| Cognitive level | 1–3 (recognition, conceptual reasoning) | 1–8, majority 4–6 | 1–3 | 1–6 |
| Scored? | Score + percentage only, both pre and post; no per-question feedback ever | Yes | No — pointer back to Unit 1 | Yes, formatively |
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

### 10.3 Blueprint — AP Physics 1 Unit 2, 27 items

Item count is a proposal pending pilot item analysis (§10.5). Twenty-seven items sit comfortably in one ~30-minute untimed sitting; the FCI uses 30 for all of introductory mechanics, so a single unit needs fewer.

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
| 13 — "centripetal force" is a separate / outward force | 2 | ball on a string swung in a circle — which way does the string pull, and does a "centripetal force" belong on the FBD?; car rounding a curve |
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

**Feedback policy — decided 2026-09-01, and what the built version does:** the student is shown **only their score and percentage**. No per-question feedback, no "correct/incorrect", no review of answers, no per-misconception profile, no watch-list. The intro screen states plainly that **item analysis will not be provided** and that **the same check is taken again at the end of the unit**. The questions *and* the answer choices are shuffled on every load, so the end-of-unit retake cannot be gamed by memorised positions.

- **Pre:** linked at unit start (before Lesson 1), marked "take this first". Optional but strongly prompted (not a hard gate — §12.10). Untimed, ~20–30 minutes.
- **Post:** the same page, taken again after the final module. `js/concept-inventory.js` records every attempt's `{score, total, pct, at}` in `localStorage` (`pa:ci:<diagnosticKey>`), so the **normalized gain** $\langle g\rangle = \dfrac{\text{post}\% - \text{pre}\%}{100\% - \text{pre}\%}$ can be computed **internally** — it is **not** shown to the student.
- The earlier draft's per-misconception *profile* and *watch-list* (a "you reason like X here" report) are **retired for the student-facing version** per the feedback-policy decision. The per-misconception tags (`misconception`, `pairId`) are kept in the item data for future *internal* analytics only.
- **Item analysis before the form is fixed:** on pilot data, compute each item's difficulty (facility), discrimination (point-biserial), and distractor function. Cut or rewrite items with discrimination < 0.2 or a dead distractor. Only then freeze the form. This is *researcher-side* analysis, never surfaced to students.
- **Newtonian threshold:** FCI research treats ~60% as a common pre-instruction ceiling and ~85% as the coherent-Newtonian threshold. These are reference points from other populations and are **not** shown to students; use them only for internal calibration.

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

**Resolved by the CED-verification pass (2026-08-31):**

1. **Exam-framework tagging — RESOLVED.** The `apIbConnection` field is retired repository-wide, replaced by the `courses` reuse index (§1). Reasoning type lives in `skill`/`representation`/`cognitiveLevel`. Migration of the ~65 items and the prototype lesson is complete. Remaining sub-task: cross-tag genuinely shared items with IB values (§12.8).
2. **CED outcome mapping — RESOLVED.** All twelve clusters mapped to verified CED topics (§2 table). Confirmed: **Systems & Center of Mass is CED topic 2.1** (added as C2.11 / Module 1a); apparent weight, connected systems, and inclined planes are **CED-topic-2.5 applications**, not separate topics. Not done: transcribing LO/EK sub-codes (§0 — the CED PDF is the authority; this doc maps to topics).
3. **Circular-motion scope — RESOLVED.** Circular motion **is** in Unit 2 (CED topic 2.9). Added as C2.12 / Module 10; Synthesis moved to Module 11; Misconception 13 and the §10.3 diagnostic row are now unconditional.
4. **Equation-sheet values — RESOLVED.** $g = 9.8\ \mathrm{m/s^2}$, $G = 6.67\times10^{-11}$ (Table of Information, §0).

**Standard — before the corresponding module ships:**

5. **Pulley scope.** Confirm the single-ideal-redirect boundary in §1 is sufficient for AP Physics 1, or widen it.
6. **ID migration — RESOLVED 2026-09-01.** `build/migrations/2026-09-01-id-reindex.js` promoted `fp01–fp50` → `AP1-U2-MCQ-001…050`, the 8 FBD-practice items → `AP1-U2-MCQ-051…058`, `frq-01…15` → `AP1-U2-FRQ-001…015`; added `clusterId` everywhere; rewrote the two lessons' `furtherPracticeQuestionIds`. Prototype lesson `objective`/`cedTopic` set in the §12.15 pass (`C2.3` / `2.5`).
7. **Build-time validator scope — RESOLVED 2026-09-01.** `build/validate.js` runs first in every build and **aborts on error**. It enforces: controlled-vocabulary drift (`skill` / `representation` / `difficulty` / `courses` / `cognitiveLevel` must be in `taxonomies.json`); `courses` present and non-empty; `objective` in `C2.x` form with a real `cedTopic`; every MCQ distractor has a `feedback.incorrect` entry and the answer key is in range; FRQ parts have a prompt + (model response or figure) and `totalPoints` matches the part points; concept-inventory items are non-numeric and carry a `misconception`. (Human-judgement checks 1, 2, 6 are unchanged.)
8. **IB cross-listing.** When Unit 2 is stable, decide which clusters (Newton's laws, gravitation, friction, springs, equilibrium) get extracted into `content/shared-concepts/` with IB SL/HL assessment variants, and which stay AP-1-only.
9. **Unit exam form.** Whether the repository ships a fixed AP-style Unit 2 practice exam (fixed form) in addition to the filterable bank, and its blueprint (MCQ count, FRQ selection, timing).
10. **Concept-inventory feedback — RESOLVED 2026-09-01.** Score + percentage only, both administrations; no per-question feedback, no profile, no watch-list; students told item analysis is not provided and that they retake the same check at the end. Normalized gain is internal only. **Built** (`unit-2-concept-check.json` + `concept-inventory.html` + `js/concept-inventory.js`).
11. **Concept-inventory calibration.** The 27 items are a first draft — freeze the form only after pilot item analysis (facility, discrimination, distractor function) on this project's population.
12. **Concept-inventory gating + post entry point — PARTLY RESOLVED 2026-09-01.** A **unit index page** is built (`content/…/unit-2-index.json`, `format: "unit-index"` → `build/templates/unit-index.html`): it lays the unit out in order — Concept Check (pre) → the twelve modules with build status → Concept Check (post, same page) — and is linked as the unit heading on the homepage. Still open: whether the pre-check is ever a *hard* gate (currently strongly-prompted only).
13. **Diagnostic schema fields.** Confirm `data/taxonomies.json` and the `build/build.js` schema comment are extended with the concept-inventory item fields (`misconception`, `pairId`) and any new misconception slugs (§10.4) as part of the §12.7 validator work.
14. **May 2027 exam changes.** The MCQ count and section timing change for May 2027 (§0); the exact figures are not yet public. Re-check the CED before the §12.9 fixed practice exam is built, and before any lesson claims a specific MCQ count.

**Structural migrations (do together, one scripted pass):**

15. **`objective` re-tag + `cedTopic` field — RESOLVED 2026-09-01.** `build/migrations/2026-09-01-objective-cedtopic.js` re-tagged all 95 items (50 MCQ + 15 FRQ + 8 FBD-bank + 12 + 10 lesson-embedded) from bare `"2.N"` to `C2.N` and inserted a `cedTopic` field per the §2 map; C2.10 items were split per-item (springs → 2.8, apparent weight → 2.5, gravitation → 2.6). Both lessons also gained top-level `objective` (`C2.2`, `C2.3`) + `cedTopic` (`2.2`, `2.5`) and `newtons-second-law.json` a lesson-level `courses`. The build now **fails** on a bare-`2.N` objective, a missing `cedTopic`, or a `cedTopic` outside 2.1–2.9 (`build/validate.js`). Still open: the §12.6 ID re-index (`fp##` → `AP1-U2-MCQ-###`) and `clusterId` field — a separate pass.
16. **Module renumber — RESOLVED 2026-09-01.** §5 is renumbered to the student-facing teaching order (Lesson 1 = Systems/COM … Lesson 11 = Circular Motion, Lesson 12 = Synthesis), matching the `lessonNumber` field and the unit index page. Historical cross-references in §12.1–3 and the revision history that still say "Module N" are left as written.

---

## 13. Downstream implementation order

1. CED verification is **done** (§0, §12.1–4). Land the §9.7 build-time validator (checks 3–5, plus the §10.4 diagnostic constraints) and the §12.6 + §12.10 scripted migration (`objective` re-tag, `cedTopic` field, MCQ/FRQ re-index).
2. Bring the existing prototype lesson (`ap1-u2-l3`, Lesson 4) into full compliance: `objective` → `C2.3` + `cedTopic: "2.5"`, add lesson-level `courses`, confirm the §11 checklist. (`apIbConnection` stripped, `courses` added, F-vs-a scrubbed, FBD figures added — all done.)
3. Produce the Unit 2 concept-inventory diagnostic (§10) — 25 items to the §10.3 blueprint — before Lesson 2 ships. Freeze the form only after the §10.5 pilot item analysis.
4. Produce **Lesson 1 (Systems & Center of Mass)** then the spine: **Lesson 2 (FBDs) → Lesson 3 (First law) → Lesson 5 (Multi-force/two-axis) → Lesson 6 (Third law)**, each with its lesson and test-bank slice.
5. Produce **M6 (Friction) → M7 (Connected systems) → M8 (Gravitation/springs/apparent weight)**.
6. Produce **M9 (Inclined planes)** and **M10 (Circular Motion)** — the two Newton's-second-law synthesis modules.
7. Produce **M11 (Synthesis & transfer)** and assemble the interleaved unit cumulative assessment.
8. Expand the test bank to the §9.3 targets (add C2.11 and C2.12 rows); run every item through the §9.7 protocol.
9. Pilot the unit; calibrate the §7 mastery rule, the §9.4 difficulty distribution, and the §10.5 diagnostic thresholds against observed student performance; compute pre/post $\langle g\rangle$ on the concept inventory.
10. Retrospective: what in this architecture broke or bent under Unit 2? Fix it here before starting Unit 3, since every later unit inherits these structures.

---

## 14. Revision history

| Version | Date | Status | Summary |
|---|---|---|---|
| 0.9.8 | 2026-09-02 | Draft — for review | **Lesson 4 approved.** The reference implementation (`newtons-second-law.json`, `ap1-u2-l3`) `status` → approved; `unit-2-index.json` chip `reference` → `approved`. Unit 2 now has seven approved lessons (1–7) plus Lesson 8 in draft; only Lessons 9–12 remain to build. |
| 0.9.7 | 2026-09-02 | Draft — for review | **Lesson 8 built.** Connected Objects and Systems (C2.7 / CED 2.5) — `connected-objects-and-systems.json` (`ap1-u2-connected`): the system method → the individual-object method (isolate one block, common $a$, reconcile) → hanging masses, ideal pulleys, and $F_T = m(g-a) < mg$ while accelerating (+ Atwood). New **Connected-Systems Explorer** interactive (`connected-systems-explorer`, on `PA.panel`); hand-authored `connected/setup-table-pulley.svg` + `atwood.svg`, generated `connected/fbd-table-block.svg` + `fbd-hanging-block.svg`; bank `ap1-u2-friction.json`→`ap1-u2-connected.json` (`AP1-U2-MCQ-089…094`); two connected-systems misconception slugs added to `data/taxonomies.json`. Registered in `unit-2-index.json`. Also: the BASIS Unit 2 diagnostic card now forces `color-scheme: light` so its native radios/selects render correctly on the white card. |
| 0.9.6 | 2026-09-02 | Draft — for review | **Lesson 7 approved; BASIS Physics 8 reconciled with the site build/theme.** Lesson 7 review-round fixes: the friction-vs-applied graph is now a `"size": "lg"` figure (new opt-in `figure--lg` CSS, full row width, taller); a dot-FBD hint added to chunk-2's formative check; the Friction Explorer's `F_g`/`F_N` arrows now scale with the mass slider (were a fixed 44px regardless of mass); the error-analysis model response is now a real `1. 2. 3. 4.` list instead of inline "**(1)** …" prose. Lesson 7 `status` → approved. **BASIS Physics 8** (a second course now under `content/basis-physics-8/`, built by a parallel effort) reviewed and reconciled: homepage course/unit ordering was insertion-order (fixed — courses alphabetical, units by parsed "Unit N"); `unit-index.html` never loaded KaTeX (fixed — its new "Learning outcomes" clusters use math); the Founder-approved Unit 2 diagnostic (`format: "external-html"`) rendered as a bare unthemed page — now wrapped in the site header + dark shell via a new `build/templates/external-html.html` (source `<title>/<style>/<body>` extracted, its `body{}` rule retargeted to a `.external-html-card`; questions/JS/self-test untouched, presentation-only); 2 raw `\( … \)` LaTeX delimiters fixed. `build/validate.js`'s `objective`/`cedTopic` check is **generalized**: it used to hardcode `C2.x` and a `2.1–2.9` CED-topic whitelist (AP Unit 2 only); it now checks structurally — `C<unit>.<cluster>` must pair with a `<unit>.<topic>` `cedTopic` from the *same* unit number, so any unit of any course can adopt the scheme without editing the validator (verified: `C3.7`/`3.7` now validates, `C2.5`/`3.5` still correctly fails). `objective` itself stays optional, so courses that haven't adopted it (BASIS Physics 8 today) are unaffected. This was the main piece of the "stabilize as template" work flagged as deferred in v0.9.4 — resolved here. |
| 0.9.4 | 2026-09-01 | Draft — for review | **Lesson 7 built; Lessons 5 & 6 approved; shared interactive scaffold.** Lesson 7 — Friction: Static and Kinetic (C2.8 / CED 2.7) — `friction-static-and-kinetic.json` (`ap1-u2-fric`): 3 chunks, a new **Friction Explorer** (`friction-explorer`), 3 diagrams under `assets/diagrams/friction/`, a 4-part FRQ, bank `ap1-u2-friction.json` (`AP1-U2-MCQ-083…088`); registered in `unit-2-index.json`. **New `js/interactive-panel.js`** (`window.PA.panel` — `cssVar`, `arrow`, `register`) loaded on every lesson page; `fbd-builder`, `center-of-mass-explorer`, `interaction-pair-explorer`, `newtons-second-law-explorer` migrated onto it (behaviour unchanged, all six interactive pages re-verified); `friction-explorer` is built on it. Lessons 5 & 6 `status` → approved. |
| 0.9.3 | 2026-09-01 | Draft — for review | **Lesson 3 approved; review-round fixes; Step 5 resolved.** Lesson 3 (Newton's First Law) `status` → approved; unit-index chips for Lessons 1–3 → `approved` (new `.is-approved` green rule). **FBD builder** box diagram: contact-force tails now land on the actual surface for every scenario — `edgeOffset()` finds the ray/box-edge intersection so a diagonal rope or push anchors on the real face, not inside the box; on a ramp the ground is drawn in the box's own rotated frame so the box sits exactly on it and F_N/friction anchor on the ramp surface (gravity still from the centre); incline box nudged up so gravity's label fits. This resolves **Step 5** — the two ramp scenarios are correct and live in Lessons 3 & 5's shared builder. `fbd-three-forces.svg` `F_wind` tail moved to the box's right face; `dot-angled-rope.svg` `F_N` made collinear with (directly opposite) `F_g`; `third-law/equal-force-unequal-accel.svg` wheels sit on the road line. **Interaction-Pair Explorer** redrawn: thicker arrows with tail dots drawn clear of the bodies, force labels moved above each body (never over an arrow), `mode: "apart"|"together"` so gravity's pair points inward; trap view labels moved outside the "one object" box. |
| 0.9.2 | 2026-09-01 | Draft — for review | **Lesson 6 built; Lesson 5 figure-in-disclosure fixes.** Lesson 6 — Newton's Third Law: Interaction Pairs vs Balanced Forces (C2.6, CED 2.3) — `newtons-third-law.json` (`ap1-u2-n3l`): 3 chunks, a new **Interaction-Pair Explorer** (`interaction-pair-explorer` — 6 interactions + a book-on-table balanced-forces-trap toggle), 3 hand-authored diagrams under `assets/diagrams/third-law/`, horse-and-cart error analysis, bank `ap1-u2-third-law.json` (`AP1-U2-MCQ-077…082`); registered in `unit-2-index.json`. **Figures now render inside progressive-disclosure hints/solutions and error-analysis model responses** (`formativeCheck.hintFigures`/`solutionFigures`, `errorAnalysis[].modelFigures`; plumbed through `assessment.js`, `primitives.js`, `sections.js`, `lessons.css`). Lesson 5 fixes: `fbd-three-forces.svg` label spacing; `fbd-angled-pull-accel.svg` 30° arc moved to the tension's tail (`spec.angles[].at`); new `two-axis-method.svg` concept schematic + 4 dot FBDs (`multi-force/dot-*`); hint/solution figures wired onto q02/mc01/mc02/errorAnalysis/la01. Step 5 (ramp scenarios → Lesson 10) noted in §5 Lesson 10 as ready-to-embed, deferred until that lesson exists. |
| 0.9.1 | 2026-09-01 | Draft — for review | Follow-up fixes. FBD builder: `F_air` starts at the leading surface (not the centre); a lone force on an axis in the dot diagram now runs straight along that axis (no lateral nudge); the two ramp scenarios use a **45°** incline so the ↖/↗ direction buttons exactly match perpendicular/parallel; **spring-force scenarios added** (vertical spring; block + spring + rope on a rough table) so every force in the list is exercised. `fbd-svg.js` angle-mark labels sit clearer of a narrow wedge. `shallow-cables-scene.svg` θ label repositioned. GitHub Pages: confirmed the Actions `GITHUB_TOKEN` cannot switch the Pages source; workflow now reads an optional `PAGES_TOKEN` secret for that, and `docs/deploying-github-pages.md` leads with the one manual click. |
| 0.9.0 | 2026-09-01 | Draft — for review | **Lesson 5 built; Lesson 1 approved; FBD builder expanded.** Lesson 5 — Newton's Second Law: Multi-Force and Two-Axis Problems (C2.5) — `newtons-second-law-multi-force.json`: signed sums on one axis → $\sum F_\perp = 0$ (normal force) + $\sum F_\parallel = ma$ → working backward from a known $a$; 2 generated FBDs (three-forces, angled-pull with a 30° arc); bank `ap1-u2-multi-force.json` (`AP1-U2-MCQ-071…076`). **Lesson 1 approved.** The **FBD builder** gained an `Air resistance` force + 7 new scenarios (skydiver terminal speed, coffee filter, rising ball with drag, cruising car, box sliding to rest, and two **ramp** scenarios with a tilted-frame render + `↘ ↙` directions); `F_g` now starts at the exact box centre / dot edge. `fbd-svg.js` gained `angles` (angle arcs) and `label.lift` (friction labels clear of the surface). `mdToHtml` renders `1.` ordered lists as `<ol>`. Lesson-3 diagram fixes (bus wheels on the ground, rope label $F_T$, θ marks). |
| 0.8.0 | 2026-09-01 | Draft — for review | **Lesson 3 built; Lesson 2 + concept inventory approved; §5 renumbered.** Lesson 3 — Newton's First Law: Inertia and Equilibrium (C2.1) — authored as `newtons-first-law.json`: inertia/inertial mass → the first-law biconditional + static/dynamic equilibrium → solving $\sum F_x = \sum F_y = 0$ (angled forces, symmetry); reuses the FBD builder for the equilibrium check; 4 new SVGs (bus-brake + 3 generated FBDs); bank `ap1-u2-first-law.json` (`AP1-U2-MCQ-065…070`). **Lesson 2 (FBDs) and the FBD bank items are approved** (2026-09-01 review). §5 instructional sequence **renumbered to Lesson 1–12** (was Module 1a/1–11), matching `lessonNumber` and the unit index; §12.11/§12.16 resolved. Build fix: `$$…$$` display math was being collapsed to `$…$` by `String.replace` — build.js now fills templates with a replacer function. New render features: `chunk.conceptFigures`, `formativeCheck.figures` (a diagram with an MCQ/FRQ stem). New permanent rule (`master` §10): every calculation is **formula-first**. `pages.yml` `configure-pages` now sets `enablement: true` so the Pages source flips to "GitHub Actions" automatically; `docs/deploying-github-pages.md` added. |
| 0.7.0 | 2026-09-01 | Draft — for review | **Lesson 1 built; concept inventory approved; lesson numbers.** Module 1a — Systems and Center of Mass (C2.11) — authored as `systems-and-center-of-mass.json` (student-facing **Lesson 1**): 3 chunks, 3 worked examples, a new Canvas **Center-of-Mass Explorer** interactive (external push vs. internal explosion), 2 misconception items, an error-analysis task, a 3-part FRQ, 6 bank items (`AP1-U2-MCQ-059…064`), 2 diagrams. Every lesson now carries a required **`lessonNumber`** (teaching-order position, shown as "Lesson N"); the build fails without it; homepage + unit index ordered by it; unit name/module labels reconciled. The **concept inventory is approved** (physics review 2026-09-01) — `status` updated; its 27 items gained `objective`/`cedTopic`/`clusterId` (`build/migrations/2026-09-01-concept-inventory-tags.js`) and `taxonomies.json` gained a `misconception` vocab + the concept-inventory field list. `build/build.js` copies `CNAME` into `dist/` when present. |
| 0.6.0 | 2026-09-01 | Draft — for review | **ID re-index + diagram-label rule.** §12.6 resolved: `build/migrations/2026-09-01-id-reindex.js` promoted the seed bank ids to `AP1-U2-MCQ-001…058` / `AP1-U2-FRQ-001…015`, added `clusterId` to all 81 bank + 23 embedded items + both lesson headers, and rewrote `furtherPracticeQuestionIds`; `build/validate.js` now checks `clusterId` ↔ `objective`. New permanent rule in `master-project-prompt.md` §11: **no label may overlap the object, an arrow/curve, an axis, another label, or a gridline** — every diagram, drawing, and graph. The six FBD SVGs are now generated from specs by `build/gen-diagrams.js` + `build/render/fbd-svg.js`, which auto-places labels clear of everything and fits the viewBox; the FBD-builder canvas labels are shifted off their arrows the same way. |
| 0.5.0 | 2026-09-01 | Draft — for review | **Structural migrations + build enforcement.** §12.15 resolved: `build/migrations/2026-09-01-objective-cedtopic.js` re-tagged all 95 items to `C2.N` + added a `cedTopic` field (C2.10 split per-item); both lessons gained top-level `objective`/`cedTopic`/`courses`. §12.7 resolved: `build/validate.js` runs first in the build and aborts on controlled-vocabulary drift, empty `courses`, malformed `objective`/`cedTopic`, a distractor with no feedback, an inconsistent FRQ point total, or a numeric concept-inventory option. §12.12 partly resolved: a **unit index page** (`format: "unit-index"`) orders Concept Check (pre) → 12 modules with status → Concept Check (post) and heads the unit on the homepage; unit name standardised to "Force and Translational Dynamics". Also: the FBD SVGs and the FBD-builder interactive now follow the permanent free-body-diagram drawing rules (`master-project-prompt.md` §11 — contact forces from the surface, gravity from the centre, dot forces from the edge, relative lengths meaningful); lesson-check FRQ part (a) model response is now the box + dot diagram, inlined at build time via `parts[].figures`. |
| 0.1.0 | 2026-08-31 | Draft — for review | Initial AP Physics 1 Unit 2 architecture, modeled structurally on an external Grade-8 unit-architecture sample (governance/tutorial-sprint/diagnostic-routing apparatus deliberately dropped). Defines 10 internal outcome clusters / 44 sub-outcomes inheriting the existing question bank's `objective` numbering; dependency order with Forces & FBDs as the spine and Inclined Planes as the synthesis capstone; a cognitive-demand progression table mapped to `rigor-standard-addendum.md` §2 (replacing the sample's proprietary learning cycle); an 11-module instructional sequence on the `master-project-prompt.md` §4 lesson flow; 18 prioritized misconceptions (slugs reconciled to the existing bank); an assessment evidence contract; a full unit test-bank architecture (ID scheme, ~146 MCQ / ~30–36 FRQ targets, difficulty calibration, per-item requirements, review protocol); a per-unit **concept-inventory diagnostic** spec (§10) modeled on the Force Concept Inventory — 25 calculator-free qualitative items, misconception-mapped blueprint, forced-choice design rules, item-analysis and normalized-gain reporting; and an open-decisions register headed by CED verification. No content approved; CED references unverified. |
| 0.2.0 | 2026-08-31 | Draft — for review | Retired the per-item `apIbConnection` exam-framework tag repository-wide (it no longer matched College Board's current practice model and duplicated `skill`/`representation`/`cognitiveLevel`). Replaced it with a **`courses` reuse index** — `ap-physics-1` / `ap-physics-2` / `ib-physics-sl` / `ib-physics-hl` in `data/taxonomies.json` — on every question, lesson, and topic, so shared physics is authored once and filtered per course. Migrated all ~65 Unit 2 bank items and the prototype lesson's 12 embedded questions to `courses: ["ap-physics-1"]`; updated `master-project-prompt.md` §27 (both copies), `data/taxonomies.json`, and `build/build.js` (the lesson `apIbConnection` field → course-neutral `examConnection`; section renamed "Exam Connection"). Science-practice reconciliation (was §12.1) closed as resolved. Added a plain-language definition of "CED". No outcome, scope, sequencing, or difficulty change. |
| 0.4.0 | 2026-09-01 | Draft — for review | **Concept inventory built** (§10.5, §12.10) — `unit-2-concept-check.json` (27 items), `concept-inventory.html`, `js/concept-inventory.js`. Feedback policy decided and implemented: **score + percentage only**, both pre and post, no per-question feedback / profile / watch-list; students told item analysis is not provided and that they retake the same check at unit end; questions and options shuffled every load; attempts stored for internal $\langle g\rangle$. The earlier §10.5 profile/watch-list is retired for the student-facing version (per-misconception tags kept for internal analytics). §12 open decisions renumbered and de-duplicated. Also: lesson 2's Concept 1 forces table now renders (GFM pipe-table support in `js/markdown.js`); FRQ items now render (`js/assessment.js` `renderFreeResponse`); FBD builder rebuilt (box + dot, contact-point arrow starts, KaTeX labels, relative-length checks). |
| 0.3.0 | 2026-08-31 | Draft — for review | **CED verification pass** (§0) against AP Central and corroborating sources. Confirmed: Unit 2 = "Force and Translational Dynamics", 18–23%; the nine CED Unit 2 topics (2.1–2.9); three science practices; the four Section-II FRQ task models; $g=9.8$, $G=6.67\times10^{-11}$; the May 2027 MCQ-count/timing change (figures TBD). Every cluster now maps to a verified CED topic (§2 table); cluster IDs `C`-prefixed in the doc to stop collision with CED topic numbers (bank `objective` re-tag deferred to §12.10). Added two clusters for previously-uncovered CED topics: **C2.11 Systems & Center of Mass** (CED 2.1 → new Module 1a) and **C2.12 Circular Motion** (CED 2.9 → new Module 10, resolving the "optional" question; Synthesis → Module 11). 44 → 52 sub-outcomes. Open decisions 1–4 closed; two structural migrations (§12.10 `objective`/`cedTopic`, §12.11 module renumber) tracked. No physics or difficulty-scale change. |
