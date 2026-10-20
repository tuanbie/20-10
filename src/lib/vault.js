// Lưu cài đặt GitHub trong trình duyệt. Token được mã hóa AES-GCM bằng khóa sinh từ mật khẩu.
import { CONFIG } from "../config.js";
import { encryptText, decryptText } from "./crypto.js";

const KEY = "thu2010.github";

function readRaw() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function loadSettings() {
  const s = readRaw();
  return {
    owner: s.owner ?? CONFIG.github.owner ?? "",
    repo: s.repo ?? CONFIG.github.repo ?? "",
    branch: s.branch || CONFIG.github.branch || "main",
    token: s.token || null, // { iv, ct } đã mã hóa
  };
}

export async function saveSettings(vaultKey, { owner, repo, branch, token }) {
  const box = token ? await encryptText(crypto.subtle, vaultKey, token.trim()) : loadSettings().token;
  localStorage.setItem(KEY, JSON.stringify({ owner: owner.trim(), repo: repo.trim(), branch: branch.trim(), token: box }));
}

export async function readToken(vaultKey) {
  const { token } = loadSettings();
  if (!token) return null;
  try {
    return await decryptText(crypto.subtle, vaultKey, token);
  } catch {
    return null;
  }
}

export const isReady = (s) => Boolean(s.owner && s.repo && s.branch && s.token);
