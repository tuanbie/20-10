import { splitAlbum } from "./album.js";

const BASE = import.meta.env.BASE_URL;

export const photoUrl = (file) => `${BASE}photos/${file}`;

export const EMPTY_ALBUM = { slider: [], spots: {} };

const valid = (p) => p && typeof p.file === "string";

const toPhoto = (p) => ({
  id: String(p.id || p.file),
  file: p.file,
  caption: String(p.caption || ""),
  date: String(p.date || ""),
  url: photoUrl(p.file),
});

export async function loadAlbum() {
  try {
    const res = await fetch(`${BASE}photos/photos.json`, { cache: "no-cache" });
    if (!res.ok) return EMPTY_ALBUM;
    const { slider, spots } = splitAlbum(await res.json());
    return {
      slider: slider.filter(valid).map(toPhoto),
      spots: Object.fromEntries(Object.entries(spots).filter(([, p]) => valid(p)).map(([k, p]) => [k, toPhoto(p)])),
    };
  } catch {
    return EMPTY_ALBUM;
  }
}

const mapAlbum = (album, fn) => ({
  slider: album.slider.map(fn),
  spots: Object.fromEntries(Object.entries(album.spots).map(([k, p]) => [k, fn(p)])),
});

export const cloneAlbum = (album) => mapAlbum(album, (p) => ({ ...p }));

/** Bỏ dấu "ảnh mới" sau khi lưu. `useSource`: trỏ ảnh về file trong public/photos. */
export const settleAlbum = (album, useSource) =>
  mapAlbum(album, (p) => (p.pending ? { ...p, url: useSource ? photoUrl(p.file) : p.url, pending: undefined } : p));

/** Ảnh mới cần ghi: { "ten-file.jpg": base64 }. */
export const pendingFiles = (album) =>
  Object.fromEntries([...album.slider, ...Object.values(album.spots)].filter((p) => p.pending).map((p) => [p.file, p.pending]));

const slim = ({ id, file, caption, date }) => ({ id, file, caption: caption.trim(), date: date.trim() });

/** Dạng gọn để ghi vào photos.json. */
export const toManifest = (album) => ({
  slider: album.slider.map(slim),
  spots: Object.fromEntries(Object.entries(album.spots).map(([k, p]) => [k, slim(p)])),
});
