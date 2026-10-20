// Plugin này CHỈ chạy khi `npm run dev`. Nó nhận dữ liệu từ bảng sửa ảnh
// và ghi thẳng vào public/photos (ảnh + photos.json), tức là lưu vào source.
// Bản build/deploy không chứa endpoint này.
import fs from "node:fs/promises";
import path from "node:path";
import { albumFiles, splitAlbum } from "../src/lib/album.js";

const ROUTE = "/__photo-admin/save";
const SAFE_FILE = /^[a-z0-9][a-z0-9-]{2,63}\.(jpg|png|webp)$/;
const SPOT_KEY = /^[a-z0-9-]{1,40}$/;
const MAX_BODY = 100 * 1024 * 1024;

export default function photoAdmin() {
  let dir = "";
  return {
    name: "photo-admin",
    apply: "serve",
    configResolved(config) {
      dir = path.join(config.publicDir, "photos");
    },
    configureServer(server) {
      server.middlewares.use(ROUTE, async (req, res) => {
        if (req.method !== "POST" || req.headers["x-photo-admin"] !== "1") {
          return send(res, 405, { error: "Không hỗ trợ" });
        }
        try {
          const body = JSON.parse(await readBody(req));
          const album = await save(dir, body);
          const spots = Object.keys(album.spots).length;
          server.config.logger.info(`[photo-admin] đã lưu ${album.slider.length} ảnh slider và ${spots} vị trí vào public/photos`);
          send(res, 200, { ok: true, album });
        } catch (err) {
          send(res, 400, { error: String(err?.message || err) });
        }
      });
    },
  };
}

function cleanPhoto(p) {
  if (!SAFE_FILE.test(p?.file || "")) throw new Error(`Tên file không hợp lệ: ${p?.file}`);
  return {
    id: String(p.id || p.file).slice(0, 80),
    file: p.file,
    caption: String(p.caption || "").slice(0, 300),
    date: String(p.date || "").slice(0, 40),
  };
}

async function save(dir, { album, files = {} }) {
  if (!album || typeof album !== "object") throw new Error("Thiếu danh sách ảnh");
  await fs.mkdir(dir, { recursive: true });

  const { slider, spots } = splitAlbum(album);
  const clean = {
    slider: slider.map(cleanPhoto),
    spots: Object.fromEntries(
      Object.entries(spots).map(([key, p]) => {
        if (!SPOT_KEY.test(key)) throw new Error(`Tên vị trí không hợp lệ: ${key}`);
        return [key, cleanPhoto(p)];
      })
    ),
  };

  for (const [file, b64] of Object.entries(files)) {
    if (!SAFE_FILE.test(file)) throw new Error(`Tên file không hợp lệ: ${file}`);
    await fs.writeFile(path.join(dir, file), Buffer.from(b64, "base64"));
  }

  // Chỉ xóa những ảnh từng có trong danh sách cũ mà nay không còn dùng ở đâu
  const manifest = path.join(dir, "photos.json");
  let old = new Set();
  try {
    old = albumFiles(JSON.parse(await fs.readFile(manifest, "utf8")));
  } catch {
    old = new Set();
  }
  const keep = albumFiles(clean);
  for (const file of old) {
    if (SAFE_FILE.test(file) && !keep.has(file)) {
      await fs.rm(path.join(dir, file), { force: true });
    }
  }

  await fs.writeFile(manifest, JSON.stringify(clean, null, 2) + "\n");
  return clean;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error("Dữ liệu quá lớn, hãy lưu ít ảnh hơn mỗi lần"));
        req.destroy();
      } else {
        chunks.push(chunk);
      }
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}
