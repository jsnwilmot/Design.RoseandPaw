import test from "node:test";
import assert from "node:assert/strict";
import { buildAuditContactFields, getAuditErrorMessage, getScoreStatus } from "../audit-client-utils.mjs";
import { handleAuditRequest } from "../worker/index.mjs";
import { normalizePageSpeedResponse } from "../worker/pagespeed.mjs";
import { getRecommendation } from "../worker/recommendations.mjs";
import { normalizePublicUrl } from "../worker/url-validation.mjs";

const samplePayload = () => ({
  lighthouseResult: {
    categories: {
      performance: { score: 0.72, auditRefs: [{ id: "uses-optimized-images", weight: 8 }] },
      accessibility: { score: 0.94, auditRefs: [{ id: "image-alt", weight: 7 }] },
      "best-practices": { score: 0.96, auditRefs: [] },
      seo: { score: 0.83, auditRefs: [{ id: "unknown-check", weight: 2 }] }
    },
    audits: {
      "first-contentful-paint": { title: "First Contentful Paint", displayValue: "1.4 s" },
      "uses-optimized-images": { id: "uses-optimized-images", score: 0, title: "Raw image title", description: "Raw image description", displayValue: "Potential savings of 420 KiB" },
      "image-alt": { id: "image-alt", score: 0, title: "Image elements do not have alt attributes", description: "Raw accessibility text" },
      "unknown-check": { id: "unknown-check", score: 0.5, title: "Safe <b>unknown</b> title", description: "Review <a href='x'>this item</a>." }
    }
  }
});

const makeCache = () => {
  const values = new Map();
  return {
    async match(request) {
      return values.get(request.url)?.clone();
    },
    async put(request, response) {
      values.set(request.url, response.clone());
    }
  };
};

const makeEnv = (rateLimitSuccess = true) => ({
  PAGESPEED_API_KEY: "test-pagespeed-key",
  ALLOWED_ORIGIN: "https://design.roseandpaw.ca",
  CACHE_TTL_SECONDS: "1800",
  AUDIT_RATE_LIMITER: { limit: async () => ({ success: rateLimitSuccess }) }
});

const makeRequest = (body, headers = {}) => new Request("https://design.roseandpaw.ca/api/website-audit", {
  method: "POST",
  headers: { "content-type": "application/json", origin: "https://design.roseandpaw.ca", "cf-connecting-ip": "203.0.113.10", ...headers },
  body: JSON.stringify(body)
});

const makeContext = () => {
  const promises = [];
  return {
    promises,
    waitUntil(promise) {
      promises.push(promise);
    }
  };
};

test("normalizes a public URL and adds https when missing", () => {
  assert.equal(normalizePublicUrl("example.com"), "https://example.com/");
  assert.equal(normalizePublicUrl("HTTP://Example.com/path#section"), "http://example.com/path");
});

for (const [label, url, code] of [
  ["missing URL", "", "invalid_url"],
  ["invalid URL", "https://", "invalid_url"],
  ["localhost", "http://localhost", "private_url"],
  ["IPv4 loopback", "http://127.0.0.1", "private_url"],
  ["zero network", "http://0.0.0.0", "private_url"],
  ["private 10 range", "http://10.2.3.4", "private_url"],
  ["private 172 range", "http://172.16.0.1", "private_url"],
  ["private 192 range", "http://192.168.1.1", "private_url"],
  ["link local", "http://169.254.4.2", "private_url"],
  ["IPv6 loopback", "http://[::1]", "private_url"],
  ["IPv6 private", "http://[fc00::1]", "private_url"],
  ["IPv6 link local", "http://[fe80::1]", "private_url"],
  ["IPv6 mapped loopback", "http://[::ffff:127.0.0.1]", "private_url"],
  ["IPv6 mapped private", "http://[::ffff:10.0.0.1]", "private_url"],
  ["unsupported protocol", "ftp://example.com", "unsupported_url"],
  ["embedded credentials", "https://user:pass@example.com", "embedded_credentials"],
  ["control characters", "https://example.com/\npath", "invalid_url"],
  ["single-label hostname", "https://intranet", "invalid_url"],
  ["malformed hostname", "https://-example.com", "invalid_url"]
]) {
  test(`rejects ${label}`, () => {
    assert.throws(() => normalizePublicUrl(url), { message: code });
  });
}

test("normalizes scores, optional metrics, findings, and sanitized fallback wording", () => {
  const report = normalizePageSpeedResponse(samplePayload(), "https://example.com/", "mobile", "2026-06-13T12:00:00.000Z");
  assert.deepEqual(report.scores, { performance: 72, accessibility: 94, bestPractices: 96, seo: 83 });
  assert.deepEqual(report.metrics, { firstContentfulPaint: { label: "First Contentful Paint", displayValue: "1.4 s" } });
  assert.equal(report.findings[0].title, "Optimize image delivery");
  assert.equal(report.findings.find((finding) => finding.id === "image-alt").priority, "high");
  assert.equal(report.findings.find((finding) => finding.id === "unknown-check").title, "Safe unknown title");
});

