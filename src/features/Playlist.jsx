// components/Playlist.jsx
import React, { useMemo, useCallback, useState, useEffect, memo, useRef } from "react";
import { useChannelStore } from "../stores/useChannelStore";
import { useGlobalColorContext } from "../Contexts/UI/GlobalColorContext";
import { RxWidth, RxHeight } from "react-icons/rx";
import { useTransport } from "../Contexts/features/TransportContext";

const CELL_W   = 128;
const LABEL_W  = 80;  

const HEADER_CELL_W       = 32; 
const HEADER_PER_COL      = CELL_W / HEADER_CELL_W;

// ── Playhead ──────────────────────────────────────────────────────────────────
const Playhead = memo(({ step, patternLength, isPlaying }) => {
  if (!isPlaying) return null;
  // step est en 16n, on le convertit en px
  const px = (step / patternLength) * CELL_W;
  return (
    <div
      className="absolute top-0 bottom-0 bg-green-500/30 pointer-events-none z-30"
      style={{ width: 2, transform: `translateX(${LABEL_W + px}px)` }}
    />
  );
});

// ── TrackLabel ────────────────────────────────────────────────────────────────
const TrackLabel = memo(({ track, colorsComponent, renameTracks }) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [trackName, setTrackName]   = useState(track.name);

  useEffect(() => {
    if (!isRenaming) setTrackName(track.name);
  }, [track.name, isRenaming]);

  const startRename = useCallback(() => {
    setTrackName(track.name);
    setIsRenaming(true);
  }, [track.name]);

  const commitRename = useCallback(() => {
    const next = trackName.trim();
    if (next === "" || next.length > 10) return;
    if (next !== track.name) renameTracks(track.id, next);
    setIsRenaming(false);
  }, [trackName, track.name, track.id, renameTracks]);

  if (isRenaming) {
    return (
      <input
        type="text"
        value={trackName}
        onChange={(e) => setTrackName(e.target.value)}
        onBlur={commitRename}
        onKeyDown={(e) => {
          if (e.key === "Enter")  commitRename();
          if (e.key === "Escape") setIsRenaming(false);
        }}
        autoFocus
        style={{ color: colorsComponent.Text, backgroundColor: colorsComponent.Background }}
        className="w-20 text-sm sticky left-0 z-10 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    );
  }

  return (
    <span
      onDoubleClick={startRename}
      style={{ color: colorsComponent.Text, backgroundColor: colorsComponent.Background }}
      className="w-20 text-sm sticky left-0 z-10 flex items-center cursor-pointer hover:bg-gray-700 transition-colors"
      title="Double-click to rename"
    >
      {track.name}
    </span>
  );
});

// ── PlaylistCell ──────────────────────────────────────────────────────────────
const PlaylistCell = memo(({
  cellPatternId, cIdx, rIdx, patternName,
  isSelected, placePattern, clearCell, openPatternInEditor,
}) => {
  const onClick       = useCallback(() => placePattern(rIdx, cIdx), [placePattern, rIdx, cIdx]);
  const onContextMenu = useCallback((e) => { e.preventDefault(); clearCell(rIdx, cIdx); }, [clearCell, rIdx, cIdx]);
  const onDoubleClick = useCallback((e) => {
    if (cellPatternId) { e.stopPropagation(); openPatternInEditor(cellPatternId); }
  }, [cellPatternId, openPatternInEditor]);

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      style={{ width: CELL_W, height: 56 }}
      className={`
        border-r border-b cursor-pointer transition-all flex-shrink-0
        ${cIdx % 4 === 0 ? "border-r-gray-500" : "border-r-gray-700"}
        border-b-gray-700
        ${cellPatternId
          ? `bg-gradient-to-b from-green-500 to-green-600 hover:from-green-400 hover:to-green-500
             ${isSelected ? "ring-2 ring-blue-400 ring-inset" : ""}`
          : "bg-gray-800 hover:bg-gray-700"
        }
      `}
      title={patternName ?? "Empty"}
    >
      {patternName && (
        <div className="text-[10px] font-bold text-center leading-tight pt-1">{patternName}</div>
      )}
    </div>
  );
});

