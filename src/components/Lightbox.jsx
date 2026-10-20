import { useEffect, useRef } from "react";

export default function Lightbox({ photos, index, onIndex, onClose }) {
  const closeRef = useRef(null);
  const startX = useRef(null);
  const swiped = useRef(false);
  const last = photos.length - 1;
  const p = photos[index];

  useEffect(() => {
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((i) => Math.min(last, i + 1));
      if (e.key === "ArrowLeft") onIndex((i) => Math.max(0, i - 1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [last, onClose, onIndex]);

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh"
      data-no-fx
      onPointerDown={(e) => {
        startX.current = e.clientX;
        swiped.current = false;
      }}
      onPointerUp={(e) => {
        if (startX.current === null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (Math.abs(dx) > 50) {
          swiped.current = true;
          onIndex((i) => (dx < 0 ? Math.min(last, i + 1) : Math.max(0, i - 1)));
        }
      }}
      onClick={(e) => {
        if (!swiped.current && e.target === e.currentTarget) onClose();
      }}
    >
      <button ref={closeRef} type="button" className="lb-close" onClick={onClose} aria-label="Đóng">
        ×
      </button>
      <figure className="lb-figure">
        <img src={p.url} alt={p.caption || "Ảnh kỷ niệm"} draggable="false" />
        {(p.caption || p.date) && (
          <figcaption>
            {p.caption}
            {p.date && <small>{p.date}</small>}
          </figcaption>
        )}
      </figure>
      {index > 0 && (
        <button type="button" className="lb-nav prev" onClick={() => onIndex(index - 1)} aria-label="Ảnh trước">
          ‹
        </button>
      )}
      {index < last && (
        <button type="button" className="lb-nav next" onClick={() => onIndex(index + 1)} aria-label="Ảnh sau">
          ›
        </button>
      )}
      <p className="lb-count">
        {index + 1} / {photos.length}
      </p>
    </div>
  );
}
