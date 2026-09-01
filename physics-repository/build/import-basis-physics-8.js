#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = process.argv[2] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const sourceRoot = path.join(repo, "resources", "physics8");
const outcomesRoot = path.join(sourceRoot, "resources");
const contentRoot = path.join(repo, "content", "basis-physics-8");
const bankRoot = path.join(repo, "data", "question-bank");

const units = [
  {
    number: 1,
    slug: "unit-1-graphing-dimensional-analysis",
    title: "Graphing and Dimensional Analysis",
    source: "resources/physics8/resources/unit1_graphing_and_dimensional_analysis_outcomes.md",
    outcomes: "unit1_graphing_and_dimensional_analysis_outcomes.md",
  },
  { number: 2, slug: "unit-2-kinematics", title: "Kinematics", source: "resources/physics8/resources/unit2_kinematics_outcomes.md", outcomes: "unit2_kinematics_outcomes.md", modules: ["Motion Language and Reference Frames", "Position-Time Graphs", "Velocity and Constant-Velocity Motion", "Velocity-Time Graphs", "Acceleration-Time Graphs", "Constant-Acceleration Equations", "One-Dimensional Free Fall", "SOHCAHTOA and Vector Components", "Synthesis and Transfer"] },
  { number: 3, slug: "unit-3-forces-newtons-laws", title: "Forces and Newton's Laws", source: "resources/physics8/resources/unit3_forces_newtonslaws_outcomes.md", outcomes: "unit3_forces_newtonslaws_outcomes.md", modules: ["Gravity", "Inertia and Newton's First Law", "Force Identification and Free-Body Diagrams", "Equilibrium", "Newton's Second Law", "Inclined Planes", "Newton's Third Law", "Hooke's Law and Springs", "Synthesis and Transfer"] },
  { number: 4, slug: "unit-4-energy", title: "Energy", source: "resources/physics8/resources/unit4_energy_outcomes.md", outcomes: "unit4_energy_outcomes.md" },
  { number: 5, slug: "unit-5-thermal-physics", title: "Thermal Physics", source: "resources/physics8/resources/unit5_thermal_physics_outcomes.md", outcomes: "unit5_thermal_physics_outcomes.md" },
  { number: 6, slug: "unit-6-momentum-collisions", title: "Momentum and Collisions", source: "resources/physics8/resources/unit6_momentum_collisions_outcomes.md", outcomes: "unit6_momentum_collisions_outcomes.md" },
  { number: 7, slug: "unit-7-waves-light", title: "Waves and Light", source: "resources/physics8/resources/unit7_waves_light_outcomes.md", outcomes: "unit7_waves_light_outcomes.md" },
  { number: 8, slug: "unit-8-electric-current-circuits", title: "Electric Current and Circuits", source: "resources/physics8/resources/unit8_electric_current_circuits_outcomes.md", outcomes: "unit8_electric_current_circuits_outcomes.md" },
];

function parseOutcomes(file) {
  const text = fs.readFileSync(path.join(outcomesRoot, file), "utf8");
  const sections = [];
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      current = { title: heading[1], outcomes: [] };
      sections.push(current);
      continue;
    }
    const bullet = line.match(/^-\s+(.+?)\s*$/);
    if (bullet && current) current.outcomes.push(bullet[1].replace(/^\*\*\*|\*\*\*$/g, ""));
  }
  return sections;
}

