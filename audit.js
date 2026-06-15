import { buildAuditContactFields, getAuditErrorMessage, getScoreStatus } from "./audit-client-utils.mjs";

const auditForm = document.querySelector("[data-audit-form]");
const helpForm = document.querySelector("[data-audit-help-form]");
const results = document.querySelector("[data-audit-results]");
const auditStatus = document.querySelector("[data-audit-status]");
const loadingState = document.querySelector("[data-audit-loading]");
const runButton = auditForm?.querySelector('button[type="submit"]');
const config = window.siteConfig?.audit || {};
let currentReport = null;

const categoryLabels = {
  performance: "Performance",
  accessibility: "Accessibility",
  "best-practices": "Best Practices",
  seo: "SEO"
};
const scoreDescriptions = {
  performance: "How quickly the page loads and becomes usable.",
  accessibility: "Automated checks for common accessibility barriers.",
  bestPractices: "Modern browser, security, and code-quality checks.",
  seo: "Technical signals that help search engines understand the page."
};

const setStatus = (element, message, type = "error", focus = false) => {
  if (!(element instanceof HTMLElement)) return;
  element.textContent = message;
  element.dataset.status = type;
  if (focus) element.focus({ preventScroll: true });
};

const createTextElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
};

const resetHcaptcha = () => {
  try {
    window.hcaptcha?.reset();
  } catch (error) {
    // Reset is best-effort when the third-party widget is unavailable.
  }
};

const renderScores = (report) => {
  const scoreGrid = results.querySelector("[data-score-grid]");
  scoreGrid.replaceChildren();
  for (const [key, label] of Object.entries({
    performance: "Performance",
    accessibility: "Accessibility",
    bestPractices: "Best Practices",
    seo: "SEO"
  })) {
    const score = report.scores[key];
    const card = document.createElement("article");
    card.className = "audit-score-card";
    card.dataset.scoreBand = Number.isFinite(score) ? (score >= 90 ? "strong" : score >= 70 ? "fair" : score >= 50 ? "weak" : "poor") : "unknown";
    card.append(
      createTextElement("h3", "", label),
      createTextElement("strong", "audit-score", Number.isFinite(score) ? `${score}/100` : "Unavailable"),
      createTextElement("p", "audit-score-status", Number.isFinite(score) ? getScoreStatus(score) : "Score unavailable"),
      createTextElement("p", "audit-score-description", scoreDescriptions[key])
    );
    scoreGrid.append(card);
  }
};

const renderMetrics = (report) => {
  const metricGrid = results.querySelector("[data-metric-grid]");
  metricGrid.replaceChildren();
  for (const metric of Object.values(report.metrics || {})) {
    const card = document.createElement("article");
    card.className = "audit-metric-card";
    card.append(
      createTextElement("h3", "", metric.label),
      createTextElement("strong", "", metric.displayValue)
    );
    metricGrid.append(card);
  }

  results.querySelector("[data-metrics-section]").hidden = metricGrid.children.length === 0;
};

const renderFindings = (report) => {
  const findingsRoot = results.querySelector("[data-findings]");
  findingsRoot.replaceChildren();
  const grouped = (report.findings || []).reduce((groups, finding) => {
    groups[finding.category] ||= [];
    groups[finding.category].push(finding);
    return groups;
  }, {});

  for (const category of ["performance", "accessibility", "best-practices", "seo"]) {
    const categoryFindings = grouped[category] || [];
    if (!categoryFindings.length) continue;

    const section = document.createElement("section");
    section.className = "audit-finding-group";
    section.append(createTextElement("h3", "", categoryLabels[category]));

    for (const finding of categoryFindings) {
      const article = document.createElement("article");
      article.className = "audit-finding";
      const heading = createTextElement("h4", "", finding.title);
      const priority = createTextElement("span", "audit-priority", `${finding.priority} priority`);
      priority.dataset.priority = finding.priority;
      const titleRow = document.createElement("div");
      titleRow.className = "audit-finding-title";
      titleRow.append(heading, priority);
      article.append(
        titleRow,
        createTextElement("p", "", finding.description),
        createTextElement("p", "audit-recommendation", `Recommended fix: ${finding.recommendation}`)
      );
      if (finding.displayValue) article.append(createTextElement("p", "audit-display-value", finding.displayValue));
      section.append(article);
    }
    findingsRoot.append(section);
  }

  if (!findingsRoot.children.length) {
    findingsRoot.append(createTextElement("p", "audit-empty", "No priority failed audits were returned for this page."));
  }
};

