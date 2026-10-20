import { useRef, useState } from "react";
import { CONFIG } from "../config.js";
import { burst } from "../lib/fx.js";

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Intro({ onOpen, onRevealed }) {
  const [phase, setPhase] = useState("idle"); // idle → opening → gone → removed
  const envRef = useRef(null);

  if (phase === "removed") return null;

  const open = () => {
    if (phase !== "idle") return;
    setPhase("opening");
    onOpen();
    const rc = envRef.current.getBoundingClientRect();
    const fast = reduceMotion();
    setTimeout(() => burst(rc.left + rc.width / 2, rc.top + rc.height * 0.2, 18, 130), 550);
    setTimeout(() => {
      setPhase("gone");
      onRevealed();
    }, fast ? 300 : 1700);
    setTimeout(() => setPhase("removed"), fast ? 900 : 2700);
  };

  const opening = phase !== "idle";
  return (
    <div className={`intro${opening ? " opening" : ""}${phase === "gone" ? " gone" : ""}`} data-no-fx>
      <div className="intro-inner">
        <p className="intro-title">Có một lá thư cho {CONFIG.herName}</p>
        <button
          ref={envRef}
          className={`envelope${opening ? " open" : ""}`}
          type="button"
          aria-label="Mở thư"
          onClick={open}
        >
          <span className="env-back" />
          <span className="env-letter">Gửi {CONFIG.herName}</span>
          <span className="env-front" />
          <span className="env-flap" />
          <span className="env-seal" />
        </button>
        <p className="intro-hint">Chạm vào phong bì để mở</p>
      </div>
    </div>
  );
}
