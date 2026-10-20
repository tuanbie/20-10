// Thu nhỏ và nén ảnh ngay trên trình duyệt trước khi lưu, để repo không bị nặng.
const MAX_SIDE = 1600;
const QUALITY = 0.85;

export const newId = () => `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function prepareImage(file) {
  const src = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = src;
    try {
      await img.decode();
    } catch {
      throw new Error(`Không đọc được “${file.name}”. Hãy chọn ảnh JPG hoặc PNG.`);
    }
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Không nén được ảnh."))), "image/jpeg", QUALITY)
    );
    const id = newId();
    return {
      id,
      file: `${id}.jpg`,
      caption: "",
      date: "",
      url: URL.createObjectURL(blob),
      pending: await blobToBase64(blob),
    };
  } finally {
    URL.revokeObjectURL(src);
  }
}
