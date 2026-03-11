import React, {
  useState, useRef, useCallback, useEffect, useMemo,
} from "react";
import * as Tone from "tone";
import { TopBar } from "./TopBar";
import { NoteBlock } from "./NoteBlock";
import { NoteLabels } from "./NoteLabels";
import ZoomBarTW from "../../UI/ZoomBarTW";
import { useChordGenerator } from "../../hooks/piano/useChordGenerator";
import { rowToNoteName }     from "../../features/PianoRoll/utils/noteUtils";
import { useChannelStore }  from "../../stores/useChannelStore";
import { usePianoRollStore } from "../../stores/usePianoRollStore";
import { usePianoRollNotes } from "../../hooks/piano/usePianoRollNotes";
import { useTransport } from "../../Contexts/features/TransportContext";

export const ROWS        = 48;
export const CELL_WIDTH  = 20;
export const CELL_HEIGHT = 20;
export const noteNames   = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

const MIN_WINDOW_PERCENT = 2;


const GridLines = React.memo(({ rows, cols, cellWidth, cellHeight }) => {
  const hLines = useMemo(() => Array.from({ length: rows + 1 }, (_, i) => (
    <div
      key={i}
      className={`absolute border-t ${i % 12 === 0 ? "border-gray-500" : "border-gray-700"}`}
      style={{ top: `${i * cellHeight}px`, width: "100%", transform: "translateZ(0)" }}
    />
  )), [rows, cellHeight]);

  const vLines = useMemo(() => Array.from({ length: cols + 1 }, (_, i) => (
    <div
      key={i}
      className={`absolute border-l ${i % 4 === 0 ? "border-gray-500" : "border-gray-700"}`}
      style={{ left: `${i * cellWidth}px`, height: "100%", transform: "translateZ(0)" }}
    />
  )), [cols, cellWidth]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ willChange: "transform" }}>
      {hLines}{vLines}
    </div>
  );
});


const VirtualizedCellGrid = React.memo(({ rows, cols, cellWidth, cellHeight, onCellMouseEnter, xToContent }) => {
  const handleMouseMove = useCallback((e) => {
    const rect     = e.currentTarget.getBoundingClientRect();
    const xContent = xToContent(e.clientX - rect.left);
    const col      = Math.floor(xContent / cellWidth);
    const row      = Math.floor((e.clientY - rect.top) / cellHeight);
    if (row >= 0 && row < rows && col >= 0 && col < cols) onCellMouseEnter(row, col);
  }, [rows, cols, cellWidth, cellHeight, onCellMouseEnter, xToContent]);

  return (
    <div
      className="absolute inset-0"
      style={{ width: `${cols * cellWidth}px`, height: `${rows * cellHeight}px`, willChange: "transform" }}
      onMouseMove={handleMouseMove}
    />
  );
});

// labels de mesure
const MeasureLabels = React.memo(({ cols, cellWidth }) => {
  const labels = useMemo(() => Array.from({ length: Math.ceil(cols / 4) }, (_, i) => (
    <div
      key={i}
      className="border-r border-gray-600 text-center text-xs py-1 text-gray-300"
      style={{ width: `${cellWidth * 4}px`, transform: "translateZ(0)" }}
    >
      {i + 1}
    </div>
  )), [cols, cellWidth]);

  return <div className="flex border-b border-gray-600 bg-gray-800">{labels}</div>;
});

// ── Composant principal ───────────────────────────────────────────────────────

