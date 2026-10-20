import { useEffect, useMemo, useState } from "react";
import { CONFIG } from "../config.js";
import Spot from "./Spot.jsx";

function useSince(startDate) {
  const start = useMemo(() => {
    if (!startDate) return null;
    const raw = /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? `${startDate}T00:00:00` : startDate;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [startDate]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!start) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [start]);

  if (!start) return null;
  let diff = Math.max(0, now - start.getTime());
  const d = Math.floor(diff / 86400000);
  diff -= d * 86400000;
  const h = Math.floor(diff / 3600000);
  diff -= h * 3600000;
  const m = Math.floor(diff / 60000);
  diff -= m * 60000;
  return { d, h, m, s: Math.floor(diff / 1000) };
}

export default function Hero() {
  const t = useSince(CONFIG.startDate);
  return (
    <header className="hero wrap" id="top">
      <Spot k="hero" className="snap hero-photo" caption />
      <h1 className="hero-title">Chúc mừng 20{"\u00a0"}tháng{"\u00a0"}10, {CONFIG.herName}.</h1>
      <p className="hero-lead">{CONFIG.heroLead}</p>
      {t && (
        <p className="together">
          {CONFIG.counterPrefix} <b>{t.d.toLocaleString("vi-VN")}</b> ngày, <b>{t.h}</b> giờ, <b>{t.m}</b> phút và{" "}
          <b>{t.s}</b> giây.
        </p>
      )}
      <a className="scroll-cue" href="#letter">
        Kéo xuống để đọc thư anh viết <i aria-hidden="true">↓</i>
      </a>
    </header>
  );
}
