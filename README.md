# Rose & Paw Digital Design

Static HTML/CSS/JavaScript website for Rose & Paw Digital Design.

Live site: https://design.roseandpaw.ca

Last updated: May 15, 2026

## Purpose

Rose & Paw Digital Design is based in Lethbridge, Alberta and serves small businesses across Canada. The website presents affordable small business website design as the main service, with basic SEO setup, Google and Yelp profile support, business card design, social media graphics, and related digital design support.

The site should not read as a Lethbridge-only business. Lethbridge is a credibility and location detail; the service area is Canada-wide.

## Tech Stack

- Static HTML files at the repo root
- CSS in `styles.css`
- Vanilla JavaScript in `script.js`
- Web3Forms for form submissions
- Google Analytics consent handling in `script.js`
- GitHub Pages custom domain via `CNAME`
- Optional local Node.js tools for checking links/schema, serving locally, Lighthouse, and image optimization

There is no build process. Deploy the static files directly.

## Current Pages

Public indexable pages:

- `index.html` - Homepage
- `services.html` - Website design and supporting services
- `packages.html` - Website packages and pricing
- `portfolio.html` - Portfolio and sample work
- `about.html` - Business background
- `faq.html` - FAQ content and FAQPage structured data
- `contact.html` - Public consultation/contact form
- `privacy.html` - Privacy policy
- `terms.html` - Terms and service policy

Utility and non-index pages:

- `404.html` - Custom page-not-found page
- `thank-you.html` - Form confirmation page, `noindex`
- `client-intake.html` - Private client intake form, `noindex`

Hidden pages are not linked from the main navigation and are not included in `sitemap.xml`.

## Forms

Public form:

- Page: `contact.html`
- Purpose: quote / consultation requests
- Action: `https://api.web3forms.com/submit`
- Redirect: `https://design.roseandpaw.ca/thank-you.html?type=quote`
- Required fields currently include name, email, service needed, and message.

Hidden/private form:

- Page: `client-intake.html`
- Purpose: project intake after a client relationship begins
- Action: `https://api.web3forms.com/submit`
- Redirect: `https://design.roseandpaw.ca/thank-you.html?type=intake`
- Not linked from main navigation
- Not included in `sitemap.xml`
- Disallowed in `robots.txt`

Before launch or after form edits, confirm Web3Forms access keys, required fields, redirects, and thank-you behavior.

## SEO Features

Current SEO setup includes:

- Unique title tags and meta descriptions on public pages
- Canonical URLs using `https://design.roseandpaw.ca`
- Open Graph metadata on public pages
- Twitter card metadata on public pages
- Shared Open Graph image: `https://design.roseandpaw.ca/images/og-image.png`
- `sitemap.xml` for public indexable pages only
- `robots.txt` with sitemap reference and specific disallow rules for hidden form/thank-you pages
- One clear H1 per page
- Descriptive internal links and CTA text
- Image `alt`, `width`, and `height` attributes where practical

Do not use old business name variants. The official name is:

```text
Rose & Paw Digital Design
```

## Structured Data

Structured data is embedded as JSON-LD.

Homepage `index.html` includes:

- `LocalBusiness` and `ProfessionalService`
- `Organization`
- `WebSite`
- `BreadcrumbList`

The homepage business schema should stay accurate:

- Name: `Rose & Paw Digital Design`
- URL: `https://design.roseandpaw.ca/`
- Phone: `250-588-4578`
- Email: `design@roseandpaw.ca`
- Location: Lethbridge, Alberta, Canada
- Area served: Canada
- Services: website design, basic SEO setup, business profile setup, business card design, social media graphics

`faq.html` includes `FAQPage` structured data. The FAQ schema must match the visible FAQ questions and answers in the page HTML. When FAQ content changes, update the visible FAQ and the JSON-LD together.

Do not add `Review` or `AggregateRating` schema unless the visible review markup and schema follow Google structured data rules. When unsure, keep reviews visible only and do not add review schema.

## Sitemap And Robots

`sitemap.xml` should include only public indexable URLs:

- `https://design.roseandpaw.ca/`
- `https://design.roseandpaw.ca/services.html`
- `https://design.roseandpaw.ca/packages.html`
- `https://design.roseandpaw.ca/portfolio.html`
- `https://design.roseandpaw.ca/about.html`
- `https://design.roseandpaw.ca/faq.html`
- `https://design.roseandpaw.ca/contact.html`
- `https://design.roseandpaw.ca/privacy.html`
- `https://design.roseandpaw.ca/terms.html`

Do not include `client-intake.html`, `thank-you.html`, `404.html`, test pages, drafts, local reports, or utility files.

Current `robots.txt`:

```text
User-agent: *
Disallow: /client-intake.html
Disallow: /thank-you.html
Allow: /

Sitemap: https://design.roseandpaw.ca/sitemap.xml
```

