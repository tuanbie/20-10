// Cánh hoa hồng rơi, vẽ bằng canvas.
const rand = (a, b) => a + Math.random() * (b - a);
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

let canvas = null;
let ctx = null;
let W = 0;
let H = 0;
let list = [];
let colors = [];
let last = 0;
let running = false;

const target = () => Math.round(Math.min(26, Math.max(10, (W * H) / 40000)));

function readColors() {
  colors = ["--petal-1", "--petal-2", "--petal-3"].map(cssVar);
  list.forEach((p) => {
    p.color = colors[p.ci];
  });
}

function make(spread, temp = false) {
  const ci = Math.floor(Math.random() * 3);
  return {
    x: rand(-20, W + 20), y: spread ? rand(-H, H) : rand(-90, -20),
    s: rand(7, 14), vy: rand(0.35, 1.0),
    sw: rand(0, 6.28), sws: rand(0.008, 0.02),
    r: rand(0, 6.28), vr: rand(-0.025, 0.025),
    f: rand(0, 6.28), vf: rand(0.015, 0.04),
    a: rand(0.45, 0.85), ci, color: colors[ci], temp,
  };
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  while (list.length < target()) list.push(make(true));
}

function draw(p) {
  const s = p.s;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.r);
  ctx.scale(1, 0.35 + 0.65 * Math.abs(Math.cos(p.f)));
  ctx.globalAlpha = p.a;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.moveTo(0, s);
  ctx.bezierCurveTo(-s * 1.1, s * 0.3, -s * 0.9, -s * 0.9, -s * 0.25, -s * 0.85);
  ctx.quadraticCurveTo(0, -s * 0.6, s * 0.25, -s * 0.85);
  ctx.bezierCurveTo(s * 0.9, -s * 0.9, s * 1.1, s * 0.3, 0, s);
  ctx.fill();
  ctx.restore();
}

function frame(t) {
  const dt = last ? Math.min(3, (t - last) / 16.67) : 1;
  last = t;
  ctx.clearRect(0, 0, W, H);
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    p.sw += p.sws * dt;
    p.x += (Math.sin(p.sw) * 0.7 + 0.15) * dt;
    p.y += p.vy * dt;
    p.r += p.vr * dt;
    p.f += p.vf * dt;
    if (p.y - p.s > H || p.x < -40 || p.x > W + 40) {
      if (p.temp || list.length > target()) {
        list.splice(i, 1);
        continue;
      }
      Object.assign(p, make(false));
    }
    draw(p);
  }
  requestAnimationFrame(frame);
}

export const petals = {
  start(el) {
    if (running || !el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    running = true;
    canvas = el;
    ctx = canvas.getContext("2d");
    readColors();
    resize();
    list = Array.from({ length: target() }, () => make(true));
    window.addEventListener("resize", resize);
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", readColors);
    requestAnimationFrame(frame);
  },
  boost(n) {
    if (!running) return;
    for (let i = 0; i < n; i++) {
      const p = make(false, true);
      p.y = rand(-H * 0.6, -20);
      list.push(p);
    }
  },
};
