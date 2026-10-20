import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import photoAdmin from "./scripts/photo-admin-plugin.js";

export default defineConfig({
  // Đường dẫn tương đối: deploy được cả ở tên miền gốc lẫn thư mục con (GitHub Pages)
  base: "./",
  plugins: [react(), photoAdmin()],
});
