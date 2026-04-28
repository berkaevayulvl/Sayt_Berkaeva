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

function initTargetCursor({
  targetSelector = ".cursor-target",
  spinDuration = 2,
  hideDefaultCursor = true,
  hoverDuration = 0.2,
  parallaxOn = true,
} = {}) {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduce || !finePointer) return;
  if (typeof window.gsap === "undefined") return;

  const gsap = window.gsap;
  const cursor = document.querySelector(".target-cursor-wrapper");
  if (!cursor) return;

  document.body.classList.add("has-custom-cursor");
  if (hideDefaultCursor) document.body.style.cursor = "none";

  const dot = cursor.querySelector(".target-cursor-dot");
  const corners = Array.from(cursor.querySelectorAll(".target-cursor-corner"));

  const constants = { borderWidth: 3, cornerSize: 12 };

  gsap.set(cursor, {
    xPercent: -50,
    yPercent: -50,
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    opacity: 1,
  });

  let activeTarget = null;
  let currentLeaveHandler = null;
  let resumeTimeout = null;

  const activeStrengthRef = { current: 0 };
  let targetCornerPositions = null;

  let spinTl = gsap.timeline({ repeat: -1 }).to(cursor, { rotation: "+=360", duration: spinDuration, ease: "none" });

  const moveCursor = (x, y) => {
    gsap.to(cursor, { x, y, duration: 0.1, ease: "power3.out", overwrite: "auto" });
  };

  const tickerFn = () => {
    if (!targetCornerPositions) return;
    const strength = activeStrengthRef.current;
    if (strength === 0) return;

    const cursorX = gsap.getProperty(cursor, "x");
    const cursorY = gsap.getProperty(cursor, "y");

    corners.forEach((corner, i) => {
      const currentX = gsap.getProperty(corner, "x");
      const currentY = gsap.getProperty(corner, "y");

      const targetX = targetCornerPositions[i].x - cursorX;
      const targetY = targetCornerPositions[i].y - cursorY;

      const finalX = currentX + (targetX - currentX) * strength;
      const finalY = currentY + (targetY - currentY) * strength;

      const duration = strength >= 0.99 ? (parallaxOn ? 0.2 : 0) : 0.05;

      gsap.to(corner, {
        x: finalX,
        y: finalY,
        duration,
        ease: duration === 0 ? "none" : "power1.out",
        overwrite: "auto",
      });
    });
  };

  const cleanupTarget = (target) => {
    if (currentLeaveHandler) target.removeEventListener("mouseleave", currentLeaveHandler);
    currentLeaveHandler = null;
  };

  const moveHandler = (e) => moveCursor(e.clientX, e.clientY);
  window.addEventListener("mousemove", moveHandler);

  const scrollHandler = () => {
    if (!activeTarget) return;
    const mouseX = gsap.getProperty(cursor, "x");
    const mouseY = gsap.getProperty(cursor, "y");
    const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
    const isStillOverTarget =
      elementUnderMouse && (elementUnderMouse === activeTarget || elementUnderMouse.closest(targetSelector) === activeTarget);
    if (!isStillOverTarget && currentLeaveHandler) currentLeaveHandler();
  };
  window.addEventListener("scroll", scrollHandler, { passive: true });

  const mouseDownHandler = () => {
    if (dot) gsap.to(dot, { scale: 0.7, duration: 0.3 });
    gsap.to(cursor, { scale: 0.9, duration: 0.2 });
  };
  const mouseUpHandler = () => {
    if (dot) gsap.to(dot, { scale: 1, duration: 0.3 });
    gsap.to(cursor, { scale: 1, duration: 0.2 });
  };
  window.addEventListener("mousedown", mouseDownHandler);
  window.addEventListener("mouseup", mouseUpHandler);

  const enterHandler = (e) => {
    const directTarget = e.target;
    let current = directTarget;
    let target = null;
    while (current && current !== document.body) {
      if (current.matches && current.matches(targetSelector)) {
        target = current;
        break;
      }
      current = current.parentElement;
    }
    if (!target) return;
    if (activeTarget === target) return;
    if (activeTarget) cleanupTarget(activeTarget);
    if (resumeTimeout) {
      clearTimeout(resumeTimeout);
      resumeTimeout = null;
    }

    activeTarget = target;
    corners.forEach((c) => gsap.killTweensOf(c));

    gsap.killTweensOf(cursor, "rotation");
    spinTl.pause();
    gsap.set(cursor, { rotation: 0 });

    const rect = target.getBoundingClientRect();
    const { borderWidth, cornerSize } = constants;
    const cursorX = gsap.getProperty(cursor, "x");
    const cursorY = gsap.getProperty(cursor, "y");

    targetCornerPositions = [
      { x: rect.left - borderWidth, y: rect.top - borderWidth },
      { x: rect.right + borderWidth - cornerSize, y: rect.top - borderWidth },
      { x: rect.right + borderWidth - cornerSize, y: rect.bottom + borderWidth - cornerSize },
      { x: rect.left - borderWidth, y: rect.bottom + borderWidth - cornerSize },
    ];

    gsap.ticker.add(tickerFn);
    gsap.to(activeStrengthRef, { current: 1, duration: hoverDuration, ease: "power2.out" });

    corners.forEach((corner, i) => {
      gsap.to(corner, {
        x: targetCornerPositions[i].x - cursorX,
        y: targetCornerPositions[i].y - cursorY,
        duration: 0.2,
        ease: "power2.out",
        overwrite: "auto",
      });
    });

    const leaveHandler = () => {
      gsap.ticker.remove(tickerFn);
      targetCornerPositions = null;
      gsap.set(activeStrengthRef, { current: 0, overwrite: true });
      activeTarget = null;

      const { cornerSize } = constants;
      const positions = [
        { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
        { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
        { x: cornerSize * 0.5, y: cornerSize * 0.5 },
        { x: -cornerSize * 1.5, y: cornerSize * 0.5 },
      ];

      const tl = gsap.timeline();
      corners.forEach((corner, index) => {
        tl.to(
          corner,
          { x: positions[index].x, y: positions[index].y, duration: 0.3, ease: "power3.out", overwrite: "auto" },
          0,
        );
      });

      resumeTimeout = window.setTimeout(() => {
        if (!activeTarget && spinTl) {
          const currentRotation = gsap.getProperty(cursor, "rotation");
          const normalizedRotation = ((currentRotation % 360) + 360) % 360;
          spinTl.kill();
          spinTl = gsap.timeline({ repeat: -1 }).to(cursor, { rotation: "+=360", duration: spinDuration, ease: "none" });
          gsap.to(cursor, {
            rotation: normalizedRotation + 360,
            duration: spinDuration * (1 - normalizedRotation / 360),
            ease: "none",
            onComplete: () => spinTl.restart(),
          });
        }
        resumeTimeout = null;
      }, 50);

      cleanupTarget(target);
    };

    currentLeaveHandler = leaveHandler;
    target.addEventListener("mouseleave", leaveHandler);
  };

  window.addEventListener("mouseover", enterHandler, { passive: true });
}

function initColorBendsWebGL() {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.getElementById("color-bends");
  if (!canvas) return;

  if (reduce) {
    canvas.style.display = "none";
    return;
  }

  const THREE = window.THREE;
  if (!THREE) return;

  // Params (mirrors the provided React component usage)
  const params = {
    colors: ["#ff5c7a", "#8a5cff", "#00ffd1"],
    rotation: 59,
    speed: 0.2,
    scale: 1.3,
    frequency: 1,
    warpStrength: 1,
    mouseInfluence: 1,
    parallax: 0.5,
    noise: 0.1,
    transparent: true,
    autoRotate: 0,
  };

  const MAX_COLORS = 8;

  const frag = `
    #define MAX_COLORS ${MAX_COLORS}
    uniform vec2 uCanvas;
    uniform float uTime;
    uniform float uSpeed;
    uniform vec2 uRot;
    uniform int uColorCount;
    uniform vec3 uColors[MAX_COLORS];
    uniform int uTransparent;
    uniform float uScale;
    uniform float uFrequency;
    uniform float uWarpStrength;
    uniform vec2 uPointer; // in NDC [-1,1]
    uniform float uMouseInfluence;
    uniform float uParallax;
    uniform float uNoise;
    varying vec2 vUv;

    void main() {
      float t = uTime * uSpeed;
      vec2 p = vUv * 2.0 - 1.0;
      p += uPointer * uParallax * 0.1;
      vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);
      vec2 q = vec2(rp.x * (uCanvas.x / uCanvas.y), rp.y);
      q /= max(uScale, 0.0001);
      q /= 0.5 + 0.2 * dot(q, q);
      q += 0.2 * cos(t) - 7.56;
      vec2 toward = (uPointer - rp);
      q += toward * uMouseInfluence * 0.2;

      vec3 col = vec3(0.0);
      float a = 1.0;

      if (uColorCount > 0) {
        vec2 s = q;
        vec3 sumCol = vec3(0.0);
        float cover = 0.0;
        for (int i = 0; i < MAX_COLORS; ++i) {
          if (i >= uColorCount) break;
          s -= 0.01;
          vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
          float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);
          float kBelow = clamp(uWarpStrength, 0.0, 1.0);
          float kMix = pow(kBelow, 0.3);
          float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
          vec2 disp = (r - s) * kBelow;
          vec2 warped = s + disp * gain;
          float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);
          float m = mix(m0, m1, kMix);
          float w = 1.0 - exp(-6.0 / exp(6.0 * m));
          sumCol += uColors[i] * w;
          cover = max(cover, w);
        }
        col = clamp(sumCol, 0.0, 1.0);
        a = uTransparent > 0 ? cover : 1.0;
      } else {
        vec2 s = q;
        for (int k = 0; k < 3; ++k) {
          s -= 0.01;
          vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
          float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(k)) / 4.0);
          float kBelow = clamp(uWarpStrength, 0.0, 1.0);
          float kMix = pow(kBelow, 0.3);
          float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
          vec2 disp = (r - s) * kBelow;
          vec2 warped = s + disp * gain;
          float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(k)) / 4.0);
          float m = mix(m0, m1, kMix);
          col[k] = 1.0 - exp(-6.0 / exp(6.0 * m));
        }
        a = uTransparent > 0 ? max(max(col.r, col.g), col.b) : 1.0;
      }

      if (uNoise > 0.0001) {
        float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453123);
        col += (n - 0.5) * uNoise;
        col = clamp(col, 0.0, 1.0);
      }

      vec3 rgb = (uTransparent > 0) ? col * a : col;
      gl_FragColor = vec4(rgb, a);
    }
  `;

  const vert = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geometry = new THREE.PlaneGeometry(2, 2);

  const toVec3 = (hex) => {
    const h = String(hex || "").replace("#", "").trim();
    const v =
      h.length === 3
        ? [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
        : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    return new THREE.Vector3(v[0] / 255, v[1] / 255, v[2] / 255);
  };

  const uColorsArray = Array.from({ length: MAX_COLORS }, () => new THREE.Vector3(0, 0, 0));
  const colorVecs = (params.colors || []).filter(Boolean).slice(0, MAX_COLORS).map(toVec3);
  for (let i = 0; i < MAX_COLORS; i++) {
    if (i < colorVecs.length) uColorsArray[i].copy(colorVecs[i]);
  }

  const material = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uCanvas: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uSpeed: { value: params.speed },
      uRot: { value: new THREE.Vector2(1, 0) },
      uColorCount: { value: colorVecs.length },
      uColors: { value: uColorsArray },
      uTransparent: { value: params.transparent ? 1 : 0 },
      uScale: { value: params.scale },
      uFrequency: { value: params.frequency },
      uWarpStrength: { value: params.warpStrength },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uMouseInfluence: { value: params.mouseInfluence },
      uParallax: { value: params.parallax },
      uNoise: { value: params.noise },
    },
    premultipliedAlpha: true,
    transparent: true,
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: "high-performance",
    alpha: true,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, params.transparent ? 0 : 1);

  const pointerTarget = new THREE.Vector2(0, 0);
  const pointerCurrent = new THREE.Vector2(0, 0);
  const pointerSmooth = 8;

  const handlePointerMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / (rect.width || 1)) * 2 - 1;
    const y = -(((e.clientY - rect.top) / (rect.height || 1)) * 2 - 1);
    pointerTarget.set(x, y);
  };
  window.addEventListener("pointermove", handlePointerMove, { passive: true });

  const resize = () => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    renderer.setSize(w, h, false);
    material.uniforms.uCanvas.value.set(w, h);
  };
  resize();
  window.addEventListener("resize", resize);

  const start = performance.now();
  const loop = (now) => {
    const elapsed = (now - start) / 1000;
    material.uniforms.uTime.value = elapsed;

    const deg = (params.rotation % 360) + params.autoRotate * elapsed;
    const rad = (deg * Math.PI) / 180;
    material.uniforms.uRot.value.set(Math.cos(rad), Math.sin(rad));

    const amt = Math.min(1, (1 / 60) * pointerSmooth);
    pointerCurrent.lerp(pointerTarget, amt);
    material.uniforms.uPointer.value.copy(pointerCurrent);

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
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

function buildSmartContactText({ name, who, goal, deadline, details }) {
  const safe = (v) => String(v || "").replace(/\s+/g, " ").trim();
  const nl = "\n";

  const baseAnswers = {
    who: safe(who),
    goal: safe(goal),
    exp: "", // optional in this quick form
    format: "",
    tech: "",
  };
  const rec = buildRecommendation(baseAnswers);

  const parts = [];
  parts.push("Заявка с сайта");
  if (safe(name)) parts.push(`Имя: ${safe(name)}`);
  if (safe(who)) parts.push(`Кто: ${safe(who)}`);
  if (safe(goal)) parts.push(`Цель: ${safe(goal)}`);
  if (safe(deadline)) parts.push(`Срок: ${safe(deadline)}`);
  parts.push("");
  parts.push("Описание задачи:");
  parts.push(safe(details));
  parts.push("");
  parts.push("Авто‑ориентир (по ответам):");
  parts.push(`- Рекомендация: ${rec.primary}`);
  parts.push(`- Что важно: ${rec.need}`);
  if (Array.isArray(rec.services) && rec.services.length) {
    parts.push("- Возможные форматы:");
    for (const s of rec.services.slice(0, 6)) parts.push(`  • ${s}`);
  }
  parts.push("");
  parts.push("Чтобы я быстро оценил(а) объём, можно ответить 2 строками:");
  parts.push("1) Есть ли примеры/референсы (ссылки)?");
  parts.push("2) Какой результат считаете “готово”?");

  return parts.join(nl);
}

function initSmartContact() {
  const form = document.querySelector("[data-smart-contact]");
  if (!form) return;

  const email = "BerkaevaYulVl@gmail.com";
  const tgUsername = "Yuliya_Berkaeva";

  const el = (name) => form.querySelector(`[name="${name}"]`);
  const textBox = form.querySelector("[data-smart-text]");
  const linkMail = form.querySelector("[data-smart-mail]");
  const linkTg = form.querySelector("[data-smart-tg]");
  const btnCopy = form.querySelector("[data-smart-copy]");

  const compute = () => {
    const payload = {
      name: el("name")?.value,
      who: el("who")?.value,
      goal: el("goal")?.value,
      deadline: el("deadline")?.value,
      details: el("details")?.value,
    };

    const text = buildSmartContactText(payload);
    if (textBox) textBox.textContent = text;

    const subject = "Заявка с сайта — Юлия Беркаева";
    const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    if (linkMail) linkMail.setAttribute("href", mailto);

    // Share URL variant is more compatible across devices
    const tgHref = `https://t.me/share/url?url=${encodeURIComponent("https://example.com")}&text=${encodeURIComponent(text)}`;

    // Prefer direct chat link with text where supported, fallback to share/url (keeps very long texts working)
    const direct = `https://t.me/${encodeURIComponent(tgUsername)}?text=${encodeURIComponent(text)}`;
    if (linkTg) linkTg.setAttribute("href", direct.length < 1800 ? direct : tgHref);
  };

  const requiredOk = () => {
    const who = el("who")?.value;
    const goal = el("goal")?.value;
    const details = el("details")?.value;
    const consent = el("consent")?.checked;
    return Boolean(who && goal && String(details || "").trim().length > 0 && consent);
  };

  const updateDisabled = () => {
    const ok = requiredOk();
    if (linkMail) linkMail.toggleAttribute("aria-disabled", !ok);
    if (linkTg) linkTg.toggleAttribute("aria-disabled", !ok);
  };

  compute();
  updateDisabled();

  form.addEventListener("input", () => {
    compute();
    updateDisabled();
  });

  form.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    if (a.matches("[data-smart-mail], [data-smart-tg]") && !requiredOk()) {
      e.preventDefault();
      alert("Заполните поля: Кто вы, Цель, Описание задачи и поставьте согласие на обработку данных.");
    }
  });

  btnCopy?.addEventListener("click", async () => {
    const text = textBox?.textContent || "";
    try {
      await navigator.clipboard.writeText(text);
      btnCopy.textContent = "Скопировано";
      window.setTimeout(() => (btnCopy.textContent = "Скопировать текст"), 1200);
    } catch {
      alert("Не получилось скопировать автоматически. Вы можете выделить текст в блоке предпросмотра и скопировать вручную.");
    }
  });
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

