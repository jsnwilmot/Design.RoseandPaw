import { cleanText, getRecommendation } from "./recommendations.mjs";

const CATEGORY_KEYS = ["performance", "accessibility", "best-practices", "seo"];
const METRIC_KEYS = {
  "first-contentful-paint": "firstContentfulPaint",
  "largest-contentful-paint": "largestContentfulPaint",
  "total-blocking-time": "totalBlockingTime",
  "cumulative-layout-shift": "cumulativeLayoutShift",
  "speed-index": "speedIndex",
  "interaction-to-next-paint": "interactionToNextPaint"
};

const scoreToPriority = (score, weight = 0) => {
  if (score === 0 || weight >= 7) return "high";
  if (score < 0.5 || weight >= 3) return "medium";
  return "low";
};

const HIGH_PRIORITY_AUDITS = new Set([
  "button-name",
  "color-contrast",
  "document-title",
  "http-status-code",
  "image-alt",
  "is-crawlable",
  "label",
  "largest-contentful-paint",
  "total-blocking-time"
]);

const getPriority = (audit, weight) => HIGH_PRIORITY_AUDITS.has(audit.id)
  ? "high"
  : scoreToPriority(audit.score, weight);

const isFailedAudit = (audit) => Number.isFinite(audit?.score)
  && audit.score < 0.9
  && audit.scoreDisplayMode !== "notApplicable"
  && audit.scoreDisplayMode !== "manual";

const normalizeFinding = (audit, category, weight) => {
  const wording = getRecommendation(audit);
  return {
    id: cleanText(audit.id, "unknown-audit", 100),
    category,
    title: wording.title,
    description: wording.description,
    recommendation: wording.recommendation,
    priority: getPriority(audit, weight),
    ...(audit.displayValue ? { displayValue: cleanText(audit.displayValue, "", 160) } : {})
  };
};

export const normalizePageSpeedResponse = (payload, normalizedUrl, strategy, testedAt = new Date().toISOString()) => {
  const lighthouse = payload?.lighthouseResult;
  if (!lighthouse?.categories || !lighthouse?.audits) {
    throw new Error("invalid_pagespeed_response");
  }
  if (CATEGORY_KEYS.some((category) => !Number.isFinite(lighthouse.categories[category]?.score))) {
    throw new Error("invalid_pagespeed_response");
  }

  const scores = Object.fromEntries(CATEGORY_KEYS.map((category) => {
    const score = lighthouse.categories[category]?.score;
    return [category === "best-practices" ? "bestPractices" : category, Number.isFinite(score) ? Math.round(score * 100) : null];
  }));

  const metrics = {};
  for (const [auditId, key] of Object.entries(METRIC_KEYS)) {
    const audit = lighthouse.audits[auditId];
    if (audit?.displayValue) {
      metrics[key] = {
        label: cleanText(audit.title, auditId, 100),
        displayValue: cleanText(audit.displayValue, "", 100)
      };
    }
  }

  const findings = [];
  for (const category of CATEGORY_KEYS) {
    const refs = lighthouse.categories[category]?.auditRefs || [];
    const categoryFindings = refs
      .map((ref) => ({ audit: lighthouse.audits[ref.id], weight: Number(ref.weight) || 0 }))
      .filter(({ audit }) => isFailedAudit(audit))
      .map(({ audit, weight }) => normalizeFinding(audit, category, weight))
      .sort((left, right) => {
        const rank = { high: 0, medium: 1, low: 2 };
        return rank[left.priority] - rank[right.priority];
      })
      .slice(0, 5);
    findings.push(...categoryFindings);
  }

  return {
    url: normalizedUrl,
    strategy,
    testedAt,
    scores,
    metrics,
    findings
  };
};
