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

/**
 * Converts a blank-line-separated block of Markdown into <p> paragraphs
 * — except a block where every line starts with "- ", which becomes a
 * <ul class="md-list"> instead (styled in css/base.css). This is the
 * only block-level construct beyond paragraphs; keep content authoring
 * to paragraphs and this one list form rather than reaching for
 * anything richer.
 */
export function mdToHtml(md) {
  if (!md) return "";
  return md
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      const isList = lines.length > 0 && lines.every((l) => l.startsWith("- "));
      if (isList) {
        const items = lines.map((l) => `<li>${mdInline(l.slice(2))}</li>`).join("\n");
        return `<ul class="md-list">${items}</ul>`;
      }
      return `<p>${mdInline(block)}</p>`;
    })
    .join("\n");
}
