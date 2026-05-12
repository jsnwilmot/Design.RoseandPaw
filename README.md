# Rose n Paw Digital Designs Website

Static marketing website for Rose n Paw Digital Designs, a Canadian small business digital design service offering websites, SEO setup, business profile support, print design, and social media graphics.

Live site: https://design.roseandpaw.ca

## Business Summary

Rose n Paw Digital Designs is based in Lethbridge, Alberta and serves small businesses across Canada. The site is built to explain services clearly, support quote requests, show portfolio work, and provide practical SEO foundations for the business.

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
- Google Analytics with consent defaults
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

- Social sharing image: `images/og-image.png`
- Favicon and touch icon: `images/favicon-192.png`
- Logo assets: `images/rose-and-paw-logo-*.png` and `images/rose-and-paw-logo-*.webp`
- Portfolio images: `images/PortfolioImages/`

If replacing `images/og-image.png`, keep it:

- PNG or JPG
- At least 1200 px wide
- Close to a 1.91:1 sharing ratio when possible
- Under 2 MB if practical
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
- Open Graph and Twitter card tags use `https://design.roseandpaw.ca/images/og-image.png`.
- `sitemap.xml` includes all public indexable pages only.
- `robots.txt` points to the production sitemap.
- Page content uses one clear H1.
- Services and service area are stated naturally.
- Images have useful alt text.
- Internal links use clear anchor text.
- Structured data is present where appropriate.

## Performance Checklist

- Use WebP images where practical.
- Keep hero and logo assets lightweight.
- Do not lazy load the main above-the-fold visual.
- Lazy load below-the-fold images.
- Add width and height attributes to images to reduce layout shift.
- Avoid unnecessary JavaScript.
- Keep `script.js` loaded with `defer`.
- Keep third-party scripts limited and intentional.
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

## Public Contact Details

- Email: design@roseandpaw.ca
- Phone: 250-588-4578
- Facebook: https://fb.com/roseandpawdesigns
