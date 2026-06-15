import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
  let putCalls = 0;
  let matchCalls = 0;
  return {
    values,
    get matchCalls() {
      return matchCalls;
    },
    get putCalls() {
      return putCalls;
    },
    async match(request) {
      matchCalls += 1;
      return values.get(request.url)?.clone();
    },
    async put(request, response) {
      putCalls += 1;
      values.set(request.url, response.clone());
    }
  };
};

const makeEnv = (rateLimitSuccess = true, onRateLimit = () => {}) => ({
  PAGESPEED_API_KEY: "test-pagespeed-key",
  ALLOWED_ORIGINS: "https://design.roseandpaw.ca,http://localhost:8080,http://127.0.0.1:8080",
  CACHE_TTL_SECONDS: "1800",
  AUDIT_RATE_LIMITER: {
    limit: async (options) => {
      onRateLimit(options);
      return { success: rateLimitSuccess };
    }
  }
});

const makeRequest = (body, headers = {}, options = {}) => {
  const method = options.method || "POST";
  const requestHeaders = { "content-type": "application/json", origin: "https://design.roseandpaw.ca", "cf-connecting-ip": "203.0.113.10", ...headers };
  for (const [name, value] of Object.entries(requestHeaders)) {
    if (value === undefined) delete requestHeaders[name];
  }
  return new Request(options.url || "https://design.roseandpaw.ca/api/website-audit", {
    method,
    headers: requestHeaders,
    ...(method === "GET" || method === "HEAD" || method === "OPTIONS"
      ? {}
      : { body: options.rawBody ?? JSON.stringify(body) })
  });
};

const makeDependencies = (overrides = {}) => ({
  cache: makeCache(),
  activeAudits: new Map(),
  fetcher: async () => new Response(JSON.stringify(samplePayload()), {
    status: 200,
    headers: { "content-type": "application/json" }
  }),
  ...overrides
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
  assert.equal(normalizePublicUrl("HTTPS://Example.com:443/path?view=full#section"), "https://example.com/path?view=full");
  assert.equal(normalizePublicUrl("https://bücher.example/"), "https://xn--bcher-kva.example/");
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
  assert.match(getAuditErrorMessage("missing_url"), /public website URL/);
  assert.match(getAuditErrorMessage("payload_too_large"), /too large/);
  const report = normalizePageSpeedResponse(samplePayload(), "https://example.com/", "mobile", "2026-06-13T12:00:00.000Z");
  const fields = buildAuditContactFields(report);
  assert.equal(fields.website_url, "https://example.com/");
  assert.match(fields.top_findings, /Optimize image delivery/);
});

test("endpoint returns normalized response and caches successful audits", async () => {
  const cache = makeCache();
  const activeAudits = new Map();
  let pagespeedCalls = 0;
  let rateLimitCalls = 0;
  const fetcher = async (url) => {
    pagespeedCalls += 1;
    assert.match(String(url), /pagespeedonline/);
    assert.match(String(url), /key=test-pagespeed-key/);
    return new Response(JSON.stringify(samplePayload()), { status: 200, headers: { "content-type": "application/json" } });
  };
  const firstContext = makeContext();
  const first = await handleAuditRequest(makeRequest({ url: "example.com", strategy: "mobile" }), makeEnv(true, () => { rateLimitCalls += 1; }), firstContext, { cache, fetcher, activeAudits });
  await Promise.all(firstContext.promises);
  assert.equal(first.status, 200);
  assert.equal((await first.json()).cached, false);
  assert.equal(cache.putCalls, 1);

  const second = await handleAuditRequest(makeRequest({ url: "example.com", strategy: "mobile" }), makeEnv(false, () => { rateLimitCalls += 1; }), makeContext(), { cache, fetcher, activeAudits });
  assert.equal(second.status, 200);
  assert.equal((await second.json()).cached, true);
  assert.equal(pagespeedCalls, 1);
  assert.equal(rateLimitCalls, 1);
  assert.equal(activeAudits.size, 0);
});

test("endpoint returns 429 for a new audit over the rate limit", async () => {
  const response = await handleAuditRequest(makeRequest({ url: "example.com" }), makeEnv(false), makeContext(), makeDependencies({
    fetcher: async () => assert.fail("PageSpeed must not be called")
  }));
  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { error: "rate_limited" });
  assert.equal(response.headers.get("retry-after"), "60");
});

