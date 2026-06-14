const RECOMMENDATIONS = {
  "uses-optimized-images": {
    title: "Optimize image delivery",
    description: "Some images may be larger than necessary.",
    recommendation: "Convert large images to WebP or AVIF and serve responsive image sizes."
  },
  "modern-image-formats": {
    title: "Use modern image formats",
    description: "Some images could download faster in a modern format.",
    recommendation: "Convert suitable images to WebP or AVIF while keeping appropriate fallbacks."
  },
  "uses-responsive-images": {
    title: "Serve correctly sized images",
    description: "Some images may be larger than the space where they appear.",
    recommendation: "Provide responsive image sizes so smaller screens do not download unnecessarily large files."
  },
  "offscreen-images": {
    title: "Delay offscreen images",
    description: "Images that are not initially visible may be loading too early.",
    recommendation: "Lazy-load images that appear below the visible part of the page."
  },
  "render-blocking-resources": {
    title: "Reduce render-blocking files",
    description: "Some CSS or scripts delay the page from appearing.",
    recommendation: "Load critical styles first and defer nonessential scripts."
  },
  "unused-css-rules": {
    title: "Remove unused CSS",
    description: "The browser is downloading styles that the page does not use.",
    recommendation: "Remove unused styles or split CSS by page or component."
  },
  "unused-javascript": {
    title: "Reduce unused JavaScript",
    description: "The browser is downloading scripts that are not needed immediately.",
    recommendation: "Remove unused code and load nonessential scripts only when required."
  },
  "image-alt": {
    title: "Add useful image descriptions",
    description: "Some images may be missing accessible alternative text.",
    recommendation: "Add concise alt text that describes the purpose of each meaningful image."
  },
  "button-name": {
    title: "Add accessible button names",
    description: "Some buttons may not clearly describe their purpose to assistive technology.",
    recommendation: "Add visible text or an accessible name to each button."
  },
  "link-name": {
    title: "Use descriptive link names",
    description: "Some links may not clearly explain where they lead.",
    recommendation: "Use clear link text instead of vague wording or unlabeled icons."
  },
  "label": {
    title: "Add form labels",
    description: "Some form fields may not have clear accessible labels.",
    recommendation: "Connect every form control to a visible label."
  },
  "heading-order": {
    title: "Correct the heading structure",
    description: "Some headings may skip levels or appear in an unclear order.",
    recommendation: "Use one H1 and organize page sections with logical H2 and H3 headings."
  },
  "color-contrast": {
    title: "Improve text contrast",
    description: "Some text may be difficult to read against its background.",
    recommendation: "Adjust text or background colours to meet WCAG contrast requirements."
  },
  "document-title": {
    title: "Add a clear page title",
    description: "The page may be missing a useful browser and search result title.",
    recommendation: "Add a unique title that describes the page and business."
  },
  "meta-description": {
    title: "Add a meta description",
    description: "Search engines may not have a useful summary for this page.",
    recommendation: "Add a clear description of the page in approximately 140 to 160 characters."
  },
  "crawlable-anchors": {
    title: "Improve link accessibility",
    description: "Some links may not be understandable or crawlable.",
    recommendation: "Use real anchor elements with descriptive link text."
  },
  "is-crawlable": {
    title: "Allow search engine crawling",
    description: "Search engines may be blocked from indexing the page.",
    recommendation: "Review robots directives and page settings to ensure the page can be indexed."
  },
  "http-status-code": {
    title: "Return a successful page status",
    description: "The page may not be returning a normal successful HTTP status.",
    recommendation: "Fix redirects or server errors so the page returns the correct status."
  },
  "largest-contentful-paint": {
    title: "Improve the largest content element",
    description: "The main visible content may take too long to appear.",
    recommendation: "Optimize the largest image or content block and remove resources that delay it."
  },
  "total-blocking-time": {
    title: "Reduce main-thread blocking",
    description: "Long-running browser work may delay interactions.",
    recommendation: "Reduce heavy JavaScript and break long tasks into smaller work."
  },
  "cumulative-layout-shift": {
    title: "Prevent unexpected layout movement",
    description: "Content may move while the page loads.",
    recommendation: "Reserve space for images, embeds, banners, and dynamically inserted content."
  }
};

const cleanText = (value, fallback = "", maxLength = 400) => String(value || fallback)
  .replace(/<[^>]*>/g, " ")
  .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
  .replace(/[<>]/g, "")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, maxLength);

export const getRecommendation = (audit) => {
  const mapped = RECOMMENDATIONS[audit.id];
  if (mapped) return mapped;

  const title = cleanText(audit.title, "Review this Lighthouse finding", 120);
  return {
    title,
    description: cleanText(audit.description, "Lighthouse identified an opportunity to improve this page."),
    recommendation: `Review the Lighthouse guidance for "${title}" and address the affected page elements.`
  };
};

export { cleanText };
