# Rose & Paw Digital Designs Website Audit

Audit date: June 15, 2026

Live site: https://design.roseandpaw.ca

Repository: `/workspaces/Design.RoseandPaw`

## 1. Executive Summary

### Overall website condition

Rose & Paw Digital Designs is a well-structured, production-ready Eleventy website with strong fundamentals. The static architecture is simple, the generated site is small, core business data is substantially centralized, internal links validate, important routes work, the custom website-audit Worker has meaningful input validation and rate limiting, and representative static pages achieved excellent PageSpeed results.

The site is strongest when it remains purely static. Mobile PageSpeed tests for Services and FAQ scored 100 across Performance, Accessibility, Best Practices, and SEO. The homepage and About page scored 98 Performance and 100 in the other categories. Measured LCP on these pages was 1.5 to 1.6 seconds with zero CLS and zero TBT.

The weakest area is third-party form-page performance. The Contact page and Website Audit page load Web3Forms/hCaptcha immediately and scored only 37 and 42 for mobile Performance, with approximately 9-second LCP and more than 1 second of TBT. Source review also found an accessibility defect in the portfolio lightbox that automated testing did not identify, and the deployed site lacks several recommended security response headers.

No committed private API key, token, password, or private credential was found. Public Web3Forms access identifiers and the GA measurement ID are intentionally browser-visible identifiers, not private secrets. They should not be treated as secret credentials, but repeated form configuration should be centralized.

### Strongest areas

- Clean static Eleventy/Nunjucks architecture with no unnecessary client framework.
- Excellent measured performance on pages without third-party form scripts.
- Strong automated accessibility results and good semantic foundations.
- Valid internal links, anchors, images, metadata, sitemap entries, and JSON-LD.
- Good responsive image usage, explicit image dimensions, lazy loading, and modern formats.
- Strong Worker URL validation, response normalization, caching, rate limiting, and safe error handling.
- Clear business positioning, pricing, service area, ownership terms, and calls to action.
- Useful project documentation and CI deployment workflows.

### Weakest areas

