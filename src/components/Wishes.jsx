import { CONFIG } from "../config.js";
import Spot, { useSpot } from "./Spot.jsx";

export default function Wishes() {
  const { photo, editing } = useSpot("wishes");
  return (
    <section className="block wrap" id="wishes">
      <h2 className="block-title">Anh chúc em</h2>
      <div className={`wishes-wrap${photo || editing ? " has-photo" : ""}`}>
        <ul className="wishes">
          {CONFIG.wishes.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
        <Spot k="wishes" className="snap wishes-photo" caption />
      </div>
    </section>
  );
}
