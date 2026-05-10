#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

let sharp;

try {
  sharp = require("sharp");
} catch (error) {
  console.error("The sharp package is required. Run `npm install` first, then try again.");
  process.exit(1);
}

const rootDir = process.cwd();
const imageDir = path.join(rootDir, "images");
const widths = [320, 640, 960, 1280];
const largeHeroWidth = 1600;
const minBytes = 100 * 1024;
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const generatedPattern = /-(320|640|960|1280|1600)\.webp$/i;
const keepOriginalNames = new Set(["favicon-192.png"]);

const formatBytes = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

const walk = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
};

const shouldSkip = async (filePath) => {
  const extension = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);

  if (!supportedExtensions.has(extension)) return "unsupported file type";
  if (generatedPattern.test(fileName)) return "already generated responsive image";
  if (keepOriginalNames.has(fileName)) return "small icon or favicon";

  const stat = await fs.stat(filePath);
  if (stat.size <= minBytes) return `under ${formatBytes(minBytes)}`;

  return "";
};

const outputBase = (filePath) => {
  const extension = path.extname(filePath);
  return path.join(path.dirname(filePath), path.basename(filePath, extension));
};

const optimizeImage = async (filePath) => {
  const image = sharp(filePath, { failOn: "none" });
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    return [];
  }

  const targetWidths = widths.filter((width) => width < metadata.width);

  if (metadata.width >= largeHeroWidth) {
    targetWidths.push(largeHeroWidth);
  }

  if (!targetWidths.includes(metadata.width) && metadata.width <= 1280) {
    targetWidths.push(metadata.width);
  }

  const uniqueWidths = [...new Set(targetWidths)].sort((a, b) => a - b);
  const base = outputBase(filePath);
  const results = [];

  for (const width of uniqueWidths) {
    const outputPath = `${base}-${width}.webp`;

    await sharp(filePath, { failOn: "none" })
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82, effort: 6 })
      .toFile(outputPath);

    const outputStat = await fs.stat(outputPath);
    results.push({
      file: path.relative(rootDir, outputPath),
      width,
      size: outputStat.size
    });
  }

  return results;
};

const main = async () => {
  const files = await walk(imageDir);
  const optimized = [];
  const skipped = [];

  for (const filePath of files) {
    const reason = await shouldSkip(filePath);
    const relativePath = path.relative(rootDir, filePath);

    if (reason) {
      skipped.push({ file: relativePath, reason });
      continue;
    }

    const results = await optimizeImage(filePath);
    optimized.push({ file: relativePath, results });
  }

  console.log("\nOptimized images:");
  if (optimized.length === 0) {
    console.log("  None");
  } else {
    for (const item of optimized) {
      console.log(`  ${item.file}`);
      for (const result of item.results) {
        console.log(`    ${result.file} (${result.width}w, ${formatBytes(result.size)})`);
      }
    }
  }

  console.log("\nSkipped images:");
  for (const item of skipped) {
    console.log(`  ${item.file} - ${item.reason}`);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
