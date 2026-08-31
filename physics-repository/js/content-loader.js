/**
 * Reads the lesson JSON the build script embedded in the page (see
 * build/build.js) and exposes it to every other browser script. On a
 * page the build script generated, a <script type="application/json"
 * id="lesson-data"> tag holds the full lesson object — no runtime
 * fetch needed, which keeps the page usable the instant HTML parses
 * (matters for §29 performance on slow school Wi-Fi) and means the
 * page works even opened directly from disk (file://), with no server.
 *
 * Plain script, not an ES module: browsers refuse to fetch module
 * scripts over file://, and this site is meant to also work when a
 * teacher just double-clicks the HTML file. Every browser-side script
 * in this project follows the same pattern — attach to the shared
 * `window.PA` namespace instead of import/export — and lesson.html
 * loads them in dependency order with plain <script> tags.
 */
window.PA = window.PA || {};

(function () {
  let cachedLessonData = null;

  function getLessonData() {
    if (cachedLessonData) return cachedLessonData;

    const script = document.getElementById("lesson-data");
    if (!script) {
      console.warn("[content-loader] No embedded #lesson-data script found on this page.");
      return null;
    }

    try {
      cachedLessonData = JSON.parse(script.textContent);
      return cachedLessonData;
    } catch (err) {
      console.error("[content-loader] Failed to parse embedded lesson data:", err);
      return null;
    }
  }

  /**
   * Fetches a question-bank file by unit id, e.g. "ap-physics-1/unit-2".
   * Used for Further Practice and future retrieval/review features that
   * need questions beyond what's embedded in the current lesson. Note
   * this one function DOES need a server (fetch can't read file://
   * paths in most browsers either) — it's for future use, not called
   * by anything on the page today.
   * @param {string} unitPath
   * @returns {Promise<Array>}
   */
  async function fetchQuestionBank(unitPath) {
    const res = await fetch(`/data/question-bank/${unitPath}.json`);
    if (!res.ok) {
      throw new Error(`[content-loader] Could not load question bank: ${unitPath}`);
    }
    return res.json();
  }

  window.PA.contentLoader = { getLessonData, fetchQuestionBank };
})();
