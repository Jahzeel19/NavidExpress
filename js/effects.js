/* ==========================================================================
   EXPRESO DE NAVIDAD · Efectos visuales
   - Snow: nevada constante en un <canvas> (ligera y sin dependencias).
   - Confetti: lluvia de confeti y estrellas para la llegada al Polo Norte.
   ========================================================================== */
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const Snow = (() => {
  let canvas, ctx, flakes = [], width = 0, height = 0, dpr = 1, raf = null, last = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const target = prefersReducedMotion() ? 35 : Math.round(Math.min(150, Math.max(50, width / 9)));
    while (flakes.length < target) flakes.push(makeFlake(true));
    flakes.length = target;
  }

  function makeFlake(anywhere) {
    const r = 0.8 + Math.random() * 2.6;
    return {
      x: Math.random() * width,
      y: anywhere ? Math.random() * height : -10,
      r,
      speed: 18 + r * 14 + Math.random() * 12,   // px por segundo
      drift: 8 + Math.random() * 18,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.45 + Math.random() * 0.5
    };
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    for (const f of flakes) {
      f.phase += dt * 0.9;
      f.y += f.speed * dt;
      f.x += Math.sin(f.phase) * f.drift * dt;
      if (f.y > height + 10) Object.assign(f, makeFlake(false));
      if (f.x > width + 10) f.x = -10;
      if (f.x < -10) f.x = width + 10;
      ctx.globalAlpha = f.alpha;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (raf || !canvas) return;
    last = performance.now();
    if (prefersReducedMotion()) { frame(last); cancelAnimationFrame(raf); raf = null; return; }
    raf = requestAnimationFrame(frame);
  }
  function stop() { cancelAnimationFrame(raf); raf = null; }

  return {
    init(el) {
      canvas = el;
      ctx = canvas.getContext("2d");
      if (!ctx) return;
      resize();
      window.addEventListener("resize", resize);
      document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
      start();
    }
  };
})();

const Confetti = (() => {
  const COLORS = ["#d9ad58", "#a63f35", "#2f7a4c", "#f4e8cf", "#7fd1a5", "#ef6f61"];
  let raf = null;

  function burst(canvas, { count = 140, duration = 4200 } = {}) {
    stop();
    if (!canvas || prefersReducedMotion()) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const parts = Array.from({ length: count }, (_, i) => ({
      x: rect.width / 2 + (Math.random() - 0.5) * 80,
      y: 120,
      vx: (Math.random() - 0.5) * 520,
      vy: -260 - Math.random() * 420,
      size: 5 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 10,
      color: COLORS[i % COLORS.length],
      star: i % 7 === 0
    }));
    const t0 = performance.now();
    let prev = t0;

    const step = (now) => {
      const dt = Math.min(0.04, (now - prev) / 1000);
      prev = now;
      const elapsed = now - t0;
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, elapsed - duration * 0.65) / (duration * 0.35));
      for (const p of parts) {
        p.vy += 620 * dt;
        p.vx *= 0.99;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.star) {
          ctx.font = `${p.size * 2.4}px serif`;
          ctx.fillText("✦", -p.size, p.size);
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
      }
      if (elapsed < duration) raf = requestAnimationFrame(step);
      else { ctx.clearRect(0, 0, rect.width, rect.height); raf = null; }
    };
    raf = requestAnimationFrame(step);
  }

  function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }
  return { burst, stop };
})();