test("cached reports remain available before configuration checks", async () => {
  const dependencies = makeDependencies();
  const generated = await handleAuditRequest(makeRequest({ url: "example.com" }), makeEnv(), makeContext(), dependencies);
  assert.equal(generated.status, 200);

  const cached = await handleAuditRequest(makeRequest({ url: "example.com" }), { ALLOWED_ORIGINS: "https://design.roseandpaw.ca" }, makeContext(), dependencies);
  assert.equal(cached.status, 200);
  assert.equal(cached.headers.get("x-audit-cache"), "HIT");

  const uncached = await handleAuditRequest(makeRequest({ url: "example.org" }), { ALLOWED_ORIGINS: "https://design.roseandpaw.ca" }, makeContext(), dependencies);
  assert.equal(uncached.status, 503);
  assert.deepEqual(await uncached.json(), { error: "service_not_configured" });
});

test("endpoint applies the configured Origin allowlist and safe CORS headers", async () => {
  const dependencies = makeDependencies();
  const production = await handleAuditRequest(makeRequest({ url: "example.com" }), makeEnv(), makeContext(), dependencies);
  assert.equal(production.status, 200);
  assert.equal(production.headers.get("access-control-allow-origin"), "https://design.roseandpaw.ca");
  assert.equal(production.headers.get("vary"), "Origin");

  const development = await handleAuditRequest(makeRequest({ url: "example.org" }, { origin: "http://localhost:8080" }), makeEnv(), makeContext(), dependencies);
  assert.equal(development.status, 200);
  assert.equal(development.headers.get("access-control-allow-origin"), "http://localhost:8080");

  const foreign = await handleAuditRequest(makeRequest({ url: "example.net" }, { origin: "https://attacker.example" }), makeEnv(), makeContext(), dependencies);
  assert.equal(foreign.status, 403);
  assert.deepEqual(await foreign.json(), { error: "forbidden_origin" });
  assert.equal(foreign.headers.get("access-control-allow-origin"), null);
});

test("missing Origin requests receive normal validation and abuse controls", async () => {
  let rateLimitCalls = 0;
  const response = await handleAuditRequest(makeRequest({ url: "example.com" }, { origin: undefined }), makeEnv(true, () => { rateLimitCalls += 1; }), makeContext(), makeDependencies());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
  assert.equal(rateLimitCalls, 1);
});

test("OPTIONS and invalid methods return safe method and CORS behavior", async () => {
  const options = await handleAuditRequest(makeRequest(null, { origin: "http://127.0.0.1:8080" }, { method: "OPTIONS" }), makeEnv(), makeContext(), makeDependencies());
  assert.equal(options.status, 204);
  assert.equal(options.headers.get("access-control-allow-origin"), "http://127.0.0.1:8080");
  assert.equal(options.headers.get("access-control-allow-methods"), "POST, OPTIONS");

  const invalidMethod = await handleAuditRequest(makeRequest(null, {}, { method: "GET" }), makeEnv(), makeContext(), makeDependencies());
  assert.equal(invalidMethod.status, 405);
  assert.deepEqual(await invalidMethod.json(), { error: "method_not_allowed" });
  assert.equal(invalidMethod.headers.get("allow"), "POST, OPTIONS");
});

test("endpoint returns precise safe request-validation errors before upstream work", async () => {
  const env = makeEnv();
  const dependencies = makeDependencies({ fetcher: async () => assert.fail("PageSpeed must not be called") });
  const invalidType = await handleAuditRequest(makeRequest({ url: "example.com" }, { "content-type": "text/plain" }), env, makeContext(), dependencies);
  assert.equal(invalidType.status, 415);
  assert.deepEqual(await invalidType.json(), { error: "invalid_content_type" });
  const oversized = await handleAuditRequest(makeRequest({ url: `https://example.com/${"x".repeat(5000)}` }), env, makeContext(), dependencies);
  assert.equal(oversized.status, 413);
  assert.deepEqual(await oversized.json(), { error: "payload_too_large" });
  const invalidJson = await handleAuditRequest(makeRequest(null, {}, { rawBody: "{" }), env, makeContext(), dependencies);
  assert.equal(invalidJson.status, 400);
  assert.deepEqual(await invalidJson.json(), { error: "invalid_json" });
  const missingUrl = await handleAuditRequest(makeRequest({ strategy: "mobile" }), env, makeContext(), dependencies);
  assert.deepEqual(await missingUrl.json(), { error: "missing_url" });
  const honeypot = await handleAuditRequest(makeRequest({ url: "example.com", company_website: "filled" }), env, makeContext(), dependencies);
  assert.deepEqual(await honeypot.json(), { error: "invalid_request" });
  const privateUrl = await handleAuditRequest(makeRequest({ url: "http://127.0.0.1" }), env, makeContext(), dependencies);
  assert.deepEqual(await privateUrl.json(), { error: "private_url" });
  const credentials = await handleAuditRequest(makeRequest({ url: "https://user:pass@example.com" }), env, makeContext(), dependencies);
  assert.deepEqual(await credentials.json(), { error: "embedded_credentials" });
  assert.equal(dependencies.cache.matchCalls, 0);
});

