# Thư 20/10 gửi Linh 💌

Trang web React (Vite) build ra static site. Ngoài lá thư, con tem, lời chúc và trái tim như bản HTML, bản này có thêm slider ảnh kỷ niệm và một nút ba chấm nhỏ ở góc trên bên trái để sửa ảnh sau khi nhập mật khẩu.

## Cấu trúc

```
thu-20-10/
├── public/photos/            ← ảnh + photos.json (danh sách ảnh), là "source" của slider
├── src/
│   ├── config.js             ← sửa toàn bộ chữ trên trang ở đây
│   ├── auth.json             ← salt + mã băm mật khẩu (không chứa mật khẩu gốc)
│   ├── App.jsx
│   ├── components/           ← Intro, Hero, Letter, Stamps, PhotoSlider, PhotoEditor, …
│   ├── lib/                  ← crypto, auth, github, images, music, petals, fx
│   └── styles.css
├── scripts/
│   ├── photo-admin-plugin.js ← khi chạy dev, ghi ảnh thẳng vào public/photos
│   └── hash-password.mjs     ← đổi mật khẩu
├── .github/workflows/deploy.yml  ← tự build + deploy GitHub Pages khi push
└── netlify.toml
```

## Chạy trên máy

Cần Node 18 trở lên.

```bash
npm install
npm run dev
```

Mở http://localhost:5173, chạm phong bì, rồi bấm nút **⋯** ở góc trên bên trái và nhập mật khẩu.

Khi chạy local, bấm **Lưu vào source** sẽ ghi ảnh (đã tự thu nhỏ còn tối đa 1600px, nén JPG) vào `public/photos/` và cập nhật `public/photos/photos.json`. Sau đó commit và push như bình thường.

## Deploy

**GitHub Pages:** push repo lên GitHub → Settings → Pages → Source: chọn **GitHub Actions**. Workflow có sẵn sẽ tự build mỗi lần push lên `main`.

**Netlify:** Add new site → Import from Git → chọn repo. `netlify.toml` đã cấu hình sẵn (`npm run build`, thư mục `dist`).

Lưu ý: GitHub Pages miễn phí yêu cầu repo **public**, nghĩa là ai cũng xem được ảnh trong repo. Muốn giữ repo private thì dùng Netlify, Vercel hoặc Cloudflare Pages (đều deploy được từ repo private).

## Sửa ảnh ngay trên trang đã deploy

Trang tĩnh không tự ghi được vào source của chính nó, nên bản deploy sẽ commit ảnh thẳng vào repo qua GitHub API. Repo được cập nhật xong thì GitHub Actions hoặc Netlify tự build lại, mất khoảng 1–2 phút.

1. Tạo token: GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token.
   - Repository access: **Only select repositories** → chọn đúng repo này.
   - Permissions → Repository permissions → **Contents: Read and write**.
   - Đặt ngày hết hạn.
2. Trên trang: bấm **⋯** → nhập mật khẩu → **Cài đặt GitHub** → nhập tài khoản, tên repo, nhánh, token → **Lưu cài đặt**.
3. Thêm, xóa, sắp xếp, ghi chú ảnh → **Lưu vào source**. Mọi thay đổi được gộp thành một commit.

Có thể điền sẵn `github.owner` và `github.repo` trong `src/config.js` để khỏi gõ lại.

## Đổi mật khẩu

```bash
npm run hash-password
```

Lệnh sẽ hỏi mật khẩu mới rồi ghi lại `src/auth.json`. Token GitHub đã lưu trong trình duyệt sẽ cần nhập lại.

## Về bảo mật

- Mật khẩu không nằm trong source. Trang chỉ lưu mã băm qua 3 lớp: SHA-512 có salt → PBKDF2-SHA-256 600.000 vòng → HMAC-SHA-256 với pepper.
- Token GitHub được mã hóa AES-GCM bằng khóa sinh từ mật khẩu, chỉ lưu trong trình duyệt của bạn, không bao giờ nằm trong source.
- Sai mật khẩu 5 lần thì khóa 60 giây.
- Vì mọi kiểm tra chạy trên trình duyệt, mật khẩu chỉ là lớp che giao diện sửa. Thứ thật sự bảo vệ trang là: người khác dù vào được bảng sửa cũng không có token, nên không thay đổi được gì trên trang thật. Mật khẩu dạng ngày tháng khá dễ đoán, nếu muốn chắc hơn hãy đổi sang chuỗi dài hơn.
