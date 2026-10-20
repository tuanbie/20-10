import { useEffect, useMemo, useRef, useState } from "react";
import { prepareImage } from "../lib/images.js";
import { photoUrl, toManifest } from "../lib/photos.js";
import { commitPhotos } from "../lib/github.js";
import { isReady, loadSettings, readToken, saveSettings } from "../lib/vault.js";

const IS_DEV = import.meta.env.DEV;

export default function PhotoEditor({ draft, setDraft, published, vaultKey, onClose, onSaved, onLock }) {
  const [sel, setSel] = useState(draft.length ? 0 : -1);
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [settings, setSettings] = useState(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [form, setForm] = useState(() => ({ owner: settings.owner, repo: settings.repo, branch: settings.branch, token: "" }));
  const fileRef = useRef(null);
  const stripRef = useRef(null);

  const dirty = useMemo(
    () => JSON.stringify(toManifest(draft)) !== JSON.stringify(toManifest(published)),
    [draft, published]
  );
  const current = sel >= 0 ? draft[sel] : null;

  useEffect(() => {
    stripRef.current?.children[sel]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [sel]);

  useEffect(() => {
    if (!dirty) setConfirmClose(false);
  }, [dirty]);

  const update = (i, patch) => setDraft((d) => d.map((p, k) => (k === i ? { ...p, ...patch } : p)));

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= draft.length) return;
    setDraft((d) => {
      const next = [...d];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setSel(j);
  };

  const remove = (i) => {
    setDraft((d) => d.filter((_, k) => k !== i));
    setSel(Math.min(i, draft.length - 2));
  };

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    if (!files.length || busy) return;
    setStatus(null);
    const added = [];
    const errors = [];
    for (let k = 0; k < files.length; k++) {
      setBusy(`Đang xử lý ảnh ${k + 1}/${files.length}…`);
      try {
        added.push(await prepareImage(files[k]));
      } catch (err) {
        errors.push(err.message);
      }
    }
    setBusy("");
    if (added.length) {
      const start = draft.length;
      setDraft((d) => [...d, ...added]);
      setSel(start + added.length - 1);
    }
    if (errors.length) setStatus({ type: "error", text: errors.join(" ") });
  };

  const save = async () => {
    if (!dirty || busy) return;
    setStatus(null);
    const manifest = toManifest(draft);
    const files = Object.fromEntries(draft.filter((p) => p.pending).map((p) => [p.file, p.pending]));
    try {
      if (IS_DEV) {
        setBusy("Đang ghi vào public/photos…");
        const res = await fetch("/__photo-admin/save", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-photo-admin": "1" },
          body: JSON.stringify({ photos: manifest, files }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Lỗi ${res.status}`);
        onSaved(draft.map((p) => (p.pending ? { ...p, url: photoUrl(p.file), pending: undefined } : p)));
        setStatus({ type: "ok", text: "Đã lưu vào public/photos. Commit và push để cập nhật trang đã deploy." });
      } else {
        if (!isReady(settings)) {
          setShowSettings(true);
          throw new Error("Cần nhập thông tin GitHub trước khi lưu.");
        }
        const token = await readToken(vaultKey);
        if (!token) {
          setShowSettings(true);
          throw new Error("Không mở được token đã lưu. Hãy nhập lại token.");
        }
        setBusy("Đang commit lên GitHub…");
        await commitPhotos({ ...settings, token }, { photos: manifest, files }, `Cập nhật ảnh kỷ niệm (${manifest.length} ảnh)`);
        onSaved(draft.map((p) => ({ ...p, pending: undefined })));
        setStatus({ type: "ok", text: "Đã commit lên GitHub. Trang sẽ tự cập nhật khi build xong, thường mất 1–2 phút." });
      }
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setBusy("");
    }
  };

  const saveForm = async () => {
    try {
      await saveSettings(vaultKey, form);
      setSettings(loadSettings());
      setForm((f) => ({ ...f, token: "" }));
      setShowSettings(false);
      setStatus({ type: "ok", text: "Đã lưu cài đặt GitHub. Token được mã hóa bằng mật khẩu và chỉ nằm trong trình duyệt này." });
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    }
  };

  const tryClose = () => {
    if (dirty && !confirmClose) {
      setConfirmClose(true);
      return;
    }
    onClose();
  };

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const canSaveForm = form.owner.trim() && form.repo.trim() && form.branch.trim() && (form.token.trim() || settings.token);

  return (
    <div
      className="editor"
      role="dialog"
      aria-labelledby="editor-title"
      data-no-fx
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        addFiles(e.dataTransfer.files);
      }}
    >
      <div className="editor-head">
        <h2 id="editor-title">
          Ảnh kỷ niệm <small>{draft.length} ảnh</small>
        </h2>
        <div className="editor-head-actions">
          <button type="button" className="text-btn" onClick={onLock}>
            Khóa lại
          </button>
          <button type="button" className={`text-btn${confirmClose ? " warn" : ""}`} onClick={tryClose}>
            {confirmClose ? "Bỏ thay đổi?" : "Đóng"}
          </button>
        </div>
      </div>

      <div className="strip" ref={stripRef} role="listbox" aria-label="Danh sách ảnh">
        {draft.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="option"
            aria-selected={i === sel}
            aria-label={p.caption || `Ảnh ${i + 1}`}
            className={`thumb${i === sel ? " on" : ""}`}
            onClick={() => setSel(i)}
          >
            <img src={p.url} alt="" draggable="false" />
            {p.pending && <span className="badge">Mới</span>}
          </button>
        ))}
        <button type="button" className="thumb add" onClick={() => fileRef.current?.click()} disabled={Boolean(busy)}>
          <span aria-hidden="true">+</span>
          Thêm ảnh
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {current ? (
        <div className="detail">
          <label className="field">
            <span>Chú thích</span>
            <input
              value={current.caption}
              maxLength={300}
              placeholder="Ví dụ: Lần đầu đi Đà Lạt"
              onChange={(e) => update(sel, { caption: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Ngày (không bắt buộc)</span>
            <input
              value={current.date}
              maxLength={40}
              placeholder="Ví dụ: 27/01/2021"
              onChange={(e) => update(sel, { date: e.target.value })}
            />
          </label>
          <div className="detail-actions">
            <button type="button" className="ghost-btn" onClick={() => move(sel, -1)} disabled={sel === 0}>
              ‹ Dời sang trái
            </button>
            <button type="button" className="ghost-btn" onClick={() => move(sel, 1)} disabled={sel === draft.length - 1}>
              Dời sang phải ›
            </button>
            <button type="button" className="ghost-btn danger" onClick={() => remove(sel)}>
              Xóa ảnh
            </button>
          </div>
        </div>
      ) : (
        <p className="editor-empty">Chưa có ảnh. Bấm “Thêm ảnh” hoặc kéo thả ảnh vào đây.</p>
      )}

      {showSettings && !IS_DEV && (
        <div className="gh-settings">
          <div className="row">
            <label className="field">
              <span>Tài khoản GitHub</span>
              <input value={form.owner} onChange={setField("owner")} placeholder="ten-tai-khoan" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
            </label>
            <label className="field">
              <span>Tên repo</span>
              <input value={form.repo} onChange={setField("repo")} placeholder="thu-20-10" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
            </label>
          </div>
          <label className="field">
            <span>Nhánh</span>
            <input value={form.branch} onChange={setField("branch")} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
          </label>
          <label className="field">
            <span>{settings.token ? "Token (đã lưu, để trống nếu không đổi)" : "Token"}</span>
            <input type="password" value={form.token} onChange={setField("token")} placeholder="github_pat_…" autoComplete="off" />
          </label>
          <p className="note">
            Dùng fine-grained token, chỉ cấp quyền Contents: Read and write cho đúng repo này. Token được mã hóa AES-GCM bằng
            khóa sinh từ mật khẩu và chỉ lưu trong trình duyệt này.
          </p>
          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={() => setShowSettings(false)}>
              Đóng
            </button>
            <button type="button" className="primary-btn" onClick={saveForm} disabled={!canSaveForm}>
              Lưu cài đặt
            </button>
          </div>
        </div>
      )}

      <div className="editor-foot">
        <p className="editor-mode">
          {IS_DEV
            ? "Đang chạy local: ảnh sẽ được ghi thẳng vào public/photos."
            : isReady(settings)
              ? `Lưu sẽ commit vào ${settings.owner}/${settings.repo}, nhánh ${settings.branch}.`
              : "Chưa kết nối GitHub nên bản deploy chưa lưu được."}{" "}
          {!IS_DEV && (
            <button type="button" className="text-btn inline" onClick={() => setShowSettings((s) => !s)}>
              Cài đặt GitHub
            </button>
          )}
        </p>
        {busy && <p className="form-msg">{busy}</p>}
        {status && (
          <p className={`form-msg ${status.type}`} role="status">
            {status.text}
          </p>
        )}
        <button type="button" className="primary-btn" onClick={save} disabled={!dirty || Boolean(busy)}>
          Lưu vào source
        </button>
      </div>
    </div>
  );
}
