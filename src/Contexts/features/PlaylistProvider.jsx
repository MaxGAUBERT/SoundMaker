// Contexts/features/PlaylistProvider.jsx
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useUndoManagerContext } from "../system/UndoManagerContext";

const PlaylistContext = createContext(null);

const DEFAULT_WIDTH  = 8;
const DEFAULT_HEIGHT = 8;

export function buildInitialPlaylistState() {
    return {
        pWidth:  DEFAULT_WIDTH,
        pHeight: DEFAULT_HEIGHT,
        playlistGrid: buildGrid(DEFAULT_WIDTH, DEFAULT_HEIGHT),
    };
}

function buildGrid(width, height, prev = []) {
    return Array.from({ length: height }, (_, r) => {
        const old = prev[r];
        return {
            id:   r,
            name: old?.name ?? `Track ${r + 1}`,
            grid: Array.from({ length: width }, (_, c) => old?.grid?.[c] ?? null),
        };
    });
}

// ── Provider ──────────────────────────────────────────────────────────────
export function PlaylistProvider({ children }) {
    const { playlistState, setPlaylistState } = useUndoManagerContext();

    const { playlistGrid, pWidth, pHeight } = playlistState;
    const [selectedPatternId, setSelectedPatternId] = useState(null);

    // Ref pour lire playlistGrid dans le useEffect sans le mettre en dépendance
    const gridRef = useRef(playlistGrid);
    useEffect(() => { gridRef.current = playlistGrid; });

    // Synchronise la grille quand les dimensions changent UNIQUEMENT
    useEffect(() => {
        setPlaylistState(draft => {
            draft.playlistGrid = buildGrid(draft.pWidth, draft.pHeight, gridRef.current);
        });
    }, [pWidth, pHeight]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Setters de dimensions ─────────────────────────────────────────────

    function setPWidth(value) {
        setPlaylistState(draft => { draft.pWidth = value; });
    }

    function setPHeight(value) {
        setPlaylistState(draft => { draft.pHeight = value; });
    }

    function setPlaylistDimensions(width, height) {
        setPlaylistState(draft => {
            draft.pWidth  = width;
            draft.pHeight = height;
        });
    }

    // ── Actions ───────────────────────────────────────────────────────────

    function placePattern(rowIdx, colIdx, patternId = selectedPatternId) {
        if (!patternId) return;
        setPlaylistState(draft => {
            draft.playlistGrid[rowIdx].grid[colIdx] = patternId;
        });
    }

    function clearCell(rowIdx, colIdx) {
        setPlaylistState(draft => {
            draft.playlistGrid[rowIdx].grid[colIdx] = null;
        });
    }

    function renameTracks(trackId, newName) {
        setPlaylistState(draft => {
            const track = draft.playlistGrid.find(t => t.id === trackId);
            if (track) track.name = newName;
        });
    }

    function clearPlaylist() {
        setPlaylistState(draft => {
            draft.playlistGrid = buildGrid(draft.pWidth, draft.pHeight);
        });
    }

    // ── Import / Export ───────────────────────────────────────────────────

    function getState() {
        return {
            pWidth,
            pHeight,
            selectedPatternId,
            playlistGrid: playlistGrid.map(track => ({ ...track, grid: [...track.grid] })),
        };
    }

    function setState(data) {
        if (!data) return;
        setPlaylistState(() => ({
            pWidth:  data.pWidth  ?? DEFAULT_WIDTH,
            pHeight: data.pHeight ?? DEFAULT_HEIGHT,
            playlistGrid: buildGrid(
                data.pWidth  ?? DEFAULT_WIDTH,
                data.pHeight ?? DEFAULT_HEIGHT,
                data.playlistGrid ?? []
            ),
        }));
        setSelectedPatternId(data.selectedPatternId ?? null);
    }

    function reset() {
        setPlaylistState(() => buildInitialPlaylistState());
        setSelectedPatternId(null);
    }

    // ── Valeur du contexte ────────────────────────────────────────────────

    const value = {
        playlistGrid, pWidth, pHeight, selectedPatternId,
        setPWidth, setPHeight, setSelectedPatternId, setPlaylistDimensions,
        placePattern, clearCell, clearPlaylist, renameTracks,
        getState, setState, reset,
    };

    return (
        <PlaylistContext.Provider value={value}>
            {children}
        </PlaylistContext.Provider>
    );
}

export function usePlaylist() {
    const ctx = useContext(PlaylistContext);
    if (!ctx) throw new Error('usePlaylist must be used within PlaylistProvider');
    return ctx;
}