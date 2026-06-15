import { normalizePageSpeedResponse } from "./pagespeed.mjs";
import { normalizePublicUrl } from "./url-validation.mjs";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff"
};
const ALLOWED_STRATEGIES = new Set(["mobile", "desktop"]);
const DEFAULT_CACHE_TTL = 1800;
const MAX_REQUEST_BYTES = 4096;
const MAX_ACTIVE_AUDITS = 50;
const PAGESPEED_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const activeAudits = new Map();

const jsonResponse = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...JSON_HEADERS, ...extraHeaders }
});

const getAllowedOrigins = (env) => new Set(String(env.ALLOWED_ORIGINS || env.ALLOWED_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean));

const getCorsHeaders = (origin, allowedOrigins) => origin && allowedOrigins.has(origin)
  ? {
      "access-control-allow-origin": origin,
      vary: "Origin"
    }
  : { vary: "Origin" };

const readJsonBody = async (request) => {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_REQUEST_BYTES) throw new Error("payload_too_large");
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new Error("invalid_content_type");
  }

  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid_json");
  const chunks = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new Error("payload_too_large");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (error) {
    throw new Error("invalid_json");
  }
};

const createCacheKey = async (url, strategy) => {
  const input = new TextEncoder().encode(`${strategy}:${url}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  const hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return new Request(`https://audit-cache.roseandpaw.invalid/${hash}`);
};

const fetchPageSpeed = async (url, strategy, apiKey, fetcher) => {
  const endpoint = new URL(PAGESPEED_ENDPOINT);
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", strategy);
  endpoint.searchParams.set("key", apiKey);
  for (const category of ["performance", "accessibility", "best-practices", "seo"]) {
    endpoint.searchParams.append("category", category);
  }

  const response = await fetcher(endpoint, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(60000)
  });
  if (!response.ok) {
    throw new Error(response.status === 429 ? "pagespeed_rate_limited" : "pagespeed_failed");
  }
  return response.json();
};

const getErrorStatus = (code) => ({
  not_found: 404,
  method_not_allowed: 405,
  forbidden_origin: 403,
  invalid_content_type: 415,
  payload_too_large: 413,
  service_not_configured: 503,
  rate_limited: 429,
  pagespeed_timeout: 504,
  pagespeed_rate_limited: 503,
  pagespeed_failed: 502
}[code] || 400);

const getSafeOperationError = (error) => {
  if (error?.message === "rate_limited") return "rate_limited";
  if (error?.name === "TimeoutError") return "pagespeed_timeout";
  if (error?.message === "pagespeed_rate_limited") return "pagespeed_rate_limited";
  return "pagespeed_failed";
};

const createAuditReport = async ({ normalizedUrl, strategy, apiKey, fetcher, cache, cacheKey, ttl }) => {
  const payload = await fetchPageSpeed(normalizedUrl, strategy, apiKey, fetcher);
  const report = normalizePageSpeedResponse(payload, normalizedUrl, strategy);
  try {
    await cache.put(cacheKey, new Response(JSON.stringify(report), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": `public, max-age=${ttl}`
      }
    }));
  } catch (error) {
    // A cache write failure must not discard a valid PageSpeed report.
  }
  return report;
};

export const handleAuditRequest = async (request, env, _ctx, dependencies = {}) => {
  const fetcher = dependencies.fetcher || fetch;
  const cache = dependencies.cache || caches.default;
  const inFlight = dependencies.activeAudits || activeAudits;
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const allowedOrigins = getAllowedOrigins(env);
  const corsHeaders = getCorsHeaders(origin, allowedOrigins);
  const respond = (body, status = 200, headers = {}) => jsonResponse(body, status, { ...corsHeaders, ...headers });
  const fail = (code, headers = {}) => respond({ error: code }, getErrorStatus(code), headers);

  if (requestUrl.pathname !== "/api/website-audit") return fail("not_found");
  if (origin && !allowedOrigins.has(origin)) return fail("forbidden_origin");
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "content-type",
        "access-control-max-age": "86400",
        allow: "POST, OPTIONS"
      }
    });
  }
  if (request.method !== "POST") return fail("method_not_allowed", { allow: "POST, OPTIONS" });

  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    return fail(error.message);
  }

  const strategy = ALLOWED_STRATEGIES.has(body?.strategy) ? body.strategy : "mobile";
  if (body?.company_website) return fail("invalid_request");
  if (typeof body?.url !== "string" || !body.url.trim()) return fail("missing_url");

  let normalizedUrl;
  try {
    normalizedUrl = normalizePublicUrl(body?.url);
  } catch (error) {
    return fail(error.message);
  }

  const cacheKey = await createCacheKey(normalizedUrl, strategy);
  const cached = await cache.match(cacheKey);
  if (cached) {
    return respond({ ...await cached.json(), cached: true }, 200, { "x-audit-cache": "HIT" });
  }

  if (inFlight.has(cacheKey.url)) {
    try {
      const report = await inFlight.get(cacheKey.url);
      return respond({ ...report, cached: false }, 200, { "x-audit-cache": "COALESCED" });
    } catch (error) {
      const code = getSafeOperationError(error);
      return fail(code, code === "rate_limited" ? { "retry-after": "60" } : {});
    }
  }

  if (!env.PAGESPEED_API_KEY || !env.AUDIT_RATE_LIMITER) return fail("service_not_configured");
  if (inFlight.size >= MAX_ACTIVE_AUDITS) return fail("rate_limited", { "retry-after": "60" });

  const reportPromise = (async () => {
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const rateLimit = await env.AUDIT_RATE_LIMITER.limit({ key: `website-audit:${ip}` });
    if (!rateLimit.success) throw new Error("rate_limited");

    return createAuditReport({
      normalizedUrl,
      strategy,
      apiKey: env.PAGESPEED_API_KEY,
      fetcher,
      cache,
      cacheKey,
      ttl: Number(env.CACHE_TTL_SECONDS) || DEFAULT_CACHE_TTL
    });
  })();
  inFlight.set(cacheKey.url, reportPromise);
  try {
    const report = await reportPromise;
    return respond({ ...report, cached: false }, 200, { "x-audit-cache": "MISS" });
  } catch (error) {
    const code = getSafeOperationError(error);
    return fail(code, code === "rate_limited" ? { "retry-after": "60" } : {});
  } finally {
    inFlight.delete(cacheKey.url);
  }
};

export default {
  fetch(request, env, ctx) {
    return handleAuditRequest(request, env, ctx);
  }
};
