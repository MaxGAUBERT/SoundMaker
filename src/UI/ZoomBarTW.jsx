// components/PianoRoll/ZoomBarTW.jsx
import React, { useCallback, useEffect, useRef } from "react";

// ── Helper pur — signature sans déstructuration pour éviter le crash si undefined ──
function clampRange(range, minWidth) {
  if (!Array.isArray(range) || range.length < 2) return [0, 100];
  const [a, b] = range;
  const width = Math.max(Math.abs(b - a), minWidth);
  let s = Math.min(a, b);
  let e = s + width;
  if (e > 100) { e = 100; s = 100 - width; }
  if (s < 0)   { s = 0;   e = width; }
  return [s, e];
}

export default function ZoomBarTW({
  windowRange,
  setWindowRange,
  minWindowPercent = 2,
}) {
  // Valeur sûre si windowRange est undefined / mal formé
  const safeRange = Array.isArray(windowRange) && windowRange.length === 2
    ? windowRange
    : [0, 100];

  const barRef   = useRef(null);
  const dragRef  = useRef(null);
  const rangeRef = useRef(safeRange);

  useEffect(() => { rangeRef.current = safeRange; }, [safeRange]);

  const pxToPercent = useCallback((dxPx) => {
    const w = barRef.current?.clientWidth || 1;
    return (dxPx / w) * 100;
  }, []);

  const onPointerDown = useCallback((e, mode) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { mode, startX: e.clientX, startRange: rangeRef.current };
  }, []);

  // Pointermove/up — monté une fois
  useEffect(() => {
    const onMove = (e) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = pxToPercent(e.clientX - drag.startX);
      const [s0, e0] = drag.startRange;
      const w = e0 - s0;

      if (drag.mode === "left")  setWindowRange(clampRange([s0 + dx, e0], minWindowPercent));
      if (drag.mode === "right") setWindowRange(clampRange([s0, e0 + dx], minWindowPercent));
      if (drag.mode === "track") setWindowRange(clampRange([s0 + dx, s0 + dx + w], minWindowPercent));
    };
    const onUp = () => { dragRef.current = null; };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup",   onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onUp);
    };
  }, [pxToPercent, setWindowRange, minWindowPercent]);

  // Wheel — monté une fois, lit rangeRef
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const rect      = el.getBoundingClientRect();
      const cursorPct = ((e.clientX - rect.left) / rect.width) * 100;
      const [s, ep]   = rangeRef.current;
      const w         = ep - s;
      const factor    = 1.15;
      const newW      = Math.max(minWindowPercent, Math.min(100, e.deltaY > 0 ? w * factor : w / factor));
      const ratio     = w > 0 ? (cursorPct - s) / w : 0;
      const ns        = cursorPct - ratio * newW;
      setWindowRange(clampRange([ns, ns + newW], minWindowPercent));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [setWindowRange, minWindowPercent]);

  const [start, end] = safeRange;

  return (
    <div className="px-0 select-none">
      <div
        ref={barRef}
        className="relative h-7 rounded-md bg-slate-800/80 border border-white/10"
      >
        <div className="absolute inset-1 rounded-sm bg-slate-700/60" />
        <div
          className="absolute top-1 bottom-1 rounded bg-white/20 backdrop-blur-[1px] ring-1 ring-white/20 cursor-grab active:cursor-grabbing"
          style={{ left: `${start}%`, width: `${end - start}%` }}
          onPointerDown={(e) => onPointerDown(e, "track")}
          title="Scroll"
        >
          <div
            className="absolute inset-y-0 -left-1 w-2 rounded-l ring-1 ring-white/40 bg-white/70 cursor-ew-resize"
            onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e, "left"); }}
            title="Zoom gauche"
          />
          <div
            className="absolute inset-y-0 -right-1 w-2 rounded-r ring-1 ring-white/40 bg-white/70 cursor-ew-resize"
            onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e, "right"); }}
            title="Zoom droit"
          />
        </div>
      </div>
    </div>
  );
}