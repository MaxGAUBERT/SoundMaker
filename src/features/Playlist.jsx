// components/Playlist.jsx
import React, { useMemo, useCallback, useState, memo } from "react";
import { useChannelStore } from "../stores/useChannelStore";
import { usePlaylistStore } from "../stores/usePlaylistStore";
import { useGlobalColorContext } from "../Contexts/UI/GlobalColorContext";
import { RxWidth, RxHeight } from "react-icons/rx";

const TrackLabel = memo(({ track, colorsComponent, renameTracks }) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [trackName, setTrackName] = useState(track.name);

    function startRename() { setTrackName(track.name); setIsRenaming(true); }

    function commitRename() {
        if (trackName.trim() === "" || trackName.length > 10) return;
        renameTracks(track.id, trackName);
        setIsRenaming(false);
    }

    if (isRenaming) {
        return (
            <input
                type="text" value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setIsRenaming(false); }}
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

const PlaylistCell = memo(({ cellPatternId, cIdx, rIdx, patternName, isSelected,
    placePattern, clearCell, openPatternInEditor
}) => {
    return (
        <div
            onClick={() => placePattern(rIdx, cIdx)}
            onContextMenu={(e) => { e.preventDefault(); clearCell(rIdx, cIdx); }}
            onDoubleClick={() => { if (cellPatternId) openPatternInEditor(cellPatternId); }}
            className={`
                w-8 h-14 border-r border-b cursor-pointer transition-all
                ${cIdx % 4 === 0 ? 'border-r-gray-500' : 'border-r-gray-700'}
                border-b-gray-700
                ${cellPatternId
                    ? `bg-gradient-to-b from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 ${isSelected ? 'ring-2 ring-blue-400 ring-inset' : ''}`
                    : 'bg-gray-800 hover:bg-gray-700'
                }
            `}
            title={patternName ?? "Empty"}
        >
            {patternName && (
                <div className="text-[9px] font-bold text-center leading-tight pt-1">
                    {patternName}
                </div>
            )}
        </div>
    );
});

const TrackRow = memo(({ track, rIdx, patternMap, selectedPatternId,
    colorsComponent, placePattern, clearCell, openPatternInEditor, renameTracks
}) => {
    return (
        <div className="flex hover:bg-gray-800/50">
            <TrackLabel track={track} colorsComponent={colorsComponent} renameTracks={renameTracks} />
            {track.grid.map((cellPatternId, cIdx) => (
                <PlaylistCell
                    key={`${track.id}-${cIdx}`}
                    cellPatternId={cellPatternId}
                    cIdx={cIdx}
                    rIdx={rIdx}
                    patternName={patternMap[cellPatternId]?.name ?? null}
                    isSelected={cellPatternId === selectedPatternId}
                    placePattern={placePattern}
                    clearCell={clearCell}
                    openPatternInEditor={openPatternInEditor}
                />
            ))}
        </div>
    );
});

const Playlist = memo(() => {
    // Sélecteurs fins depuis les stores
    const patterns           = useChannelStore(s => s.patterns);
    const setCurrentPatternID = useChannelStore(s => s.setCurrentPatternID);

    const pWidth            = usePlaylistStore(s => s.pWidth);
    const pHeight           = usePlaylistStore(s => s.pHeight);
    const playlistGrid      = usePlaylistStore(s => s.playlistGrid);
    const selectedPatternId = usePlaylistStore(s => s.selectedPatternId);
    const setPWidth         = usePlaylistStore(s => s.setPWidth);
    const setPHeight        = usePlaylistStore(s => s.setPHeight);
    const setSelectedPatternId = usePlaylistStore(s => s.setSelectedPatternId); 
    const placePattern      = usePlaylistStore(s => s.placePattern);
    const clearCell         = usePlaylistStore(s => s.clearCell);
    const renameTracks      = usePlaylistStore(s => s.renameTracks);            

    const { colorsComponent } = useGlobalColorContext();

    const openPatternInEditor = useCallback((patternId) => {
        setCurrentPatternID(patternId);
    }, [setCurrentPatternID]);

    const headerRow = useMemo(() => (
        <div
            style={{ borderColor: colorsComponent.Border, backgroundColor: colorsComponent.Background }}
            className="flex sticky top-0 z-20 border-b"
        >
            <div
                style={{ borderColor: colorsComponent.Border, color: colorsComponent.Text }}
                className="w-20 border-r flex items-center justify-center text-xs"
            />
            {Array.from({ length: pWidth }).map((_, i) => (
                <div
                    key={i}
                    className={`w-8 h-8 text-xs text-gray-400 flex items-center justify-center border-r ${
                        i % 4 === 0 ? 'border-r-gray-500 bg-gray-800' : 'border-r-gray-700'
                    }`}
                >
                    {i % 4 === 0 ? Math.floor(i / 4) + 1 : ''}
                </div>
            ))}
        </div>
    ), [pWidth, colorsComponent]);

    const patternMap = useMemo(() => {
        const map = {};
        patterns.forEach(p => { map[p.id] = p; });
        return map;
    }, [patterns]);

    return (
        <div className="flex flex-col h-full">
            {/* Header fixe */}
            <div
                style={{ backgroundColor: colorsComponent.Background, borderColor: colorsComponent.Border }}
                className="p-3 border-b flex-shrink-0"
            >
                <h2 className="text-white font-semibold text-lg mb-3">Playlist</h2>

                <div className="grid grid-cols-8 gap-4 mb-3">
                    <div>
                        <label style={{ color: colorsComponent.Text }} className="text-xs block mb-1">
                            <RxWidth size={15} />: {pWidth}
                        </label>
                        <input type="range" min={8} max={128} value={pWidth}
                            onChange={(e) => setPWidth(Number(e.target.value))} className="w-full" />
                    </div>
                    <div>
                        <label style={{ color: colorsComponent.Text }} className="text-xs block mb-1">
                            <RxHeight size={15} /> {pHeight}
                        </label>
                        <input type="range" min={8} max={128} value={pHeight}
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
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>

                <div style={{ color: colorsComponent.Text }} className="text-[10px] mt-2">
                    Left click: place | Right click: remove | Double click: edit
                </div>
            </div>

            {/* Grille scrollable */}
            <div className="flex-1 overflow-auto">
                <div className="inline-block min-w-full">
                    {headerRow}
                    {playlistGrid.map((track, rIdx) => (
                        <TrackRow
                            key={track.id}
                            track={track}
                            rIdx={rIdx}
                            patternMap={patternMap}
                            selectedPatternId={selectedPatternId}
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