/**
 * Repo-relative path constants shared by the build script and its
 * render components. `build/render/paths.js` is three levels below the
 * repo root.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
export const CONTENT_DIR = path.join(ROOT, "content");
export const DIST_DIR = path.join(ROOT, "dist");
export const TEMPLATES_DIR = path.join(ROOT, "build", "templates");
export const QUESTION_BANK_DIR = path.join(ROOT, "data", "question-bank");
export const DIAGRAMS_DIR = path.join(ROOT, "assets", "diagrams");
