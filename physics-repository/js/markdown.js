/**
 * Single shared implementation of the tiny Markdown subset used across
 * lesson content. Imported by both the Node build script (build/build.js)
 * and the browser (js/assessment.js), so authored emphasis renders
 * identically whether it was baked in at build time or inserted by JS
 * at runtime (quiz feedback, hints).
 *
 * Supported syntax, deliberately minimal:
 *   **bold**              -> <strong>
 *   *italic*               -> <em>
 *   ==highlighted==         -> <mark class="term-highlight"> (background highlight)
 *   [[key term]]            -> <span class="key-term"> (slightly larger, for first-use vocabulary)
 *   `code`                  -> <code>
 * Inline $...$ / $$...$$ math is left untouched for KaTeX auto-render.
 *
 * Use ==...== to flag a critical relationship or warning worth a visual
 * flag ("the net force, not just one applied force"). Use [[...]] the
 * first time a lesson introduces a term a student needs to recognize by
 * name later (impulse, free-body diagram, Newton's second law). Don't
 * stack them — pick the one that matches why the phrase matters.
 */

/** Escapes and converts a single line/phrase (no paragraph wrapping). */
export function mdInline(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/==(.+?)==/g, '<mark class="term-highlight">$1</mark>')
    .replace(/\[\[(.+?)\]\]/g, '<span class="key-term">$1</span>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    // Undo escaping inside math delimiters so KaTeX still sees raw LaTeX
    // (e.g. \langle, comparisons inside \text{}).
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** Split one pipe-table row into trimmed cell strings, dropping the
 * empty cells that a leading / trailing `|` produces. */
function tableCells(line) {
  const cells = line.split("|").map((c) => c.trim());
  if (cells.length && cells[0] === "") cells.shift();
  if (cells.length && cells[cells.length - 1] === "") cells.pop();
  return cells;
}

/** A GFM-style pipe table: header row, a `|---|---|` separator row
 * (dashes / colons / pipes / spaces only), then body rows. */
function renderTable(lines) {
  const header = tableCells(lines[0]);
  const rows = lines.slice(2).map(tableCells);
  const thead = `<thead><tr>${header.map((c) => `<th>${mdInline(c)}</th>`).join("")}</tr></thead>`;
  const tbody = rows
    .map(
      (r) =>
        `<tr>${header.map((_, i) => `<td>${mdInline(r[i] ?? "")}</td>`).join("")}</tr>`
    )
    .join("");
  return `<div class="md-table-wrap"><table class="md-table">${thead}<tbody>${tbody}</tbody></table></div>`;
}

/**
 * Converts a blank-line-separated block of Markdown into <p> paragraphs.
 * Two richer block forms are supported: a block where every line starts
 * with "- " becomes a <ul class="md-list">, and a GFM pipe table (header
 * row + `|---|` separator + rows) becomes a <table class="md-table">.
 * Keep authoring to paragraphs, this list form, and small tables.
 */
export function mdToHtml(md) {
  if (!md) return "";
  return md
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      if (!lines.length) return "";

      const isTable =
        lines.length >= 2 &&
        lines[0].includes("|") &&
        /^\|?[\s:|-]*-[\s:|-]*\|?$/.test(lines[1]) &&
        lines[1].includes("|");
      if (isTable) return renderTable(lines);

      const isList = lines.every((l) => l.startsWith("- "));
      if (isList) {
        const items = lines.map((l) => `<li>${mdInline(l.slice(2))}</li>`).join("\n");
        return `<ul class="md-list">${items}</ul>`;
      }

      return `<p>${mdInline(block)}</p>`;
    })
    .join("\n");
}
