import { useEffect, useMemo, useRef, useState } from "react";
import { prepareImage } from "../lib/images.js";
import { pendingFiles, settleAlbum, toManifest } from "../lib/photos.js";
import { commitPhotos } from "../lib/github.js";
import { isReady, loadSettings, readToken, saveSettings } from "../lib/vault.js";
import { SPOTS } from "./Spot.jsx";

const IS_DEV = import.meta.env.DEV;

const isImage = (f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name);

export default function PhotoEditor({ draft, setDraft, published, vaultKey, focus, onClose, onSaved, onLock }) {
  const [tab, setTab] = useState("slider"); // "slider" | "spots"
  const [sel, setSel] = useState(draft.slider.length ? 0 : -1);
  const [spot, setSpot] = useState(SPOTS[0].key);
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [settings, setSettings] = useState(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [form, setForm] = useState(() => ({ owner: settings.owner, repo: settings.repo, branch: settings.branch, token: "" }));
  const fileRef = useRef(null);
  const spotFileRef = useRef(null);
  const stripRef = useRef(null);

  const slider = draft.slider;
  const dirty = useMemo(
    () => JSON.stringify(toManifest(draft)) !== JSON.stringify(toManifest(published)),
    [draft, published]
  );
  const current = sel >= 0 ? slider[sel] : null;
  const filled = SPOTS.filter((s) => draft.spots[s.key]).length;

  useEffect(() => {
    stripRef.current?.children[sel]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [sel]);

  useEffect(() => {
    if (!dirty) setConfirmClose(false);
  }, [dirty]);

  // Bấm vào một ảnh/ô trống trên trang → mở đúng vị trí đó ở đây
  useEffect(() => {
    if (!focus) return;
    setTab("spots");
    setSpot(focus.key);
  }, [focus]);

  const setSlider = (fn) => setDraft((d) => ({ ...d, slider: fn(d.slider) }));
  const update = (i, patch) => setSlider((s) => s.map((p, k) => (k === i ? { ...p, ...patch } : p)));

  const setSpotPhoto = (key, photo) =>
    setDraft((d) => {
      const spots = { ...d.spots };
      if (photo) spots[key] = photo;
      else delete spots[key];
      return { ...d, spots };
    });
  const updateSpot = (key, patch) => setDraft((d) => ({ ...d, spots: { ...d.spots, [key]: { ...d.spots[key], ...patch } } }));

  const chooseSpot = (key) => {
    setSpot(key);
    document.querySelector(`[data-spot="${key}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= slider.length) return;
    setSlider((s) => {
      const next = [...s];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setSel(j);
  };

  const remove = (i) => {
    setSlider((s) => s.filter((_, k) => k !== i));
    setSel(Math.min(i, slider.length - 2));
  };

  const readImages = async (fileList, max = Infinity) => {
    const files = Array.from(fileList || []).filter(isImage).slice(0, max);
    if (!files.length || busy) return [];
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
    if (errors.length) setStatus({ type: "error", text: errors.join(" ") });
    return added;
  };

  const addFiles = async (fileList) => {
    const added = await readImages(fileList);
    if (!added.length) return;
    const start = slider.length;
    setSlider((s) => [...s, ...added]);
    setSel(start + added.length - 1);
  };

  const setSpotFile = async (fileList) => {
    const key = spot;
    const [photo] = await readImages(fileList, 1);
    if (photo) setSpotPhoto(key, photo);
  };

  const save = async () => {
    if (!dirty || busy) return;
    setStatus(null);
    const album = toManifest(draft);
    const files = pendingFiles(draft);
    try {
      if (IS_DEV) {
        setBusy("Đang ghi vào public/photos…");
        const res = await fetch("/__photo-admin/save", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-photo-admin": "1" },
          body: JSON.stringify({ album, files }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Lỗi ${res.status}`);
        onSaved(settleAlbum(draft, true));
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
        const spotCount = Object.keys(album.spots).length;
        await commitPhotos(
          { ...settings, token },
          { album, files },
          `Cập nhật ảnh kỷ niệm (${album.slider.length} ảnh slider, ${spotCount} vị trí)`
        );
        onSaved(settleAlbum(draft, false));
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

  const sliderPanel = (
    <>
      <div className="strip" ref={stripRef} role="listbox" aria-label="Danh sách ảnh">
        {slider.map((p, i) => (
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
            <button type="button" className="ghost-btn" onClick={() => move(sel, 1)} disabled={sel === slider.length - 1}>
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
    </>
  );

  const spotsPanel = (
    <>
      <p className="editor-empty spots-help">Chọn một vị trí rồi tải ảnh lên hoặc lấy ảnh từ slider. Khi đang sửa, bấm vào ô ảnh ngay trên trang cũng được.</p>
      <ul className="spot-list">
        {SPOTS.map((s) => {
          const p = draft.spots[s.key];
          const on = s.key === spot;
          return (
            <li key={s.key}>
              <button type="button" className={`spot-row${on ? " on" : ""}`} aria-expanded={on} onClick={() => chooseSpot(s.key)}>
                <span className="spot-thumb">{p ? <img src={p.url} alt="" draggable="false" /> : <span aria-hidden="true">+</span>}</span>
                <span className="spot-label">
                  {s.label}
                  <small>{p ? (p.pending ? "Ảnh mới, chưa lưu" : "Đã có ảnh") : "Chưa có ảnh"}</small>
                </span>
              </button>
              {on && (
                <div className="spot-detail">
                  <div className="detail-actions">
                    <button type="button" className="ghost-btn" onClick={() => spotFileRef.current?.click()} disabled={Boolean(busy)}>
                      {p ? "Đổi ảnh khác" : "Tải ảnh lên"}
                    </button>
                    {p && (
                      <button type="button" className="ghost-btn danger" onClick={() => setSpotPhoto(s.key, null)}>
                        Gỡ ảnh
                      </button>
                    )}
                  </div>
                  {slider.length > 0 && (
                    <>
                      <p className="mini-label">Hoặc lấy ảnh từ slider</p>
                      <div className="strip mini">
                        {slider.map((sp, i) => (
                          <button
                            key={sp.id}
                            type="button"
                            className={`thumb${p?.file === sp.file ? " on" : ""}`}
                            aria-label={sp.caption || `Ảnh ${i + 1}`}
                            onClick={() => setSpotPhoto(s.key, { ...sp })}
                          >
                            <img src={sp.url} alt="" draggable="false" />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {p && s.caption && (
                    <label className="field">
                      <span>Chú thích dưới ảnh (không bắt buộc)</span>
                      <input value={p.caption} maxLength={300} onChange={(e) => updateSpot(s.key, { caption: e.target.value })} />
                    </label>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );

  return (
    <div
      className="editor"
      role="dialog"
      aria-labelledby="editor-title"
      data-no-fx
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (tab === "spots") setSpotFile(e.dataTransfer.files);
        else addFiles(e.dataTransfer.files);
      }}
    >
      <div className="editor-head">
        <h2 id="editor-title">Ảnh kỷ niệm</h2>
        <div className="editor-head-actions">
          <button type="button" className="text-btn" onClick={onLock}>
            Khóa lại
          </button>
          <button type="button" className={`text-btn${confirmClose ? " warn" : ""}`} onClick={tryClose}>
            {confirmClose ? "Bỏ thay đổi?" : "Đóng"}
          </button>
        </div>
      </div>

      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "slider"} className={`tab${tab === "slider" ? " on" : ""}`} onClick={() => setTab("slider")}>
          Slider <small>{slider.length} ảnh</small>
        </button>
        <button type="button" role="tab" aria-selected={tab === "spots"} className={`tab${tab === "spots" ? " on" : ""}`} onClick={() => setTab("spots")}>
          Các vị trí <small>{filled}/{SPOTS.length}</small>
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
      <input
        ref={spotFileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          setSpotFile(e.target.files);
          e.target.value = "";
        }}
      />

      {tab === "slider" ? sliderPanel : spotsPanel}

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