function initMagneticButtons() {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduce || !finePointer) return;
  if (typeof window.gsap === "undefined") return;

  const gsap = window.gsap;

  const strength = 10; // px
  const targets = Array.from(document.querySelectorAll(".btn, .nav__link.nav__cta"));

  for (const el of targets) {
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      const mx = (x / (r.width / 2)) * strength;
      const my = (y / (r.height / 2)) * strength;
      el.classList.add("is-magnetic");
      el.style.setProperty("--mx", `${mx.toFixed(2)}px`);
      el.style.setProperty("--my", `${my.toFixed(2)}px`);
    };

    const onLeave = () => {
      el.classList.remove("is-magnetic");
      gsap.to(el, {
        duration: 0.35,
        ease: "power3.out",
        onUpdate: () => {
          el.style.setProperty("--mx", "0px");
          el.style.setProperty("--my", "0px");
        },
        onComplete: () => {
          el.style.setProperty("--mx", "0px");
          el.style.setProperty("--my", "0px");
        },
      });
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
  }
}

function initScrollSpy() {
  const navLinks = Array.from(document.querySelectorAll(".nav__link[href^=\"#\"]"));
  if (navLinks.length === 0) return;

  const linkById = new Map();
  for (const a of navLinks) {
    const hash = a.getAttribute("href") || "";
    const id = hash.startsWith("#") ? hash.slice(1) : "";
    if (id) linkById.set(id, a);
  }

  const sections = Array.from(linkById.keys())
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (sections.length === 0) return;

  const setActive = (id) => {
    for (const a of navLinks) a.classList.remove("is-active");
    const a = linkById.get(id);
    if (a) a.classList.add("is-active");
  };

  if (!("IntersectionObserver" in window)) {
    // fallback: activate first
    setActive(sections[0].id);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]?.target?.id) setActive(visible[0].target.id);
    },
    { rootMargin: "-30% 0px -55% 0px", threshold: [0.06, 0.12, 0.18, 0.24] },
  );

  for (const s of sections) io.observe(s);
}

