export const getScoreStatus = (score) => {
  if (score >= 90) return "Strong";
  if (score >= 70) return "Needs improvement";
  if (score >= 50) return "Significant issues";
  return "High-priority improvements needed";
};

export const getAuditErrorMessage = (code) => ({
  invalid_url: "Enter a valid public website URL.",
  unsupported_url: "Only public HTTP and HTTPS website URLs can be audited.",
  embedded_credentials: "Remove the username or password from the URL and try again.",
  private_url: "Private, local, and internal website addresses cannot be audited.",
  rate_limited: "Too many audits were requested from this connection. Please wait and try again.",
  pagespeed_timeout: "Google PageSpeed Insights did not finish the audit. Please try again.",
  pagespeed_rate_limited: "Google PageSpeed Insights is temporarily busy. Please try again later.",
  pagespeed_failed: "Google PageSpeed Insights could not audit this page. Confirm it is publicly available and try again.",
  service_not_configured: "The audit service is not configured yet. Please use the contact page for help.",
  invalid_request: "The audit request could not be processed. Check the website URL and try again."
}[code] || "The audit could not be completed. Please try again or contact Rose & Paw Digital Designs.");

export const buildAuditContactFields = (report) => {
  const findings = (report.findings || []).slice(0, 8).map((finding) => `${finding.priority}: ${finding.title}`).join("; ");
  return {
    website_url: report.url,
    audit_strategy: report.strategy,
    audit_date: report.testedAt,
    performance_score: String(report.scores.performance ?? "Unavailable"),
    accessibility_score: String(report.scores.accessibility ?? "Unavailable"),
    best_practices_score: String(report.scores.bestPractices ?? "Unavailable"),
    seo_score: String(report.scores.seo ?? "Unavailable"),
    top_findings: findings || "No high-priority failed audits were returned."
  };
};
