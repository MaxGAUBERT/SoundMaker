// Settings.jsx
import { useEffect, useRef, useState } from "react";
import { LuAudioLines } from "react-icons/lu";
import { IoMdSettings } from "react-icons/io";
import { FaRegKeyboard } from "react-icons/fa";
import { IoMdHome } from "react-icons/io";
import { FcAbout } from "react-icons/fc";


function classNames(...arr){ return arr.filter(Boolean).join(" "); }

function Settings({
  open,
  onClose,
  initialTab = "general",
  tabs: tabsProp,
  title = "Settings",
}) {
  const [active, setActive] = useState(initialTab);
  const overlayRef = useRef(null);
  const firstFocusableRef = useRef(null);

  useEffect(() => { setActive(initialTab); }, [initialTab]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => firstFocusableRef.current?.focus(), 0);
    return () => clearTimeout(id);
  }, [open]);

  if (!open) return null;

  const tabs = tabsProp ?? [
  {
    id: "general",
    label: "General",
    content: (
      <div className="flex flex-col gap-4">
       <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="border rounded p-1 bg-gray-100 dark:bg-gray-200"
        >
          <option value="light">Clair</option>
          <option value="dark">Sombre</option>
          <option value="system">Système</option>
          <option value="neon">Neon</option>
          <option value="studio">Studio</option>
          <option value="forest">Forest</option>
        </select>

        <label className="flex items-center gap-2">
          <input type="checkbox" />
          <span>Activer l’historique global (undo/redo)</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" />
          <span>Sauvegarde auto du projet</span>
        </label>
      </div>
    ),
  },
  {
    id: "audio",
    label: "Audio",
    content: (
      <div className="flex flex-col gap-4">
        <label className="flex flex-col">
          <span>Default BPM</span>
          <input
            type="number"
            min="20"
            max="300"
            className="bg-black/40 border rounded p-1"
            value={settings.bpm}
            onChange={(e) => updateSetting("bpm", Number(e.target.value))}
          />
        </label>

        <label className="flex flex-col">
          <input
            type="number"
            className="bg-black/40 border rounded p-1"
            value={settings.channels}
            onChange={(e) => updateSetting("channels", Number(e.target.value))}
          />
          <span>Number of default channels</span>
        </label>



      </div>
    ),
  },
  {
    id: "shortcuts",
    label: "Shortcuts",
    content: (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between">
          <span>Play / Pause</span>
          <kbd className="px-2 py-1 bg-gray-800 rounded">Space</kbd>
        </div>
        <div className="flex justify-between">
          <span>Undo</span>
          <kbd className="px-2 py-1 bg-gray-800 rounded">Ctrl + Z</kbd>
        </div>
        <div className="flex justify-between">
          <span>Redo</span>
          <kbd className="px-2 py-1 bg-gray-800 rounded">Ctrl + Y</kbd>
        </div>
        <div className="flex justify-between">
          <span>Ouvrir Piano Roll</span>
          <kbd className="px-2 py-1 bg-gray-800 rounded">P</kbd>
        </div>
      </div>
    ),
  },
  {
    id: "about",
    label: "About",
    content: (
      <div className="flex flex-col gap-2 text-sm">
        <p>
          <strong>Dream Sequencer</strong> v0.1
        </p>
        <p>Un séquenceur React + Tone.js inspiré de FL Studio.</p>
      </div>
    ),
  },
];


  const idx = Math.max(0, tabs.findIndex(t => t.id === active));
  const activeTab = tabs[idx];

  const handleOverlayMouseDown = (e) => {
    if (e.target === overlayRef.current) onClose?.();
  };

  return (
    <div
      ref={overlayRef}
      onMouseDown={handleOverlayMouseDown}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div
        role="dialog" aria-modal="true" aria-labelledby="settings-title"
        onMouseDown={(e)=>e.stopPropagation()}
        className="w-full max-w-3xl rounded-2xl shadow-xl bg-white text-gray-900 border"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 id="settings-title" className="text-xl font-semibold">{title}</h2>
          <IoMdSettings className="relative text-4xl align-right" />
          <button type="button" ref={firstFocusableRef} onClick={onClose} className="rounded px-2 py-1 hover:bg-gray-100">✕</button>
        </div>

        <div className="flex">
          <aside className="w-48 border-r p-3 space-y-1" role="tablist" aria-orientation="vertical">
            {tabs.map(t => (
              <button
                key={t.id} type="button" role="tab"
                aria-selected={active === t.id}
                onClick={() => setActive(t.id)}
                className={classNames(
                  "w-full text-left px-3 py-2 rounded text-sm",
                  active === t.id ? "bg-gray-900 text-white" : "hover:bg-gray-100"
                )}
              >
                {t.id === "general" && <IoMdHome size={20} className="inline-block mr-2" />}
                {t.id === "audio" && <LuAudioLines size={20} className="inline-block mr-2" />}
                {t.id === "Shortcuts" && <FaRegKeyboard size={20} className="inline-block mr-2" />}
                {t.id === "about" && <FcAbout size={20} className="inline-block mr-2" />}
                {t.label}
              </button>
            ))}
          </aside>

          <section className="flex-1 p-5 min-h-[280px]" role="tabpanel" aria-labelledby={activeTab?.id}>
            {activeTab?.content}
          </section>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded border hover:bg-gray-50">Cancel</button>
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-900 text-white hover:opacity-90">Save changes</button>
        </div>
      </div>
    </div>
  );
}

export default Settings; 