function initStarDust() {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.getElementById("star-dust");
  if (!canvas) return;
  if (reduce) {
    canvas.style.display = "none";
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const finePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;

  let w = 0;
  let h = 0;
  let dpr = 1;

  const resize = () => {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = window.innerWidth || 1;
    h = window.innerHeight || 1;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  const count = Math.round((w * h) / 42000); // sparse
  const stars = Array.from({ length: Math.max(40, Math.min(160, count)) }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: 0.6 + Math.random() * 1.4,
    a: 0.08 + Math.random() * 0.22,
    s: 0.12 + Math.random() * 0.35,
    p: Math.random() * Math.PI * 2,
  }));

  const pointer = { x: w * 0.5, y: h * 0.5, k: 0 };
  if (finePointer) {
    window.addEventListener("pointermove", (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.k = 1;
    });
  }

  let t = 0;
  const draw = () => {
    t += 0.016;
    ctx.clearRect(0, 0, w, h);

    // very soft vignette lift
    const vg = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, Math.max(w, h) * 0.65);
    vg.addColorStop(0, "rgba(255,255,255,0.02)");
    vg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);

    for (const s of stars) {
      const tw = 0.5 + 0.5 * Math.sin(t * s.s + s.p);
      const ax = (pointer.x - w * 0.5) * 0.0006 * pointer.k;
      const ay = (pointer.y - h * 0.5) * 0.0006 * pointer.k;

      const x = s.x + ax * (20 * s.r);
      const y = s.y + ay * (20 * s.r);

      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${(s.a * (0.7 + 0.6 * tw)).toFixed(3)})`;
      ctx.arc(x, y, s.r * (0.85 + 0.35 * tw), 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
}

function initSplashCursor() {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.getElementById("fluid");
  if (!canvas) return;

  const finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduce || !finePointer) {
    canvas.style.display = "none";
    return;
  }

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  let w = 0;
  let h = 0;
  let dpr = 1;

  const resize = () => {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = window.innerWidth || 1;
    h = window.innerHeight || 1;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  // “дорого‑богато” палитра
  const palette = [
    { r: 41, g: 245, b: 255 }, // cyan
    { r: 255, g: 47, b: 200 }, // hot pink
    { r: 255, g: 194, b: 75 }, // gold
  ];

  const splats = [];
  const maxSplats = 90;

  const addSplat = (x, y, vx, vy, power = 1) => {
    const c = palette[(Math.random() * palette.length) | 0];
    splats.push({
      x,
      y,
      vx,
      vy,
      r: 40 + Math.random() * 110 * power,
      a: 0.08 + Math.random() * 0.22 * power,
      life: 1,
      c,
    });
    while (splats.length > maxSplats) splats.shift();
  };

  let last = null;
  const onMove = (e) => {
    const x = e.clientX;
    const y = e.clientY;
    if (!last) last = { x, y, t: performance.now() };
    const dx = x - last.x;
    const dy = y - last.y;
    const v = Math.min(1.8, Math.hypot(dx, dy) / 22);
    addSplat(x, y, dx, dy, v);
    last = { x, y, t: performance.now() };
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener(
    "pointerdown",
    (e) => {
      for (let i = 0; i < 6; i++) addSplat(e.clientX, e.clientY, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 120, 1.2);
    },
    { passive: true },
  );

  // soft blur pass using shadow + additive
  const fade = 0.08; // higher = faster dissipate
  const step = () => {
    // fade previous frame
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(0,0,0,${fade})`;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = "lighter";
    for (const s of splats) {
      s.life *= 0.965;
      s.x += s.vx * 0.06;
      s.y += s.vy * 0.06;
      s.vx *= 0.92;
      s.vy *= 0.92;

      const a = s.a * s.life;
      if (a < 0.003) continue;

      // glow blob
      ctx.beginPath();
      ctx.shadowBlur = 26;
      ctx.shadowColor = `rgba(${s.c.r},${s.c.g},${s.c.b},${Math.min(0.35, a * 2)})`;
      ctx.fillStyle = `rgba(${s.c.r},${s.c.g},${s.c.b},${a})`;
      ctx.arc(s.x, s.y, s.r * (0.55 + 0.55 * (1 - s.life)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // cleanup
    for (let i = splats.length - 1; i >= 0; i--) {
      if (splats[i].life < 0.02) splats.splice(i, 1);
    }

    requestAnimationFrame(step);
  };

  // initialize canvas with transparent black
  ctx.clearRect(0, 0, w, h);
  requestAnimationFrame(step);
}

function initCardSpringHover() {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduce || !finePointer) return;
  if (typeof window.gsap === "undefined") return;

  const gsap = window.gsap;
  const cards = Array.from(document.querySelectorAll(".glass-card"));
  if (cards.length === 0) return;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  for (const el of cards) {
    let raf = 0;
    const state = { rx: 0, ry: 0, px: 0, py: 0 };

    const apply = () => {
      raf = 0;
      el.style.setProperty("--rx", state.rx.toFixed(2));
      el.style.setProperty("--ry", state.ry.toFixed(2));
      el.style.setProperty("--px", state.px.toFixed(2));
      el.style.setProperty("--py", state.py.toFixed(2));
    };

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);

      // border glow follows cursor
      const hx = ((e.clientX - r.left) / r.width) * 100;
      const hy = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty("--hx", `${clamp(hx, 0, 100).toFixed(1)}%`);
      el.style.setProperty("--hy", `${clamp(hy, 0, 100).toFixed(1)}%`);

      // rotation + content parallax
      const maxRot = 6.5;
      const maxPar = 4.5;
      const target = {
        rx: clamp(dx * maxRot, -maxRot, maxRot),
        ry: clamp(dy * maxRot, -maxRot, maxRot),
        px: clamp(dx * maxPar, -maxPar, maxPar),
        py: clamp(dy * maxPar, -maxPar, maxPar),
      };

      gsap.to(state, {
        ...target,
        duration: 0.55,
        ease: "elastic.out(1, 0.35)",
        overwrite: "auto",
        onUpdate: () => {
          if (!raf) raf = requestAnimationFrame(apply);
        },
      });
    };

    const onEnter = () => {
      gsap.to(el, { scale: 1.01, duration: 0.28, ease: "power3.out", overwrite: "auto" });
    };

    const onLeave = () => {
      el.style.setProperty("--hx", "50%");
      el.style.setProperty("--hy", "50%");
      gsap.to(state, {
        rx: 0,
        ry: 0,
        px: 0,
        py: 0,
        duration: 0.7,
        ease: "elastic.out(1, 0.28)",
        overwrite: "auto",
        onUpdate: () => {
          if (!raf) raf = requestAnimationFrame(apply);
        },
      });
      gsap.to(el, { scale: 1, duration: 0.35, ease: "power3.out", overwrite: "auto" });
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
  }
}