test("rejects PageSpeed responses with missing categories", () => {
  const payload = samplePayload();
  delete payload.lighthouseResult.categories.seo;
  assert.throws(() => normalizePageSpeedResponse(payload, "https://example.com/", "mobile"), { message: "invalid_pagespeed_response" });
});

test("unknown audit fallback is safe and useful", () => {
  const wording = getRecommendation({ id: "unknown", title: "Review <script>alert(1)</script> item", description: "Unsafe <b>markup</b>" });
  assert.equal(wording.title, "Review alert(1) item");
  assert.equal(wording.description, "Unsafe markup");
  assert.match(wording.recommendation, /Review the Lighthouse guidance/);
});

test("client helpers provide statuses, safe errors, and concise contact fields", () => {
  assert.equal(getScoreStatus(90), "Strong");
  assert.equal(getScoreStatus(69), "Significant issues");
  assert.match(getAuditErrorMessage("rate_limited"), /Too many audits/);
  const report = normalizePageSpeedResponse(samplePayload(), "https://example.com/", "mobile", "2026-06-13T12:00:00.000Z");
  const fields = buildAuditContactFields(report);
  assert.equal(fields.website_url, "https://example.com/");
  assert.match(fields.top_findings, /Optimize image delivery/);
});

test("endpoint returns normalized response and caches successful audits", async () => {
  const cache = makeCache();
  let pagespeedCalls = 0;
  const fetcher = async (url) => {
    pagespeedCalls += 1;
    assert.match(String(url), /pagespeedonline/);
    return new Response(JSON.stringify(samplePayload()), { status: 200, headers: { "content-type": "application/json" } });
  };
  const firstContext = makeContext();
  const first = await handleAuditRequest(makeRequest({ url: "example.com", strategy: "mobile" }), makeEnv(), firstContext, { cache, fetcher });
  await Promise.all(firstContext.promises);
  assert.equal(first.status, 200);
  assert.equal((await first.json()).cached, false);

  const second = await handleAuditRequest(makeRequest({ url: "example.com", strategy: "mobile" }), makeEnv(false), makeContext(), { cache, fetcher });
  assert.equal(second.status, 200);
  assert.equal((await second.json()).cached, true);
  assert.equal(pagespeedCalls, 1);
});

test("endpoint returns 429 for a new audit over the rate limit", async () => {
  const response = await handleAuditRequest(makeRequest({ url: "example.com" }), makeEnv(false), makeContext(), { cache: makeCache(), fetcher: async () => assert.fail("PageSpeed must not be called") });
  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { error: "rate_limited" });
});

test("endpoint rejects invalid content type, oversized bodies, foreign origins, and honeypot submissions", async () => {
  const env = makeEnv();
  const dependencies = { cache: makeCache(), fetcher: async () => assert.fail("PageSpeed must not be called") };
  const invalidType = await handleAuditRequest(makeRequest({ url: "example.com" }, { "content-type": "text/plain" }), env, makeContext(), dependencies);
  assert.equal(invalidType.status, 400);
  const oversized = await handleAuditRequest(makeRequest({ url: `https://example.com/${"x".repeat(5000)}` }), env, makeContext(), dependencies);
  assert.equal(oversized.status, 400);
  const foreign = await handleAuditRequest(makeRequest({ url: "example.com" }, { origin: "https://attacker.example" }), env, makeContext(), dependencies);
  assert.equal(foreign.status, 403);
  const honeypot = await handleAuditRequest(makeRequest({ url: "example.com", company_website: "filled" }), env, makeContext(), dependencies);
  assert.equal(honeypot.status, 400);
});

test("endpoint returns safe PageSpeed failure response", async () => {
  const response = await handleAuditRequest(makeRequest({ url: "example.com" }), makeEnv(), makeContext(), {
    cache: makeCache(),
    fetcher: async () => new Response("quota details and internal data", { status: 429 })
  });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "pagespeed_rate_limited" });
});

test("endpoint returns safe timeout response", async () => {
  const timeout = new Error("timed out");
  timeout.name = "TimeoutError";
  const response = await handleAuditRequest(makeRequest({ url: "example.com" }), makeEnv(), makeContext(), {
    cache: makeCache(),
    fetcher: async () => { throw timeout; }
  });
  assert.equal(response.status, 504);
  assert.deepEqual(await response.json(), { error: "pagespeed_timeout" });
});
