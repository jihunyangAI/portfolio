(() => {
  const INBOX_EMAIL = "jihunyang@naver.com";
  const root = document.documentElement;
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const form = document.querySelector("[data-contact-form]");

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  };

  const storedTheme = localStorage.getItem("theme");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  applyTheme(storedTheme === "dark" || storedTheme === "light" ? storedTheme : systemTheme);

  themeToggle?.addEventListener("click", () => {
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });

  const setMenu = (open) => {
    if (!menuToggle || !mobileNav) return;
    menuToggle.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    mobileNav.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
  };

  menuToggle?.addEventListener("click", () => {
    setMenu(mobileNav.hidden);
  });

  mobileNav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const setFieldError = (name, message) => {
    const input = form.querySelector(`[name="${name}"]`);
    const field = input?.closest(".field");
    const error = form.querySelector(`[data-error-for="${name}"]`);
    if (!field || !error) return;
    field.classList.toggle("is-invalid", Boolean(message));
    error.hidden = !message;
    error.textContent = message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
  };

  const validate = (data) => {
    const errors = {};
    if (data.name.trim().length < 2) {
      errors.name = "이름을 두 글자 이상 적어 주세요.";
    }
    if (!emailPattern.test(data.email.trim())) {
      errors.email = "올바른 이메일 주소를 적어 주세요.";
    }
    if (data.message.trim().length < 10) {
      errors.message = "메시지를 10자 이상 적어 주세요.";
    }
    return errors;
  };

  form?.addEventListener("input", (event) => {
    const name = event.target?.name;
    if (name) setFieldError(name, "");
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = form.querySelector("[data-form-status]");
    const submit = form.querySelector("[data-submit]");
    const data = {
      name: form.name.value,
      email: form.email.value,
      message: form.message.value,
    };
    const errors = validate(data);

    ["name", "email", "message"].forEach((key) => setFieldError(key, errors[key] || ""));

    if (Object.keys(errors).length) {
      status.hidden = true;
      const firstError = form.querySelector(".is-invalid input, .is-invalid textarea");
      firstError?.focus();
      return;
    }

    if (!INBOX_EMAIL) {
      status.hidden = false;
      status.classList.add("is-error");
      status.textContent = "받을 메일 주소가 아직 없습니다. 주소를 알려 주시면 바로 연결합니다.";
      return;
    }

    submit.disabled = true;
    submit.textContent = "보내는 중";
    status.hidden = true;

    fetch(`https://formsubmit.co/ajax/${encodeURIComponent(INBOX_EMAIL)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        message: data.message,
        _subject: `포트폴리오 연락: ${data.name}`,
        _captcha: "false",
        _template: "table",
      }),
    })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        const failed = !response.ok || payload.success === false || payload.success === "false";
        const needsActivation = /activat/i.test(String(payload.message || ""));

        if (failed && !needsActivation) {
          throw new Error(payload.message || "메일을 보내지 못했습니다.");
        }

        form.reset();
        status.classList.remove("is-error");
        status.textContent = needsActivation
          ? "jihunyang@naver.com으로 확인 메일을 보냈습니다. FormSubmit 링크를 누르면 이후 메시지가 도착합니다."
          : "메시지를 보냈습니다. 메일함을 확인해 주세요.";
        status.hidden = false;
      })
      .catch(() => {
        status.classList.add("is-error");
        status.textContent = "메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.";
        status.hidden = false;
      })
      .finally(() => {
        submit.disabled = false;
        submit.textContent = "보내기";
      });
  });
})();