function initGalleryFilters() {
  const host = document.querySelector("[data-gallery-filters]");
  const grid = document.querySelector("[data-gallery-grid]");
  if (!host || !grid) return;

  const chips = Array.from(host.querySelectorAll("[data-filter]"));
  const items = Array.from(grid.querySelectorAll("[data-cat]"));
  if (chips.length === 0 || items.length === 0) return;

  const setActive = (key) => {
    for (const c of chips) c.classList.toggle("is-active", c.getAttribute("data-filter") === key);
    for (const el of items) {
      const cats = String(el.getAttribute("data-cat") || "")
        .split(/\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const show = key === "all" ? true : cats.includes(key);
      el.classList.toggle("is-hidden", !show);
    }
  };

  host.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;
    const key = btn.getAttribute("data-filter") || "all";
    setActive(key);
  });

  setActive("all");
}

function initOfficeViewerLinks() {
  const links = Array.from(document.querySelectorAll("[data-office-viewer]"));
  if (links.length === 0) return;

  // Turn relative file link into Office viewer link using current origin
  for (const a of links) {
    const rawHref = a.getAttribute("href") || "";
    if (!rawHref || /^https?:\/\//i.test(rawHref)) continue;

    const abs = new URL(rawHref, window.location.href).toString();
    const viewer = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(abs)}`;
    a.setAttribute("href", viewer);
  }
}

function initVideoFirstFramePosters() {
  const videos = Array.from(document.querySelectorAll(".media-card__video"));
  if (videos.length === 0) return;

  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  for (const video of videos) {
    const host = video.closest(".media-card__frame");
    if (!host) continue;

    // We'll draw a tiny first-frame preview and overlay it as an <img>
    const img = document.createElement("img");
    img.className = "video-firstframe";
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    host.insertBefore(img, video);

    const hidePoster = () => img.classList.add("is-hidden");
    const showPoster = () => img.classList.remove("is-hidden");

    // Hide when playing, show again on ended/pause at start
    video.addEventListener("play", hidePoster, { passive: true });
    video.addEventListener("pause", () => {
      if (video.currentTime <= 0.05) showPoster();
    });
    video.addEventListener("ended", () => {
      video.currentTime = 0;
      showPoster();
    });

    // Capture first frame once metadata is ready
    const capture = async () => {
      try {
        // Ensure we have a frame to draw.
        if (video.readyState < 2) return;

        // Seek to the very beginning (some browsers need a tiny offset)
        const t = Math.min(0.02, Math.max(0, (video.duration || 0) * 0));
        if (Number.isFinite(video.duration) && video.duration > 0) {
          video.currentTime = t;
          await new Promise((res) => video.addEventListener("seeked", res, { once: true }));
        }

        const w = Math.max(2, Math.floor(video.videoWidth || 0));
        const h = Math.max(2, Math.floor(video.videoHeight || 0));
        if (w < 2 || h < 2) return;

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, w, h);
        img.src = canvas.toDataURL("image/jpeg", 0.78);
        showPoster();
      } catch {
        // If capture fails (CORS/decoder), fall back to default video rendering.
        img.remove();
      }
    };

    video.addEventListener("loadeddata", capture, { once: true });
    // Trigger loading enough data for first frame
    try {
      video.load();
    } catch {
      // ignore
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initMobileMenu();
  initScrollReveal();
  initTilt();
  initTargetCursor({ spinDuration: 2, hideDefaultCursor: true, parallaxOn: true, hoverDuration: 0.2 });
  initSilkStrands();
  initColorBendsWebGL();
  initStarDust();
  initSplashCursor();
  initScrollSpy();
  initMagneticButtons();
  initCardSpringHover();
  initDiagnosticQuiz();
  initSmartContact();
  initGalleryFilters();
  initOfficeViewerLinks();
  initVideoFirstFramePosters();
});

