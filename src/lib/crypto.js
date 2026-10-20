// Dùng chung cho trình duyệt và script Node (scripts/hash-password.mjs).
// Các hàm nhận `subtle` (WebCrypto) làm tham số để chạy được ở cả hai môi trường.

const enc = new TextEncoder();
const dec = new TextDecoder();

export const toHex = (buf) =>
  Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");

export const fromHex = (hex) => Uint8Array.from(hex.match(/.{2}/g) || [], (h) => parseInt(h, 16));

const toB64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
};
const fromB64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

/**
 * Băm mật khẩu qua 3 lớp, không lưu mật khẩu gốc ở đâu cả:
 *   Lớp 1: SHA-512( salt1 : mật khẩu )
 *   Lớp 2: PBKDF2-SHA-256( lớp 1, salt2, N vòng ) → 256 bit
 *   Lớp 3: HMAC-SHA-256( pepper, lớp 2 )
 */
export async function hashPassword(subtle, password, p) {
  const layer1 = await subtle.digest("SHA-512", enc.encode(`${p.salt1}:${password.normalize("NFC")}`));
  const pbkdfKey = await subtle.importKey("raw", layer1, "PBKDF2", false, ["deriveBits"]);
  const layer2 = await subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromHex(p.salt2), iterations: p.iterations },
    pbkdfKey,
    256
  );
  const hmacKey = await subtle.importKey("raw", fromHex(p.pepper), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await subtle.sign("HMAC", hmacKey, layer2));
}

/** Khóa AES-GCM sinh từ mật khẩu, dùng để mã hóa token GitHub lưu trong trình duyệt. */
export async function deriveVaultKey(subtle, password, p) {
  const base = await subtle.importKey("raw", enc.encode(password.normalize("NFC")), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: fromHex(p.keySalt), iterations: p.iterations },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** So sánh hai chuỗi hex với thời gian không đổi. */
export function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function encryptText(subtle, key, text) {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));
  return { iv: toB64(iv), ct: toB64(ct) };
}

export async function decryptText(subtle, key, box) {
  const pt = await subtle.decrypt({ name: "AES-GCM", iv: fromB64(box.iv) }, key, fromB64(box.ct));
  return dec.decode(pt);
}