- Web3Forms/hCaptcha causes severe mobile performance and Best Practices regressions on form pages.
- The image lightbox declares itself modal without trapping focus or making the background inert.
- Live static responses lack CSP, frame protection, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`.
- Cloudflare email obfuscation adds an extra blocking script to every HTML page and changes deployed markup.
- SEO metadata length warnings remain on six pages.
- The portfolio and trust evidence are limited for a design-services business.
- Large global CSS and JavaScript files concentrate unrelated behavior and increase regression risk.

### Overall risk level

**Moderate-low.** No P0 issue was found. The site is operational and generally safe, but the form-page performance regression and modal accessibility defect should be addressed before calling the site fully optimized.

### Production readiness

**Ready for production with high-priority remediation recommended.** Core functionality, crawling, static rendering, and Worker validation are working. The current site should remain online while the P1 items are repaired.

### Five most important actions

1. Delay Web3Forms/hCaptcha loading until the form is near the viewport or the user interacts with it.
2. Rebuild the portfolio lightbox as a real accessible dialog with focus containment, background inertness, and specific trigger names.
3. Add recommended security headers at Cloudflare while testing all third-party integrations.
4. Shorten the six flagged titles/meta descriptions and remove the public GA measurement-ID sentence from service copy.
5. Add automated rendered-browser coverage for navigation, dialogs, forms, viewport reflow, and key live routes.

## 2. Audit Scope and Method

### Files and areas reviewed

- `AGENTS.md`, `README.md`, `.gitignore`, `.dev.vars.example`
- `package.json`, `package-lock.json`
- `.eleventy.js`, all `src/` data, layouts, partials, pages, sitemap, and browser configuration
- `styles.css`, `script.js`, `audit.js`, `audit-client-utils.mjs`
- All public images and source-asset organization
- `tools/`, `test/`, `worker/`, `wrangler.jsonc`
- GitHub Actions workflows
- Generated `_site/` output
- Live response bodies, routes, headers, Worker responses, links, and representative PageSpeed results

No redirects file, custom headers file, manifest, service worker, collection-specific content directory, or bundled font files exist.

### Pages tested

Repository/generated validation covered all 13 HTML files and all 10 indexable sitemap pages.

Live HTTP checks covered:

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
- A missing URL returning the custom 404 response
- Sitemap, robots, scripts, styles, audit modules, configuration, and social image

Mobile PageSpeed-backed tests covered Homepage, Services, About, FAQ, Contact, Website Audit, and a missing-page/404 response. Desktop PageSpeed-backed testing covered the Homepage.

### Viewports and browsers

The source CSS was reviewed for the requested 320, 375, 390, 768, 1024, 1280, and 1440+ widths. Responsive rules exist at 560, 640, 760, and 1120 pixels.

Actual rendered viewport and keyboard testing could not be completed because the audit environment has no Chrome/Chromium, Firefox, Safari, Edge, Playwright, or equivalent browser executable. `npm run lighthouse` was attempted both sandboxed and with escalated permissions, but Lighthouse completed 0 of 10 audits because `CHROME_PATH` could not be resolved.

Safari-compatible behavior was reviewed from source only. Features requiring targeted browser QA include `inert`, `backdrop-filter`, `100svh`, optional chaining, nullish assignment, `scrollBy({ behavior: "smooth" })`, and `AbortSignal.timeout`.

### Tools and methods

- Repository-wide manual architecture, accessibility, security, SEO, performance, content, and maintainability review
- Eleventy build and custom generated-site validator
- Node test suite and syntax checks
- Wrangler dry-run
- npm dependency audit and outdated check
- Live HTTP status, timing, header, route, and link checks
- Live-versus-generated output comparison
- Live website-audit Worker functional/security checks
- Live PageSpeed-backed mobile and desktop audits
- Static color-contrast calculations for key design tokens

### Environment limitations

- No installed browser executable, so no screenshots, visual regression review, keyboard-only browser walkthrough, browser console inspection, or native Lighthouse CLI scores were possible.
- Form submissions were not sent because doing so would create real business messages.
- hCaptcha completion and Web3Forms dashboard configuration cannot be fully validated without interactive browser access and service-side access.
- Cloudflare dashboard rules, DNS settings, Search Console, Analytics reports, and Google Business Profile were not accessible.
- The first build/check attempts were run concurrently with `npm ci` and failed while dependencies were being replaced. They were rerun successfully after installation and are not project defects.

## 3. Scorecard

| Category | Score | Basis |
|---|---:|---|
| Accessibility | 91 | Automated PageSpeed accessibility scored 100 on every tested page; semantic structure, focus styles, labels, skip link, reduced motion, and keyboard handlers are strong. The modal focus defect and required-field communication reduce the score. |
| Performance | 82 | Static pages score 98-100, but Contact scored 37 and Website Audit scored 42 on mobile due primarily to immediate third-party CAPTCHA/form loading. |
| Technical SEO | 94 | Indexability, canonicals, sitemap, robots reference, headings, metadata, and schema validate. Six metadata-length warnings and limited page-specific schema remain. |
| On-page and local SEO | 87 | Strong Lethbridge/Canada-wide messaging and service content. Local trust/entity signals and portfolio depth can be improved without keyword stuffing. |
| UI design | 89 | Consistent tokens, spacing, cards, buttons, responsive grids, and brand treatment. Visual browser QA was unavailable, and the design relies heavily on repeated card/section patterns. |
| User experience | 86 | Clear pricing, process, CTAs, and contact paths. Third-party form slowness, lightbox behavior, and limited portfolio evidence reduce confidence. |
| Mobile responsiveness | 90 | Responsive grids, mobile navigation, full-width mobile CTAs, responsive images, and reflow-minded CSS are present. Actual 320px browser QA was unavailable. |
| Code quality | 88 | Clear naming, safe DOM text rendering, focused Worker modules, and strong validation. Large global CSS/JS and some repeated configuration increase risk. |
| Maintainability | 85 | Shared data is used effectively. Form settings, business wording, page metadata, and large global assets still create maintenance hotspots. |
| Security | 86 | No private secrets found; HSTS, Worker validation, rate limiting, safe errors, and no obvious XSS/SSRF path are strong. Missing static security headers and limited audit-endpoint abuse protection remain. |
| Functional reliability | 91 | Routes, internal links, external links, custom 404, Worker validation, tests, and build pass. Browser interactions and real form delivery were not fully testable. |
| Content and conversion | 86 | Strong offer clarity, pricing, process, service area, ownership, and CTAs. Portfolio depth, proof, specific timelines, and package decision support can improve. |

**Overall score: 88/100.**

## 4. Priority Action Plan

### P0, Critical

No P0 issues were found.

### P1, High Priority

| ID | Priority | Category | Affected page/file | Problem and evidence | User/business impact | Exact recommended fix | Effort | Regression risk | Validation method |
|---|---|---|---|---|---|---|---|---|---|
| P1-01 | P1 | Performance | `contact.html`, `/website-audit/`, `src/_includes/layouts/base.njk:11-13` | Immediate Web3Forms/hCaptcha loading causes severe mobile regressions. Live Contact: Performance 37, LCP 8.9s, TBT 1,000ms, Best Practices 81. Website Audit: Performance 42, LCP 8.8s, TBT 1,150ms, Best Practices 81. | Slow forms undermine conversions and fail the 95+ target on the highest-intent pages. | Load the third-party CAPTCHA script only when its form approaches the viewport or receives first interaction. Preserve a clear no-JS fallback and reserve widget space. Confirm whether the deprecated API warning originates in the vendor script and report it to Web3Forms if it cannot be avoided. | Medium | Medium | Mobile PageSpeed/Lighthouse on Contact and Website Audit; complete CAPTCHA and submit test; verify no layout shift. |
| P1-02 | P1 | Accessibility / functionality | `script.js:476-546`, `src/pages/portfolio.njk:27` | The lightbox uses `role="dialog"` and `aria-modal="true"` but does not trap focus or make background content inert. The global selector also converts all homepage `.portfolio-preview img` elements into generic buttons named “Open larger portfolio image.” | Keyboard and screen-reader users can move behind a supposedly modal dialog, and multiple controls have indistinguishable names. Likely WCAG 2.2 failures: 2.4.3 Focus Order, 2.4.6 Headings and Labels, and 4.1.2 Name, Role, Value. | Limit activation to `[data-lightbox-image]`; use a semantic `<button>` around the image; include the subject in each accessible name; set non-dialog content inert while open; contain Tab/Shift+Tab; close on Escape; restore focus. | Medium | Medium | Keyboard-only test on Homepage and Portfolio; screen-reader dialog announcement; axe; verify focus never leaves the open dialog. |
| P1-03 | P1 | Security | Live Cloudflare/GitHub Pages responses | Live HTML and static assets have HSTS but lack CSP, frame protection, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`. | Increases exposure to clickjacking, content injection impact, referrer leakage, and unnecessary browser capabilities. | Add headers at Cloudflare using response-header rules or a narrowly scoped Worker. Start with `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a restrictive `Permissions-Policy`, and `Content-Security-Policy` including `frame-ancestors 'none'`. Build CSP from observed dependencies and test Web3Forms, hCaptcha, GA, Cloudflare email protection, and the audit API before enforcement. | Medium | High | Inspect live headers; run CSP in Report-Only first; submit forms; run PageSpeed Best Practices; verify external links and CAPTCHA. |

### P2, Medium Priority

| ID | Priority | Category | Affected page/file | Problem and evidence | User/business impact | Exact recommended fix | Effort | Regression risk | Validation method |
|---|---|---|---|---|---|---|---|---|---|
| P2-01 | P2 | Security / abuse prevention | `worker/index.mjs:85-87`, `README.md:109` | Documentation says the API accepts only same-origin requests, but a live POST without `Origin` returned 200 from cache. Foreign origins are rejected, but non-browser clients can omit or spoof Origin. | Makes the same-origin claim inaccurate and leaves PageSpeed quota abuse primarily controlled by per-IP rate limiting. | Correct the documentation. Consider Cloudflare Turnstile or another Worker-side proof for new uncached audits, plus stronger Cloudflare rate-limit/bot rules. Keep cached reports available before rate limiting if desired. | Medium | Medium | Live no-Origin, foreign-Origin, cached, uncached, and rate-limit tests; verify legitimate audit flow. |
| P2-02 | P2 | Accessibility / forms | Contact, Website Audit help form, Client Intake | Required fields use native `required`, but labels do not visually identify required versus optional fields before submission. | Sighted and cognitive-accessibility users must discover requirements through errors. Relates to WCAG 3.3.2 Labels or Instructions. | Add a short “Required fields are marked…” instruction and visible required indicators in labels; keep native `required`; do not use color alone. | Small | Low | Visual review, keyboard submission, screen-reader label check, axe. |
| P2-03 | P2 | SEO | `src/pages/index.njk:6`, `about.njk:6`, `services.njk:6`, `contact.njk:8`, `faq.njk:7`, `terms.njk:7` | `npm run check` reports three long titles and three long meta descriptions. | Search engines may truncate important wording and weaken click-through clarity. | Rewrite within the validator’s practical ranges while preserving target intent and unique wording. | Small | Low | `npm run check`; inspect search-snippet previews; confirm uniqueness. |
| P2-04 | P2 | Performance / deployment | Live static asset headers, non-fingerprinted `styles.css`, `script.js`, images | Static assets use only `max-age=14400`; PageSpeed repeatedly flags efficient cache lifetimes. | Repeat visits download assets more often than necessary; limits performance margin. | Add content hashes or versioned asset URLs during Eleventy build, then apply `public, max-age=31536000, immutable` to versioned assets at Cloudflare. Keep HTML short-lived. | Medium | Medium | Compare asset URLs after build; inspect live Cache-Control; repeat-view Lighthouse/PageSpeed. |
| P2-05 | P2 | Performance / deployment | Live HTML, Cloudflare email protection | Cloudflare email obfuscation rewrites every email link and injects an additional blocking decode script into every HTML page. Live HTML differs from `_site` only mainly because of this feature. | Adds a network/script dependency, complicates CSP, degrades no-JS email access, and makes deployed output harder to validate. | Evaluate disabling Cloudflare Email Address Obfuscation. Spam protection is already handled at forms; public contact email is intentionally visible. If retained, include it in CSP and browser QA. | Small | Low | Compare live and `_site`; test email links with and without JS; rerun PageSpeed. |
| P2-06 | P2 | Maintainability | `styles.css` (1,987 lines), `script.js` (550 lines) | Global files contain navigation, consent, analytics, carousel, forms, lightbox, audit-adjacent behavior, and all page styles. | Unrelated changes have a wider regression surface and make ownership/testing harder. | Split by stable responsibility only: global/base, components/forms, page-specific audit styles; split JS into global UI, forms, and portfolio modules. Keep output simple and avoid a bundler unless it provides measurable value. | Medium | Medium | Build/check, browser regression, compare generated asset count/size, no duplicated selectors. |
| P2-07 | P2 | Maintainability / data | Form templates and `tools/check-site.js:124-147` | Public form identifiers and expected form-page mappings are repeated across three templates and the validator. Business/service wording is also repeated in several page bodies. | Configuration changes can break forms or validation inconsistently. | Add non-secret form configuration to `src/_data/` and generate hidden fields/validation expectations from shared data. Centralize only genuinely shared content; keep page-specific copy local. | Medium | Medium | Change a test value in a branch; build; verify all forms and validator derive the same value; do not expose private secrets. |
| P2-08 | P2 | Content / conversion | Homepage and `src/pages/portfolio.njk` | Only one named case study is shown; other portfolio entries are described as sample work. Outcomes are qualitative rather than measurable. | Design buyers have limited proof when deciding whether to contact the business. | Add more verified work as it becomes available, with permission, scope, constraints, and honest outcomes. Do not invent metrics or clients. | Medium | Low | Content review against client permission; verify links/images; conversion tracking review. |
| P2-09 | P2 | Local SEO / trust | Global content and structured data | Lethbridge and Canada-wide service messaging is consistent, but there is no visible Google Business Profile link and limited locally specific proof beyond one salon project. | Reduces local entity confidence and local conversion trust. | Add the verified Google Business Profile link where useful, keep NAP/service-area details aligned, and add genuine Lethbridge-area case studies or service examples over time. Do not create doorway pages or fake location pages. | Small | Low | Compare site details with GBP; validate links; review Search Console/local queries. |
| P2-10 | P2 | Structured data / architecture | `.eleventy.js:12-86` | Structured-data generation is embedded in a large Eleventy filter. Non-home pages reference the business `@id` without emitting the business node on those pages; `WebPage` nodes are absent. This is valid enough to parse but harder to maintain and less explicit. | Increases schema-maintenance risk and misses optional entity relationships. | Move schema assembly to a dedicated data/helper module. Emit consistent Organization/Business references and optional page-specific `WebPage`/`AboutPage`/`ContactPage` nodes only where accurate. Preserve the current no-fake-review rule. | Medium | Medium | JSON-LD parse test; Schema.org validator; Google Rich Results Test where eligible. |
| P2-11 | P2 | Testing / reliability | `test/audit.test.mjs`, no browser tests | Tests cover Worker/client helpers well but not navigation, lightbox, carousel, consent, forms, responsive reflow, or live deployment headers. | UI regressions and deployment changes can pass CI unnoticed. | Add a small rendered-browser suite when a browser is available: mobile nav, skip link, lightbox focus, form states, package query selection, cookie choices, 320px overflow, and live header smoke checks. | Medium | Low | Run tests in CI with a pinned browser; intentionally break one behavior to confirm failure. |

### P3, Low Priority

| ID | Priority | Category | Affected page/file | Problem and evidence | User/business impact | Exact recommended fix | Effort | Regression risk | Validation method |
|---|---|---|---|---|---|---|---|---|---|
| P3-01 | P3 | Dependency cleanup | `package.json:17`, `tools/serve-static.js` | The `serve` package is installed but `npm run serve` uses the custom Node server. | Unnecessary dependency and audit surface. | Remove `serve` if no undocumented workflow uses it. | Small | Low | `npm ci`, `npm run serve`, `npm run check`, `npm audit`. |
| P3-02 | P3 | Dependency maintenance | `package.json` / lockfile | `npm outdated` found newer compatible Eleventy and Lighthouse releases and a newer Sharp major/minor release. | Delays fixes and increases future upgrade size. | Update Eleventy and Lighthouse in a focused maintenance PR; review Sharp release notes before upgrading. | Small | Medium | Full test/check/worker/Lighthouse suite in a browser-enabled environment. |
| P3-03 | P3 | SEO / metadata maintenance | `src/_data/site.json:3`, `src/sitemap.xml.njk:10` | One global `lastModified` date is emitted for all indexable pages. | Search engines receive less precise change information. | Prefer per-page maintained dates or Git-derived dates only if reliable; otherwise omit `lastmod` rather than publishing inaccurate uniform dates. | Small | Low | Inspect sitemap after content-only changes; validate XML. |
| P3-04 | P3 | Deployment documentation | `robots.txt`, live `/robots.txt` | Cloudflare prepends managed AI-crawler directives, so the deployed file differs from the repository. Search crawling remains allowed and sitemap remains present. | Creates operational surprise and makes repository-only review incomplete. | Document the Cloudflare managed-robots setting and desired AI crawler policy. Keep search crawling allowed. | Small | Low | Compare live and source robots; inspect Cloudflare setting. |
| P3-05 | P3 | PWA/browser polish | `images/favicon-192.png`, no manifest | A 192px icon exists but no web app manifest references it. A manifest is not required for this website. | Minor missed install/bookmark polish only. | Either add a minimal manifest with accurate branding or remove the unused icon. Do not add a service worker without a real offline requirement. | Small | Low | Manifest validation and browser installability check, or confirm file removal has no references. |
| P3-06 | P3 | Content clarity | `src/pages/services.njk:106`, `src/pages/privacy.njk:34` | Customer-facing copy exposes the site's GA measurement ID and describes implementation details that do not help buyers. The ID is public, not secret. | Distracts visitors and can look overly technical. | Replace the literal ID with benefit-focused wording; keep implementation details in documentation/privacy only where required. | Small | Low | Content review and build/check. |

## 5. Accessibility Findings

### Confirmed issues

- **Modal focus management:** `script.js:476-546` creates an ARIA modal dialog without focus containment or background inertness. Fix under P1-02.
- **Indistinguishable image-button names:** the selector `.portfolio-preview img` affects the homepage and portfolio page, and every converted image receives the same accessible name. Fix under P1-02.
- **Required-field communication:** native required semantics exist, but visible labels do not identify required fields before submission. Fix under P2-02.

### Likely issues requiring browser confirmation

- The cookie banner moves focus to the first choice on initial page load and when reopened, but closing it does not restore focus to the Cookie settings trigger. Add focus restoration and Escape handling if browser testing confirms disorientation.
- The mobile menu correctly uses `hidden`, `inert`, `aria-expanded`, Escape, and focus return. Confirm VoiceOver/Safari behavior because `inert` support and fixed/sticky combinations should be tested on real devices.
- hCaptcha accessibility depends on third-party widget behavior and cannot be guaranteed from source.
- Review-carousel controls and keyboard scrolling are implemented, but screen-reader verbosity and focus behavior should be tested.

### Passed checks

- Document language is `en-CA`.
- Every generated public page has exactly one H1.
- Heading hierarchy is generally logical.
- Every page has a `<main id="main">` target and a skip link.
- Strong global `:focus-visible` outline is present.
- Reduced-motion handling disables smooth scrolling and animations.
- Mobile navigation has an accessible toggle name, state, Escape handling, and hidden/inert closed state.
- FAQ uses native `<details>` and `<summary>`.
- Forms use visible labels and native controls.
- Form status messages use polite live regions; important error states can receive focus.
- Images have alt attributes and explicit width/height.
- Decorative header/footer logos use empty alt text with adjacent brand text.
- External `_blank` links include `noopener noreferrer`.
- Review stars have a text alternative and are not conveyed by color alone.
- Key calculated text-token contrast ratios pass AA for normal text: bronze on white 5.46:1, muted on paper 5.73:1, white on navy 18.94:1.
- PageSpeed accessibility scored 100 on all seven representative live mobile tests and the homepage desktop test.

## 6. Performance Findings

### Measured live results

| Page / mode | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS | Speed Index |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Homepage mobile | 98 | 100 | 100 | 100 | 0.9s | 1.5s | 0ms | 0 | 3.8s |
| Homepage desktop | 100 | 100 | 100 | 100 | 0.2s | 0.4s | 0ms | 0 | 0.3s |
| Services mobile | 100 | 100 | 100 | 100 | 0.9s | 1.5s | 0ms | 0 | 0.9s |
| About mobile | 98 | 100 | 100 | 100 | 0.9s | 1.6s | 0ms | 0 | 3.8s |
| FAQ mobile | 100 | 100 | 100 | 100 | 0.8s | 1.5s | 0ms | 0 | 0.8s |
| Contact mobile | 37 | 100 | 81 | 100 | 5.0s | 8.9s | 1,000ms | 0 | 7.4s |
| Website Audit mobile | 42 | 100 | 81 | 100 | 3.2s | 8.8s | 1,150ms | 0 | 5.0s |
| Missing-page response mobile | 100 | 100 | 96 | 61 | 0.8s | 1.5s | 0ms | 0 | 2.2s |

The missing-page SEO score is expected because the response is a 404 and intentionally noindex. The missing-page Best Practices reduction reported a console error, but raw browser console detail was unavailable.

### Resource and delivery observations

- Generated deployment size is approximately 972 KiB across 39 files.
- Public images total approximately 680 KiB; the largest delivery-ready image is under 83 KiB.
- Global CSS is approximately 34 KiB uncompressed; global JS is approximately 17 KiB; audit JS is approximately 11 KiB.
- HTML files range from roughly 7 KiB to 27 KiB.
- Images use WebP where practical, responsive `srcset` where useful, explicit dimensions, and lazy loading below the fold.
- No custom webfonts are downloaded.
- CLS measured 0 on every PageSpeed-backed test.
- Static pages show zero TBT.
- Live homepage TTFB from the audit environment was approximately 116ms; representative route checks were approximately 116-156ms.
- Cloudflare/GitHub responses use compression negotiation but static asset caching is short and filenames are not fingerprinted.
- CSS remains render-blocking and PageSpeed estimates up to 330ms savings on some pages. Given the small stylesheet, fix third-party scripts and caching before introducing critical-CSS complexity.
- PageSpeed reports forced-reflow findings on Homepage/About, likely related to early DOM/layout reads such as carousel state measurement or header behavior. TBT is zero, so this is not currently a material user problem.

### Specific remedies

1. Fix immediate third-party form script loading first.
2. Apply long-lived immutable caching to versioned static assets.
3. Recheck whether Cloudflare email obfuscation is worth its global script cost.
4. After those changes, rerun mobile Lighthouse with a real browser before considering CSS inlining or splitting.
5. Keep current image dimensions, responsive sources, WebP delivery, system-font stack, and static architecture.

## 7. SEO Findings

### Technical SEO

Passed:

- Unique title, description, canonical, and robots directives exist for indexable pages.
- Canonicals use the intended public `.html` URLs and `/website-audit/`.
- Sitemap contains 10 indexable pages and excludes noindex pages.
- `robots.txt` allows crawling and references the sitemap.
- Missing routes return HTTP 404 with a useful custom page.
- Internal links, anchors, images, linked assets, and sitemap mappings pass `npm run check`.
- No redirect chains were found in the main internal navigation because links point directly to final URLs.
- Open Graph and Twitter metadata are consistently emitted.

Required/strong recommendations:

- Fix the six metadata-length warnings under P2-03.
- Document Cloudflare's live robots modifications.
- Consider per-page `lastmod` values or omit inaccurate uniform dates.

Not required:

- A web app manifest is optional and does not improve normal search indexing.
- `meta keywords` should not be added.
- Changing valid `.html` URLs solely to appear “cleaner” is not recommended because preserving public URLs is a project requirement.

### On-page SEO

Strengths:

- Pages have clear search intent and one meaningful H1.
- Service, package, FAQ, portfolio, and contact content is substantial and internally linked.
- Content avoids ranking guarantees and keyword stuffing.
- Pricing and service inclusions answer commercial-intent questions.

Recommendations:

- Shorten metadata without removing important terms.
- Replace repetitive generic phrases with more verified project-specific detail as the portfolio grows.
- Keep service copy buyer-focused; remove the literal GA measurement ID from Services.

### Local SEO

Strengths:

- Business name, Lethbridge location, Alberta region, Canada-wide service area, phone, and email are consistent.
- Visible local wording is natural.
- LocalBusiness/ProfessionalService structured data is present on the homepage.
- A local client example is visible.

Recommendations:

- Add the verified Google Business Profile link if available and appropriate.
- Keep website, GBP, Facebook, and other directory information aligned.
- Add genuine local case studies over time.
- Do not create thin city pages for locations without unique, useful content.

### Structured data

Passed:

- JSON-LD parses successfully.
- Homepage emits LocalBusiness/ProfessionalService, Organization, WebSite, and BreadcrumbList.
- Services emits Service; Packages emits OfferCatalog; FAQ emits FAQPage from visible FAQ content.
- No unsupported Review or AggregateRating schema is emitted.

Recommendations:

- Refactor schema generation out of the Eleventy config.
- Add accurate page-type nodes only where useful.
- Continue avoiding self-serving Review/AggregateRating markup. Google generally does not show self-serving review stars for LocalBusiness/Organization pages, so adding that markup would not be a valid optimization.

### Crawlability and indexability

- All intended indexable routes return 200.
- The live missing route returns 404.
- Client intake, thank-you, and 404 pages are excluded from the sitemap and marked noindex.
- The live 404 PageSpeed SEO score of 61 is expected and not a defect.
- Cloudflare managed robots rules block several AI crawlers while keeping general search crawling allowed.

### Social metadata

- Open Graph and Twitter card metadata is complete and consistent.
- The shared 1200x630 social image exists and is small.
- Page-specific social images are optional future enhancements, not a required fix.

## 8. UI and UX Findings

### Global design system

- Strong: centralized color tokens, consistent radius/shadows, restrained system typography, clear heading scale, and reusable section/card/button patterns.
- Improve: the repeated card-and-section visual pattern may make long pages feel similar. Use visual variation only where it improves scanning or decision-making.
- Confirm in browser: copper-colored non-large text on white would be only 3.79:1; current primary text links generally use darker bronze, but future uses of `--copper` as text should be avoided for normal-size text.

### Header and navigation

- Strong: sticky header, clear brand, useful mobile toggle, visible CTA, active-page indication, Escape support, and 44px menu targets.
- Confirm in browser: long brand/nav fit around 1024-1119px, where mobile navigation remains active.
- Recommendation: add a visible “Free Website Audit” header link only if analytics show it is a major acquisition path; the footer and homepage already link to it.

### Homepage

- Strong: clear audience, price anchor, service area, differentiators, packages, process, reviews, and repeated CTAs.
- Improve: there is substantial repetition of “small business,” “website design,” and similar positioning. Tightening repeated paragraphs could improve scan speed without reducing SEO relevance.
- Functional concern: homepage portfolio images unintentionally become lightbox buttons because of the broad JS selector.

### Services

- Strong: clear service hierarchy and useful explanations.
- Improve: remove the literal GA measurement ID and make analytics copy about buyer outcomes.
- Consider: add a link from each service section to the most relevant package/contact preselection.

### About

- Strong: owner identity, location, approach, and trust-building copy.
- Improve: add verified credentials, process experience, or a concise professional background only if accurate.

### FAQ

- Strong: native accessible disclosure controls, substantial buyer-focused answers, and schema synchronized from shared data.
- Improve: group the 23 questions into labeled categories if user testing shows the page is difficult to scan. Do not replace native details/summary without a strong reason.

### Contact and forms

- Strong: multiple contact methods, clear service and budget selectors, direct labels, live status, native validation, CAPTCHA, and inline success.
- High-priority issue: third-party CAPTCHA/form script severely harms mobile performance.
- Improve: visually identify required fields and include a response-time expectation if the business can reliably meet it.
- Do not submit test messages to production without owner approval.

### Website audit feature

- Strong: clear limitations, privacy note, loading state, error mapping, score explanation, safe text rendering, and request-help workflow.
- Improve: protect new audit generation against distributed abuse beyond per-IP rate limiting.
- High-priority issue: the help-form CAPTCHA script harms performance before the user reaches the form.
- Consider: load help-form CAPTCHA only after a report exists and the user begins the help request.

### Footer

- Strong: useful navigation, NAP/service-area information, contact links, privacy/terms, and cookie settings.
- Improve: Cloudflare email obfuscation complicates the footer and adds a global script.

### Mobile

- Source review shows full-width CTAs below 560px, one-column layouts, responsive images, mobile navigation, and fixed cookie-banner compensation.
- The cookie banner reserves 310px on small screens; confirm that this is sufficient at 320px with text zoom and localized/system font differences.
- Actual mobile visual and keyboard QA remains required.

### Tablet

- Two-column grids activate at 640px and desktop navigation only at 1120px, which is a sensible pattern.
- Confirm Contact, package cards, and long FAQ content at 768px and 1024px.

### Desktop

- Maximum content widths prevent excessive line length.
- Homepage desktop PageSpeed is excellent.
- Confirm very-wide visual balance at 1440px+; source max widths should prevent overexpansion.

## 9. Functional Bugs

### BUG-01: Modal dialog permits focus to escape

- **Reproduction steps:** Open `portfolio.html`, focus the portfolio image, activate it, then press Tab repeatedly.
- **Expected result:** Focus remains within the modal until it is closed.
- **Actual result from source:** Only the close button receives initial focus; no focus trap or background inertness is applied.
- **Likely root cause:** Custom lightbox implementation stops at focus placement and Escape handling.
- **Recommended fix:** Implement the P1-02 dialog behavior.
- **Affected files:** `script.js`, `src/pages/portfolio.njk`, potentially `styles.css`.

### BUG-02: Homepage portfolio images become unintended generic controls

- **Reproduction steps:** Load the homepage with JavaScript; inspect or tab to the portfolio preview images.
- **Expected result:** Homepage images remain normal images unless intentionally marked as lightbox triggers.
- **Actual result from source:** `document.querySelectorAll(".portfolio-preview img")` gives all three images `tabindex="0"`, `role="button"`, and the same generic accessible name.
- **Likely root cause:** Selector does not use the existing `data-lightbox-image` opt-in attribute.
- **Recommended fix:** Select only `[data-lightbox-image]` and use semantic buttons with specific names.
- **Affected files:** `script.js`, `src/pages/portfolio.njk`.

### BUG-03: Documented same-origin-only API behavior is not true

- **Reproduction steps:** POST valid JSON to `/api/website-audit` without an `Origin` header.
- **Expected result based on README:** Request is rejected as not same-origin.
- **Actual result:** Live request returned 200 from cache.
- **Likely root cause:** `worker/index.mjs:86` checks only when `Origin` is present.
- **Recommended fix:** Correct documentation and strengthen abuse prevention rather than relying on Origin as authentication.
- **Affected files:** `worker/index.mjs`, `README.md`, Cloudflare configuration.

### Passed functional checks

- All major live routes returned expected 200 status.
- A missing route returned 404 and the custom 404 page.
- Calendly, Facebook, Google review, and portfolio client links resolved successfully.
- Web3Forms submission endpoint returned 403 to a non-form GET-style status probe, which is expected and does not prove form failure.
- Website-audit endpoint returned 405 for GET, 403 for foreign Origin, and 400 for a private URL.
- Internal links and anchors passed generated-site validation.
- Package query values map to contact form options in source.

## 10. Code Quality and Maintainability

### Duplicate and repeated code

- Shared business identity, navigation, packages, FAQ, and site values are already centralized effectively.
- Package data correctly drives cards, form options, and Offer schema.
- FAQ data correctly drives visible content and FAQ schema.
- Public form identifiers and form-page expectations are repeated in templates and `tools/check-site.js`; centralize these non-secret values.
- Business/service wording is repeated across pages. Centralize only exact facts, not all marketing copy, to avoid making content editing opaque.

### Redundant and unused files/dependencies

- `serve` appears unused because the project uses `tools/serve-static.js`.
- `images/favicon-192.png` is not referenced because no manifest exists.
- `_source-assets/` is intentionally retained and excluded from deployment; it is not redundant.
- `_site/` and generated reports are correctly ignored.

### Dead or unused code

- No confirmed unused imports or variables were found by syntax/source review.
- No unreachable Worker paths were identified.
- The broad lightbox selector creates unintended behavior rather than dead code.

### Inconsistent patterns and fragmentation

- `styles.css` and `script.js` are large global files, while Worker logic is split into focused modules. Bring browser code closer to the Worker module quality without overengineering.
- Structured-data generation belongs in a dedicated helper/data module rather than the main Eleventy config.
- `tools/check-site.js` is valuable but regex-based; it should remain a fast guard, not be treated as a complete HTML parser/accessibility test.

### Dependency concerns

- `npm audit` found zero vulnerabilities.
- `npm outdated` found modest updates.
- Wrangler is downloaded through pinned `npx` rather than installed as a dev dependency. Pinning is good, but CI depends on registry availability during every Worker check/deploy. Installing pinned Wrangler as a dev dependency would make `npm ci` the single dependency-fetch step and improve reproducibility.

### Build and deployment concerns

- GitHub Pages deploy workflow correctly runs `npm ci`, `npm test`, and `npm run check`.
- Worker deployment correctly runs tests and dry-run before deploy.
- The Pages workflow does not run `check:worker`; this is acceptable because Worker deployment is separate.
- No live response-header configuration is represented in the repository, so Cloudflare dashboard state is an undocumented deployment dependency.
- Cloudflare modifies HTML and robots at the edge, so generated-output validation does not exactly validate deployed output.

### Documentation gaps

- Document Cloudflare Email Address Obfuscation and managed robots behavior.
- Correct the same-origin-only API statement.
- Document live security-header ownership and validation.
- Document that browser-based Lighthouse requires Chrome/Chromium and `CHROME_PATH` in some environments.

## 11. Security Findings

### High: Missing static-site security headers

- **Risk:** Clickjacking, increased impact of injected content, referrer leakage, and unnecessary browser-feature access.
- **Likelihood:** Moderate; exploitation generally requires another weakness or malicious embedding.
- **Impact:** Moderate to high depending on future integrations.
- **Remediation owner:** Cloudflare response-header rules or a route-scoped/static response Worker; CSP changes may require source adjustments.
- **Remediation:** P1-03.

### Medium: Website-audit quota abuse controls rely mainly on IP rate limiting

- **Risk:** Distributed clients can consume PageSpeed API quota. Origin checks are not authentication and no-Origin requests are accepted.
- **Likelihood:** Moderate for a public free audit tool.
- **Impact:** Service unavailability or API quota exhaustion; direct financial impact depends on Google API configuration.
- **Remediation owner:** Cloudflare/Worker.
- **Remediation:** Add stronger bot/proof controls for uncached audits, monitor usage, restrict the PageSpeed API key, and correct documentation.

### Passed security checks

- No private committed API key, token, password, account credential, or private key found.
- `.dev.vars` and `.env` are ignored.
- PageSpeed key is documented as a Worker secret and not exposed to the browser.
- Public form access identifiers are expected to be browser-visible and are not private secrets.
- Worker rejects malformed input, unsupported protocols, embedded credentials, localhost, private/loopback/link-local addresses, oversized requests, foreign origins, and honeypot submissions.
- Worker never directly fetches the submitted target URL; Google PageSpeed performs the external audit.
- Worker returns normalized results and safe error codes without upstream error details.
- Successful reports are cached and new reports are rate-limited.
- API responses include `no-store` and `X-Content-Type-Options: nosniff`.
- External new-tab links use `noopener noreferrer`.
- Dynamic audit rendering uses `textContent`, reducing XSS risk.
- `innerHTML` uses fixed templates plus a trusted site-config email; no user-controlled HTML injection path was identified.
- `npm audit` found zero vulnerabilities.

## 12. Content and Conversion Findings

### Strengths

- Visitors can quickly understand the main service, audience, Lethbridge base, Canada-wide reach, starting prices, process, ownership, and next steps.
- Packages have clear inclusions, ideal-customer descriptions, and revision counts.
- Content appropriately avoids ranking guarantees.
- About, Terms, Privacy, FAQ, and Contact reduce uncertainty.
- Calls to action are repeated at appropriate decision points.
- Testimonials are visibly presented without unsupported review schema.

### Improvements

- Add more verified portfolio examples and outcomes as available. A design business needs visual/proof depth to support conversion.
- Add a reliable expected response time on Contact if the business can consistently meet it.
- Clarify typical project timelines by package or scope. The homepage gives 1-2 weeks for basic static sites, while FAQ remains broad.
- Clarify deposit expectations when policy is finalized; current wording says a deposit “may” be required.
- Reduce repeated general positioning on the homepage where it does not add new decision information.
- Replace “less guessy” on Services if a more professional tone is desired; this is a brand-tone decision, not a correctness issue.
- Remove the literal GA measurement ID from customer-facing service copy.
- Keep all testimonials, outcomes, and portfolio claims verifiable and permissioned.

## 13. Tests and Commands

| Command / check | Purpose | Result | Important output | Follow-up needed |
|---|---|---|---|---|
| `npm ci` | Install locked dependencies | Passed | Added 407 packages | None |
| Initial concurrent `npm run build` / `npm run check` | Build/check while `npm ci` was replacing dependencies | Failed due audit execution race | Temporary missing transitive modules | Not a project issue; rerun passed |
| `npm run build` | Eleventy build | Passed | Copied 24; wrote 15 files | None |
| `npm test` | Node Worker/client tests | Passed | 1 test file, no failures | Add browser tests |
| `npm run check` | Build and generated-site validation | Passed with warnings | 13 HTML files, 10 sitemap pages; six metadata warnings | Fix P2-03 |
| `node tools/check-site.js` | Validate existing generated output | Passed with same warnings | Links, assets, labels, IDs, metadata, schema passed | Keep in CI |
| `node --check ...` | JavaScript/module syntax checks | Passed | No syntax errors | None |
| `npm audit --omit=dev` | Production dependency audit | Passed | 0 vulnerabilities; project has no runtime npm dependencies | None |
| First sandboxed `npm audit` | Full dependency audit | Failed due environment DNS | Registry `EAI_AGAIN` | Rerun with network passed |
| `npm audit` with network | Full dependency audit | Passed | 0 vulnerabilities | Recheck during updates |
| First sandboxed `npm outdated` | Dependency update check | Failed due environment DNS | Registry `EAI_AGAIN` | Rerun with network completed |
| `npm outdated` with network | Dependency update check | Completed with outdated packages | Eleventy/Lighthouse updates available; newer Sharp available | P3-02 |
| First sandboxed `npm run check:worker` | Wrangler dry-run | Failed due environment DNS | Could not download pinned Wrangler | Rerun with network passed |
| `npm run check:worker` with network | Worker dry-run | Passed | Worker bundle 17.80 KiB / gzip 5.81 KiB; expected bindings present | Consider devDependency for reproducibility |
| `npm run lighthouse` sandboxed | Local Lighthouse suite | Failed due environment | `spawnSync /bin/sh EPERM` | Rerun escalated |
| `npm run lighthouse` escalated | Local Lighthouse suite | Failed due environment | No Chrome/Chromium; 0 of 10 audits | Run in browser-enabled CI |
| Live PageSpeed-backed audits | Representative performance/accessibility/SEO tests | Completed | Static pages 98-100 Performance; Contact 37; Website Audit 42 | Fix P1-01 |
| Live header/status/timing checks | Deployment behavior | Completed | HSTS present; recommended headers missing; missing route returns 404 | P1-03 |
| Live route and external-link checks | Broken-link/function smoke test | Passed for major routes/links | Main routes and external links resolve | Continue periodic checks |
| Live Worker method/origin/private URL checks | API behavior/security | Completed | GET 405, foreign Origin 403, private URL 400, no-Origin valid POST accepted | P2-01 |
| Live-versus-generated comparison | Detect edge modifications | Completed | Assets/config match; Cloudflare rewrites email links and robots | Document/decide P2-05/P3-04 |
| Secret-pattern review | Identify committed secrets | Passed | No private committed secrets found | Keep secret scanning in CI if available |
| `git diff --check` | Whitespace/patch integrity | Passed | No whitespace errors | None |

No `npm run lint`, HTML validator, CSS validator, axe, Playwright, or browser-compatibility command exists in the repository. No new dependency was installed for the audit.

## 14. Recommended Implementation Phases

### Phase 1: Critical security and broken functionality

- **Issues included:** P1-02, P1-03, P2-01.
- **Files likely affected:** `script.js`, `src/pages/portfolio.njk`, `styles.css`, `worker/index.mjs`, `README.md`, Cloudflare response/rate-limit settings.
- **Implementation order:** accessible lightbox; API abuse/documentation; security headers in Report-Only/testing mode; header enforcement.
- **Validation:** keyboard/dialog testing, axe, Worker tests, live API checks, CSP reports, forms, audit tool, external links.
- **Prompt sizing:** Multiple smaller Codex prompts. Keep the lightbox, Worker controls, and Cloudflare headers separate.

### Phase 2: Accessibility and SEO

- **Issues included:** P2-02, P2-03, P2-09, P2-10, P3-03, P3-06.
- **Files likely affected:** form page templates, page front matter, `_data`, schema helper/config, sitemap template, service/privacy copy.
- **Implementation order:** required indicators; metadata; customer-facing copy; schema refactor; sitemap dates; verified local links.
- **Validation:** `npm run check`, rendered browser QA, screen reader/keyboard checks, schema validators, sitemap validation.
- **Prompt sizing:** Two or three smaller prompts: accessibility/forms, SEO copy/metadata, schema/sitemap.

### Phase 3: Performance and Core Web Vitals

- **Issues included:** P1-01, P2-04, P2-05.
- **Files likely affected:** base layout, form scripts, `script.js`, Eleventy asset handling, Cloudflare cache/email settings.
- **Implementation order:** defer CAPTCHA; test forms; decide email obfuscation; version assets; set immutable caching.
- **Validation:** mobile/desktop Lighthouse or PageSpeed on all representative pages, form submission, no-JS fallback, live headers, CLS.
- **Prompt sizing:** Multiple smaller prompts because third-party loading and asset versioning have separate regression risks.

### Phase 4: UI, UX, and conversion improvements

- **Issues included:** P2-08 plus content recommendations.
- **Files likely affected:** Homepage, Portfolio, About, FAQ, Contact, shared data/assets.
- **Implementation order:** add only verified portfolio/trust evidence; improve response/timeline clarity; reduce repetitive copy; review FAQ grouping.
- **Validation:** stakeholder content approval, mobile/desktop visual QA, link/image validation, conversion-event verification.
- **Prompt sizing:** Multiple content-focused prompts with owner-provided facts and assets.

### Phase 5: Refactoring and cleanup

- **Issues included:** P2-06, P2-07, P3-01, P3-02, P3-05.
- **Files likely affected:** CSS/JS assets, form data/templates, package files, favicon/manifest files.
- **Implementation order:** centralize form config; remove unused dependency; split stable modules; dependency updates; decide manifest/icon.
- **Validation:** `npm ci`, tests, check, Worker dry-run, browser regression, dependency audit.
- **Prompt sizing:** Separate prompts for each refactor/update to keep reviews focused.

### Phase 6: Final validation and deployment checks

- **Issues included:** P2-11 and all completed work.
- **Files likely affected:** tests, CI workflows, documentation.
- **Implementation order:** add browser tests; run all checks; deploy preview; inspect live edge modifications and headers; deploy; post-deploy smoke test.
- **Validation:** complete command matrix, browser/viewports, forms, Worker, PageSpeed, schema, Search Console readiness, live route/header checks.
- **Prompt sizing:** One validation-focused prompt after implementation phases, with a separate prompt for any failures found.

## 15. Exact Recommended Fix Order

1. Fix lightbox trigger semantics, accessible naming, focus containment, inert background, Escape, and focus restoration.
2. Implement deferred/lazy Web3Forms/hCaptcha loading on Contact and Website Audit help form.
3. Retest real form behavior, no-JS behavior, CAPTCHA, and PageSpeed before proceeding.
4. Correct the README same-origin claim and strengthen audit-endpoint distributed-abuse controls.
5. Add Cloudflare security headers in CSP Report-Only mode.
6. Validate all forms, analytics consent, email links, and audit flows against CSP reports, then enforce CSP/frame protection.
7. Add visible required-field instructions/indicators.
8. Shorten the six flagged titles/meta descriptions.
9. Remove the literal GA measurement ID from customer-facing copy.
10. Decide whether to disable Cloudflare Email Address Obfuscation and document the decision.
11. Add versioned static asset URLs and long immutable cache headers.
12. Add rendered-browser tests for mobile navigation, lightbox, consent, forms, and 320px reflow.
13. Refactor schema generation into a focused helper and validate it.
14. Centralize non-secret form configuration.
15. Add verified portfolio and local trust evidence as it becomes available.
16. Split global CSS/JS only along stable responsibility boundaries.
17. Remove the unused `serve` dependency and decide whether the unused 192px favicon needs a manifest.
18. Update dependencies in focused maintenance work.
19. Run the complete final validation matrix and post-deployment live checks.

## 16. Items That Should Not Be Changed

- Keep the static Eleventy/Nunjucks architecture; no framework migration is justified.
- Preserve current public `.html` URLs and canonical URLs.
- Keep `_site/` and reports as ignored generated output.
- Keep shared business, navigation, package, FAQ, and site data under `src/_data/`.
- Keep native `<details>/<summary>` FAQ controls.
- Keep the skip link, one-H1 page structure, semantic landmarks, focus styles, and reduced-motion support.
- Keep system fonts; they avoid font-loading performance cost.
- Keep explicit image dimensions, responsive `srcset`, WebP assets, and lazy loading.
- Keep HSTS and HTTPS-only public URLs.
- Keep Worker response normalization, safe error codes, URL validation, caching, and rate limiting.
- Keep PageSpeed keys in Cloudflare secrets, never in browser/generated files.
- Keep analytics consent default-denied and advertising storage/user data/personalization denied.
- Keep the honest no-ranking-guarantee language.
- Keep Review/AggregateRating schema absent unless future use is accurate and eligible under current Google rules.
- Keep client intake and thank-you pages noindex and out of the sitemap.
- Keep the custom useful 404 page and actual 404 status for missing routes.
- Keep verified testimonials visible without inventing claims or metrics.

## 17. Final Quality Review

The audit checked for:

- Duplicate code and repeated configuration: checked; form configuration and large global assets are the main opportunities.
- Redundant files and dependencies: checked; unused `serve` dependency and possibly unused 192px favicon identified.
- Dead code: checked; none confirmed.
- Unused imports and variables: checked by source review/syntax checks; none confirmed.
- Broken links and references: checked; generated validation and major live link checks passed.
- Accessibility issues: checked; modal focus/naming and required-field communication issues identified.
- SEO issues: checked; metadata warnings, schema maintainability, local trust, and sitemap-date issues identified.
- Security issues: checked; no private committed secrets found; missing headers and audit abuse controls identified.
- Performance issues: checked with measured live results; third-party form pages are the primary failure.
- Build risks: checked; build/check/tests/Worker dry-run pass; browser Lighthouse environment dependency documented.
- Regression risks: checked and included per prioritized issue.
- Exposed secrets: checked; none found. Public browser identifiers were not treated as private secrets.
- Documentation gaps: checked; Cloudflare edge modifications, security-header ownership, browser requirements, and API-origin claim identified.

No source file was changed during this audit. Only `AUDIT_REPORT.md` was added.
