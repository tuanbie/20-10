import params from "../auth.json";
import { hashPassword, deriveVaultKey, safeEqual } from "./crypto.js";

const LOCK_KEY = "thu2010.lock";
const MAX_FAILS = 5;
const LOCK_MS = 60_000;

function readLock() {
  try {
    return JSON.parse(localStorage.getItem(LOCK_KEY)) || { fails: 0, until: 0 };
  } catch {
    return { fails: 0, until: 0 };
  }
}
function writeLock(value) {
  try {
    localStorage.setItem(LOCK_KEY, JSON.stringify(value));
  } catch {
    /* trình duyệt chặn lưu trữ: bỏ qua */
  }
}

export const lockRemaining = () => Math.max(0, readLock().until - Date.now());

/** Kiểm tra mật khẩu. Thành công thì trả về khóa AES dùng để mở token GitHub. */
export async function login(password) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Trình duyệt chưa hỗ trợ mã hóa. Hãy mở trang qua https hoặc localhost.");
  if (lockRemaining() > 0) return { ok: false, locked: true };

  const hash = await hashPassword(subtle, password, params);
  if (!safeEqual(hash, params.hash)) {
    const fails = readLock().fails + 1;
    const locked = fails >= MAX_FAILS;
    writeLock(locked ? { fails: 0, until: Date.now() + LOCK_MS } : { fails, until: 0 });
    return { ok: false, locked };
  }

  writeLock({ fails: 0, until: 0 });
  const key = await deriveVaultKey(subtle, password, params);
  return { ok: true, key };
}
