#!/usr/bin/env node
/**
 * Minimal zero-dependency static file server for previewing dist/ locally.
 * Exists because lesson pages use `<script type="module">`, and browsers
 * refuse cross-file module imports under the file:// protocol (a CORS
 * restriction, not a bug in this project) — opening dist/index.html
 * directly by double-clicking it will NOT run any lesson's interactive
 * quizzes. Always preview through this server (or any local static
 * server) instead.
 *
 * Run: node build/serve.js  (or: npm run serve, which builds first)
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, "dist");
const PORT = process.env.PORT ? Number(process.env.PORT) : 4173;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

if (!fs.existsSync(DIST_DIR)) {
  console.error(`[serve] dist/ not found. Run "npm run build" first.`);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath.endsWith("/")) urlPath += "index.html";

  const filePath = path.join(DIST_DIR, urlPath);
  // Refuse to serve outside dist/ (basic path traversal guard).
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end(`Not found: ${urlPath}`);
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`[serve] http://localhost:${PORT}/`);
  console.log(`[serve] Ctrl+C to stop.`);
});