Do not broadly block CSS, JavaScript, image folders, or other assets needed to render pages.

## Performance

Current local Lighthouse results for the main public pages:

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---:|---:|---:|---:|
| `/` | 99 | 100 | 100 | 100 |
| `/services.html` | 100 | 100 | 100 | 100 |
| `/packages.html` | 100 | 100 | 100 | 100 |
| `/portfolio.html` | 99 | 100 | 100 | 100 |
| `/faq.html` | 99 | 100 | 100 | 100 |
| `/contact.html` | 100 | 100 | 100 | 100 |

Performance practices:

- Do not lazy-load the above-the-fold hero/brand visual.
- Use `loading="lazy"` on below-the-fold images.
- Use WebP images where practical.
- Keep `images/og-image.png` at a social-friendly 1200 x 630 ratio.
- Keep `script.js` loaded with `defer`.
- Keep animations and JavaScript lightweight.
- Avoid layout shift in portfolio cards, review cards, and carousel areas.

Run PageSpeed Insights on the live deployed site before treating performance as final.

## Accessibility

Accessibility expectations:

- One H1 per page
- Logical heading order
- Visible form labels connected to inputs
- Buttons and links with clear text
- Keyboard-accessible navigation and mobile menu
- Visible focus states
- Useful alt text for content images
- Empty alt text for decorative repeated logo images when visible text already names the brand
- Readable color contrast
- No “click here” link text

Run Lighthouse after accessibility-related edits and manually review forms, navigation, CTAs, and image alt text.

## Local Checks

Install dependencies once:

```bash
npm install
```

Run the local static server:

```bash
npm run serve
```

Open:

```text
http://localhost:3000/
```

Run the structural checker:

```bash
npm run check
```

This validates JSON-LD syntax, local image paths, responsive source paths, and internal links.

Run the default Lighthouse report against the homepage:

```bash
npm run lighthouse
```

The report is written to:

```text
reports/lighthouse-report.html
```

Generated reports are ignored by Git.

## Deployment

For GitHub Pages:

1. Confirm `CNAME` contains `design.roseandpaw.ca`.
2. Confirm public pages, `images/`, `styles.css`, `script.js`, `sitemap.xml`, `robots.txt`, `404.html`, and `CNAME` are committed.
3. Commit the changed files.
4. Push to the branch configured for GitHub Pages.
5. Wait for GitHub Pages to finish deployment.
6. Test the live homepage, services, packages, portfolio, FAQ, contact, privacy, terms, sitemap, robots, and a missing URL for the custom 404.
7. Submit or resubmit the sitemap in Google Search Console after meaningful sitemap or page changes.

## Image Notes

Main image locations:

- Open Graph image: `images/og-image.png`
- Favicon / touch icon: `images/favicon-192.png`
- Logo assets: `images/rose-and-paw-logo-*.png` and `images/rose-and-paw-logo-*.webp`
- Google review QR: `images/DigitalDesignsReviewQR.png` and `images/DigitalDesignsReviewQR.webp`
- Portfolio assets: `images/PortfolioImages/`

After replacing images, check:

- File path references
- `srcset` values
- `alt` text
- `width` and `height`
- Lazy-loading behavior
- Lighthouse image-delivery notes

Optional responsive WebP generation:

```bash
npm run optimize:images
```

Only update HTML to use generated images after confirming the generated files look correct.

## Maintenance Rules

Keep `README.md` current in the same change set whenever changing:

- Pages
- Navigation
- Forms
- SEO metadata
- Structured data
- `sitemap.xml`
- `robots.txt`
- Images or the Open Graph image
- Portfolio items
- Package names, pricing, or inclusions
- Contact details
- Deployment behavior

Content maintenance notes:

- Update `index.html` for homepage copy, reviews, trust points, and primary CTAs.
- Update `services.html` when services or positioning changes.
- Update `packages.html` when pricing, package names, or “Best for” wording changes.
- Update `portfolio.html` when adding real portfolio items or clearly labelled sample work.
- Update `faq.html` visible FAQ content and FAQPage JSON-LD together.
- Update `contact.html`, `client-intake.html`, and `thank-you.html` when form behavior changes.
- Update `privacy.html` and `terms.html` when tracking, forms, third-party services, or business policies change.
- Update `sitemap.xml` when public indexable pages are added, removed, or renamed.
- Update `robots.txt` only for intentional crawl rules; do not block render assets.
- Update homepage structured data when the business name, URL, phone, email, services, service area, or social links change.

Do not invent testimonials, client claims, ranking guarantees, fake results, or fake portfolio work. Label sample work clearly.

## Public Contact Details

- Email: `design@roseandpaw.ca`
- Phone: `250-588-4578`
- Facebook: `https://fb.com/roseandpawdesigns`
