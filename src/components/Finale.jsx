import { useRef, useState } from "react";
import { CONFIG } from "../config.js";
import { burst } from "../lib/fx.js";
import { Music } from "../lib/music.js";
import { petals } from "../lib/petals.js";

const TAPS = 5;
const NOTES = [72, 74, 76, 79, 84];
const HEART = "M50 88C20 66 2 48 2 28 2 13 13 2 27 2c10 0 18 6 23 14 5-8 13-14 23-14 14 0 25 11 25 26 0 20-18 38-48 60z";

export default function Finale() {
  const [taps, setTaps] = useState(0);
  const [full, setFull] = useState(false);
  const btnRef = useRef(null);

  const center = () => {
    const rc = btnRef.current.getBoundingClientRect();
    return [rc.left + rc.width / 2, rc.top + rc.height / 2];
  };

  const onTap = () => {
    const [cx, cy] = center();
    if (taps >= TAPS) {
      burst(cx, cy, 14, 170);
      Music.ding(88);
      return;
    }
    const n = taps + 1;
    setTaps(n);
    btnRef.current
      .querySelector("svg")
      ?.animate?.([{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }], { duration: 350 });
    burst(cx, cy, 5 + n * 2, 90);
    Music.ding(NOTES[n - 1]);
    if (n === TAPS) {
      setTimeout(() => {
        setFull(true);
        const [x, y] = center();
        burst(x, y, 40, Math.max(window.innerWidth, window.innerHeight) * 0.55);
        petals.boost(30);
        Music.chord([72, 76, 79, 84, 88]);
      }, 450);
    }
  };

  const left = TAPS - taps;
  const hint = left === TAPS ? `Cần chạm ${TAPS} lần.` : left > 0 ? `Còn ${left} lần nữa.` : "";

  return (
    <section className="block wrap finale" id="finale">
      <h2 className="block-title">Một điều cuối cùng</h2>
      <p className="block-help">Chạm vào trái tim cho đến khi nó đầy nhé.</p>
      <button
        ref={btnRef}
        className={`big-heart${full ? " full" : ""}`}
        type="button"
        aria-label={full ? "Trái tim đã đầy" : "Trái tim, chạm để lấp đầy"}
        onClick={onTap}
        data-no-fx
      >
        <svg viewBox="0 0 100 92" aria-hidden="true">
          <defs>
            <clipPath id="heart-clip">
              <path d={HEART} />
            </clipPath>
          </defs>
          <path className="heart-shape" d={HEART} />
          <g clipPath="url(#heart-clip)">
            <rect
              className="heart-fill"
              x="0"
              y="0"
              width="100"
              height="92"
              style={{ transform: `translateY(${(92 * (1 - taps / TAPS)).toFixed(1)}px)` }}
            />
          </g>
        </svg>
      </button>
      <p className="heart-count" aria-live="polite">
        {hint}
      </p>
      {full && (
        <div className="final-msg">
          <p className="final-title">{CONFIG.finalTitle}</p>
          <p className="final-text">{CONFIG.finalMessage}</p>
        </div>
      )}
    </section>
  );
}