const populateHelpForm = (report) => {
  if (!(helpForm instanceof HTMLFormElement)) return;
  const fields = buildAuditContactFields(report);
  for (const [name, value] of Object.entries(fields)) {
    const field = helpForm.elements.namedItem(name);
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) field.value = value;
  }
  const summary = helpForm.elements.namedItem("audit_summary");
  if (summary instanceof HTMLTextAreaElement) {
    const formatScore = (value) => value === "Unavailable" ? value : `${value}/100`;
    summary.value = [
      `${report.url} (${report.strategy})`,
      `Performance: ${formatScore(fields.performance_score)}`,
      `Accessibility: ${formatScore(fields.accessibility_score)}`,
      `Best Practices: ${formatScore(fields.best_practices_score)}`,
      `SEO: ${formatScore(fields.seo_score)}`,
      `Top findings: ${fields.top_findings}`
    ].join("\n");
  }
  const helpButton = helpForm.querySelector('button[type="submit"]');
  if (helpButton instanceof HTMLButtonElement) helpButton.disabled = false;
};

const clearHelpFormReport = () => {
  if (!(helpForm instanceof HTMLFormElement)) return;
  currentReport = null;
  for (const name of [
    "website_url",
    "audit_strategy",
    "audit_date",
    "performance_score",
    "accessibility_score",
    "best_practices_score",
    "seo_score",
    "top_findings"
  ]) {
    const field = helpForm.elements.namedItem(name);
    if (field instanceof HTMLInputElement) field.value = "";
  }
  const summary = helpForm.elements.namedItem("audit_summary");
  if (summary instanceof HTMLTextAreaElement) summary.value = "Run an audit to add the report summary.";
  const helpButton = helpForm.querySelector('button[type="submit"]');
  if (helpButton instanceof HTMLButtonElement) helpButton.disabled = true;
};

const renderReport = (report) => {
  currentReport = report;
  results.querySelector("[data-result-url]").textContent = report.url;
  results.querySelector("[data-result-strategy]").textContent = report.strategy === "desktop" ? "Desktop" : "Mobile";
  results.querySelector("[data-result-date]").textContent = new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(report.testedAt));
  results.querySelector("[data-result-cache]").textContent = report.cached ? "Recently cached report" : "New PageSpeed report";
  renderScores(report);
  renderMetrics(report);
  renderFindings(report);
  populateHelpForm(report);
  results.hidden = false;
  results.querySelector("#audit-results-title").focus({ preventScroll: true });
};

if (auditForm instanceof HTMLFormElement) {
  auditForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(auditForm);
    clearHelpFormReport();
    setStatus(auditStatus, "The Lighthouse audit is running. Results will appear on this page.", "info");
    loadingState.hidden = false;
    results.hidden = true;
    if (runButton instanceof HTMLButtonElement) {
      runButton.disabled = true;
      runButton.textContent = "Running Audit...";
    }

    try {
      const response = await fetch(config.endpoint || "/api/website-audit", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          url: formData.get("url"),
          strategy: formData.get("strategy"),
          company_website: formData.get("company_website")
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "audit_failed");
      renderReport(payload);
      setStatus(auditStatus, "Audit complete. Review the results below.", "success");
    } catch (error) {
      setStatus(auditStatus, getAuditErrorMessage(error.message), "error", true);
    } finally {
      loadingState.hidden = true;
      if (runButton instanceof HTMLButtonElement) {
        runButton.disabled = false;
        runButton.textContent = "Run Free Audit";
      }
    }
  });
}

if (helpForm instanceof HTMLFormElement) {
  helpForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formStatus = helpForm.querySelector("[data-form-status]");
    const submitButton = helpForm.querySelector('button[type="submit"]');

    if (!currentReport) {
      setStatus(formStatus, "Run an audit before requesting help with the results.", "error", true);
      return;
    }
    const captchaReady = window.captchaLoader && typeof window.captchaLoader.loadForForm === "function"
      ? await window.captchaLoader.loadForForm(helpForm)
      : false;
    if (!captchaReady) {
      setStatus(formStatus, "Spam protection could not load. Retry the check or use the contact page.", "error", true);
      return;
    }
    const captchaResponse = helpForm.querySelector('[name="h-captcha-response"]')?.value || "";
    if (!captchaResponse) {
      setStatus(formStatus, "Complete the spam protection check before sending your request.", "error", true);
      return;
    }

    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }
    setStatus(formStatus, "Sending your request.", "info");

    try {
      const response = await fetch(helpForm.action, {
        method: "POST",
        body: new FormData(helpForm),
        headers: { accept: "application/json" }
      });
      if (!response.ok) throw new Error("request_failed");
      setStatus(formStatus, "Thank you. Your audit summary and request were sent.", "success", true);
      helpForm.querySelectorAll("input:not([type='hidden']), textarea:not([readonly])").forEach((field) => {
        field.value = "";
      });
    } catch (error) {
      setStatus(formStatus, "Your request could not be sent. Please use the contact page or try again.", "error", true);
      resetHcaptcha();
    } finally {
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false;
        submitButton.textContent = "Request Help With These Results";
      }
    }
  });
}
