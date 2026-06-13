const navToggle = document.querySelector("[data-nav-toggle]");
const menu = document.querySelector("[data-menu]");
const year = document.querySelector("[data-year]");
const header = document.querySelector("[data-header]");
const contactForm = document.querySelector("[data-contact-form]");
const reviewCarousel = document.querySelector("[data-review-carousel]");
const reviewPrev = document.querySelector("[data-review-prev]");
const reviewNext = document.querySelector("[data-review-next]");
const siteConfig = window.siteConfig || {};
const packageLabels = Object.fromEntries((siteConfig.packages || []).map((item) => [item.id, item.contactValue]));
const googleAnalyticsId = siteConfig.analyticsId || "";
const businessEmail = siteConfig.email;
const turnstileSiteKey = siteConfig.turnstileSiteKey || "CONFIGURE_TURNSTILE_SITE_KEY";
const cookieConsentKey = "rosePawCookieConsent";
let googleAnalyticsLoaded = false;

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

const loadGoogleAnalytics = () => {
  if (googleAnalyticsLoaded || typeof window.gtag !== "function") {
    return;
  }

  googleAnalyticsLoaded = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`;
  document.head.append(script);

  window.gtag("js", new Date());
  window.gtag("config", googleAnalyticsId);
};

const updateGoogleConsent = (value) => {
  if (typeof window.gtag !== "function") {
    return;
  }

  window.gtag("consent", "update", {
    "analytics_storage": value === "accepted" ? "granted" : "denied",
    "ad_storage": "denied",
    "ad_user_data": "denied",
    "ad_personalization": "denied"
  });

  if (value === "accepted") {
    loadGoogleAnalytics();
  }
};

const analyticsAllowed = () => getStoredConsent() === "accepted";

const trackEvent = (eventName, eventParams = {}) => {
  if (analyticsAllowed() && typeof window.gtag === "function") {
    window.gtag("event", eventName, eventParams);
  }
};

if (year) {
  year.textContent = new Date().getFullYear();
}

const storedConsent = getStoredConsent();

if (storedConsent === "accepted" || storedConsent === "rejected") {
  updateGoogleConsent(storedConsent);
}

const getConsentDescription = () => {
  const consent = getStoredConsent();

  if (consent === "accepted") {
    return "Current choice: analytics cookies accepted.";
  }

  if (consent === "rejected") {
    return "Current choice: analytics cookies rejected.";
  }

  return "No analytics cookie choice has been saved.";
};

const openCookieSettings = () => {
  if (document.querySelector(".cookie-banner")) {
    return;
  }

  const banner = document.createElement("section");
  banner.className = "cookie-banner";
  banner.setAttribute("aria-label", "Cookie consent");
  banner.innerHTML = `
    <div class="cookie-copy">
      <p>We use cookies to improve this website, measure traffic, and understand which services visitors are interested in. You can accept or reject non-essential cookies.</p>
      <p class="cookie-choice-status" data-cookie-status>${getConsentDescription()}</p>
    </div>
    <div class="cookie-actions">
      <button class="button button-primary" type="button" data-cookie-choice="accepted">Accept analytics</button>
      <button class="button button-light" type="button" data-cookie-choice="rejected">Reject analytics</button>
      <a class="button button-secondary" href="privacy.html">Privacy Policy</a>
      <button class="button button-secondary" type="button" data-cookie-close>Close</button>
    </div>
  `;

  document.body.classList.add("has-cookie-banner");
  document.body.append(banner);

  const firstChoice = banner.querySelector("[data-cookie-choice]");
  if (firstChoice instanceof HTMLButtonElement) {
    firstChoice.focus({ preventScroll: true });
  }
};

const closeCookieSettings = () => {
  const banner = document.querySelector(".cookie-banner");
  document.body.classList.remove("has-cookie-banner");
  banner?.remove();
};

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;

  if (target?.closest("[data-cookie-settings]")) {
    openCookieSettings();
    return;
  }

  if (target?.closest("[data-cookie-close]")) {
    closeCookieSettings();
    return;
  }

  const choiceButton = target?.closest("[data-cookie-choice]");
  if (!(choiceButton instanceof HTMLButtonElement)) {
    return;
  }

  const choice = choiceButton.dataset.cookieChoice;
  if (choice !== "accepted" && choice !== "rejected") {
    return;
  }

  setStoredConsent(choice);
  updateGoogleConsent(choice);
  closeCookieSettings();
});

if (storedConsent !== "accepted" && storedConsent !== "rejected") {
  openCookieSettings();
}

if (navToggle && menu) {
  const desktopNavigation = window.matchMedia("(min-width: 1120px)");
  const toggleLabel = navToggle.querySelector(".sr-only");

  const setNavigationState = (isOpen, returnFocus = false) => {
    const isDesktop = desktopNavigation.matches;
    const mobileMenuOpen = !isDesktop && isOpen;

    navToggle.setAttribute("aria-expanded", String(mobileMenuOpen));
    menu.classList.toggle("is-open", mobileMenuOpen);
    menu.hidden = !isDesktop && !mobileMenuOpen;
    menu.inert = !isDesktop && !mobileMenuOpen;

    if (toggleLabel) {
      toggleLabel.textContent = mobileMenuOpen ? "Close navigation" : "Open navigation";
    }

    if (returnFocus) {
      navToggle.focus();
    }
  };

  setNavigationState(false);

  navToggle.addEventListener("click", () => {
    setNavigationState(navToggle.getAttribute("aria-expanded") !== "true");
  });

  menu.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      setNavigationState(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
      setNavigationState(false, true);
    }
  });

  desktopNavigation.addEventListener("change", () => setNavigationState(false));
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

const protectedForms = document.querySelectorAll("[data-protected-form]");
const turnstileStates = new WeakMap();

const loadTurnstile = () => new Promise((resolve, reject) => {
  if (window.turnstile) {
    resolve(window.turnstile);
    return;
  }

  const existingScript = document.querySelector("[data-turnstile-script]");
  if (existingScript) {
    existingScript.addEventListener("load", () => resolve(window.turnstile), { once: true });
    existingScript.addEventListener("error", reject, { once: true });
    return;
  }

  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  script.async = true;
  script.defer = true;
  script.dataset.turnstileScript = "";
  script.addEventListener("load", () => resolve(window.turnstile), { once: true });
  script.addEventListener("error", reject, { once: true });
  document.head.append(script);
});

const setProtectedFormStatus = (form, message, type = "error") => {
  const status = form.querySelector("[data-form-status]");
  if (status instanceof HTMLElement) {
    status.textContent = message;
    status.dataset.status = type;
  }
};

const resetTurnstile = (form) => {
  const state = turnstileStates.get(form);
  if (!state || !window.turnstile || state.widgetId === null) {
    return;
  }

  state.verified = false;
  state.submitButton.disabled = true;
  window.turnstile.reset(state.widgetId);
};

if (protectedForms.length > 0) {
  protectedForms.forEach((form) => {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const container = form.querySelector("[data-turnstile]");
    if (!(submitButton instanceof HTMLButtonElement) || !(container instanceof HTMLElement)) {
      return;
    }

    const state = { submitButton, verified: false, widgetId: null };
    turnstileStates.set(form, state);
    submitButton.disabled = true;
    setProtectedFormStatus(form, "Complete the spam protection check before submitting.", "info");

    form.addEventListener("submit", (event) => {
      if (state.verified) {
        if (!form.hasAttribute("data-contact-form")) {
          state.submitButton.disabled = true;
          state.submitButton.textContent = "Submitting...";
          setProtectedFormStatus(form, "Submitting your form.", "info");
        }
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      setProtectedFormStatus(form, "Please complete the spam protection check before submitting.");
      container.focus();
    });
  });

  if (turnstileSiteKey === "CONFIGURE_TURNSTILE_SITE_KEY") {
    protectedForms.forEach((form) => {
      if (form instanceof HTMLFormElement) {
        setProtectedFormStatus(form, `Spam protection is not configured. Please email ${businessEmail}.`);
      }
    });
  } else {
    loadTurnstile()
      .then((turnstile) => {
        protectedForms.forEach((form) => {
          if (!(form instanceof HTMLFormElement)) {
            return;
          }

          const state = turnstileStates.get(form);
          const container = form.querySelector("[data-turnstile]");
          if (!state || !(container instanceof HTMLElement)) {
            return;
          }

          state.widgetId = turnstile.render(container, {
            sitekey: turnstileSiteKey,
            callback: () => {
              state.verified = true;
              state.submitButton.disabled = false;
              setProtectedFormStatus(form, "Spam protection complete.", "success");
            },
            "expired-callback": () => {
              state.verified = false;
              state.submitButton.disabled = true;
              setProtectedFormStatus(form, "Spam protection expired. Please complete it again.");
            },
            "error-callback": () => {
              state.verified = false;
              state.submitButton.disabled = true;
              setProtectedFormStatus(form, `Spam protection is unavailable. Please email ${businessEmail}.`);
            }
          });
        });
      })
      .catch(() => {
        protectedForms.forEach((form) => {
          if (form instanceof HTMLFormElement) {
            setProtectedFormStatus(form, `Spam protection is unavailable. Please email ${businessEmail}.`);
          }
        });
      });
  }
}

if (contactForm instanceof HTMLFormElement) {
  const params = new URLSearchParams(window.location.search);
  const packageInterest = params.get("package");
  const budget = contactForm.elements.namedItem("budget_or_package_interest");
  const formStatus = contactForm.querySelector("[data-form-status]");
  const submitButton = contactForm.querySelector('button[type="submit"]');

  const showFormStatus = (message, type = "error") => {
    if (!(formStatus instanceof HTMLElement)) {
      return;
    }

    formStatus.textContent = message;
    formStatus.dataset.status = type;
  };

  const replaceFormWithSuccess = () => {
    contactForm.innerHTML = `
      <div class="form-success" tabindex="-1">
        <p class="eyebrow">Request sent</p>
        <h2>Thank you. Your message has been received.</h2>
        <p>I&rsquo;ll review your project details and follow up with practical next steps.</p>
        <p>You can also email <a href="mailto:${businessEmail}">${businessEmail}</a> if you need to add anything.</p>
      </div>
    `;

    const success = contactForm.querySelector(".form-success");
    if (success instanceof HTMLElement) {
      success.focus({ preventScroll: true });
    }

    trackEvent("quote_form_submit", { form_name: "Project inquiry" });
  };

  const validateRequiredContactFields = () => {
    const requiredNames = ["name", "email", "message"];
    const missingFields = requiredNames.filter((fieldName) => {
      const field = contactForm.elements.namedItem(fieldName);
      return field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement
        ? field.value.trim() === ""
        : true;
    });

    if (missingFields.length > 0) {
      showFormStatus("Please fill in your name, email, and message before submitting.");
      const firstMissingField = contactForm.elements.namedItem(missingFields[0]);
      if (firstMissingField instanceof HTMLElement) {
        firstMissingField.focus();
      }
      return false;
    }

    if (!contactForm.checkValidity()) {
      showFormStatus("Please check the highlighted fields and try again.");
      contactForm.reportValidity();
      return false;
    }

    showFormStatus("");
    return true;
  };

  if (packageInterest && budget instanceof HTMLSelectElement && packageLabels[packageInterest]) {
    budget.value = packageLabels[packageInterest];
  }

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateRequiredContactFields()) {
      return;
    }

    const previousButtonText = submitButton instanceof HTMLButtonElement ? submitButton.textContent : "";

    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        body: new FormData(contactForm),
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("The form service did not accept the request.");
      }

      replaceFormWithSuccess();
    } catch (error) {
      showFormStatus(`Sorry, the form could not be submitted. Please email ${businessEmail} or try again.`);
      resetTurnstile(contactForm);

      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = contactForm.hasAttribute("data-protected-form");
        submitButton.textContent = previousButtonText;
      }
    }
  });

}

const portfolioImages = document.querySelectorAll(".portfolio-preview img");

if (portfolioImages.length > 0) {
  const lightbox = document.createElement("div");
  lightbox.className = "image-lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Expanded portfolio image");
  lightbox.hidden = true;
  lightbox.innerHTML = `
    <button class="image-lightbox-close" type="button" aria-label="Close image preview">Close</button>
    <img alt="">
  `;

  const lightboxImage = lightbox.querySelector("img");
  const closeButton = lightbox.querySelector("button");
  let lastFocusedElement = null;

  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.classList.remove("has-lightbox");

    if (lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    }
  };

  portfolioImages.forEach((image) => {
    image.setAttribute("tabindex", "0");
    image.setAttribute("role", "button");
    image.setAttribute("aria-label", "Open larger portfolio image");

    const openLightbox = () => {
      lastFocusedElement = document.activeElement;

      if (lightboxImage instanceof HTMLImageElement) {
        lightboxImage.src = image.currentSrc || image.src;
        lightboxImage.alt = image.alt || "Expanded portfolio image";
      }

      lightbox.hidden = false;
      document.body.classList.add("has-lightbox");

      if (closeButton instanceof HTMLButtonElement) {
        closeButton.focus();
      }
    };

    image.addEventListener("click", openLightbox);
    image.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox();
      }
    });
  });

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox || event.target === closeButton) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) {
      closeLightbox();
    }
  });

  document.body.append(lightbox);
}

if (document.body?.dataset.page === "thank-you") {
  trackEvent("client_intake_submit", { form_name: "Client intake sent" });
}
