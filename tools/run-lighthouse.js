#!/usr/bin/env node

const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = process.cwd();
const reportsDir = path.join(rootDir, "reports", "lighthouse");
const lighthouseCli = path.join(rootDir, "node_modules", "lighthouse", "cli", "index.js");
const baseUrl = process.env.LIGHTHOUSE_BASE_URL || "http://127.0.0.1:3000";
const pages = [
  ["home", "/"],
  ["services", "/services.html"],
  ["packages", "/packages.html"],
  ["portfolio", "/portfolio.html"],
  ["about", "/about.html"],
  ["faq", "/faq.html"],
  ["contact", "/contact.html"],
  ["privacy", "/privacy.html"],
  ["terms", "/terms.html"]
];
const chromeFlags = [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--remote-debugging-address=127.0.0.1"
].join(" ");

if (!fs.existsSync(lighthouseCli)) {
  console.error("Local Lighthouse package not found. Run `npm install` first.");
  process.exit(1);
}

fs.mkdirSync(reportsDir, { recursive: true });
const summary = [];
let failed = false;
const server = spawn(process.execPath, [path.join(rootDir, "tools", "serve-static.js")], {
  cwd: rootDir,
  stdio: "ignore"
});

Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);

try {
  for (const [name, route] of pages) {
    const outputBase = path.join(reportsDir, name);
    const url = new URL(route, baseUrl).href;
    console.log(`Auditing ${url}`);

    const result = spawnSync(process.execPath, [
      lighthouseCli,
      url,
      "--output", "html",
      "--output", "json",
      "--output-path", outputBase,
      "--chrome-flags", chromeFlags,
      "--quiet"
    ], { cwd: rootDir, stdio: "inherit" });

    const jsonPath = `${outputBase}.report.json`;
    if (result.status !== 0 || !fs.existsSync(jsonPath)) {
      console.error(`Lighthouse failed for ${url}.`);
      failed = true;
      continue;
    }

    const report = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const scores = Object.fromEntries(
      ["performance", "accessibility", "best-practices", "seo"]
        .map((category) => [category, Math.round(report.categories[category].score * 100)])
    );
    summary.push({ page: name, route, ...scores });
  }
} finally {
  if (server.exitCode === null) server.kill();
}

const summaryPath = path.join(reportsDir, "summary.json");
fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);

console.table(summary);
console.log(`Lighthouse reports saved under ${path.relative(rootDir, reportsDir)}.`);

if (failed || summary.length !== pages.length) {
  console.error(`Lighthouse completed ${summary.length} of ${pages.length} audits.`);
  process.exit(1);
}
