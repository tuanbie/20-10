#!/usr/bin/env node
// Đổi mật khẩu mở khóa trang sửa ảnh.
// Cách dùng:  npm run hash-password            (sẽ hỏi mật khẩu)
//        hoặc npm run hash-password -- <mật khẩu>
// Kết quả được ghi vào src/auth.json (chỉ chứa salt + mã băm, không có mật khẩu gốc).
import { webcrypto } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { hashPassword, toHex } from "../src/lib/crypto.js";

const { subtle } = webcrypto;
const random = (n) => toHex(webcrypto.getRandomValues(new Uint8Array(n)));

let password = process.argv[2];
if (!password) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  password = await rl.question("Mật khẩu mới: ");
  rl.close();
}
password = String(password).trim();
if (password.length < 6) {
  console.error("Mật khẩu cần ít nhất 6 ký tự.");
  process.exit(1);
}

const params = {
  v: 1,
  iterations: 600000,
  salt1: random(16),
  salt2: random(16),
  pepper: random(32),
  keySalt: random(16),
};
params.hash = await hashPassword(subtle, password, params);

await writeFile(new URL("../src/auth.json", import.meta.url), JSON.stringify(params, null, 2) + "\n");
console.log("Đã cập nhật src/auth.json.");
console.log("Lưu ý: token GitHub đã lưu trong trình duyệt sẽ cần nhập lại sau khi đổi mật khẩu.");
