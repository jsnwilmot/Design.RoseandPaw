import { normalizePageSpeedResponse } from "./pagespeed.mjs";
import { normalizePublicUrl } from "./url-validation.mjs";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff"
};
const ALLOWED_STRATEGIES = new Set(["mobile", "desktop"]);
const DEFAULT_CACHE_TTL = 1800;
const PAGESPEED_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

const jsonResponse = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...JSON_HEADERS, ...extraHeaders }
});

const errorResponse = (code, status = 400) => jsonResponse({ error: code }, status);

const readJsonBody = async (request) => {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 4096) throw new Error("invalid_request");
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new Error("invalid_request");
  }

  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid_request");
  const chunks = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > 4096) {
      await reader.cancel();
      throw new Error("invalid_request");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
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

export const handleAuditRequest = async (request, env, ctx, dependencies = {}) => {
  const fetcher = dependencies.fetcher || fetch;
  const cache = dependencies.cache || caches.default;
  const requestUrl = new URL(request.url);

  if (requestUrl.pathname !== "/api/website-audit") return errorResponse("not_found", 404);
  if (request.method !== "POST") return errorResponse("method_not_allowed", 405, { allow: "POST" });
  const allowedOrigin = env.ALLOWED_ORIGIN || requestUrl.origin;
  if (request.headers.get("origin") && request.headers.get("origin") !== allowedOrigin) return errorResponse("forbidden_origin", 403);
  if (!env.PAGESPEED_API_KEY || !env.AUDIT_RATE_LIMITER) return errorResponse("service_not_configured", 503);

  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    return errorResponse("invalid_request");
  }

  const strategy = ALLOWED_STRATEGIES.has(body?.strategy) ? body.strategy : "mobile";
  if (body?.company_website) return errorResponse("invalid_request");

  let normalizedUrl;
  try {
    normalizedUrl = normalizePublicUrl(body?.url);
  } catch (error) {
    return errorResponse(error.message);
  }

  const cacheKey = await createCacheKey(normalizedUrl, strategy);
  const cached = await cache.match(cacheKey);
  if (cached) {
    return jsonResponse({ ...await cached.json(), cached: true }, 200, { "x-audit-cache": "HIT" });
  }

  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimit = await env.AUDIT_RATE_LIMITER.limit({ key: `website-audit:${ip}` });
  if (!rateLimit.success) return errorResponse("rate_limited", 429, { "retry-after": "60" });

  try {
    const payload = await fetchPageSpeed(normalizedUrl, strategy, env.PAGESPEED_API_KEY, fetcher);
    const report = normalizePageSpeedResponse(payload, normalizedUrl, strategy);
    const ttl = Number(env.CACHE_TTL_SECONDS) || DEFAULT_CACHE_TTL;
    const cacheResponse = new Response(JSON.stringify(report), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": `public, max-age=${ttl}`
      }
    });
    ctx.waitUntil(cache.put(cacheKey, cacheResponse));
    return jsonResponse({ ...report, cached: false }, 200, { "x-audit-cache": "MISS" });
  } catch (error) {
    if (error.name === "TimeoutError") return errorResponse("pagespeed_timeout", 504);
    if (error.message === "pagespeed_rate_limited") return errorResponse("pagespeed_rate_limited", 503);
    return errorResponse("pagespeed_failed", 502);
  }
};

export default {
  fetch(request, env, ctx) {
    return handleAuditRequest(request, env, ctx);
  }
};
