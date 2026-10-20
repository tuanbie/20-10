const BASE = import.meta.env.BASE_URL;

export const photoUrl = (file) => `${BASE}photos/${file}`;

export async function loadPhotos() {
  try {
    const res = await fetch(`${BASE}photos/photos.json`, { cache: "no-cache" });
    if (!res.ok) return [];
    const list = await res.json();
    if (!Array.isArray(list)) return [];
    return list
      .filter((p) => p && typeof p.file === "string")
      .map((p) => ({
        id: String(p.id || p.file),
        file: p.file,
        caption: String(p.caption || ""),
        date: String(p.date || ""),
        url: photoUrl(p.file),
      }));
  } catch {
    return [];
  }
}

/** Dạng gọn để ghi vào photos.json. */
export const toManifest = (list) =>
  list.map(({ id, file, caption, date }) => ({ id, file, caption: caption.trim(), date: date.trim() }));