test("endpoint returns safe PageSpeed failure response", async () => {
  const dependencies = makeDependencies({
    fetcher: async () => new Response("quota details and internal data", { status: 429 })
  });
  const response = await handleAuditRequest(makeRequest({ url: "example.com" }), makeEnv(), makeContext(), dependencies);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "pagespeed_rate_limited" });
  assert.equal(dependencies.cache.putCalls, 0);
  assert.equal(dependencies.activeAudits.size, 0);
});

test("endpoint returns safe timeout response", async () => {
  const timeout = new Error("timed out");
  timeout.name = "TimeoutError";
  const dependencies = makeDependencies({
    fetcher: async () => { throw timeout; }
  });
  const response = await handleAuditRequest(makeRequest({ url: "example.com" }), makeEnv(), makeContext(), dependencies);
  assert.equal(response.status, 504);
  assert.deepEqual(await response.json(), { error: "pagespeed_timeout" });
  assert.equal(dependencies.activeAudits.size, 0);
});

test("concurrent identical requests share one active PageSpeed request", async () => {
  let resolveUpstream;
  let signalUpstreamStarted;
  const upstreamStarted = new Promise((resolve) => { signalUpstreamStarted = resolve; });
  let pagespeedCalls = 0;
  let rateLimitCalls = 0;
  const dependencies = makeDependencies({
    fetcher: async () => {
      pagespeedCalls += 1;
      signalUpstreamStarted();
      await new Promise((resolve) => { resolveUpstream = resolve; });
      return new Response(JSON.stringify(samplePayload()), { status: 200 });
    }
  });
  const env = makeEnv(true, () => { rateLimitCalls += 1; });
  const firstPromise = handleAuditRequest(makeRequest({ url: "example.com" }), env, makeContext(), dependencies);
  const secondPromise = handleAuditRequest(makeRequest({ url: "https://EXAMPLE.com:443/" }), env, makeContext(), dependencies);
  await upstreamStarted;
  await new Promise((resolve) => setTimeout(resolve, 0));
  resolveUpstream();

  const [first, second] = await Promise.all([firstPromise, secondPromise]);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(second.headers.get("x-audit-cache"), "COALESCED");
  assert.equal(pagespeedCalls, 1);
  assert.equal(rateLimitCalls, 1);
  assert.equal(dependencies.activeAudits.size, 0);
});

test("upstream failures are not cached, are safely normalized, and permit later retry", async () => {
  let pagespeedCalls = 0;
  const dependencies = makeDependencies({
    fetcher: async () => {
      pagespeedCalls += 1;
      if (pagespeedCalls === 1) return new Response("private upstream details", { status: 500 });
      return new Response(JSON.stringify(samplePayload()), { status: 200 });
    }
  });

  const failed = await handleAuditRequest(makeRequest({ url: "example.com" }), makeEnv(), makeContext(), dependencies);
  assert.equal(failed.status, 502);
  assert.deepEqual(await failed.json(), { error: "pagespeed_failed" });
  assert.equal(dependencies.cache.putCalls, 0);
  assert.equal(dependencies.activeAudits.size, 0);

  const retried = await handleAuditRequest(makeRequest({ url: "example.com" }), makeEnv(), makeContext(), dependencies);
  assert.equal(retried.status, 200);
  assert.equal(pagespeedCalls, 2);
  assert.equal(dependencies.cache.putCalls, 1);
});

test("responses never expose the PageSpeed API key or raw upstream details", async () => {
  const response = await handleAuditRequest(makeRequest({ url: "example.com" }), makeEnv(), makeContext(), makeDependencies({
    fetcher: async () => new Response(`failed request key=${makeEnv().PAGESPEED_API_KEY}`, { status: 500 })
  }));
  const text = await response.text();
  assert.equal(response.status, 502);
  assert.doesNotMatch(text, /test-pagespeed-key|failed request|googleapis/i);
  assert.doesNotMatch(readFileSync(new URL("../worker/index.mjs", import.meta.url), "utf8"), /console\.(?:log|warn|error)/);
});
