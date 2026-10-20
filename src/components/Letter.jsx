import { useEffect, useMemo, useRef, useState } from "react";
import { CONFIG } from "../config.js";

const PUNCT = /[.,!?…]/;

export default function Letter({ active }) {
  const paras = useMemo(() => CONFIG.letter.map((p) => [...p.normalize("NFC")]), []);
  const flat = useMemo(() => paras.flat(), [paras]);
  const total = flat.length;
  const ends = useMemo(() => {
    const set = new Set();
    let acc = 0;
    paras.forEach((p) => {
      acc += p.length;
      set.add(acc);
    });
    return set;
  }, [paras]);

  const [started, setStarted] = useState(false);
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const done = count >= total;

  useEffect(() => {
    if (!active || started) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStarted(true);
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setCount(total);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [active, started, total]);

  useEffect(() => {
    if (!started || done) return undefined;
    const prev = count > 0 ? flat[count - 1] : "";
    const delay = count === 0 ? 0 : ends.has(count) ? 420 : PUNCT.test(prev) ? 240 : 30;
    const t = setTimeout(() => setCount((c) => c + 1), delay);
    return () => clearTimeout(t);
  }, [started, done, count, flat, ends]);

  const visible = [];
  let remaining = count;
  for (const p of paras) {
    if (remaining <= 0) break;
    const n = Math.min(remaining, p.length);
    visible.push(p.slice(0, n).join(""));
    remaining -= n;
  }
  const typing = started && !done;

  return (
    <section className="block wrap" id="letter" aria-label="Lá thư">
      <article ref={ref} className={`paper${done ? " done" : ""}`}>
        <p className="paper-date">Ngày 20 tháng 10 năm {new Date().getFullYear()}</p>
        <p className="paper-greet">{CONFIG.letterGreeting}</p>
        <div className="sr-only">{CONFIG.letter.join(" ")}</div>
        <div className="paper-body" aria-hidden="true">
          {visible.map((text, i) => (
            <p key={i}>
              {text}
              {typing && i === visible.length - 1 && <span className="caret" />}
            </p>
          ))}
          {typing && visible.length === 0 && (
            <p>
              <span className="caret" />
            </p>
          )}
        </div>
        <p className="paper-sign">
          <span>{CONFIG.signOff}</span>
          <strong>{CONFIG.myName}</strong>
        </p>
      </article>
      {typing && (
        <div className="letter-actions">
          <button className="ghost-btn" type="button" onClick={() => setCount(total)}>
            Hiện cả lá thư
          </button>
        </div>
      )}
    </section>
  );
}
