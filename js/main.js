// ===================================================================
// Config
// ===================================================================
const GITHUB_USERNAME = "huiwoo-jo";
const SCROLL_HEADER_THRESHOLD = 60;
const SCROLL_TOP_THRESHOLD = 300;
const OBSERVER_THRESHOLD = 0.2;
const TYPE_SPEED = 45;
const CONTACT_FORM_ENDPOINT = "https://formspree.io/f/xzdqklew";

// ===================================================================
// Theme (dark mode) — state: theme → render: document data-theme
// ===================================================================
const themeToggleBtn = document.querySelector("#theme-toggle");
const themeIcon = themeToggleBtn.querySelector("i");

const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  themeIcon.classList.toggle("fa-moon", theme === "light");
  themeIcon.classList.toggle("fa-sun", theme === "dark");
  localStorage.setItem("theme", theme);
};

const getInitialTheme = () => {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

applyTheme(getInitialTheme());

themeToggleBtn.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
});

// ===================================================================
// Hero typing effect (bonus) — 텍스트를 한 글자씩 렌더링
// ===================================================================
const heroSubtitleEl = document.querySelector(".hero__subtitle");

const typeText = (el, text, speed) => {
  el.textContent = "";
  el.classList.add("typing");
  let index = 0;

  const typeNextChar = () => {
    if (index < text.length) {
      el.textContent += text[index];
      index += 1;
      setTimeout(typeNextChar, speed);
    } else {
      el.classList.remove("typing");
    }
  };

  typeNextChar();
};

typeText(heroSubtitleEl, heroSubtitleEl.textContent, TYPE_SPEED);

// ===================================================================
// Hamburger menu — state: menu open/closed → render: classList 'active'
// ===================================================================
const hamburger = document.querySelector("#hamburger");
const navMenu = document.querySelector("#nav-menu");

const closeMenu = () => {
  hamburger.classList.remove("active");
  navMenu.classList.remove("active");
  hamburger.setAttribute("aria-expanded", "false");
};

hamburger.addEventListener("click", () => {
  const isActive = navMenu.classList.toggle("active");
  hamburger.classList.toggle("active", isActive);
  hamburger.setAttribute("aria-expanded", String(isActive));
});

document.querySelectorAll(".nav__link").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    closeMenu();

    const targetId = link.getAttribute("href");
    const target = document.querySelector(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// ===================================================================
// Scroll effects — header background, scroll-to-top visibility
// ===================================================================
const header = document.querySelector("#header");
const scrollTopBtn = document.querySelector("#scroll-top");

window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > SCROLL_HEADER_THRESHOLD);
  scrollTopBtn.classList.toggle("show", window.scrollY > SCROLL_TOP_THRESHOLD);
});

scrollTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ===================================================================
// Scroll animation (Intersection Observer)
// ===================================================================
const animatedEls = document.querySelectorAll(".animate-on-scroll");

const scrollObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        scrollObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: OBSERVER_THRESHOLD }
);

animatedEls.forEach((el) => scrollObserver.observe(el));

// ===================================================================
// Projects — GitHub API integration
// state: idle → loading → success | error | empty → render: hidden 속성 토글
// ===================================================================
const projectsLoadingEl = document.querySelector("#projects-loading");
const projectsErrorEl = document.querySelector("#projects-error");
const projectsEmptyEl = document.querySelector("#projects-empty");
const projectsGridEl = document.querySelector("#projects-grid");
const projectsFiltersEl = document.querySelector("#projects-filters");
const projectsRetryBtn = document.querySelector("#projects-retry");

const PROJECT_STATE_ELS = [
  projectsLoadingEl,
  projectsErrorEl,
  projectsEmptyEl,
  projectsGridEl,
  projectsFiltersEl,
];

// 언어 필터 상태 (bonus): allRepos = 전체 목록, activeLanguage = 현재 선택된 필터
let allRepos = [];
let activeLanguage = "all";

const setProjectsState = (state) => {
  PROJECT_STATE_ELS.forEach((el) => {
    el.hidden = true;
  });
  if (state === "loading") projectsLoadingEl.hidden = false;
  if (state === "error") projectsErrorEl.hidden = false;
  if (state === "empty") projectsEmptyEl.hidden = false;
  if (state === "success") {
    projectsGridEl.hidden = false;
    projectsFiltersEl.hidden = false;
  }
};

const createProjectCard = ({
  name,
  description,
  html_url,
  stargazers_count,
  language,
}) => {
  const card = document.createElement("article");
  card.className = "project-card";
  card.innerHTML = `
		<h3 class="project-card__name">${name}</h3>
		<p class="project-card__desc">${
      description ?? "설명이 없는 프로젝트입니다."
    }</p>
		<div class="project-card__meta">
			<span>⭐ ${stargazers_count}</span>
			<span>${language ?? "—"}</span>
		</div>
		<a class="btn btn--outline" href="${html_url}" target="_blank" rel="noopener noreferrer">GitHub에서 보기</a>
	`;
  return card;
};

