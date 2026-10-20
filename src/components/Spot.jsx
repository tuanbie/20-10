import { createContext, useContext } from "react";
import { CONFIG } from "../config.js";

// Những vị trí trên trang có thể gắn ảnh (ngoài slider). Sửa trong bảng ⋯ → tab "Các vị trí".
export const SPOTS = [
  { key: "hero", label: "Đầu trang", caption: true },
  { key: "letter", label: "Kẹp trên lá thư", caption: true },
  ...CONFIG.reasons.map((r, i) => ({ key: `reason-${i}`, label: `Tem: ${r.title}` })),
  { key: "wishes", label: "Cạnh lời chúc", caption: true },
  { key: "finale", label: "Trong trái tim cuối" },
];

export const SpotContext = createContext({ spots: {}, editing: false, pick: () => {} });

export const useSpots = () => useContext(SpotContext);

export function useSpot(key) {
  const { spots, editing, pick } = useContext(SpotContext);
  return { photo: spots[key] || null, editing, pick: () => pick(key) };
}

/**
 * Ảnh gắn tại một vị trí. Không có ảnh thì không hiện gì, trừ khi đang sửa:
 * lúc đó hiện ô trống, bấm vào để chọn ảnh cho vị trí này trong bảng sửa.
 * `inButton`: nằm trong một <button> khác (con tem) nên chỉ được dùng thẻ span.
 */
export default function Spot({ k, className = "", caption = false, inButton = false }) {
  const { photo, editing, pick } = useSpot(k);
  if (!photo && !editing) return null;

  const label = SPOTS.find((s) => s.key === k)?.label || "";
  const body = photo ? (
    <>
      <span className="spot-img">
        <img src={photo.url} alt={photo.caption || ""} loading="lazy" decoding="async" draggable="false" />
      </span>
      {caption && photo.caption && <span className="spot-cap">{photo.caption}</span>}
    </>
  ) : (
    <span className="spot-empty">+ Ảnh: {label}</span>
  );
  const cls = `spot ${className}${editing ? " editing" : ""}`;

  if (!editing) {
    const Tag = inButton ? "span" : "figure";
    return (
      <Tag className={cls} data-spot={k}>
        {body}
      </Tag>
    );
  }
  if (inButton) {
    return (
      <span
        className={cls}
        data-spot={k}
        title={`Sửa ảnh: ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          pick();
        }}
      >
        {body}
      </span>
    );
  }
  return (
    <button type="button" className={cls} data-spot={k} title={`Sửa ảnh: ${label}`} onClick={pick} data-no-fx>
      {body}
    </button>
  );
}
