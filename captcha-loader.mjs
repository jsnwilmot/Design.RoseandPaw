const CAPTCHA_SCRIPT_URL = "https://web3forms.com/client/script.js";
const CAPTCHA_LOAD_TIMEOUT = 15000;
const CAPTCHA_WIDGET_SELECTOR = 'iframe[src*="hcaptcha.com"], textarea[name="h-captcha-response"], input[name="h-captcha-response"]';

const messages = {
  idle: "Spam protection will load when you begin using this form.",
  loading: "Loading spam protection...",
  ready: "Spam protection is ready. Complete the check before submitting.",
  error: "Spam protection could not load. Retry the check or use the contact options below."
};

export const createCaptchaLoader = ({
  documentRef = globalThis.document,
  windowRef = globalThis.window,
  IntersectionObserverClass = globalThis.IntersectionObserver,
  MutationObserverClass = globalThis.MutationObserver,
  timeoutMs = CAPTCHA_LOAD_TIMEOUT
} = {}) => {
  let scriptPromise;
  let scriptElement;
  const formStates = new WeakMap();
  const formPromises = new WeakMap();

  const getElements = (form) => ({
    shell: form.querySelector("[data-captcha-shell]"),
    status: form.querySelector("[data-captcha-status]"),
    error: form.querySelector("[data-captcha-error]")
  });

  const setState = (form, state) => {
    const elements = getElements(form);
    if (elements.shell) {
      elements.shell.dataset.captchaState = state;
    }
    if (elements.status && elements.status.textContent !== messages[state]) {
      elements.status.textContent = messages[state];
    }
    if (elements.error) {
      elements.error.hidden = state !== "error";
    }
    formStates.set(form, state);
  };

  const loadCaptchaScript = () => {
    if (scriptPromise) {
      return scriptPromise;
    }

    scriptPromise = new Promise((resolve, reject) => {
      scriptElement = documentRef.createElement("script");
      scriptElement.src = CAPTCHA_SCRIPT_URL;
      scriptElement.async = true;
      scriptElement.defer = true;
      scriptElement.dataset.captchaScript = "true";

      const timeoutId = windowRef.setTimeout(() => {
        reject(new Error("captcha_script_timeout"));
      }, timeoutMs);

      scriptElement.addEventListener("load", () => {
        windowRef.clearTimeout(timeoutId);
        resolve();
      }, { once: true });
      scriptElement.addEventListener("error", () => {
        windowRef.clearTimeout(timeoutId);
        reject(new Error("captcha_script_failed"));
      }, { once: true });
      documentRef.body.append(scriptElement);
    });

    return scriptPromise;
  };

  const waitForWidget = (form) => {
    if (form.querySelector(CAPTCHA_WIDGET_SELECTOR)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const observer = new MutationObserverClass(() => {
        if (form.querySelector(CAPTCHA_WIDGET_SELECTOR)) {
          windowRef.clearTimeout(timeoutId);
          observer.disconnect();
          resolve();
        }
      });
      const timeoutId = windowRef.setTimeout(() => {
        observer.disconnect();
        reject(new Error("captcha_widget_timeout"));
      }, timeoutMs);

      observer.observe(form.querySelector("[data-captcha-shell]") || form, {
        childList: true,
        subtree: true
      });
    });
  };

  const loadForForm = async (form) => {
    if (!form?.querySelector) {
      return false;
    }
    if (formStates.get(form) === "ready") {
      return true;
    }
    if (formPromises.has(form)) {
      return formPromises.get(form);
    }

    setState(form, "loading");
    const formPromise = (async () => {
      try {
        await loadCaptchaScript();
        await waitForWidget(form);
        setState(form, "ready");
        return true;
      } catch (error) {
        setState(form, "error");
        return false;
      } finally {
        formPromises.delete(form);
      }
    })();
    formPromises.set(form, formPromise);
    return formPromise;
  };

  const retryForForm = (form) => {
    scriptElement?.remove();
    documentRef.querySelector('script[src*="hcaptcha.com"]')?.remove();
    scriptElement = undefined;
    scriptPromise = undefined;
    formPromises.delete(form);
    return loadForForm(form);
  };

  const initializeForm = (form) => {
    setState(form, "idle");
    const startLoading = () => {
      cleanup();
      void loadForForm(form);
    };
    const interactionEvents = ["focusin", "pointerdown", "keydown"];
    let observer;
    const cleanup = () => {
      observer?.disconnect();
      interactionEvents.forEach((eventName) => form.removeEventListener(eventName, startLoading));
    };

    interactionEvents.forEach((eventName) => form.addEventListener(eventName, startLoading, { once: true }));
    const observeForm = () => {
      if (typeof IntersectionObserverClass !== "function" || formStates.get(form) !== "idle") {
        return;
      }
      observer = new IntersectionObserverClass((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          startLoading();
        }
      }, { rootMargin: "300px 0px" });
      observer.observe(form);
    };

    if (documentRef.readyState === "complete") {
      observeForm();
    } else {
      windowRef.addEventListener("load", observeForm, { once: true });
    }

    form.querySelector("[data-captcha-retry]")?.addEventListener("click", () => {
      void retryForForm(form);
    });
  };

  const initialize = () => {
    documentRef.querySelectorAll("[data-captcha-form]").forEach(initializeForm);
  };

  return {
    initialize,
    loadForForm,
    retryForForm,
    isReady: (form) => formStates.get(form) === "ready"
  };
};

if (globalThis.document && globalThis.window) {
  const captchaLoader = createCaptchaLoader();
  captchaLoader.initialize();
  globalThis.window.captchaLoader = captchaLoader;
}
