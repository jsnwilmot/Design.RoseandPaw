#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(process.env.SITE_DIR || path.join(process.cwd(), "_site"));
const htmlFiles = fs.readdirSync(rootDir).filter((file) => file.endsWith(".html")).sort();
const issues = [];
const warnings = [];

const read = (file) => fs.readFileSync(path.join(rootDir, file), "utf8");
const exists = (file) => fs.existsSync(path.join(rootDir, file));
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const attribute = (markup, name) => markup.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"))?.[1] ?? "";
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((match) => match[0]);
const isExternal = (value) => /^(?:https?:|data:|mailto:|tel:|javascript:)/i.test(value);
const decodeEntities = (value) => value
  .replaceAll("&amp;", "&")
  .replaceAll("&quot;", "\"")
  .replaceAll("&#39;", "'")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">");

const normalizeLocalPath = (value, fallbackFile = "") => {
  const [withoutHash] = value.split("#");
  const [withoutQuery] = withoutHash.split("?");
  return decodeURIComponent(withoutQuery || fallbackFile).replace(/^\/+/, "");
};

const checkLocalReference = (sourceFile, value, kind) => {
  if (!value || isExternal(value) || value.startsWith("#")) return;

  let localPath;
  try {
    localPath = normalizeLocalPath(value, sourceFile);
  } catch (error) {
    issues.push(`${sourceFile}: malformed URL encoding in ${kind} ${value}`);
    return;
  }

  if (!exists(localPath)) {
    issues.push(`${sourceFile}: missing ${kind} ${value}`);
  }
};

const checkStructuredData = (file, html) => {
  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      issues.push(`${file}: JSON-LD parse error: ${error.message}`);
    }
  }
};

const checkImages = (file, html) => {
  for (const image of tags(html, "img")) {
    checkLocalReference(file, attribute(image, "src"), "image");
    if (!/\balt=["'][^"']*["']/i.test(image)) issues.push(`${file}: image missing alt attribute`);
    if (!attribute(image, "width") || !attribute(image, "height")) issues.push(`${file}: image missing width or height: ${attribute(image, "src")}`);
  }

  for (const element of [...tags(html, "img"), ...tags(html, "source")]) {
    const srcset = attribute(element, "srcset");
    for (const candidate of srcset.split(",")) {
      checkLocalReference(file, candidate.trim().split(/\s+/)[0], "srcset candidate");
    }
  }
};

const checkLinksAndAssets = (file, html) => {
  for (const link of tags(html, "a")) {
    const href = attribute(link, "href");
    if (!href || isExternal(href)) continue;

    const [target, hash] = href.split("#");
    const localPath = normalizeLocalPath(target || file, file);
    checkLocalReference(file, target || file, "internal link");

    if (hash && exists(localPath)) {
      const targetHtml = read(localPath);
      if (!new RegExp(`(?:id|name)=["']${escapeRegex(hash)}["']`).test(targetHtml)) {
        issues.push(`${file}: missing anchor ${href}`);
      }
    }
  }

  for (const link of tags(html, "link")) {
    const rel = attribute(link, "rel");
    if (/(?:stylesheet|icon)/i.test(rel)) checkLocalReference(file, attribute(link, "href"), "linked asset");
  }

  for (const script of tags(html, "script")) {
    checkLocalReference(file, attribute(script, "src"), "script");
  }
};

const checkAccessibility = (file, html) => {
  const ids = [...html.matchAll(/<[a-z][a-z0-9-]*\b[^>]*>/gi)].map((match) => attribute(match[0], "id")).filter(Boolean);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  for (const id of duplicates) issues.push(`${file}: duplicate id ${id}`);

  for (const link of tags(html, "a")) {
    if (attribute(link, "target") === "_blank" && !/\brel=["'][^"']*\bnoopener\b[^"']*\bnoreferrer\b[^"']*["']/i.test(link)) {
      issues.push(`${file}: target="_blank" link missing rel="noopener noreferrer"`);
    }
  }

  const labels = [...html.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>/gi)];
  for (const control of [...tags(html, "input"), ...tags(html, "select"), ...tags(html, "textarea")]) {
    if (/type=["']hidden["']/i.test(control)) continue;
    const id = attribute(control, "id");
    const name = attribute(control, "name");
    const labelled = Boolean(attribute(control, "aria-label") || attribute(control, "aria-labelledby"))
      || labels.some((label) => (id && attribute(label[1], "for") === id) || (name && new RegExp(`<(?:input|select|textarea)\\b[^>]*\\bname=["']${escapeRegex(name)}["']`, "i").test(label[2])));
    if (!labelled) issues.push(`${file}: form control missing accessible label: ${name || id || control}`);
  }
};

const sitemap = read("sitemap.xml");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const publicFiles = sitemapUrls.map((url) => new URL(url).pathname.replace(/^\/$/, "/index.html").replace(/^\//, ""));
const canonicalOwners = new Map();
const titleOwners = new Map();
const descriptionOwners = new Map();

for (const file of htmlFiles) {
  const html = read(file);
  checkStructuredData(file, html);
  checkImages(file, html);
  checkLinksAndAssets(file, html);
  checkAccessibility(file, html);

  if (!publicFiles.includes(file)) continue;

  const h1Count = (html.match(/<h1\b/gi) || []).length;
  if (h1Count !== 1) issues.push(`${file}: public page must contain exactly one H1; found ${h1Count}`);

  const title = decodeEntities(html.match(/<title>([^<]*)<\/title>/i)?.[1].trim() ?? "");
  const description = decodeEntities(html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)?.[1].trim() ?? "");
  const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["'][^>]*>/i)?.[1] ?? "";
  if (!title) issues.push(`${file}: public page missing title`);
  if (!description) issues.push(`${file}: public page missing meta description`);
  if (!canonical) issues.push(`${file}: public page missing canonical URL`);
  if (title && (title.length < 25 || title.length > 65)) warnings.push(`${file}: title length is ${title.length}`);
  if (description && (description.length < 70 || description.length > 170)) warnings.push(`${file}: meta description length is ${description.length}`);
  if (title) {
    if (titleOwners.has(title)) issues.push(`${file}: duplicate title also used by ${titleOwners.get(title)}`);
    titleOwners.set(title, file);
  }
  if (description) {
    if (descriptionOwners.has(description)) issues.push(`${file}: duplicate meta description also used by ${descriptionOwners.get(description)}`);
    descriptionOwners.set(description, file);
  }
  if (canonical) {
    if (canonicalOwners.has(canonical)) issues.push(`${file}: duplicate canonical URL also used by ${canonicalOwners.get(canonical)}`);
    canonicalOwners.set(canonical, file);
  }
}

for (const [url, file] of sitemapUrls.map((url, index) => [url, publicFiles[index]])) {
  if (!exists(file)) issues.push(`sitemap.xml: URL does not map to an existing file: ${url}`);
  if (exists(file) && /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(read(file))) {
    issues.push(`sitemap.xml: includes noindex page ${url}`);
  }
}

const robots = read("robots.txt");
for (const file of htmlFiles.filter((item) => /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(read(item)))) {
  if (new RegExp(`Disallow:\\s*/${escapeRegex(file)}`, "i").test(robots)) {
    issues.push(`robots.txt: blocks noindex page ${file}`);
  }
}

if (warnings.length) console.warn(`Warnings:\n${warnings.join("\n")}\n`);
if (issues.length) {
  console.error(`Validation errors:\n${issues.join("\n")}`);
  process.exit(1);
}

console.log(`Site validation passed for ${htmlFiles.length} HTML files and ${publicFiles.length} public sitemap pages.`);
