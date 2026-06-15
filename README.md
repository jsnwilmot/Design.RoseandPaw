# Rose & Paw Digital Designs

Eleventy-generated static website for Rose & Paw Digital Designs.

Live site: https://design.roseandpaw.ca

## Architecture

Eleventy and Nunjucks generate plain HTML, CSS, JavaScript, images, `robots.txt`, `sitemap.xml`, and `CNAME` into `_site/`. There is no client-side framework or runtime template fetching.

```text
src/
  _data/                 Shared business, navigation, package, FAQ, and site data
  _includes/
    layouts/             Base page layout
    partials/            Shared head, header, footer, and structured data
  pages/                 Page-specific semantic content and metadata
  site-config.js.njk     Non-secret browser configuration generated from shared data
  sitemap.xml.njk        Sitemap generated from page front matter
images/                  Public delivery-ready images, copied to _site/images
_source-assets/          Original/editable assets retained in Git, never deployed
tools/                   Validation, local server, Lighthouse, and image tools
worker/                  Cloudflare Worker for the secure website-audit API
test/                    Node test suite for audit security and normalization
reports/                 Ignored generated reports; only reports/.gitignore is tracked
_site/                   Ignored generated deployment output
```

Shared content is maintained in:

- `src/_data/business.json`: business identity, contact details, URLs, logos, analytics ID
- `src/_data/navigation.json`: header and footer navigation
- `src/_data/packages.json`: package cards, prices, form values, URL mapping, and Offer schema
- `src/_data/faq.json`: visible FAQ answers and FAQPage schema
- `src/_data/site.json`: non-secret site configuration and maintained sitemap date
- `src/pages/*.njk`: page metadata/front matter and page-specific content

Do not manually create root HTML files. Edit source templates/data and build.

## Requirements

- Node.js 22
- npm 10

Install the locked dependencies:

```bash
npm ci
```

## Commands

```bash
npm run dev
npm run build
npm run check
npm test
npm run check:worker
npm run lighthouse
npm run optimize:images
```

- `npm run dev`: Eleventy development server with rebuilds
- `npm run build`: generate `_site/`
- `npm run check`: build, then validate the generated site
- `npm test`: run the audit endpoint, URL validation, caching, normalization, and client-helper tests
- `npm run check:worker`: validate and bundle the Cloudflare Worker without deploying it
- `npm run lighthouse`: build, then audit all public pages and write ignored reports
- `npm run optimize:images`: optional source image optimization helper

Validation covers JSON-LD, internal links and anchors, images and `srcset`, duplicate IDs, H1 counts, metadata, canonicals, sitemap/noindex rules, form labels, linked assets, and external-link security.

## Public URLs

The build preserves:

- `/`
- `/services.html`
- `/packages.html`
- `/portfolio.html`
- `/about.html`
- `/faq.html`
- `/contact.html`
- `/privacy.html`
- `/terms.html`
- `/website-audit/`
- `/client-intake.html`
- `/thank-you.html`
- `/404.html`
- `/robots.txt`
- `/sitemap.xml`

Only the ten indexable public pages are generated into `sitemap.xml`. Client intake, thank-you, and 404 pages remain excluded.

## Forms And Browser Configuration

Forms use Web3Forms with its zero-configuration hCaptcha integration. Protected form pages load the shared local CAPTCHA loader immediately, but delay the Web3Forms and hCaptcha third-party scripts until the form approaches the viewport or receives user interaction. The public quote form submits with JavaScript and displays inline success. Without JavaScript, the forms provide direct email and phone alternatives. The unlisted client intake form redirects to `/thank-you.html`.

Select hCaptcha for each form in the Web3Forms dashboard. Web3Forms supplies the hCaptcha configuration, so this repository does not require a CAPTCHA site key or secret. Cloudflare Turnstile is not used because Web3Forms requires a paid plan for that integration.

Google Analytics 4 uses the Measurement ID in `src/_data/business.json` and loads only after analytics consent. Advertising storage, user data, and personalization remain denied.

## Free Website Audit

`/website-audit/` submits a public webpage URL to the route-scoped Cloudflare Worker at `/api/website-audit`. The Worker calls Google PageSpeed Insights, requests the performance, accessibility, best-practices, and SEO Lighthouse categories, and returns only a normalized report used by the browser interface.

The API:

- accepts JSON `POST` requests up to 4 KiB and rejects browser requests from origins outside the configured allowlist
- normalizes domains without a protocol to HTTPS
- rejects localhost, embedded credentials, malformed hosts, private/loopback/link-local IPv4 and IPv6 ranges, unsupported protocols, control characters, and excessive URL lengths
- never downloads or renders the submitted page directly
- returns valid cached reports before rate limiting or generating a new report
- rate-limits uncached reports by connecting IP through a Cloudflare Workers Rate Limiting binding
- suppresses concurrent duplicate PageSpeed requests for the same normalized URL and strategy within each Worker isolate
- caches successful reports by normalized URL and strategy for 30 minutes using the Workers Cache API
- applies a 60-second PageSpeed request timeout and returns safe error codes
- keeps the PageSpeed API key in a Cloudflare secret