const PianoRoll = () => {
  // ── Stores ────────────────────────────────────────────────────────────────
  const width = useChannelStore((s) => s.width);
  const setWidth = useChannelStore((s) => s.setWidth);
  const currentPatternID = useChannelStore(s => s.currentPatternID);
  const currentChannelID = useChannelStore(s => s.currentChannelID);




  const channel = useChannelStore(s => {
  const pattern = s.patterns.find(p => p.id === s.currentPatternID);
  return pattern?.ch.find(c => c.id === s.currentChannelID)?.name;
  });

  const channelUrl = useChannelStore(s => {
  const pattern = s.patterns.find(p => p.id === s.currentPatternID);
  return pattern?.ch.find(c => c.id === s.currentChannelID)?.sampleUrl;
  });
  

  const {
    mode, selectedNoteId, isMouseDown, isResizing: isResizingStore,
    resizeDirection, windowRange, selectedChordType,
    setMode, setSelectedNoteId, setIsMouseDown, setWindowRange,
    setSelectedChordType, startResize, startResizeGrid, endResize,
  } = usePianoRollStore();

  // ── Hooks métier ─────────────────────────────────────────────────────────
  const { notes, setNotes, clearNotes, filterNotesInRange } =
    usePianoRollNotes(currentPatternID, currentChannelID );

  const samplerRef = useRef(null);

  // ── État local (UI pure, pas besoin de store global) ─────────────────────
  const { currentStep, isPlaying, mode: playMode} = useTransport(); 
  const [isResizingLocal, setIsResizingLocal] = useState(false);
  const [resizeMode,     setResizeMode]     = useState(null);
  const [initialMouseX,  setInitialMouseX]  = useState(0);
  const [initialNote,    setInitialNote]    = useState(null);
  const playModeRef = useRef(playMode);
  // Refs
  const gridRef      = useRef(null);
  const viewportRef  = useRef(null);
  const modeRef      = useRef(mode);
  const noteLabelsRef = useRef([]);
  const paintThrottleRef = useRef(null);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => {playModeRef.current = playMode;}, [playMode]);

  // ── Notes (lecture) ───────────────────────────────────────────────────────
  const currentNotes = useMemo(() => notes, [notes]);

  // ── Zoom ──────────────────────────────────────────────────────────────────
  const naturalWidthPx    = width * CELL_WIDTH;
  const windowWidthPercent = windowRange[1] - windowRange[0];
  const scaleX            = 100 / windowWidthPercent;
  const startPx           = (windowRange[0] / 100) * naturalWidthPx;
  const xToContent = useCallback((xView) => xView / scaleX + startPx, [scaleX, startPx]);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const xContent     = xToContent(e.clientX - vp.getBoundingClientRect().left);
      const cursorPct    = (xContent / naturalWidthPx) * 100;
      const delta        = Math.sign(e.deltaY);
      const factor       = 1 + 0.15 * Math.abs(delta);
      const currentWidth = windowRange[1] - windowRange[0];
      const newWidth     = delta > 0 ? currentWidth * factor : currentWidth / factor;
      const clamped      = Math.max(MIN_WINDOW_PERCENT, Math.min(100, newWidth));
      const ratio        = (cursorPct - windowRange[0]) / currentWidth;
      let s = cursorPct - ratio * clamped;
      let en = s + clamped;
      if (s < 0)   { s = 0;       en = clamped; }
      if (en > 100) { en = 100; s = 100 - clamped; }
      setWindowRange([s, en]);
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, [xToContent, windowRange, naturalWidthPx]);

  // ── Labels notes ──────────────────────────────────────────────────────────
  const noteLabels = useMemo(() => {
    const labels = Array.from({ length: ROWS }, (_, i) => rowToNoteName(i));
    noteLabelsRef.current = labels;
    return labels;
  }, []);

  const isBlackKey = useCallback((row) => [1, 3, 6, 8, 10].includes((ROWS - 1 - row) % 12), []);

  // ── Chord generator ───────────────────────────────────────────────────────
  const { generateChordNotes } = useChordGenerator({ ROWS, selectedChordType, noteLabelsRef });

  // ── Handlers ──────────────────────────────────────────────────────────────

  useEffect(() => {
  let mounted = true;

  const loadSampler = async () => {
    if (!channelUrl) return;

    samplerRef.current?.dispose();

    const sampler = new Tone.Sampler({
      urls: { C5: channelUrl }
    }).toDestination();

    await sampler.loaded;

    if (!mounted) {
      sampler.dispose();
      return;
    }

    samplerRef.current = sampler;
  };

  loadSampler();

  return () => {
    mounted = false;
    samplerRef.current?.dispose();
    samplerRef.current = null;
  };

  }, [channelUrl]);

  const handlePlaySound = useCallback(async (_, row) => {
  await Tone.start();

  const sampler = samplerRef.current;
  if (!sampler) return;
  
  sampler.triggerAttackRelease(rowToNoteName(row), "8n");

}, []);

  const handleColsChange = useCallback((newCols) => {
    requestAnimationFrame(() => {
      setWidth(newCols);
      filterNotesInRange(newCols);
      setWindowRange(([s, e]) => [0, Math.min(100, Math.max(MIN_WINDOW_PERCENT, e - s))]);
    });
  }, [setWidth, filterNotesInRange, setWindowRange]);

  // Resize via poignées (drag handlers)
  const handleResizeLeft = useCallback((e, note) => {
    e.stopPropagation();
    startResize(note, "left", e.clientX);
    setIsResizingLocal(true);
    setResizeMode("left");
    setInitialMouseX(e.clientX);
    setInitialNote({ ...note });
  }, [startResize]);

  const handleResizeRight = useCallback((e, note) => {
    e.stopPropagation();
    startResize(note, "right", e.clientX);
    setIsResizingLocal(true);
    setResizeMode("right");
    setInitialMouseX(e.clientX);
    setInitialNote({ ...note });
  }, [startResize]);

  const handleNoteMouseDown = useCallback((e, note) => {
    e.stopPropagation();
    setSelectedNoteId(note.id);
  }, [setSelectedNoteId]);

  // Mousedown/up global
  useEffect(() => {
    const down = () => setIsMouseDown(true);
    const up   = () => setIsMouseDown(false);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup",   up);
    return () => { window.removeEventListener("mousedown", down); window.removeEventListener("mouseup", up); };
  }, [setIsMouseDown]);

  // Mouse move/up pour le resize
  const handleMouseMove = useCallback((e) => {
    if (isResizingLocal && initialNote) {
      const deltaCells = Math.round((e.clientX - initialMouseX) / scaleX / CELL_WIDTH);
      setNotes((prev) => prev.map((n) => {
        if (n.id !== initialNote.id) return n;
        if (resizeMode === "left") {
          const actualDelta = Math.max(-initialNote.start, Math.min(deltaCells, initialNote.length - 1));
          return { ...n, start: initialNote.start + actualDelta, length: initialNote.length - actualDelta };
        }
        if (resizeMode === "right") {
          return { ...n, length: Math.max(1, Math.min(initialNote.length + deltaCells, width - initialNote.start)) };
        }
        return n;
      }));
      return;
    }

    if (!isResizingStore || !selectedNoteId) return;
    const rect     = gridRef.current?.getBoundingClientRect();
    if (!rect) return;
    const col      = Math.floor(xToContent(e.clientX - rect.left) / CELL_WIDTH);

    setNotes((prev) => prev.map((n) => {
      if (n.id !== selectedNoteId) return n;
      if (resizeDirection === "left") {
        const newStart  = Math.max(0, Math.min(col, n.start + n.length - 1));
        return { ...n, start: newStart, length: n.start + n.length - newStart };
      }
      if (resizeDirection === "right") {
        return { ...n, length: Math.max(1, Math.min(col - n.start + 1, width - n.start)) };
      }
      return n;
    }));
  }, [isResizingLocal, isResizingStore, initialNote, initialMouseX, resizeMode, resizeDirection,
      selectedNoteId, scaleX, width, setNotes, xToContent]);

  const handleMouseUp = useCallback(() => { 
    if (isResizingLocal) {
      setIsResizingLocal(false);
      setResizeMode(null);
      setInitialNote(null);
      setInitialMouseX(0);
    }
    endResize();
  }, [isResizingLocal, endResize]);

  useEffect(() => {
    if (!isResizingLocal && !isResizingStore) return;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup",   handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup",   handleMouseUp);
    };
  }, [isResizingLocal, isResizingStore, handleMouseMove, handleMouseUp]);

  // Paint
  const handlePaintCell = useCallback((row, col) => {
    if (!isMouseDown || modeRef.current !== "paint") return;
    if (paintThrottleRef.current) return;
    paintThrottleRef.current = setTimeout(() => { paintThrottleRef.current = null; }, 16);
    setNotes((prev) => {
      if (prev.some((n) => n.row === row && col >= n.start && col < n.start + n.length)) return prev;
      return [...prev, { id: crypto.randomUUID(), row, start: col, length: 2, height: 1, pitch: ROWS - 1 - row }];
    });
  }, [isMouseDown, setNotes]);

  // Delete
  const handleDeleteCell = useCallback((row, col) => {
    if (!isMouseDown || modeRef.current !== "delete") return;
    setNotes((prev) => {
      const idx = prev.findIndex((n) =>
        row >= n.row && row < n.row + n.height && col >= n.start && col < n.start + n.length
      );
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      setSelectedNoteId(null);
      return next;
    });
  }, [isMouseDown, setNotes, setSelectedNoteId]);

  // Grid click
  const handleGridClick = useCallback((e) => {
    if (isResizingStore) return;
    const rect    = gridRef.current.getBoundingClientRect();
    const col     = Math.floor(xToContent(e.clientX - rect.left) / CELL_WIDTH);
    const row     = Math.floor((e.clientY - rect.top) / CELL_HEIGHT);
    if (row < 0 || row >= ROWS || col < 0 || col >= width) return;

    if (mode === "draw") {
      handlePlaySound(null, row);
      setNotes((prev) => {
        const idx = prev.findIndex((n) =>
          row >= n.row && row < n.row + n.height && col >= n.start && col < n.start + n.length
        );
        if (idx !== -1) {
          const next = [...prev]; next.splice(idx, 1);
          setSelectedNoteId(null);
          return next;
        }
        const newNote = { id: crypto.randomUUID(), row, start: col, length: 2, height: 1, pitch: ROWS - 1 - row };
        setSelectedNoteId(newNote.id);
        return [...prev, newNote];
        
      }, );
    }


    if (mode === "resize") {
      const note = notes.find((n) =>
        row >= n.row && row < n.row + n.height && col >= n.start && col < n.start + n.length
      );
      if (!note) { setSelectedNoteId(null); return; }

      const gridRect  = gridRef.current.getBoundingClientRect();
      const clickRelX = xToContent(e.clientX - gridRect.left) - note.start * CELL_WIDTH;
      const dir       = clickRelX < (note.length * CELL_WIDTH) / 2 ? "left" : "right";

      startResizeGrid(note.id, dir);
      setInitialNote(note);
      setInitialMouseX(e.clientX);
    }

    if (mode === "chords") {
      const chordNotes = generateChordNotes(row, col);
      if (chordNotes.length > 0) {
        setNotes((prev) => [...prev, ...chordNotes]);
        setSelectedNoteId(chordNotes[0].id);
      }
      handlePlaySound(null, row);
    }
  }, [isResizingStore, mode, width, xToContent, setNotes,
      setSelectedNoteId, notes, generateChordNotes, startResizeGrid]);

  const toggleMode = useCallback((newMode) => setMode(newMode), [setMode]);
  const clearAll   = useCallback(() => { clearNotes; setSelectedNoteId(null); }, [clearNotes, setSelectedNoteId]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-900 text-white rounded-xl min-h-0">
      <TopBar
        selectedInstrument={channel}
        selectedPattern={currentPatternID}
        mode={mode}
        toggleMode={toggleMode}
        clearAll={clearNotes}
        selectedChordType={selectedChordType}
        setSelectedChordType={setSelectedChordType}
        width={width}
        setWidth={handleColsChange}
      />

      <div className="mt-2">
        <ZoomBarTW
          windowRange={windowRange}
          setWindowRange={setWindowRange}
          minWindowPercent={MIN_WINDOW_PERCENT}
        />
      </div>

      <div className="flex">
        <NoteLabels noteLabels={noteLabels} handlePlaySound={handlePlaySound} isBlackKey={isBlackKey} />

        <div className="relative w-full overflow-hidden" ref={viewportRef}>
          {/* Mesures */}
          <div
            className="relative"
            style={{ width: `${width * CELL_WIDTH}px`, transformOrigin: "left center",
              transform: `translateX(-${startPx}px) scaleX(${scaleX})` }}
          >
            <MeasureLabels cols={width} cellWidth={CELL_WIDTH} />
          </div>

          {/* Grille + notes */}
          <div
            ref={gridRef}
            className="relative cursor-crosshair select-none"
            onClick={handleGridClick}
            style={{
              width: `${width * CELL_WIDTH}px`, height: `${ROWS * CELL_HEIGHT}px`,
              transformOrigin: "left top",
              transform: `translateX(-${startPx}px) scaleX(${scaleX})`,
              willChange: "transform",
            }}
          >
            {/* Playhead */}
            <div
              className="absolute bg-red-900 pointer-events-none z-10"
              style={{
                left: `${isPlaying && currentStep && playModeRef.current !== "song" ? currentStep * CELL_WIDTH : 0}px`,
                width: `${CELL_WIDTH / 8}px`, height: `${ROWS * CELL_HEIGHT}px`,
                transform: "translateZ(0)", transition: "left 0.1s linear",
              }}
            />

            
            {/* Notes */}
            <div style={{ willChange: "transform" }}>
              {currentNotes.map((note) => (
                <NoteBlock
                  key={note.id}
                  note={note}
                  selected={selectedNoteId === note.id}
                  noteLabel={noteLabelsRef.current[note.row]}
                  onMouseDown={(e) => handleNoteMouseDown(e, note)}
                  onResizeLeft={handleResizeLeft}
                  onResizeRight={handleResizeRight}
                />
              ))}
            </div>


            <VirtualizedCellGrid
              rows={ROWS} cols={width}
              cellWidth={CELL_WIDTH} cellHeight={CELL_HEIGHT}
              onCellMouseEnter={(row, col) => { handlePaintCell(row, col); handleDeleteCell(row, col); }}
              xToContent={xToContent}
            />

            <GridLines rows={ROWS} cols={width} cellWidth={CELL_WIDTH} cellHeight={CELL_HEIGHT} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PianoRoll);