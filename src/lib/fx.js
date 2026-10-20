// Tim nhỏ bay ra khi chạm. Vẽ trực tiếp vào một lớp DOM riêng cho nhẹ.
let root = null;
export const setFxRoot = (el) => {
  root = el;
};

const rand = (a, b) => a + Math.random() * (b - a);
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function burst(x, y, n, spread = 80) {
  if (!root) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) n = Math.min(n, 3);
  const colors = [cssVar("--rose"), cssVar("--petal-1"), cssVar("--petal-3"), cssVar("--leaf")];
  for (let i = 0; i < n; i++) {
    const el = document.createElement("span");
    el.className = "fx-heart";
    const angle = rand(0, Math.PI * 2);
    const dist = rand(spread * 0.35, spread);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.setProperty("--dx", `${(Math.cos(angle) * dist).toFixed(1)}px`);
    el.style.setProperty("--dy", `${(Math.sin(angle) * dist - rand(10, 40)).toFixed(1)}px`);
    el.style.setProperty("--r", `${rand(-40, 40).toFixed(0)}deg`);
    el.style.setProperty("--s", rand(0.7, 1.3).toFixed(2));
    el.style.setProperty("--size", `${rand(10, 20).toFixed(0)}px`);
    el.style.setProperty("--dur", `${rand(800, 1400).toFixed(0)}ms`);
    el.style.setProperty("--c", colors[i % colors.length]);
    el.addEventListener("animationend", () => el.remove(), { once: true });
    root.appendChild(el);
  }
}