// 현재 activeLanguage 기준으로 allRepos를 걸러 그리드에 렌더링 (bonus: array.filter())
const renderFilteredProjects = () => {
  const filtered =
    activeLanguage === "all"
      ? allRepos
      : allRepos.filter((repo) => repo.language === activeLanguage);

  projectsGridEl.innerHTML = "";
  filtered.forEach((repo) =>
    projectsGridEl.appendChild(createProjectCard(repo))
  );
};

const createFilterButton = (value, label) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "filter-btn";
  btn.textContent = label;
  btn.dataset.language = value;
  btn.classList.toggle("active", value === activeLanguage);

  btn.addEventListener("click", () => {
    activeLanguage = value;
    renderFilteredProjects();
    projectsFiltersEl.querySelectorAll(".filter-btn").forEach((otherBtn) => {
      otherBtn.classList.toggle("active", otherBtn.dataset.language === value);
    });
  });

  return btn;
};

// repos에 등장한 언어들로 필터 버튼 목록을 새로 그림 (bonus)
const renderProjectFilters = (repos) => {
  const languages = [
    ...new Set(repos.map((repo) => repo.language).filter(Boolean)),
  ];

  projectsFiltersEl.innerHTML = "";
  projectsFiltersEl.appendChild(createFilterButton("all", "전체"));
  languages.forEach((language) => {
    projectsFiltersEl.appendChild(createFilterButton(language, language));
  });
};

const loadProjects = async () => {
  setProjectsState("loading");

  try {
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6`
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos = await response.json();

    if (!Array.isArray(repos) || repos.length === 0) {
      setProjectsState("empty");
      return;
    }

    allRepos = repos.filter((repo) => !repo.fork);

    if (allRepos.length === 0) {
      setProjectsState("empty");
      return;
    }

    activeLanguage = "all";
    renderProjectFilters(allRepos);
    renderFilteredProjects();
    setProjectsState("success");
  } catch (error) {
    console.error("Failed to load GitHub projects:", error);
    setProjectsState("error");
  }
};

projectsRetryBtn.addEventListener("click", loadProjects);

loadProjects();

// ===================================================================
// Contact form — state: validation errors → render: error messages
// ===================================================================
const contactForm = document.querySelector("#contact-form");
const nameInput = document.querySelector("#name");
const emailInput = document.querySelector("#email");
const messageInput = document.querySelector("#message");
const formSuccessEl = document.querySelector("#form-success");
const formSubmitErrorEl = document.querySelector("#form-submit-error");
const contactSubmitBtn = contactForm.querySelector(".contact__submit");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const showFieldError = (input, message) => {
  const field = input.closest(".form-field");
  const errorEl = field.querySelector(".form-error");
  field.classList.toggle("has-error", Boolean(message));
  errorEl.textContent = message ?? "";
};

const validateForm = () => {
  const { value: name } = nameInput;
  const { value: email } = emailInput;
  const { value: message } = messageInput;

  let isValid = true;

  if (!name.trim()) {
    showFieldError(nameInput, "이름을 입력해주세요.");
    isValid = false;
  } else {
    showFieldError(nameInput, "");
  }

  if (!email.trim()) {
    showFieldError(emailInput, "이메일을 입력해주세요.");
    isValid = false;
  } else if (!EMAIL_PATTERN.test(email)) {
    showFieldError(emailInput, "올바른 이메일 형식이 아닙니다.");
    isValid = false;
  } else {
    showFieldError(emailInput, "");
  }

  if (!message.trim()) {
    showFieldError(messageInput, "메시지를 입력해주세요.");
    isValid = false;
  } else {
    showFieldError(messageInput, "");
  }

  return isValid;
};

[nameInput, emailInput, messageInput].forEach((input) => {
  input.addEventListener("input", () => {
    if (input.closest(".form-field").classList.contains("has-error")) {
      validateForm();
    }
  });
});

// 폼 실제 전송 (bonus): Formspree로 POST, 로딩/성공/에러 상태를 UI로 표현
contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formSuccessEl.hidden = true;
  formSubmitErrorEl.hidden = true;

  if (!validateForm()) return;

  contactSubmitBtn.disabled = true;
  contactSubmitBtn.textContent = "전송 중...";

  try {
    const response = await fetch(CONTACT_FORM_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(contactForm),
    });

    if (!response.ok) {
      throw new Error(`Form submit failed: ${response.status}`);
    }

    formSuccessEl.hidden = false;
    contactForm.reset();
  } catch (error) {
    console.error("Failed to send contact form:", error);
    formSubmitErrorEl.hidden = false;
  } finally {
    contactSubmitBtn.disabled = false;
    contactSubmitBtn.textContent = "Send";
  }
});
