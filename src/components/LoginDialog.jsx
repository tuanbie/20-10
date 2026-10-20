import { useEffect, useRef, useState } from "react";
import { login, lockRemaining } from "../lib/auth.js";

export default function LoginDialog({ onClose, onSuccess }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [wait, setWait] = useState(() => Math.ceil(lockRemaining() / 1000));
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait(Math.ceil(lockRemaining() / 1000)), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const submit = async () => {
    if (busy || !password || wait > 0) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await login(password);
      if (result.ok) {
        onSuccess(result.key);
        return;
      }
      setPassword("");
      if (result.locked) {
        setWait(Math.ceil(lockRemaining() / 1000));
        setMessage("Sai quá nhiều lần.");
      } else {
        setMessage("Mật khẩu chưa đúng.");
        inputRef.current?.focus();
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" data-no-fx onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="login-title">
        <h2 id="login-title" className="modal-title">Chỉnh sửa trang</h2>
        <p className="modal-help">Nhập mật khẩu để thêm hoặc sửa ảnh.</p>
        <label className="field">
          <span>Mật khẩu</span>
          <input
            ref={inputRef}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            disabled={busy || wait > 0}
          />
        </label>
        {message && (
          <p className="form-msg error" role="alert">
            {message}
          </p>
        )}
        {wait > 0 && <p className="form-msg">Thử lại sau {wait} giây.</p>}
        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>
            Hủy
          </button>
          <button type="button" className="primary-btn" onClick={submit} disabled={busy || !password || wait > 0}>
            {busy ? "Đang kiểm tra…" : "Mở khóa"}
          </button>
        </div>
      </div>
    </div>
  );
}
