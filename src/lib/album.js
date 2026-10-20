// Cấu trúc public/photos/photos.json, dùng chung cho trang và plugin lưu ảnh khi chạy dev:
//   { "slider": [ảnh...], "spots": { "hero": ảnh, "letter": ảnh, "reason-0": ảnh, ... } }
// Bản cũ chỉ là một mảng ảnh của slider, vẫn đọc được.

export function splitAlbum(raw) {
  if (Array.isArray(raw)) return { slider: raw, spots: {} };
  const spots = raw?.spots;
  return {
    slider: Array.isArray(raw?.slider) ? raw.slider : [],
    spots: spots && typeof spots === "object" && !Array.isArray(spots) ? spots : {},
  };
}

/** Tất cả tên file ảnh đang được dùng (slider + các vị trí). */
export function albumFiles(raw) {
  const { slider, spots } = splitAlbum(raw);
  return new Set([...slider, ...Object.values(spots)].map((p) => p?.file).filter((f) => typeof f === "string"));
}
