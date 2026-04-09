const THEME_KEY = "yb_theme";

function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}

function initThemeToggle() {
  const btn = document.querySelector("[data-theme-toggle]");
  if (!btn) return;

  setTheme(getPreferredTheme());

  btn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    setTheme(current === "light" ? "dark" : "light");
  });
}

function initMobileMenu() {
  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".nav");
  if (!burger || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  };

  burger.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));

  nav.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}

function initScrollReveal() {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const items = Array.from(document.querySelectorAll("[data-animate]"));
  if (items.length === 0) return;

  if (reduce || !("IntersectionObserver" in window)) {
    for (const el of items) el.classList.add("is-inview");
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) entry.target.classList.add("is-inview");
      }
    },
    { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
  );

  for (const el of items) io.observe(el);
}

function initTilt() {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduce || !finePointer) return;

  const els = Array.from(document.querySelectorAll("[data-tilt]"));
  for (const el of els) {
    const max = 10;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rx = (py - 0.5) * -2 * max;
      const ry = (px - 0.5) * 2 * max;
      el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    };

    const onLeave = () => {
      el.style.transform = "";
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
  }
}

function initCustomCursor() {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduce || !finePointer) return;

  const cursor = document.querySelector(".cursor");
  if (!cursor) return;
  document.body.classList.add("has-custom-cursor");

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let tx = x;
  let ty = y;

  const lerp = (a, b, t) => a + (b - a) * t;

  const tick = () => {
    tx = lerp(tx, x, 0.18);
    ty = lerp(ty, y, 0.18);
    cursor.style.left = `${tx}px`;
    cursor.style.top = `${ty}px`;
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);

  window.addEventListener("mousemove", (e) => {
    x = e.clientX;
    y = e.clientY;
    cursor.style.opacity = "1";
  });

  window.addEventListener("mousedown", () => {
    cursor.style.transform = "translate(-50%, -50%) scale(0.86)";
  });
  window.addEventListener("mouseup", () => {
    cursor.style.transform = "translate(-50%, -50%) scale(1)";
  });

  const hoverTargets = Array.from(document.querySelectorAll(".cursor-target"));
  for (const t of hoverTargets) {
    t.addEventListener("mouseenter", () => {
      cursor.style.transform = "translate(-50%, -50%) scale(1.2)";
      cursor.style.borderColor = "rgba(37, 243, 211, 0.6)";
    });
    t.addEventListener("mouseleave", () => {
      cursor.style.transform = "translate(-50%, -50%) scale(1)";
      cursor.style.borderColor = "rgba(255, 255, 255, 0.35)";
    });
  }
}

