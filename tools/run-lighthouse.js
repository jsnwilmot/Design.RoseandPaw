#!/usr/bin/env node

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = process.cwd();
const reportsDir = path.join(rootDir, "reports");
const outputPath = path.join(reportsDir, "lighthouse-report.html");
const lighthouseCli = path.join(rootDir, "node_modules", "lighthouse", "cli", "index.js");
const chromeFlags = [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--remote-debugging-address=127.0.0.1"
].join(" ");

fs.mkdirSync(reportsDir, { recursive: true });

if (fs.existsSync(outputPath)) {
  fs.rmSync(outputPath, { force: true });
}

const args = [
  lighthouseCli,
  "http://localhost:3000",
  "--output",
  "html",
  "--output-path",
  outputPath,
  "--chrome-flags",
  chromeFlags
];

const child = spawn(process.execPath, args, {
  cwd: rootDir,
  stdio: "inherit"
});

child.on("exit", (code) => {
  const reportExists = fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0;

  if (code === 0) {
    process.exit(0);
  }

  if (reportExists) {
    console.warn("Lighthouse created the report, but Chrome cleanup returned a non-zero exit code.");
    console.warn(`Report saved to ${path.relative(rootDir, outputPath)}`);
    process.exit(0);
  }

  process.exit(code || 1);
});
