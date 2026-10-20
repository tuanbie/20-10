import { useState } from "react";
import { CONFIG } from "../config.js";
import { burst } from "../lib/fx.js";
import { Music } from "../lib/music.js";
import Spot, { useSpots } from "./Spot.jsx";

const VARIANTS = ["v-rose", "v-leaf", "v-paper"];
const TILTS = [-2, 1.5, -1, 2, -1.5, 1];

export default function Stamps() {
  const [flipped, setFlipped] = useState(() => new Set());
  const { spots, editing } = useSpots();

  const toggle = (i, el) => {
    const on = !flipped.has(i);
    setFlipped((prev) => {
      const next = new Set(prev);
      if (on) next.add(i);
      else next.delete(i);
      return next;
    });
    if (on) {
      const rc = el.getBoundingClientRect();
      burst(rc.left + rc.width / 2, rc.top + rc.height / 2, 8, 80);
      Music.ding(84 + (i % 3) * 2);
    }
  };

  return (
    <section className="block wrap" id="reasons">
      <h2 className="block-title">{CONFIG.reasonsTitle}</h2>
      <p className="block-help">Chạm vào từng con tem để lật mặt sau.</p>
      <div className="stamps">
        {CONFIG.reasons.map((r, i) => (
          <button
            key={r.title}
            type="button"
            className={`stamp${flipped.has(i) ? " flipped" : ""}${spots[`reason-${i}`] || editing ? " has-photo" : ""}`}
            style={{ "--tilt": `${TILTS[i % TILTS.length]}deg` }}
            aria-pressed={flipped.has(i)}
            aria-label={`${r.title}: ${r.text}`}
            onClick={(e) => toggle(i, e.currentTarget)}
            data-no-fx
          >
            <span className="stamp-inner">
              <span className={`stamp-face stamp-front ${VARIANTS[i % VARIANTS.length]}`}>
                <span className="stamp-top">
                  <i />
                  <span>20/10</span>
                </span>
                <Spot k={`reason-${i}`} className="stamp-photo" inButton />
                <span className="stamp-title">{r.title}</span>
                <span className="stamp-hint">Chạm để lật</span>
              </span>
              <span className="stamp-face stamp-back">
                <span className="stamp-text">{r.text}</span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
