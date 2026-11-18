type Pattern = "base" | "construction" | "support";

type Point = {
  x: number;
  y: number;
  phase: number;
};

const MOBILE_BREAKPOINT = 640;
const MOBILE_DENSITY = 16;
const DESKTOP_DENSITY = 32;
const FRAME_INTERVAL = 50;

export function initSignatureBackground() {
  const canvas = document.createElement("canvas");
  canvas.className = "signature-background";
  canvas.setAttribute("aria-hidden", "true");
  canvas.dataset.pattern = "base";
  canvas.dataset.motion = "running";
  document.body.prepend(canvas);

  const canvasContext = canvas.getContext("2d", { alpha: true });
  if (!canvasContext) return;
  const context = canvasContext;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const rootStyle = getComputedStyle(document.documentElement);
  const teal = rootStyle.getPropertyValue("--adpa-teal").trim();
  let pattern: Pattern = "base";
  let points: Point[] = [];
  let animationFrame = 0;
  let resizeFrame = 0;
  let renderedFrames = 0;
  let lastFrame = -FRAME_INTERVAL;
  let pixelRatio = 1;

  function fit() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(window.innerWidth * pixelRatio);
    canvas.height = Math.round(window.innerHeight * pixelRatio);
    canvas.dataset.density = String(
      window.innerWidth < MOBILE_BREAKPOINT
        ? MOBILE_DENSITY
        : DESKTOP_DENSITY,
    );
    const density = Number(canvas.dataset.density);
    points = Array.from({ length: density }, (_, index) => ({
      x: (((index * 73) % 101) / 101) * window.innerWidth,
      y: ((((index * 47) + 19) % 103) / 103) * window.innerHeight,
      phase: (index * Math.PI * 2) / density,
    }));
  }

  function positions(time: number) {
    const travel = pattern === "construction" ? 6 : 10;
    const progress = time * 0.00008;
    return points.map((point) => ({
      x: point.x + Math.sin(progress + point.phase) * travel,
      y: point.y + Math.cos(progress * 0.8 + point.phase) * travel,
    }));
  }

  function draw(time: number) {
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const current = positions(time);

    context.strokeStyle = teal;
    context.fillStyle = teal;
    context.lineWidth = 1;
    if (pattern === "construction") {
      context.globalAlpha = 0.14;
      for (const point of current) {
        context.strokeRect(point.x - 5, point.y - 5, 10, 10);
        context.beginPath();
        context.moveTo(point.x - 14, point.y);
        context.lineTo(point.x + 14, point.y);
        context.stroke();
      }
    } else {
      context.globalAlpha = pattern === "support" ? 0.16 : 0.1;
      const step = pattern === "support" ? 2 : 4;
      for (let index = 0; index < current.length; index += step) {
        const point = current[index];
        const next = current[(index + 3) % current.length];
        context.beginPath();
        context.moveTo(point.x, point.y);
        context.lineTo(next.x, next.y);
        context.stroke();
      }
      context.globalAlpha = pattern === "support" ? 0.22 : 0.16;
      for (const point of current) {
        context.beginPath();
        context.arc(point.x, point.y, pattern === "support" ? 2 : 1.5, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.globalAlpha = 1;
    renderedFrames += 1;
    canvas.dataset.frames = String(renderedFrames);
  }

  function tick(time: number) {
    if (document.hidden || reducedMotion.matches) {
      animationFrame = 0;
      return;
    }
    if (time - lastFrame >= FRAME_INTERVAL) {
      draw(time);
      lastFrame = time;
    }
    animationFrame = requestAnimationFrame(tick);
  }

  function updateMotion() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    if (document.hidden) {
      canvas.dataset.motion = "paused";
      return;
    }
    if (reducedMotion.matches) {
      canvas.dataset.motion = "static";
      draw(0);
      return;
    }
    canvas.dataset.motion = "running";
    lastFrame = -FRAME_INTERVAL;
    animationFrame = requestAnimationFrame(tick);
  }

  function setPattern(next: Pattern) {
    pattern = next;
    canvas.dataset.pattern = next;
    draw(reducedMotion.matches ? 0 : performance.now());
  }

  function bindCards(selector: string, accent: Pattern) {
    for (const card of document.querySelectorAll<HTMLElement>(selector)) {
      card.addEventListener("pointerenter", (event) => {
        if (event.pointerType !== "touch") setPattern(accent);
      });
      card.addEventListener("pointerleave", () => setPattern("base"));
      card.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "touch") setPattern(accent);
      });
      card.addEventListener("pointerup", () => setPattern("base"));
      card.addEventListener("pointercancel", () => setPattern("base"));
    }
  }

  fit();
  draw(0);
  updateMotion();
  bindCards("#construccion article", "construction");
  bindCards("#soporte article", "support");
  document.addEventListener("visibilitychange", updateMotion);
  reducedMotion.addEventListener("change", updateMotion);
  window.addEventListener("resize", () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      fit();
      draw(reducedMotion.matches ? 0 : performance.now());
      resizeFrame = 0;
    });
  });
}
