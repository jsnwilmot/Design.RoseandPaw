# Rose & Paw Digital Designs Website

Static marketing website for Rose & Paw Digital Designs, a Lethbridge, Alberta digital design service offering small business websites, SEO setup, business profile support, print design, and social media graphics.

Live site: https://design.roseandpaw.ca

Last updated: May 14, 2026

## Business Summary

Rose & Paw Digital Designs is based in Lethbridge, Alberta and serves small businesses across Canada. The site is built to explain services clearly, support quote requests, show portfolio work, and provide practical SEO foundations for the business.

## Main Services

- Small business website design
- Website redesigns and updates
- Search engine optimization setup
- Google Business Profile setup and optimization
- Yelp Business Profile setup and optimization
- Business card design
- Social media graphics
- Print-ready flyers, menus, service lists, and related design assets
- Basic analytics and launch support

## Tech Stack

- Static HTML
- CSS
- Vanilla JavaScript
- Web3Forms for form submissions
- Google Analytics with consent defaults and deferred loading after cookie acceptance
- GitHub Pages or equivalent static hosting
- Optional Node.js image optimization tooling using Sharp

## Folder And File Structure

```text
.
|-- index.html              # Homepage
|-- about.html              # Business background
|-- services.html           # Service detail page
|-- packages.html           # Packages and pricing
|-- portfolio.html          # Portfolio examples
|-- faq.html                # FAQ and FAQ structured data
|-- contact.html            # Public inquiry form
|-- client-intake.html      # Private client intake form, noindex
|-- thank-you.html          # Form confirmation page, noindex
|-- privacy.html            # Privacy policy
|-- terms.html              # Terms and service policy
|-- 404.html                # Custom not found page
|-- styles.css              # Site styles
|-- script.js               # Navigation, cookie consent, analytics events, form helpers
|-- sitemap.xml             # Public indexable URL list
|-- robots.txt              # Crawler instructions
|-- CNAME                   # Custom domain for GitHub Pages
|-- images/                 # Logos, favicon, Open Graph image, portfolio assets
|-- reports/                # Local Lighthouse reports, ignored by Git
|-- tools/check-site.js      # Local JSON-LD, image path, and internal link checker
|-- tools/serve-static.js    # Strict local static server for preview and Lighthouse
`-- tools/optimize-images.js # Optional responsive image generation script
```

## Preview Locally

Because this is a static site, you can open `index.html` directly in a browser for a quick preview.

Install dependencies once:

```bash
npm install
```

For a more accurate local preview, run the local static server from the project root:

```bash
npm run serve
```

Then open:

```text
http://localhost:3000/
```

The local server is configured to use port 3000 for repeatable local testing. If port 3000 is already in use, it will stop with a clear message instead of silently switching to another port.

## Local Lighthouse Testing

Local Lighthouse testing is useful during development. Start the local server first:

```bash
npm run serve
```

In a second terminal, run a Lighthouse test against the local site:

```bash
npm run lighthouse
```

This runs the same local audit used for the HTML report. To be explicit about generating the report file, run:

```bash
npm run lighthouse:report
```

The report is written to:

```text
reports/lighthouse-report.html
```

Generated reports are ignored by Git so test output does not get committed accidentally.

Run the local structural checker after SEO or content edits:

```bash
npm run check
```

This validates JSON-LD syntax, local image paths, responsive source paths, and internal links.

If `npm run serve` says port 3000 is already in use, stop the other local server first. Lighthouse is configured to test `http://localhost:3000` by default, so the site and Lighthouse need to use the same port.

PageSpeed Insights is still the final check for the deployed site because it tests the live public URL:

https://pagespeed.web.dev/

## Editing Common Content

- Homepage copy and review content: `index.html`
- Service details: `services.html`
- Package names, pricing, and inclusions: `packages.html`
- Portfolio examples: `portfolio.html`
- Contact details and inquiry form settings: `contact.html`
- Client intake questions: `client-intake.html`
- Privacy and terms content: `privacy.html` and `terms.html`
- Shared layout styles: `styles.css`
- Navigation behavior, cookie banner, and event tracking: `script.js`

When editing business name, phone number, email, or service area, update every page where that information appears, plus structured data in `index.html`.

## Updating Images

Main image locations:

- Source social sharing image: `images/og-image.png`
- Optimized social sharing image used in meta tags: `images/og-image.jpg`
- Google review QR image: `images/DigitalDesignsReviewQR.png` with `images/DigitalDesignsReviewQR.webp` served first on the homepage
- Favicon and touch icon: `images/favicon-192.png`
- Logo assets: `images/rose-and-paw-logo-*.png` and `images/rose-and-paw-logo-*.webp`
- Portfolio images: `images/PortfolioImages/`

If replacing the Open Graph image, keep it:

- JPG around 1200 x 630 when possible
- Around 75 to 85 percent quality, unless PNG is needed for sharp text or transparency
- Close to a 1.91:1 sharing ratio
- Under 2 MB, ideally much smaller
- Branded clearly enough to work in Facebook, LinkedIn, Messages, and X/Twitter previews

After replacing any image, check all HTML references, alt text, width and height attributes, and responsive `srcset` values.

