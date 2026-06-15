import test from "node:test";
import assert from "node:assert/strict";
import { createCaptchaLoader } from "../captcha-loader.mjs";

class FakeElement extends EventTarget {
  constructor() {
    super();
    this.dataset = {};
    this.hidden = false;
    this.textContent = "";
    this.removed = false;
  }

  remove() {
    this.removed = true;
  }
}

const makeForm = () => {
  const shell = new FakeElement();
  const status = new FakeElement();
  const error = new FakeElement();
  const retry = new FakeElement();
  const form = new FakeElement();
  form.widgetReady = false;
  form.querySelector = (selector) => {
    if (selector === "[data-captcha-shell]") return shell;
    if (selector === "[data-captcha-status]") return status;
    if (selector === "[data-captcha-error]") return error;
    if (selector === "[data-captcha-retry]") return retry;
    if (selector.includes("h-captcha-response") || selector.includes("hcaptcha.com")) return form.widgetReady ? new FakeElement() : null;
    return null;
  };
  return { form, shell, status, error, retry };
};

const makeEnvironment = (forms, outcomes = ["load"], readyState = "complete") => {
  const scripts = [];
  const observers = [];
  const windowRef = new EventTarget();
  windowRef.setTimeout = globalThis.setTimeout;
  windowRef.clearTimeout = globalThis.clearTimeout;
  const documentRef = {
    readyState,
    body: {
      append(script) {
        scripts.push(script);
        const outcome = outcomes[scripts.length - 1] || "load";
        queueMicrotask(() => {
          if (outcome === "load") forms.forEach(({ form }) => { form.widgetReady = true; });
          script.dispatchEvent(new Event(outcome));
        });
      }
    },
    createElement() {
      return new FakeElement();
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return forms.map(({ form }) => form);
    }
  };
  class FakeIntersectionObserver {
    constructor(callback) {
      this.callback = callback;
      observers.push(this);
    }
    observe() {}
    disconnect() {}
  }
  class FakeMutationObserver {
    observe() {}
    disconnect() {}
  }
  return {
    documentRef,
    scripts,
    observers,
    IntersectionObserverClass: FakeIntersectionObserver,
    MutationObserverClass: FakeMutationObserver,
    windowRef
  };
};

test("loads one third-party script for repeated and multiple-form requests", async () => {
  const forms = [makeForm(), makeForm()];
  const environment = makeEnvironment(forms);
  const loader = createCaptchaLoader(environment);

  const results = await Promise.all([
    loader.loadForForm(forms[0].form),
    loader.loadForForm(forms[0].form),
    loader.loadForForm(forms[1].form)
  ]);

  assert.deepEqual(results, [true, true, true]);
  assert.equal(environment.scripts.length, 1);
  assert.equal(forms[0].shell.dataset.captchaState, "ready");
  assert.equal(forms[1].shell.dataset.captchaState, "ready");
});

test("interaction and viewport proximity trigger delayed loading", async () => {
  const interactionForm = makeForm();
  const interactionEnvironment = makeEnvironment([interactionForm]);
  const interactionLoader = createCaptchaLoader(interactionEnvironment);
  interactionLoader.initialize();
  assert.equal(interactionEnvironment.scripts.length, 0);
  interactionForm.form.dispatchEvent(new Event("focusin"));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(interactionEnvironment.scripts.length, 1);

  const viewportForm = makeForm();
  const viewportEnvironment = makeEnvironment([viewportForm]);
  const viewportLoader = createCaptchaLoader(viewportEnvironment);
  viewportLoader.initialize();
  viewportEnvironment.observers[0].callback([{ isIntersecting: true }]);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(viewportEnvironment.scripts.length, 1);
});

test("viewport observation waits until the initial page load completes", () => {
  const form = makeForm();
  const environment = makeEnvironment([form], ["load"], "loading");
  const loader = createCaptchaLoader(environment);
  loader.initialize();

  assert.equal(environment.observers.length, 0);
  assert.equal(environment.scripts.length, 0);
  environment.windowRef.dispatchEvent(new Event("load"));
  assert.equal(environment.observers.length, 1);
  assert.equal(environment.scripts.length, 0);
});

test("failed loading shows an error and retry starts a fresh successful request", async () => {
  const form = makeForm();
  const environment = makeEnvironment([form], ["error", "load"]);
  const loader = createCaptchaLoader(environment);

  assert.equal(await loader.loadForForm(form.form), false);
  assert.equal(form.shell.dataset.captchaState, "error");
  assert.equal(form.error.hidden, false);

  assert.equal(await loader.retryForForm(form.form), true);
  assert.equal(environment.scripts.length, 2);
  assert.equal(form.shell.dataset.captchaState, "ready");
  assert.equal(form.error.hidden, true);
});
