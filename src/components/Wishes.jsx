import { CONFIG } from "../config.js";

export default function Wishes() {
  return (
    <section className="block wrap" id="wishes">
      <h2 className="block-title">Anh chúc em</h2>
      <ul className="wishes">
        {CONFIG.wishes.map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>
    </section>
  );
}
