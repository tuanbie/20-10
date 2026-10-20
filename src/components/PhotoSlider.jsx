import { useCallback, useEffect, useRef, useState } from "react";
import { CONFIG } from "../config.js";
import Lightbox from "./Lightbox.jsx";

const TILTS = [-1.6, 1.2, -0.8, 1.6, -1.2, 0.8];

export default function PhotoSlider({ photos, editing }) {
  const trackRef = useRef(null);
  const ticking = useRef(false);
  const [active, setActive] = useState(0);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    if (active > photos.length - 1) setActive(Math.max(0, photos.length - 1));
  }, [photos.length, active]);

  const measure = useCallback(() => {
    ticking.current = false;
    const track = trackRef.current;
    if (!track) return;
    const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const items = Array.from(track.children);
    if (track.scrollLeft >= track.scrollWidth - track.clientWidth - 2) {
      setActive(items.length - 1);
      return;
    }
    let best = 0;
    let bestDist = Infinity;
    items.forEach((el, i) => {
      const dist = Math.abs(el.offsetLeft - pad - track.scrollLeft);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setActive(best);
  }, []);

  const onScroll = () => {
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(measure);
  };

  const go = (i) => {
    const track = trackRef.current;
    const el = track?.children[i];
    if (!el) return;
    const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: el.offsetLeft - pad, behavior: smooth ? "smooth" : "auto" });
  };

  if (!photos.length) {
    if (!editing) return null;
    return (
      <section className="block wrap" id="photos">
        <h2 className="block-title">{CONFIG.photosTitle}</h2>
        <p className="photos-empty">Chưa có ảnh nào. Thêm ảnh ở bảng chỉnh sửa bên dưới.</p>
      </section>
    );
  }

  return (
    <section className="block photos" id="photos" aria-roledescription="carousel" aria-label={CONFIG.photosTitle}>
      <div className="wrap">
        <h2 className="block-title">{CONFIG.photosTitle}</h2>
        <p className="block-help">{CONFIG.photosHelp}</p>
      </div>

      <div className="track" ref={trackRef} onScroll={onScroll} data-no-fx>
        {photos.map((p, i) => (
          <figure
            key={p.id}
            className="polaroid"
            style={{ "--tilt": `${TILTS[i % TILTS.length]}deg` }}
            aria-roledescription="slide"
            aria-label={`${i + 1} trên ${photos.length}`}
          >
            <button type="button" className="polaroid-img" onClick={() => setViewing(i)} aria-label="Xem ảnh lớn">
              <img src={p.url} alt={p.caption || `Ảnh kỷ niệm ${i + 1}`} loading="lazy" decoding="async" draggable="false" />
            </button>
            <figcaption>
              {p.caption && <span>{p.caption}</span>}
              {p.date && <small>{p.date}</small>}
            </figcaption>
          </figure>
        ))}
      </div>

      {photos.length > 1 && (
        <div className="slider-nav wrap" data-no-fx>
          <button type="button" className="nav-btn" onClick={() => go(Math.max(0, active - 1))} disabled={active === 0} aria-label="Ảnh trước">
            ‹
          </button>
          {photos.length <= 10 ? (
            <div className="dots">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  className={`dot${i === active ? " on" : ""}`}
                  onClick={() => go(i)}
                  aria-label={`Ảnh ${i + 1}`}
                  aria-current={i === active}
                />
              ))}
            </div>
          ) : (
            <p className="slider-count">
              {active + 1} / {photos.length}
            </p>
          )}
          <button
            type="button"
            className="nav-btn"
            onClick={() => go(Math.min(photos.length - 1, active + 1))}
            disabled={active === photos.length - 1}
            aria-label="Ảnh sau"
          >
            ›
          </button>
        </div>
      )}

      {viewing !== null && photos[viewing] && (
        <Lightbox photos={photos} index={viewing} onIndex={setViewing} onClose={() => setViewing(null)} />
      )}
    </section>
  );
}
