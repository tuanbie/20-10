export default function AdminDot({ onClick, unlocked }) {
  return (
    <button
      type="button"
      className={`admin-dot${unlocked ? " unlocked" : ""}`}
      onClick={onClick}
      aria-label="Tùy chọn"
      title="Tùy chọn"
      data-no-fx
    >
      <span />
      <span />
      <span />
    </button>
  );
}
