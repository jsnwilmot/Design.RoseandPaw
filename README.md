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
npm run lighthouse
npm run optimize:images
```

- `npm run dev`: Eleventy development server with rebuilds
- `npm run build`: generate `_site/`
- `npm run check`: build, then validate the generated site
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
- `/client-intake.html`
- `/thank-you.html`
- `/404.html`
- `/robots.txt`
- `/sitemap.xml`

Only the nine indexable public pages are generated into `sitemap.xml`. Client intake, thank-you, and 404 pages remain excluded.

## Forms And Browser Configuration

Forms continue to use Web3Forms and Cloudflare Turnstile. The public quote form submits with JavaScript and displays inline success; its non-JavaScript fallback submits directly to Web3Forms. The unlisted client intake form redirects to `/thank-you.html`.

`src/site-config.js.njk` generates non-secret browser configuration from shared data. Before deployment, replace `CONFIGURE_TURNSTILE_SITE_KEY` in `src/_data/site.json` with the production public Turnstile site key. Never store a Turnstile secret or other private credential in this repository.

Google Analytics 4 uses the Measurement ID in `src/_data/business.json` and loads only after analytics consent. Advertising storage, user data, and personalization remain denied.

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

- Forms remain blocked until a production Turnstile public site key is configured.
- Successful Web3Forms delivery requires live third-party service access and cannot be fully proven by local static checks.
- Lighthouse scores depend on the local browser and machine.
