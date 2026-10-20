import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CONFIG } from "./config.js";
import { burst, setFxRoot } from "./lib/fx.js";
import { Music } from "./lib/music.js";
import { petals } from "./lib/petals.js";
import { cloneAlbum, EMPTY_ALBUM, loadAlbum } from "./lib/photos.js";
import Intro from "./components/Intro.jsx";
import Hero from "./components/Hero.jsx";
import Letter from "./components/Letter.jsx";
import Stamps from "./components/Stamps.jsx";
import PhotoSlider from "./components/PhotoSlider.jsx";
import Wishes from "./components/Wishes.jsx";
import Finale from "./components/Finale.jsx";
import AdminDot from "./components/AdminDot.jsx";
import LoginDialog from "./components/LoginDialog.jsx";
import PhotoEditor from "./components/PhotoEditor.jsx";
import { SpotContext } from "./components/Spot.jsx";

export default function App() {
  const [opened, setOpened] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [album, setAlbum] = useState(EMPTY_ALBUM);
  const [draft, setDraft] = useState(null);
  const [vaultKey, setVaultKey] = useState(null);
  const [panel, setPanel] = useState(null); // null | "login" | "editor"
  const [spotFocus, setSpotFocus] = useState(null); // vị trí ảnh vừa được bấm trên trang khi đang sửa
  const fxRef = useRef(null);
  const petalsRef = useRef(null);

  useEffect(() => {
    setFxRoot(fxRef.current);
    document.title = `Gửi ${CONFIG.herName}, 20/10`;
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    loadAlbum().then(setAlbum);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("locked", !opened);
    document.body.classList.toggle("opened", opened);
    if (opened) petals.start(petalsRef.current);
  }, [opened]);

  useEffect(() => {
    if (!opened) return undefined;
    const onDown = (e) => {
      if (e.target.closest("[data-no-fx]")) return;
      burst(e.clientX, e.clientY, 4, 46);
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, [opened]);

  useEffect(() => {
    if (panel !== "editor") return undefined;
    const t = setTimeout(() => document.getElementById("photos")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    return () => clearTimeout(t);
  }, [panel]);

  const startMusic = () => {
    if (CONFIG.music && Music.start()) setMusicOn(true);
  };
  const toggleMusic = () => {
    if (Music.on) {
      Music.stop();
      setMusicOn(false);
    } else if (Music.start()) {
      setMusicOn(true);
    }
  };

  const openEditor = () => {
    setDraft(cloneAlbum(album));
    setPanel("editor");
  };
  const onAdmin = () => (vaultKey ? openEditor() : setPanel("login"));
  const onLoggedIn = (key) => {
    setVaultKey(key);
    openEditor();
  };
  const closeEditor = () => {
    setDraft(null);
    setPanel(null);
  };
  const lock = () => {
    setVaultKey(null);
    closeEditor();
  };
  const onSaved = (saved) => {
    setAlbum(saved);
    setDraft(cloneAlbum(saved));
  };
  const closeLogin = useCallback(() => setPanel(null), []);

  const editing = panel === "editor";
  const shown = draft ?? album;
  const spotCtx = useMemo(
    () => ({ spots: shown.spots, editing, pick: (key) => setSpotFocus({ key, at: Date.now() }) }),
    [shown.spots, editing]
  );

  return (
    <>
      <div className="glow" aria-hidden="true" />
      <canvas id="petals" ref={petalsRef} aria-hidden="true" />
      <div className="fx" ref={fxRef} aria-hidden="true" />

      <Intro onOpen={startMusic} onRevealed={() => setOpened(true)} />

      {opened && (
        <>
          <AdminDot onClick={onAdmin} unlocked={Boolean(vaultKey)} />
          <button
            type="button"
            className={`music${musicOn ? "" : " off"}`}
            onClick={toggleMusic}
            aria-pressed={musicOn}
            aria-label="Bật hoặc tắt nhạc"
            title={musicOn ? "Tắt nhạc" : "Bật nhạc"}
            data-no-fx
          >
            ♪
          </button>
        </>
      )}

      <SpotContext.Provider value={spotCtx}>
        <main>
          <Hero />
          <Letter active={opened} />
          <Stamps />
          <PhotoSlider photos={shown.slider} editing={editing} />
          <Wishes />
          <Finale />
        </main>
      </SpotContext.Provider>

      <footer className={`footer${editing ? " with-editor" : ""}`}>
        <p>Từ {CONFIG.myName}, với tất cả yêu thương.</p>
        <button type="button" className="ghost-btn" onClick={() => window.location.reload()}>
          Mở lại phong bì
        </button>
      </footer>

      {panel === "login" && <LoginDialog onClose={closeLogin} onSuccess={onLoggedIn} />}
      {editing && draft && (
        <PhotoEditor
          draft={draft}
          setDraft={setDraft}
          published={album}
          vaultKey={vaultKey}
          focus={spotFocus}
          onClose={closeEditor}
          onSaved={onSaved}
          onLock={lock}
        />
      )}
    </>
  );
}
