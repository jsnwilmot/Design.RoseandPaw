const navToggle = document.querySelector("[data-nav-toggle]");
const menu = document.querySelector("[data-menu]");
const year = document.querySelector("[data-year]");
const header = document.querySelector("[data-header]");
const contactForm = document.querySelector("[data-contact-form]");
const reviewCarousel = document.querySelector("[data-review-carousel]");
const reviewPrev = document.querySelector("[data-review-prev]");
const reviewNext = document.querySelector("[data-review-next]");
const packageLabels = {
  starter: "Starter Website from $499",
  launch: "Launch Package from $899",
  growth: "Growth Package from $1,299",
  complete: "Complete Brand Package from $1,799"
};
const submittedStorageKey = "rosePawQuoteFormSubmitted";
const cookieConsentKey = "rosePawCookieConsent";

const getStoredConsent = () => {
  try {
    return window.localStorage.getItem(cookieConsentKey);
  } catch (error) {
    return null;
  }
};

const setStoredConsent = (value) => {
  try {
    window.localStorage.setItem(cookieConsentKey, value);
  } catch (error) {
    // The consent banner still works for the current page if storage is unavailable.
  }
};

const updateGoogleConsent = (value) => {
  if (typeof window.gtag !== "function") {
    return;
  }

  const consentValue = value === "accepted" ? "granted" : "denied";

  window.gtag("consent", "update", {
    "analytics_storage": consentValue,
    "ad_storage": consentValue,
    "ad_user_data": consentValue,
    "ad_personalization": consentValue
  });
};

const analyticsAllowed = () => getStoredConsent() === "accepted";

const trackEvent = (eventName, eventParams = {}) => {
  if (analyticsAllowed() && typeof window.gtag === "function") {
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

const storedConsent = getStoredConsent();

if (storedConsent === "accepted" || storedConsent === "rejected") {
  updateGoogleConsent(storedConsent);
}

const createCookieBanner = () => {
  if (storedConsent === "accepted" || storedConsent === "rejected") {
    return;
  }

  const banner = document.createElement("section");
  banner.className = "cookie-banner";
  banner.setAttribute("aria-label", "Cookie consent");
  banner.innerHTML = `
    <p>We use cookies to improve this website, measure traffic, and understand which services visitors are interested in. You can accept or reject non-essential cookies.</p>
    <div class="cookie-actions">
      <button class="button button-primary" type="button" data-cookie-choice="accepted">Accept</button>
      <button class="button button-light" type="button" data-cookie-choice="rejected">Reject</button>
      <a class="button button-secondary" href="privacy.html">Privacy Policy</a>
    </div>
  `;

  document.body.classList.add("has-cookie-banner");

  banner.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("[data-cookie-choice]") : null;

    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const choice = button.dataset.cookieChoice;

    if (choice !== "accepted" && choice !== "rejected") {
      return;
    }

    setStoredConsent(choice);
    updateGoogleConsent(choice);
    document.body.classList.remove("has-cookie-banner");
    banner.remove();
  });

  document.body.append(banner);
};

createCookieBanner();

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

if (reviewCarousel instanceof HTMLElement) {
  const updateReviewControls = () => {
    const maxScroll = reviewCarousel.scrollWidth - reviewCarousel.clientWidth;
    const atStart = reviewCarousel.scrollLeft <= 2;
    const atEnd = reviewCarousel.scrollLeft >= maxScroll - 2;

    if (reviewPrev instanceof HTMLButtonElement) {
      reviewPrev.disabled = atStart;
    }

    if (reviewNext instanceof HTMLButtonElement) {
      reviewNext.disabled = atEnd;
    }
  };

  const scrollReviews = (direction) => {
    reviewCarousel.scrollBy({
      left: reviewCarousel.clientWidth * direction,
      behavior: "smooth"
    });
  };

  if (reviewPrev instanceof HTMLButtonElement) {
    reviewPrev.addEventListener("click", () => scrollReviews(-1));
  }

  if (reviewNext instanceof HTMLButtonElement) {
    reviewNext.addEventListener("click", () => scrollReviews(1));
  }

  reviewCarousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollReviews(-1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollReviews(1);
    }

    if (event.key === "Home") {
      event.preventDefault();
      reviewCarousel.scrollTo({ left: 0, behavior: "smooth" });
    }

    if (event.key === "End") {
      event.preventDefault();
      reviewCarousel.scrollTo({ left: reviewCarousel.scrollWidth, behavior: "smooth" });
    }
  });

  reviewCarousel.addEventListener("wheel", (event) => {
    const maxScroll = reviewCarousel.scrollWidth - reviewCarousel.clientWidth;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const canScrollLeft = reviewCarousel.scrollLeft > 2;
    const canScrollRight = reviewCarousel.scrollLeft < maxScroll - 2;

    if (!delta || (delta < 0 && !canScrollLeft) || (delta > 0 && !canScrollRight)) {
      return;
    }

    event.preventDefault();
    reviewCarousel.scrollBy({ left: delta });
  }, { passive: false });

  reviewCarousel.addEventListener("scroll", updateReviewControls, { passive: true });
  window.addEventListener("resize", updateReviewControls);
  window.requestAnimationFrame(updateReviewControls);
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
  const params = new URLSearchParams(window.location.search);
  const formType = params.get("type");
  const eyebrow = document.querySelector("[data-thank-you-eyebrow]");
  const heading = document.querySelector("[data-thank-you-heading]");
  const body = document.querySelector("[data-thank-you-body]");
  const note = document.querySelector("[data-thank-you-note]");
  const copy = {
    quote: {
      eyebrow: "Quote request sent",
      heading: "Thank you. Your request has been received.",
      body: "We'll review your project details and follow up with the next steps.",
      note: "Most quote requests receive a response within 1 to 2 business days.",
      event: "quote_form_submit"
    },
    intake: {
      eyebrow: "Client intake sent",
      heading: "Thank you. Your form has been received.",
      body: "We'll review your details and follow up if anything else is needed before starting your project.",
      note: "Your intake form helps us plan your website structure, content, style direction, and project requirements.",
      event: "client_intake_submit"
    }
  };
  const activeCopy = copy[formType] || null;

  if (activeCopy) {
    if (eyebrow) eyebrow.textContent = activeCopy.eyebrow;
    if (heading) heading.textContent = activeCopy.heading;
    if (body) body.textContent = activeCopy.body;
    if (note) note.textContent = activeCopy.note;
    trackEvent(activeCopy.event, { form_name: activeCopy.eyebrow });
  }

  if (formType === "quote") {
    markQuoteFormSubmitted();
  }
}
