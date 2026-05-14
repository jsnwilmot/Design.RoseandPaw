#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const rootDir = process.cwd();
const htmlFiles = fs.readdirSync(rootDir).filter((file) => file.endsWith(".html"));
const issues = [];

const read = (file) => fs.readFileSync(path.join(rootDir, file), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(rootDir, relativePath));

const normalizeLocalPath = (value, fallbackFile) => {
  const [withoutHash] = value.split("#");
  const [withoutQuery] = withoutHash.split("?");
  return decodeURIComponent(withoutQuery || fallbackFile).replace(/^\/+/, "");
};

const hasAnchor = (file, hash) => {
  const html = read(file);
  const escaped = hash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:id|name)=["']${escaped}["']`).test(html);
};

for (const file of htmlFiles) {
  const html = read(file);

  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      issues.push(`${file}: JSON-LD parse error: ${error.message}`);
    }
  }

  for (const match of html.matchAll(/<img[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
    const src = match[1];
    if (/^(?:https?:|data:|mailto:|tel:)/i.test(src)) continue;
    const localPath = normalizeLocalPath(src, file);
    if (!exists(localPath)) issues.push(`${file}: missing image ${src}`);
  }

  for (const match of html.matchAll(/<source[^>]*\bsrcset=["']([^"']+)["'][^>]*>/gi)) {
    for (const item of match[1].split(",")) {
      const src = item.trim().split(/\s+/)[0];
      if (!src || /^(?:https?:|data:)/i.test(src)) continue;
      const localPath = normalizeLocalPath(src, file);
      if (!exists(localPath)) issues.push(`${file}: missing source ${src}`);
    }
  }

  for (const match of html.matchAll(/<a[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|tel:|#)/i.test(href)) continue;

    const [target, hash] = href.split("#");
    const localPath = normalizeLocalPath(target || file, file);

    if (!exists(localPath)) {
      issues.push(`${file}: missing internal link ${href}`);
      continue;
    }

    if (hash && !hasAnchor(localPath, hash)) {
      issues.push(`${file}: missing anchor ${href}`);
    }
  }
}

if (issues.length) {
  console.error(issues.join("\n"));
  process.exit(1);
}

console.log("JSON-LD, image paths, source paths, and internal links passed.");