// ── TrackRow ──────────────────────────────────────────────────────────────────
const TrackRow = memo(({
  track, rIdx, patternMap, currentPatternID,
  colorsComponent, placePattern, clearCell, openPatternInEditor, renameTracks,
}) => (
  <div className="flex hover:bg-gray-800/50">
    <TrackLabel track={track} colorsComponent={colorsComponent} renameTracks={renameTracks} />
    {track.grid.map((cellPatternId, cIdx) => (
      <PlaylistCell
        key={`${track.id}-${cIdx}`}
        cellPatternId={cellPatternId}
        cIdx={cIdx}
        rIdx={rIdx}
        patternName={patternMap[cellPatternId]?.name ?? null}
        isSelected={cellPatternId === currentPatternID}
        placePattern={placePattern}
        clearCell={clearCell}
        openPatternInEditor={openPatternInEditor}
      />
    ))}
  </div>
));

// ── Playlist ──────────────────────────────────────────────────────────────────
const Playlist = memo(() => {
  const patterns          = useChannelStore(s => s.patterns);
  const setCurrentPatternID = useChannelStore(s => s.setCurrentPatternID);
  const width             = useChannelStore(s => s.width); // patternLength en steps

  // ⚠️ pCols = nb de colonnes (largeur), pRows = nb de tracks (hauteur)
  const pCols             = useChannelStore(s => s.pCols);
  const pRows             = useChannelStore(s => s.pRows);
  const playlistTracks    = useChannelStore(s => s.playlistTracks);
  const currentPatternID  = useChannelStore(s => s.currentPatternID);
  const selectedPatternId = useChannelStore(s => s.selectedPatternId);

  const setPWidth         = useChannelStore(s => s.setPCols);  // largeur → pCols
  const setPHeight        = useChannelStore(s => s.setPRows);  // hauteur → pRows
  const setSelectedPatternId = useChannelStore(s => s.setSelectedPatternId);
  const placePatternRaw   = useChannelStore(s => s.placeClip);
  const clearCellRaw      = useChannelStore(s => s.removeClip);
  const renameTracks      = useChannelStore(s => s.renameTrack);

  // ── Sélection ─────────────────────────────────────────────────────────────
  const isSelectingRef  = useRef(false);
  const startSelection  = useChannelStore(s => s.startSelection);
  const selectedIds     = useChannelStore(s => s.selectedIds);
  const setSelection    = useChannelStore(s => s.setSelection);
  const clearSelection  = useChannelStore(s => s.clearSelection);
  const holdTimer       = useRef(null);

  const { colorsComponent } = useGlobalColorContext();
  const { currentStep, isPlaying } = useTransport();

  console.log("playlistTracks:", playlistTracks);

  const openPatternInEditor = useCallback(
    (patternId) => setCurrentPatternID(patternId),
    [setCurrentPatternID]
  );

  const placePattern = useCallback(
    (r, c) => placePatternRaw(r, c, selectedPatternId),
    [placePatternRaw, selectedPatternId]
  );

  const clearCell = useCallback(
    (r, c) => clearCellRaw(r, c),
    [clearCellRaw]
  );

  // ── Sélection header : convertir index header → colonne pattern ───────────
  function handleMouseDown(headerIdx) {
    holdTimer.current = setTimeout(() => {
      isSelectingRef.current = true;
      const col = Math.floor(headerIdx / HEADER_PER_COL);
      setSelection(col, col);
    }, 300);
  }

  function handleMouseEnter(headerIdx) {
    if (!isSelectingRef.current) return;
    const col  = Math.floor(headerIdx / HEADER_PER_COL);
    const from = Math.min(startSelection ?? col, col);
    const to   = Math.max(startSelection ?? col, col);
    setSelection(from, to);
  }

  useEffect(() => {
    const stop = () => {
      clearTimeout(holdTimer.current);
      isSelectingRef.current = false;
    };
    document.addEventListener("mouseup", stop);
    return () => document.removeEventListener("mouseup", stop);
  }, []);

  // ── Header : pCols colonnes, chacune découpée en HEADER_PER_COL cellules ──
  const headerRow = useMemo(() => {
    const totalHeaderCells = pCols * HEADER_PER_COL;
    return (
      <div
        style={{ borderColor: colorsComponent.Border, backgroundColor: colorsComponent.Background }}
        className="flex relative top-0 z-20 border-b"
      >
        {/* Label vide aligné avec LABEL_W */}
        <div
          style={{ minWidth: LABEL_W, borderColor: colorsComponent.Border, color: colorsComponent.Text }}
          className="border-r flex items-center justify-center text-xs flex-shrink-0"
        />
        {Array.from({ length: totalHeaderCells }).map((_, i) => {
          const col         = Math.floor(i / HEADER_PER_COL);
          const isColStart  = i % HEADER_PER_COL === 0;
          const isColSel    = selectedIds.includes(col);
          return (
            <div
              key={i}
              onMouseDown={() => handleMouseDown(i)}
              onMouseEnter={() => handleMouseEnter(i)}
              onDoubleClick={clearSelection}
              style={{ width: HEADER_CELL_W }}
              className={`
                h-8 text-xs flex items-center justify-center border-r cursor-pointer select-none relative flex-shrink-0
                ${isColStart ? "border-r-gray-500 bg-gray-800" : "border-r-gray-700"}
                ${isColSel ? "text-white" : "text-gray-400"}
              `}
            >
              {isColStart ? col + 1 : ""}
              {isColSel && (
                <div className="absolute bottom-0 left-0 right-0 bg-red-500" style={{ height: 2 }} />
              )}
            </div>
          );
        })}
      </div>
    );
  }, [pCols, selectedIds, colorsComponent]);

  const patternMap = useMemo(() => {
    const map = Object.create(null);
    for (const p of patterns) map[p.id] = p;
    return map;
  }, [patterns]);

  return (
    <div className="flex flex-col h-full">
      {/* Header controls */}
      <div
        style={{ backgroundColor: colorsComponent.Background, borderColor: colorsComponent.Border }}
        className="p-3 border-b flex-shrink-0"
      >
        <h2 className="text-white font-semibold text-lg mb-3">Playlist</h2>

        <div className="grid grid-cols-8 gap-4 mb-3">
          <div>
            <label style={{ color: colorsComponent.Text }} className="text-xs block mb-1">
              <RxWidth size={15} />: {pCols}
            </label>
            <input type="range" min={8} max={128} value={pCols}
              onChange={(e) => setPWidth(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label style={{ color: colorsComponent.Text }} className="text-xs block mb-1">
              <RxHeight size={15} />: {pRows}
            </label>
            <input type="range" min={4} max={32} value={pRows}
              onChange={(e) => setPHeight(Number(e.target.value))} className="w-full" />
          </div>
        </div>

        <div className="flex gap-2 flex-row overflow-auto">
          <span className="text-gray-400 text-xs">Patterns:</span>
          {patterns.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPatternId(p.id)}
              onDoubleClick={() => openPatternInEditor(p.id)}
              className={`px-3 py-1 rounded text-xs transition-all ${
                selectedPatternId === p.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {"Pattern " + p.id}
            </button>
          ))}
        </div>

        <div style={{ color: colorsComponent.Text }} className="text-[10px] mt-2">
          Left click: place | Click + hold: song selection | Double click header: clear selection | Right click: remove | Double click cell: edit
        </div>
      </div>

      {/* Scrollable grid */}
      <div className="flex-1 overflow-auto">
        <div className="relative inline-block min-w-full">
          <Playhead step={currentStep} patternLength={width} isPlaying={isPlaying} />
          {headerRow}
          {playlistTracks.map((track, rIdx) => (
            <TrackRow
              key={track.id}
              track={track}
              rIdx={rIdx}
              patternMap={patternMap}
              currentPatternID={currentPatternID}
              colorsComponent={colorsComponent}
              placePattern={placePattern}
              clearCell={clearCell}
              openPatternInEditor={openPatternInEditor}
              renameTracks={renameTracks}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export default Playlist;