function kebab(value) {
  return value.toLowerCase().replace(/['’]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

for (const unit of units) {
  const sections = unit.outcomes ? parseOutcomes(unit.outcomes) : [];
  const modules = unit.modules || sections.map((s) => s.title);
  const outcomeCount = sections.reduce((sum, s) => sum + s.outcomes.length, 0);
  const sequence = [
    { type: "concept-check", phase: "pre", slug: unit.number === 2 ? "diagnostic/student/online-form" : null, title: `Unit ${unit.number} Entry Diagnostic`, status: unit.number === 2 ? "approved" : "planned", note: unit.number === 2 ? "Production v0.3.15 · 30 points · 25–30 minutes · Founder risk exception." : "Placeholder — no native diagnostic has been approved for this unit." },
    ...modules.map((title, i) => ({ type: "module", label: `Lesson ${i + 1}`, slug: unit.number === 2 && i === 0 ? "motion-language-reference-frames" : null, title, cluster: `BP8.${unit.number}.${i + 1}`, status: unit.number === 2 && i === 0 ? "approved" : "planned" })),
    { type: "concept-check", phase: "post", slug: null, title: `Unit ${unit.number} Concept Check — retake`, status: "planned", note: "Placeholder — to be activated only after the corresponding diagnostic is converted and reviewed." },
  ];
  const introParts = [
    `**${unit.title}** is part of the BASIS Physics 8 course map.`,
    outcomeCount ? `The source defines **${outcomeCount} learning outcomes** across **${sections.length} topic clusters**.` : unit.note,
    `Source: \`${unit.source}\`. Lessons and concept checks below are architectural placeholders; a non-null slug will indicate that a native interactive page has been built.`,
  ];
  writeJson(path.join(contentRoot, unit.slug, `unit-${unit.number}-index.json`), {
    format: "unit-index",
    id: `basis-p8-u${unit.number}-index`,
    slug: `unit-${unit.number}-index`,
    course: "BASIS Physics 8",
    courses: ["basis-physics-8"],
    unit: `Unit ${unit.number}: ${unit.title}`,
    lessonTitle: `Unit ${unit.number} · ${unit.title}`,
    source: unit.source,
    outcomeClusters: sections,
    intro: introParts.filter(Boolean).join("\n\n"),
    sequence,
  });
}

const diagnosticSource = path.join(sourceRoot, "rescue_sprint", "unit_02_kinematics", "diagnostics", "packages", "unit_02_knowledge_gap_diagnostic_v0.3.15");
const diagnosticTarget = path.join(contentRoot, "unit-2-kinematics", "diagnostic");
fs.mkdirSync(path.join(diagnosticTarget, "student"), { recursive: true });
fs.copyFileSync(path.join(diagnosticSource, "student", "online_form.html"), path.join(diagnosticTarget, "student", "online-form.source.html"));
fs.cpSync(path.join(diagnosticSource, "assets"), path.join(diagnosticTarget, "assets"), { recursive: true });
writeJson(path.join(diagnosticTarget, "student", "online-form.json"), {
  format: "external-html",
  id: "basis-p8-u2-entry-diagnostic",
  slug: "online-form",
  course: "BASIS Physics 8",
  courses: ["basis-physics-8"],
  unit: "Unit 2: Kinematics",
  lessonTitle: "Unit 2 Kinematics — Knowledge-Gap Diagnostic",
  sourceFile: "content/basis-physics-8/unit-2-kinematics/diagnostic/student/online-form.source.html",
  assetDirectory: {
    source: "content/basis-physics-8/unit-2-kinematics/diagnostic/assets",
    destination: "../assets"
  },
  sourceStatus: "Approved for production deployment by Founder risk exception",
  sourceVersion: "0.3.15",
  points: 30,
  targetMinutes: "25–30",
  note: "Tracked, deployable copy of the validated source form; no answer key is embedded."
});

const lessonAssetSource = path.join(sourceRoot, "rescue_sprint", "unit_02_kinematics", "lessons", "materials", "module_01", "assets", "number_line.svg");
const lessonAssetTarget = path.join(repo, "assets", "diagrams", "basis-physics-8", "unit-2", "motion-language-reference-frames");
fs.mkdirSync(lessonAssetTarget, { recursive: true });
fs.copyFileSync(lessonAssetSource, path.join(lessonAssetTarget, "number-line.svg"));

const lessonCourses = ["basis-physics-8"];
const feedback = (correct, incorrect) => ({ correct, incorrect });
writeJson(path.join(contentRoot, "unit-2-kinematics", "motion-language-reference-frames.json"), {
  id: "basis-p8-u2-l1",
  slug: "motion-language-reference-frames",
  course: "BASIS Physics 8",
  courses: lessonCourses,
  unit: "Unit 2: Kinematics",
  topic: "Motion foundations",
  lessonTitle: "Motion Language and Reference Frames",
  lessonNumber: "1",
  status: "approved",
  sourceDocument: "resources/physics8/rescue_sprint/unit_02_kinematics/lessons/module_01_motion_language_and_reference_frames.md",
  sourceApproval: "Founder-approved under DEC-040",
  prerequisites: ["None — this lesson establishes the vocabulary and reference-frame conventions used throughout Unit 2."],
  majorObjective: "Distinguish scalar and vector quantities, establish a reference frame, and calculate distance and signed displacement for one-dimensional journeys.",
  subObjectives: [
    "Classify physical quantities as scalars or vectors using magnitude and direction.",
    "Declare an origin and positive direction before assigning signed positions.",
    "Distinguish total path length from signed change in position.",
    "Calculate displacement using $\\Delta x=x_f-x_i$ and explain a zero-displacement round trip."
  ],
  hook: {
    prompt: "A runner completes one full lap and stops exactly where they started. Which statement is defensible?",
    choices: ["The runner traveled zero distance.", "The runner's displacement is zero even though the distance is not.", "Both distance and displacement must be the lap length.", "Displacement cannot be discussed without knowing the runner's speed."],
    correctIndex: 1
  },
  priorKnowledge: "No physics prerequisite is assumed. This lesson establishes the controlled notation $x_i$, $x_f$, and $\\Delta x$, with a declared origin and positive direction.",
  chunks: [
    {
      id: "chunk-1",
      title: "Scalars, vectors, and reference frames",
      concept: "A **scalar** has magnitude only. A **vector** has magnitude and direction. Distance, speed, time, mass, and temperature are scalars; displacement, velocity, and acceleration are vectors. In one dimension, a sign records direction only after an origin and positive direction have been declared.",
      representation: "Build every one-dimensional model in this order:\n1. Choose an origin.\n2. Declare the positive direction.\n3. Mark signed positions.\n4. Keep that convention fixed for the entire problem.",
      conceptFigures: [{ svg: "basis-physics-8/unit-2/motion-language-reference-frames/number-line.svg", caption: "A reusable one-dimensional reference frame with a fixed origin and positive direction." }],
      workedExample: {
        scaffold: "full",
        problem: "A cart is described as 6 m left of a door. Construct one valid reference frame and state the cart's signed position.",
        phases: [
          { label: "Declare the frame", steps: ["Choose the door as $x=0$ and declare right as positive."] },
          { label: "Translate the description", steps: ["Left is the negative direction in this frame, so the cart is at $x=-6\\ \\mathrm{m}$."] },
          { label: "Check consistency", steps: ["A left-positive frame would instead give $x=+6\\ \\mathrm{m}$; either is valid if declared and used consistently."] }
        ],
        keyMove: "The sign comes from the declared coordinate direction, not from the object itself."
      },
      formativeCheck: {
        id: "BP8-U2-L1-FC-001",
        courses: lessonCourses,
        type: "multiple-choice",
        skill: "identify-principle",
        representation: "verbal",
        difficulty: "foundation",
        cognitiveLevel: 2,
        question: "Which list contains only vector quantities?",
        choices: ["displacement, velocity, acceleration", "distance, velocity, time", "speed, displacement, acceleration", "distance, speed, position magnitude"],
        correctAnswer: 0,
        feedback: feedback("Correct — every quantity in the list requires both magnitude and direction.", { 1: "Distance and time are scalars.", 2: "Speed is a scalar.", 3: "All three quantities are scalars as written." })
      }
    },
    {
      id: "chunk-2",
      title: "Position, distance, and displacement",
      concept: "**Position** is a signed location in the chosen frame. **Distance** is total path length and is always nonnegative. **Displacement** is the signed change from initial to final position: $$\\Delta x=x_f-x_i$$ A reversal increases distance but can reduce the magnitude of displacement. A round trip has nonzero distance and zero displacement.",
      representation: "Track distance by adding the magnitude of every path segment. Track displacement by ignoring intermediate stops and subtracting the initial position from the final position.",
      workedExample: {
        scaffold: "full",
        problem: "A student starts at $x_i=+2\\ \\mathrm{m}$, walks to $+8\\ \\mathrm{m}$, then back to $x_f=+5\\ \\mathrm{m}$. Find distance and displacement.",
        phases: [
          { label: "Distance", steps: ["First leg: $|8-2|=6\\ \\mathrm{m}$.", "Second leg: $|5-8|=3\\ \\mathrm{m}$.", "Total distance: $6+3=9\\ \\mathrm{m}$."] },
          { label: "Displacement", steps: ["Use only the endpoints: $\\Delta x=x_f-x_i=5-2=+3\\ \\mathrm{m}$."] },
          { label: "Interpret", steps: ["The positive displacement means the final position is 3 m in the positive direction from the starting position."] }
        ],
        keyMove: "Distance follows the path; displacement compares only the endpoints."
      },
      formativeCheck: {
        id: "BP8-U2-L1-FC-002",
        courses: lessonCourses,
        type: "multiple-choice",
        skill: "construct-model",
        representation: "numerical",
        difficulty: "developing",
        cognitiveLevel: 3,
        question: "Take east as positive. A cyclist starts at $x_i=-4\\ \\mathrm{m}$, rides to $+11\\ \\mathrm{m}$, then returns to $x_f=+2\\ \\mathrm{m}$. Which pair gives distance and displacement?",
        choices: ["distance $24\\ \\mathrm{m}$; displacement $+6\\ \\mathrm{m}$", "distance $6\\ \\mathrm{m}$; displacement $24\\ \\mathrm{m}$", "distance $24\\ \\mathrm{m}$; displacement $-6\\ \\mathrm{m}$", "distance $15\\ \\mathrm{m}$; displacement $+2\\ \\mathrm{m}$"],
        correctAnswer: 0,
        feedback: feedback("Correct — the path is $15+9=24\\ \\mathrm{m}$, while $\\Delta x=2-(-4)=+6\\ \\mathrm{m}$.", { 1: "This swaps total path length and endpoint change.", 2: "The distance is correct, but the displacement sign conflicts with the east-positive frame.", 3: "This uses only part of the journey and reports the final position instead of displacement." })
      }
    }
  ],
  misconceptions: [{
    id: "BP8-U2-L1-MC-001",
    courses: lessonCourses,
    type: "multiple-choice",
    skill: "misconception-diagnosis",
    representation: "verbal",
    difficulty: "developing",
    cognitiveLevel: 3,
    question: "A robot makes a round trip and returns to its starting position. Which statement is correct?",
    choices: ["Both distance and displacement are zero.", "Distance is nonzero and displacement is zero.", "Distance is zero and displacement is nonzero.", "Distance and displacement must have equal nonzero values."],
    correctAnswer: 1,
    feedback: feedback("Correct — the robot accumulated path length but had no net change in position.", { 0: "Returning to the start makes displacement zero, not the path length.", 2: "Distance cannot be zero if motion occurred.", 3: "Reversing direction makes distance exceed displacement magnitude." })
  }],
  representationConnections: "A verbal journey becomes a number-line model; the model fixes signed positions; those positions support separate calculations of distance and displacement.",
  lessonAssessment: [{
    id: "BP8-U2-L1-LA-001",
    courses: lessonCourses,
    type: "multiple-choice",
    skill: "transfer",
    representation: "numerical",
    difficulty: "developing",
    cognitiveLevel: 4,
    question: "A robot starts at $+3\\ \\mathrm{m}$, travels to $-5\\ \\mathrm{m}$, then to $+8\\ \\mathrm{m}$. Which result is correct?",
    choices: ["distance $21\\ \\mathrm{m}$; displacement $+5\\ \\mathrm{m}$", "distance $5\\ \\mathrm{m}$; displacement $21\\ \\mathrm{m}$", "distance $21\\ \\mathrm{m}$; displacement $-5\\ \\mathrm{m}$", "distance $13\\ \\mathrm{m}$; displacement $+8\\ \\mathrm{m}$"],
    correctAnswer: 0,
    feedback: feedback("Correct — distance is $8+13=21\\ \\mathrm{m}$ and displacement is $8-3=+5\\ \\mathrm{m}$.", { 1: "This swaps path length and endpoint change.", 2: "The displacement sign is inconsistent with the final position relative to the start.", 3: "This omits the first path segment and uses final position as displacement." })
  }],
  examConnection: "This lesson establishes the signed-position and vector language required for every later kinematics representation and calculation.",
  summary: "Declare a reference frame before using signs. Scalars have magnitude only; vectors have magnitude and direction. Distance accumulates the path, while displacement is $x_f-x_i$.",
  exitQuestion: {
    id: "BP8-U2-L1-EXIT-001",
    courses: lessonCourses,
    type: "multiple-choice",
    skill: "justify-with-principle",
    representation: "verbal",
    difficulty: "developing",
    cognitiveLevel: 3,
    question: "Two observers use different origins but the same positive direction for the same journey. What must agree?",
    choices: ["Every signed position", "The calculated displacement", "The initial-position number", "The final-position number"],
    correctAnswer: 1,
    feedback: feedback("Correct — translating the origin changes both endpoint coordinates equally, so their difference is unchanged.", { 0: "Positions depend on the chosen origin.", 2: "The initial coordinate changes when the origin changes.", 3: "The final coordinate also changes when the origin changes." })
  },
  needsPlotly: false
});

const bankUnits = [
  { number: 2, sourceSlug: "unit_02_kinematics", name: "Kinematics" },
  { number: 3, sourceSlug: "unit_03_forces", name: "Forces and Newton's Laws" },
  { number: 4, sourceSlug: "unit_04_energy", name: "Energy" },
];

const catalog = {
  id: "basis-p8-test-bank-index",
  course: "BASIS Physics 8",
  courseId: "basis-physics-8",
  status: "source-indexed",
  note: "These are recalibrated provenance manifests for the approved/proposed Markdown source banks. They are not native interactive question-bank arrays.",
  units: [],
};

for (const unit of bankUnits) {
  const sourceRel = path.join("resources", "physics8", "rescue_sprint", unit.sourceSlug, "test_bank", "index", `${unit.sourceSlug}_test_bank_index.json`);
  const source = JSON.parse(fs.readFileSync(path.join(repo, sourceRel), "utf8"));
  const convert = (entry, state = "active") => ({
    id: String(entry.id).replace(/^U(\d+)-/, "BP8-U$1-"),
    sourceId: entry.id,
    state,
    type: entry.type || (String(entry.id).includes("FRQ") ? "FRQ" : "MCQ"),
    cluster: entry.cluster || null,
    outcomes: entry.outcomes || entry.outcome || [],
    difficulty: entry.difficulty || null,
    points: entry.points ?? null,
    answer: entry.answer ?? null,
    asset: entry.asset ?? null,
    sourceFile: path.posix.join("resources/physics8/rescue_sprint", unit.sourceSlug, "test_bank", entry.file || ""),
    ...(entry.retired ? { retired: entry.retired, reason: entry.reason || null, supersededBy: entry.supersededBy ? String(entry.supersededBy).replace(/^U(\d+)-/, "BP8-U$1-") : null } : {}),
  });
  const active = [...(source.mcq || []).map((e) => convert(e)), ...(source.frq || []).map((e) => convert(e))];
  const retired = (source.retired || []).map((e) => convert(e, "retired"));
  const manifest = {
    id: `basis-p8-u${unit.number}-test-bank-index`,
    course: "BASIS Physics 8",
    courseId: "basis-physics-8",
    unit: `Unit ${unit.number}: ${unit.name}`,
    sourceIndex: sourceRel.split(path.sep).join("/"),
    generatedFromSourceAt: source.generatedAt || null,
    counts: { mcq: source.mcqCount || 0, frq: source.frqCount || 0, active: active.length, retired: retired.length, totalRecords: active.length + retired.length },
    entries: [...active, ...retired],
  };
  const filename = `basis-p8-u${unit.number}-${kebab(unit.name)}-index.json`;
  writeJson(path.join(bankRoot, filename), manifest);
  catalog.units.push({ unit: unit.number, name: unit.name, indexFile: filename, ...manifest.counts });
}
catalog.totals = catalog.units.reduce((a, u) => ({ mcq: a.mcq + u.mcq, frq: a.frq + u.frq, active: a.active + u.active, retired: a.retired + u.retired, totalRecords: a.totalRecords + u.totalRecords }), { mcq: 0, frq: 0, active: 0, retired: 0, totalRecords: 0 });
writeJson(path.join(bankRoot, "basis-p8-test-bank-index.json"), catalog);

const readme = `# BASIS Physics 8\n\n**Course ID:** \`basis-physics-8\`  \n**Integration status:** Draft architecture with source-backed unit maps and test-bank manifests\n\nThis course mirrors the AP Physics 1 repository's course/unit-index architecture without copying AP-specific standards or claims. Unit maps are generated from the authoritative files under \`resources/physics8\`. A null lesson slug means the page is a planned placeholder, not a built lesson.\n\n## Course map\n\n${units.map((u) => `- Unit ${u.number}: ${u.title} — \`${u.slug}/unit-${u.number}-index.json\``).join("\n")}\n\n## Source coverage\n\n- Units 1–8 include source-backed outcome clusters from dedicated Markdown files; the Unit 1 source heading says \"Unit 9\" and is normalized here to the academy's established Unit 1 sequence.\n- Unit 2 includes its approved production diagnostic and a native interactive Lesson 1.\n- Units 2–3 include developed lesson-source Markdown and 300 indexed assessment items each.\n- Unit 4 includes 300 active indexed assessment items plus 29 retired records.\n- Units 5–8 currently have outcomes only; their lessons and assessments remain planned.\n\n## Test-bank boundary\n\nThe files \`data/question-bank/basis-p8-*-index.json\` are provenance manifests. They recalibrate the source IDs from \`U#-*\` to the course-scoped \`BP8-U#-*\` namespace while retaining \`sourceId\`. They do not claim that the Markdown questions have been converted to the site's native interactive question schema.\n`;
fs.writeFileSync(path.join(contentRoot, "README.md"), readme);

console.log(JSON.stringify({ course: "basis-physics-8", units: units.length, testBank: catalog.totals }, null, 2));