Origin validation reduces browser-based cross-origin abuse but is not authentication. Requests without an `Origin` header still receive all normal validation, cache, honeypot, and rate-limit controls because non-browser callers can omit or spoof that header. Allowed browser origins receive explicit CORS headers; arbitrary origins are never reflected. Public callers never receive the Google PageSpeed API key.

The request-for-help form uses the existing Web3Forms access-key pattern and free-plan hCaptcha integration. It sends a concise audit summary, not raw Lighthouse JSON.

### Audit Environment

Create a Google Cloud API key with PageSpeed Insights API access, then add it as a Cloudflare Worker secret:

```bash
npx wrangler secret put PAGESPEED_API_KEY
```

For local Worker API development, copy `.dev.vars.example` to `.dev.vars` and replace the placeholder:

```bash
npx wrangler dev
```

`ALLOWED_ORIGINS`, the 30-minute cache TTL, route, and rate-limit binding are non-secret values in `wrangler.jsonc`. The allowlist contains the production site and the existing local Eleventy development origins. Do not add PageSpeed keys to Eleventy data, browser JavaScript, generated files, or GitHub variables.

The existing hCaptcha integration does not require a repository environment variable. Keep hCaptcha selected for the website-audit help form in the Web3Forms dashboard.

### Optional Cloudflare Dashboard Protections

These protections are dashboard actions and are not configured by this repository:

- Add a route-specific Cloudflare rate-limiting rule for uncached `/api/website-audit` abuse where plan features permit.
- Enable available free-plan bot protections and monitor false positives before tightening them.
- Restrict the Google PageSpeed API key to the PageSpeed Insights API, set quota limits, and monitor usage.
- Configure Cloudflare and Google Cloud usage alerts.
- Monitor Worker cache-hit rates and unexpected audit-generation volume.

## SEO And Structured Data

Page titles, descriptions, robots directives, canonicals, sitemap inclusion, change frequency, and priority live in each page's front matter.

Shared structured data is generated from centralized data:

- Homepage: `LocalBusiness`, `ProfessionalService`, `Organization`, `WebSite`, and breadcrumbs
- Services: `Service` and breadcrumbs
- Packages: `OfferCatalog` from package data and breadcrumbs
- FAQ: `FAQPage` from visible FAQ data and breadcrumbs
- Other pages: breadcrumbs

Do not add unsupported `Review` or `AggregateRating` schema.

## Deployment

Generated output is not committed.

GitHub Pages deploys `_site/` through `.github/workflows/deploy-pages.yml`:

1. Install with `npm ci`
2. Build and validate with `npm run check`
3. Upload `_site/`
4. Deploy through GitHub Pages Actions

Configure GitHub Pages source as **GitHub Actions**.

For Cloudflare Pages:

- Build command: `npm run build`
- Output directory: `_site`
- Node version: `22`

`CNAME`, `robots.txt`, public images, `styles.css`, and browser scripts are copied into `_site/` during the build. `_source-assets/`, `_site/`, reports, and development files are not deployed.

### Website Audit Worker Deployment

The current static GitHub Pages deployment remains unchanged. The separate `rose-and-paw-website-audit` Worker is routed only to `design.roseandpaw.ca/api/website-audit`, so the rest of the website continues to be served by the existing static deployment.

Before the first Worker deployment:

1. Confirm `design.roseandpaw.ca` traffic is proxied through Cloudflare so the Worker route can intercept `/api/website-audit`.
2. Create and restrict a Google PageSpeed Insights API key.
3. Run `npx wrangler secret put PAGESPEED_API_KEY`.
4. Run `npm test`, `npm run check`, and `npm run check:worker`.
5. Deploy with `npm run deploy:audit-worker`.

The manual `.github/workflows/deploy-audit-worker.yml` workflow requires repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The Cloudflare API token must have the minimum permissions needed to deploy the Worker and route. The PageSpeed key remains a Worker secret in Cloudflare and is not stored in GitHub.

## Maintenance Rules

- Preserve current public URLs and canonical URLs.
- Keep one H1 per page and semantic landmarks/forms.
- Update shared data instead of duplicating values in templates or JavaScript.
- Keep package prices, cards, contact options, URL selection, and schema synchronized through `packages.json`.
- Keep visible FAQ content and FAQ schema synchronized through `faq.json`.
- Update `site.lastModified` when making meaningful public content changes.
- Keep `_site/` and generated reports out of Git.
- Run `npm run check` and rendered browser QA after template, content, form, or navigation changes.
- Do not invent testimonials, client claims, ranking guarantees, fake results, or fake portfolio work.

## Known Limitations

- Successful Web3Forms and hCaptcha delivery requires the corresponding Web3Forms dashboard configuration and live third-party service access, so it cannot be fully proven by local static checks.
- Website audit results depend on Google PageSpeed Insights availability and quota. Lighthouse lab results cover one public webpage and are not a complete manual audit or real-user performance report.
- Lighthouse scores depend on the local browser and machine.
