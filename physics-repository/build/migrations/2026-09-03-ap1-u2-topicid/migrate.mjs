// Additive migration: stamp topicId "newtonian-dynamics" on every AP Physics 1
// Unit 2 bank item. Surgical text insert that preserves each file's original
// formatting — inserts a "topicId" line immediately after the item's "course"
// field. Idempotent (skips files that already contain the topicId).
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const BANK = fileURLToPath(new URL("../../../data/question-bank/", import.meta.url));
const TOPIC = "newtonian-dynamics";
let files = 0, inserts = 0;

for (const f of fs.readdirSync(BANK).filter((x) => /^ap1-u2-.*\.json$/.test(x))) {
  const p = path.join(BANK, f);
  let text = fs.readFileSync(p, "utf8");
  if (text.includes(`"topicId": "${TOPIC}"`)) { console.log(`${f}: already has topicId, skipped`); continue; }
  // After every `"course": "...",` line (item-level), add a topicId line with the same indent.
  let n = 0;
  text = text.replace(/^(\s*)"course":\s*"[^"]*",\n/gm, (m, indent) => {
    n++;
    return `${m}${indent}"topicId": "${TOPIC}",\n`;
  });
  // sanity: file must still parse
  const parsed = JSON.parse(text);
  const arr = Array.isArray(parsed) ? parsed : parsed.items || parsed.questions || [];
  const tagged = arr.filter((q) => q.topicId === TOPIC).length;
  if (tagged !== arr.length) { console.error(`${f}: tagged ${tagged}/${arr.length} — NOT written`); continue; }
  fs.writeFileSync(p, text);
  files++; inserts += n;
  console.log(`${f}: ${n} topicId line(s) inserted (${arr.length} items)`);
}
console.log(`\n${files} files, ${inserts} inserts.`);