function initBackgroundCanvas() {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.getElementById("color-bends");
  if (!canvas) return;
  if (reduce) {
    canvas.style.display = "none";
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const resize = () => {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  let t = 0;
  const draw = () => {
    t += 0.0045;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    const g1 = ctx.createRadialGradient(window.innerWidth * (0.25 + 0.06 * Math.sin(t)), window.innerHeight * 0.2, 40, window.innerWidth * 0.25, window.innerHeight * 0.2, 520);
    g1.addColorStop(0, "rgba(37, 243, 211, 0.10)");
    g1.addColorStop(1, "rgba(37, 243, 211, 0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    const g2 = ctx.createRadialGradient(window.innerWidth * (0.78 + 0.05 * Math.cos(t * 1.3)), window.innerHeight * 0.28, 40, window.innerWidth * 0.78, window.innerHeight * 0.28, 560);
    g2.addColorStop(0, "rgba(168, 85, 247, 0.10)");
    g2.addColorStop(1, "rgba(168, 85, 247, 0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    const g3 = ctx.createRadialGradient(window.innerWidth * (0.56 + 0.04 * Math.sin(t * 1.7)), window.innerHeight * 0.82, 40, window.innerWidth * 0.56, window.innerHeight * 0.82, 620);
    g3.addColorStop(0, "rgba(255, 61, 166, 0.08)");
    g3.addColorStop(1, "rgba(255, 61, 166, 0)");
    ctx.fillStyle = g3;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
}

function initSilkStrands() {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const host = document.getElementById("silk-bg");
  if (!host) return;
  if (reduce) return;

  const finePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let w = 0;
  let h = 0;
  let dpr = 1;

  const resize = () => {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  const mouse = { x: w * 0.5, y: h * 0.55, a: 0.0 };
  if (finePointer) {
    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.a = 1.0;
    });
  }

  const rand = (a, b) => a + Math.random() * (b - a);

  const strands = Array.from({ length: 20 }, (_, i) => {
    const base = i / 20;
    return {
      phase: rand(0, Math.PI * 2),
      speed: rand(0.35, 0.9),
      width: rand(1.0, 2.2),
      alpha: rand(0.06, 0.12),
      hue: base,
    };
  });

  let t = 0;
  const draw = () => {
    t += 0.006;
    ctx.clearRect(0, 0, w, h);

    ctx.globalCompositeOperation = "lighter";

    for (const s of strands) {
      const cx = w * (0.18 + 0.68 * s.hue);
      const cy = h * 0.55;
      const driftX = Math.sin(t * s.speed + s.phase) * (w * 0.06);
      const driftY = Math.cos(t * (s.speed * 0.9) + s.phase) * (h * 0.05);

      const mx = cx + driftX + (mouse.x - w * 0.5) * 0.03 * mouse.a;
      const my = cy + driftY + (mouse.y - h * 0.6) * 0.02 * mouse.a;

      const topX = mx + Math.sin(t + s.phase) * (w * 0.08);
      const topY = h * 0.05 + Math.cos(t * 0.7 + s.phase) * (h * 0.02);
      const botX = mx + Math.cos(t * 0.8 + s.phase) * (w * 0.08);
      const botY = h * 0.98 + Math.sin(t * 0.6 + s.phase) * (h * 0.02);

      const c1x = mx + Math.sin(t * 1.2 + s.phase) * (w * 0.14);
      const c1y = my - h * 0.18;
      const c2x = mx + Math.cos(t * 1.0 + s.phase) * (w * 0.16);
      const c2y = my + h * 0.18;

      const grad = ctx.createLinearGradient(topX, topY, botX, botY);
      grad.addColorStop(0, `rgba(37, 243, 211, ${s.alpha})`);
      grad.addColorStop(0.45, `rgba(168, 85, 247, ${s.alpha * 0.95})`);
      grad.addColorStop(1, `rgba(255, 61, 166, ${s.alpha * 0.9})`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = s.width;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, botX, botY);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = "source-over";
    requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);
}

function diagnosticQuizConfig() {
  return [
    {
      id: "who",
      question: "Кто вы в контексте запроса?",
      options: ["Частное лицо / самозанятый", "Представитель компании (ИП / ООО)", "Руководитель команды внутри организации"],
    },
    {
      id: "goal",
      question: "Что ближе к вашей главной цели?",
      options: [
        "Научиться стабильно работать с нейросетями",
        "Автоматизировать рутину или процессы",
        "Собрать продукт / инструмент на базе ИИ",
        "Понять, куда внедрять ИИ в бизнесе стратегически",
      ],
    },
    {
      id: "exp",
      question: "Какой у вас опыт с ИИ‑инструментами?",
      options: ["Почти нет, нужна база", "Пользуюсь точечно, хочу системности", "Уверенный пользователь, нужна глубина или внедрение"],
    },
    {
      id: "format",
      question: "Какой горизонт и формат вам интересен?",
      options: ["Разовая консультация или экспресс‑разбор", "Короткий интенсив (несколько встреч)", "Проект с чётким результатом", "Долгое сопровождение или обучение команды"],
    },
    {
      id: "tech",
      question: "Готовность к техническим экспериментам (скрипты, API, no‑code)",
      options: ["Минимальная — простые сценарии", "Средняя — готов(а) к пошаговым инструкциям", "Высокая — можно к прототипам и интеграциям"],
    },
  ];
}

function buildRecommendation(answers) {
  const who = answers.who || "";
  const goal = answers.goal || "";
  const exp = answers.exp || "";
  const format = answers.format || "";
  const tech = answers.tech || "";

  let primary = "Персональная консультация + план внедрения";
  let need = "Наведём ясность: цель, инструменты, сценарии и первые шаги без лишней сложности.";
  const services = [];

  if (goal.includes("Автоматизировать")) {
    primary = "Автоматизация процессов с ИИ (боты/сценарии/интеграции)";
    need = "Определим узкие места, выберем инструменты и соберём рабочий прототип с понятными регламентами.";
    services.push("Аудит процессов и карта внедрения");
    services.push("Прототипирование бота/сценариев");
  } else if (goal.includes("продукт")) {
    primary = "Прототип продукта/инструмента на базе ИИ";
    need = "Соберём MVP: сценарий, интерфейс, тестирование гипотез и план развития.";
    services.push("Проект с чётким результатом (MVP)");
    services.push("Подбор стека и архитектуры");
  } else if (goal.includes("стратегически")) {
    primary = "Стратегия внедрения ИИ в бизнес";
    need = "Сформируем дорожную карту: где эффект максимальный, какие риски и как измерять результат.";
    services.push("Стратегическая сессия + roadmap");
    services.push("Программа грамотности для команды");
  } else {
    primary = "Системная работа с ИИ‑инструментами (без хаоса)";
    need = "Настроим подход: промпты, шаблоны, контекст, качество и повторяемость результата.";
    services.push("Индивидуальная консультация");
    services.push("Короткий интенсив (несколько встреч)");
  }

  if (who.includes("компании") || who.includes("Руководитель")) {
    services.push("Корпоративный воркшоп");
    services.push("Сопровождение пилота и регламенты");
  } else {
    services.push("Подбор стека под профессию");
    services.push("Оформление портфолио/резюме с ИИ");
  }

  if (format.includes("Долгое сопровождение")) services.push("Долгое сопровождение / обучение команды");
  if (exp.includes("Почти нет")) services.push("База по инструментам + безопасные сценарии");
  if (tech.includes("Высокая")) services.push("Интеграции / API / прототипы");

  return { primary, need, services: Array.from(new Set(services)) };
}

function initDiagnosticQuiz() {
  const root = document.getElementById("diagnostic-app");
  if (!root) return;

  const steps = diagnosticQuizConfig();
  let stepIndex = 0;
  const answers = {};

  const render = () => {
    const step = steps[stepIndex];
    const total = steps.length;
    const progress = Math.round(((stepIndex + 1) / total) * 100);

    root.innerHTML = `
      <div class="quiz" role="application" aria-label="Диагностика запроса">
        <div class="quiz__top">
          <div class="quiz__title">Шаг ${stepIndex + 1} из ${total}</div>
          <div class="quiz__progress" aria-label="Прогресс">
            <span style="width:${progress}%"></span>
          </div>
        </div>

        <p class="quiz__q">${step.question}</p>

        <div class="quiz__options" role="radiogroup" aria-label="${step.question}">
          ${step.options
            .map((opt, idx) => {
              const checked = answers[step.id] === opt ? "checked" : "";
              return `
                <label class="quiz__opt cursor-target">
                  <input type="radio" name="q" value="${idx}" ${checked} />
                  <span>${opt}</span>
                </label>
              `;
            })
            .join("")}
        </div>

        <div class="quiz__actions">
          <button class="btn-like cursor-target" type="button" data-prev ${stepIndex === 0 ? "disabled" : ""}>Назад</button>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn-like cursor-target" type="button" data-reset>Пройти заново</button>
            <button class="btn-like cursor-target" type="button" data-next>${stepIndex === total - 1 ? "Показать результат" : "Дальше"}</button>
          </div>
        </div>
      </div>
    `;

    const optInputs = Array.from(root.querySelectorAll('input[type="radio"]'));
    for (const input of optInputs) {
      input.addEventListener("change", () => {
        const i = Number(input.value);
        answers[step.id] = step.options[i];
      });
    }

    root.querySelector("[data-prev]")?.addEventListener("click", () => {
      stepIndex = Math.max(0, stepIndex - 1);
      render();
    });

    root.querySelector("[data-reset]")?.addEventListener("click", () => {
      stepIndex = 0;
      for (const k of Object.keys(answers)) delete answers[k];
      render();
    });

    root.querySelector("[data-next]")?.addEventListener("click", () => {
      if (!answers[step.id]) {
        alert("Выберите один из вариантов.");
        return;
      }
      if (stepIndex === total - 1) {
        renderResult();
        return;
      }
      stepIndex = Math.min(total - 1, stepIndex + 1);
      render();
    });
  };

  const renderResult = () => {
    const rec = buildRecommendation(answers);
    root.innerHTML = `
      <div class="result">
        <div class="result__kicker">Ваш ориентир по услугам</div>
        <h3 class="result__title">${rec.primary}</h3>

        <div class="result__box">
          <strong>Первичная потребность:</strong>
          <div class="muted" style="margin-top:6px; line-height:1.6;">${rec.need}</div>
        </div>

        <div class="result__box">
          <strong>Возможные форматы:</strong>
          <ul class="list" style="margin-top:8px;">
            ${rec.services.map((s) => `<li>${s}</li>`).join("")}
          </ul>
        </div>

        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <a class="btn btn--primary cursor-target" href="#contact">Запросить сотрудничество</a>
          <button class="btn-like cursor-target" type="button" data-reset>Пройти заново</button>
        </div>
      </div>
    `;

    root.querySelector("[data-reset]")?.addEventListener("click", () => {
      stepIndex = 0;
      for (const k of Object.keys(answers)) delete answers[k];
      render();
    });
  };

  render();
}

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initMobileMenu();
  initScrollReveal();
  initTilt();
  initCustomCursor();
  initSilkStrands();
  initBackgroundCanvas();
  initDiagnosticQuiz();
});