## Optional Image Optimization

Install dependencies once:

```bash
npm install
```

Generate optimized responsive WebP images:

```bash
npm run optimize:images
```

Only update HTML to use generated images after confirming the output files are correct and the design still looks right.

## Updating Sitemap

Edit `sitemap.xml` whenever a public indexable page is added, removed, or renamed.

Use:

- Production domain: `https://design.roseandpaw.ca`
- Clean canonical URLs
- Current `lastmod` dates
- Only public indexable pages

Do not include `404.html`, `thank-you.html`, or private/noindex pages such as `client-intake.html`.

## Robots.txt

`robots.txt` should allow normal crawling and include the sitemap:

```text
User-agent: *
Allow: /

Sitemap: https://design.roseandpaw.ca/sitemap.xml
```

Do not block CSS, JavaScript, images, or other assets needed for rendering.

## Deployment

For GitHub Pages with the current custom domain setup:

1. Confirm `CNAME` contains `design.roseandpaw.ca`.
2. Commit the changed files.
3. Push to the branch configured for GitHub Pages.
4. Confirm GitHub Pages finishes deployment.
5. Visit `https://design.roseandpaw.ca/` and check key pages.

For another static host, upload the project files so the HTML files, `images/`, `styles.css`, `script.js`, `sitemap.xml`, `robots.txt`, and `404.html` remain at the site root.

## SEO Checklist

- Each public page has a unique title and meta description.
- Canonical URLs use `https://design.roseandpaw.ca`.
- Open Graph and Twitter card tags use `https://design.roseandpaw.ca/images/og-image.jpg`.
- `sitemap.xml` includes all public indexable pages only.
- `robots.txt` points to the production sitemap.
- Page content uses one clear H1.
- Services and service area are stated naturally.
- Images have useful alt text.
- Internal links use clear anchor text.
- Structured data is present where appropriate.

## Structured Data

The homepage includes JSON-LD for:

- `LocalBusiness` and `ProfessionalService` for Rose & Paw Digital Designs
- `Organization`
- `WebSite`
- `BreadcrumbList`

The business schema includes the production URL, logo, optimized image, description, email, phone, Lethbridge address locality, Alberta region, Canada service area, Facebook sameAs link, price range, service types, and an offer catalog for website design, SEO optimization, business profile setup, and print/social graphics.

Do not add Review or AggregateRating schema for Rose & Paw testimonials unless there is a future compliant reason to do so.

## Performance Checklist

- Use WebP images where practical.
- Keep hero and logo assets lightweight.
- Do not lazy load the main above-the-fold visual.
- Lazy load below-the-fold images.
- Add width and height attributes to images to reduce layout shift.
- Use the optimized 1200 x 630 JPG Open Graph image for social sharing.
- Serve the Google review QR code as WebP with the PNG available as fallback.
- Use responsive WebP portfolio previews on the homepage and portfolio page.
- Avoid unnecessary JavaScript.
- Keep `script.js` loaded with `defer`.
- Keep third-party scripts limited and intentional.
- Load Google Analytics only after non-essential cookies are accepted.
- Test mobile and desktop layouts after changes.
- Run local Lighthouse during development with `npm run lighthouse`.
- Run PageSpeed Insights after deployment to test the live public URL.

## Accessibility Checklist

- Maintain one H1 per page.
- Keep skip link support.
- Use descriptive link text.
- Keep form labels visible and connected to fields.
- Ensure buttons and links are keyboard accessible.
- Keep image alt text meaningful.
- Preserve readable color contrast.
- Check mobile navigation after script or CSS changes.

## Maintenance Notes

- Replace review placeholder content only with real client reviews.
- Keep pricing, service names, and package inclusions current.
- Confirm Web3Forms access keys and redirects before launch.
- Confirm Google Analytics measurement ID before publishing major updates.
- Re-submit the sitemap in Google Search Console after significant page or sitemap changes.
- Test the custom 404 page after deployment.
- Keep local SEO wording natural. Avoid awkward phrases such as repeated exact-match location keywords.
- If more portfolio work is added, use real screenshots or clearly branded previews, not invented client work.

## Public Contact Details

- Email: design@roseandpaw.ca
- Phone: 250-588-4578
- Facebook: https://fb.com/roseandpawdesigns

## Changelog

### May 14, 2026

- Added and refined homepage `ProfessionalService` / `LocalBusiness` JSON-LD with service types and offers.
- Improved local SEO wording so Lethbridge and Canada-wide service references read naturally.
- Added homepage portfolio thumbnails using real Heidi's Hair Salon and business card assets.
- Added Google Business Profile cleanup mockup image to the homepage LOCAL SEARCH portfolio card.
- Optimized `images/GoogleProfileCard.png` to `images/GoogleProfileCard.webp` for the displayed homepage card image.
- Added practical project timeline wording to the homepage process section.
- Clarified the Lethbridge base, Vancouver Island phone-number history, and Canada-wide service area.
- Improved image lazy loading and responsive portfolio image handling.
- Optimized Open Graph image handling with a 1200 x 630 JPG social image.
- Converted `DigitalDesignsReviewQR.png` to WebP for supported browsers while keeping the PNG fallback.
