// components/Playlist.jsx
import { useMemo, useCallback, useState} from "react";
import { useChannels } from "../Contexts/features/ChannelProvider";
import { usePlaylist } from "../Contexts/features/PlaylistProvider";
import { useGlobalColorContext } from "../Contexts/UI/GlobalColorContext";
import { RxWidth, RxHeight } from "react-icons/rx";


function TrackLabel({ track, colorsComponent, renameTracks }) {
    const [isRenaming, setIsRenaming] = useState(false);
    const [trackName, setTrackName] = useState(track.name);

    function startRename() {
        setTrackName(track.name);
        setIsRenaming(true);
    }

    function commitRename() {
        if (trackName.trim() === "" || trackName.length > 10) return;
        
        renameTracks(track.id, trackName);
        setIsRenaming(false);
    }

    if (isRenaming) {
        return (
            <input
                type="text"
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setIsRenaming(false);
                }}
                autoFocus
                style={{
                    color: colorsComponent.Text,
                    backgroundColor: colorsComponent.Background
                }}
                className="w-20 text-sm sticky left-0 z-10 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        );
    }

    return (
        <span
            onDoubleClick={startRename}
            style={{
                color: colorsComponent.Text,
                backgroundColor: colorsComponent.Background
            }}
            className="w-20 text-sm sticky left-0 z-10 flex items-center cursor-pointer hover:bg-gray-700 transition-colors"
            title="Double-click to rename"
        >
            {track.name}
        </span>
    );
}

export default function Playlist() {
    const { patterns, setCurrentPatternID } = useChannels();
    const { colorsComponent } = useGlobalColorContext();
    const {
        playlistGrid,
        pWidth,
        pHeight,
        selectedPatternId,
        setPWidth,
        setPHeight,
        setSelectedPatternId,
        placePattern,
        clearCell,
        renameTracks
    } = usePlaylist();


    const openPatternInEditor = useCallback((patternId) => {
    setCurrentPatternID(patternId);
    }, [setCurrentPatternID]);

    const headerRow = useMemo(() => (
        <div 
            style={{ 
                borderColor: colorsComponent.Border, 
                backgroundColor: colorsComponent.Background 
            }} 
            className="flex sticky top-0 z-20 border-b"
        >
            <div 
                style={{ 
                    borderColor: colorsComponent.Border, 
                    color: colorsComponent.Text 
                }} 
                className="w-20 border-r flex items-center justify-center text-xs"
            >
                {""}
            </div>
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
        patterns.forEach(p => {
            map[p.id] = p;
        });
        return map;
    }, [patterns]);

    const gridRows = useMemo(() => (
        console.log("playlistGrid:", playlistGrid),
        playlistGrid.map((track, rIdx) => {

        const grid = track?.grid;

            return (

                <div key={track.id} className="flex hover:bg-gray-800/50">

                        {/* Track label */}
                        <TrackLabel
                            track={track}
                            colorsComponent={colorsComponent}
                            renameTracks={renameTracks}
                        />

            {/* Cells */}
            {grid.map((cellPatternId, cIdx) => {

            const pattern = patternMap[cellPatternId];
            const isSelected = cellPatternId === selectedPatternId;

            return (

                <div
                key={`${track.id}-${cIdx}`}

                onClick={() => placePattern(rIdx, cIdx)}

                onContextMenu={(e) => {
                    e.preventDefault();
                    clearCell(rIdx, cIdx);
                }}

                onDoubleClick={() => {
                    if (cellPatternId) {
                    openPatternInEditor(cellPatternId);
                    }
                }}

                className={`
                    w-8 h-14 border-r border-b cursor-pointer transition-all
                    ${cIdx % 4 === 0 ? 'border-r-gray-500' : 'border-r-gray-700'}
                    border-b-gray-700
                    ${cellPatternId
                    ? `bg-gradient-to-b from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 ${
                        isSelected ? 'ring-2 ring-blue-400 ring-inset' : ''
                        }`
                    : 'bg-gray-800 hover:bg-gray-700'
                    }
                `}

                title={pattern?.name ?? "Empty"}
                >

                {pattern && (
                    <div className="text-[9px] font-bold text-center leading-tight pt-1">
                    {pattern.name}
                    </div>
                )}
                </div>
            );
            })}
        </div>
        );
  })

), [
  playlistGrid,
  selectedPatternId,
  patternMap,
  placePattern,
  clearCell,
  openPatternInEditor,
  colorsComponent,
  renameTracks
]);

    return (
        <div className="flex flex-col h-full">
            {/* Header fixe */}
            <div 
                style={{ 
                    backgroundColor: colorsComponent.Background, 
                    borderColor: colorsComponent.Border 
                }} 
                className="p-3 border-b flex-shrink-0"
            >
                <h2 className="text-white font-semibold text-lg mb-3">Playlist</h2>

                {/* Contrôles */}
                <div className="grid grid-cols-8 gap-4 mb-3">
                    <div>
                        <label 
                            style={{ color: colorsComponent.Text }} 
                            className="text-xs block mb-1"
                        >
                            <RxWidth size={15}/>: {pWidth}
                        </label>
                        <input
                            type="range"
                            min={8}
                            max={128}
                            value={pWidth}
                            onChange={(e) => setPWidth(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label 
                            style={{ color: colorsComponent.Text }} 
                            className="text-xs block mb-1"
                        >
                        <RxHeight size={15}/> {pHeight}
                        </label>
                        <input
                            type="range"
                            min={8}
                            max={128}
                            value={pHeight}
                            onChange={(e) => setPHeight(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Sélection de patterns */}
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

                <div 
                    style={{ color: colorsComponent.Text }} 
                    className="text-[10px] mt-2"
                >
                    Left click: place | Right click: remove | Double click: edit
                </div>
            </div>

            {/* Grille scrollable */}
            <div className="flex-1 overflow-auto">
                <div className="inline-block min-w-full">
                    {headerRow}
                    {gridRows}
                </div>
            </div>
        </div>
    );
}