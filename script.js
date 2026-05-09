const navToggle = document.querySelector("[data-nav-toggle]");
const menu = document.querySelector("[data-menu]");
const year = document.querySelector("[data-year]");
const header = document.querySelector("[data-header]");
const contactForm = document.querySelector("[data-contact-form]");
const packageLabels = {
  starter: "Starter Website from $499",
  launch: "Launch Package from $899",
  growth: "Growth Package from $1,299",
  complete: "Complete Brand Package from $1,799"
};
const submittedStorageKey = "rosePawQuoteFormSubmitted";

const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, eventParams);
  }
};

const markQuoteFormSubmitted = () => {
  try {
    window.sessionStorage.setItem(submittedStorageKey, "true");
  } catch (error) {
    // Storage can be unavailable in some privacy modes; the form still submits normally.
  }
};

const clearQuoteFormSubmitted = () => {
  try {
    if (window.sessionStorage.getItem(submittedStorageKey) === "true") {
      window.sessionStorage.removeItem(submittedStorageKey);
      return true;
    }
  } catch (error) {
    return false;
  }

  return false;
};

if (year) {
  year.textContent = new Date().getFullYear();
}

if (navToggle && menu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    menu.classList.toggle("is-open", !isOpen);
  });

  menu.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      navToggle.setAttribute("aria-expanded", "false");
      menu.classList.remove("is-open");
    }
  });
}

if (header) {
  const setHeaderState = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });
}

document.addEventListener("click", (event) => {
  const link = event.target instanceof Element ? event.target.closest("[data-track]") : null;

  if (!(link instanceof HTMLElement)) {
    return;
  }

  const eventName = link.dataset.track;

  if (eventName && eventName !== "form_submit") {
    trackEvent(eventName, {
      link_url: link instanceof HTMLAnchorElement ? link.href : undefined,
      link_text: link.textContent ? link.textContent.trim() : undefined
    });
  }
});

if (contactForm instanceof HTMLFormElement) {
  const params = new URLSearchParams(window.location.search);
  const packageInterest = params.get("package");
  const budget = contactForm.elements.namedItem("budget_or_package_interest");
  const resetAfterSubmission = () => {
    if (clearQuoteFormSubmitted()) {
      contactForm.reset();
    }
  };

  if (packageInterest && budget instanceof HTMLSelectElement && packageLabels[packageInterest]) {
    budget.value = packageLabels[packageInterest];
  }

  resetAfterSubmission();
  window.addEventListener("pageshow", resetAfterSubmission);
}

if (document.body && document.body.dataset.page === "thank-you") {
  markQuoteFormSubmitted();
  trackEvent("quote_form_submit", { form_name: "Project inquiry" });
}
