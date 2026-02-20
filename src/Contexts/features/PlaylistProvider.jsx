import { createContext, useContext, useState, useEffect } from 'react';

const PlaylistContext = createContext(null);

export function PlaylistProvider({ children }) {
    const [pWidth, setPWidth] = useState(64);
    const [pHeight, setPHeight] = useState(8);
    const [selectedPatternId, setSelectedPatternId] = useState(null);

    const [playlistGrid, setPlaylistGrid] = useState(
    Array.from({ length: pHeight }, (_, i) => ({
        id: i,
        name: `Track ${i + 1}`,
        grid: Array.from({ length: pWidth }, () => false)
    }))
    );

    useEffect(() => {
    setPlaylistGrid(prev =>
        Array.from({ length: pHeight }, (_, r) => {

        const old = prev[r];

        return {
            id: r,
            name: old?.name ?? `Track ${r + 1}`,
            grid: Array.from({ length: pWidth }, (_, c) =>
            old?.grid?.[c] ?? null
            ),
        };
        })
    );
    }, [pWidth, pHeight]);

    function placePattern(rowIdx, colIdx, patternId = selectedPatternId) {

    if (!patternId) return;

    setPlaylistGrid(prev =>
        prev.map((track, r) =>
        r === rowIdx
            ? {
                ...track,
                grid: track.grid.map((cell, c) =>
                c === colIdx ? patternId : cell
                ),
            }
            : track
        )
    );
    }

    function clearCell(rowIdx, colIdx) {
    setPlaylistGrid(prev =>
        prev.map((track, r) =>

        r === rowIdx
            ? {
                ...track,
                grid: track.grid.map((cell, c) =>
                c === colIdx ? null : cell
                )
            }
            : track
        )
    );

    }

    function clearPlaylist() {
        setPlaylistGrid(
            Array.from({ length: pHeight }, () =>
                Array.from({ length: pWidth }, () => null)
            )
        );
    }

    function setPlaylistDimensions(width, height) {
        setPWidth(width);
        setPHeight(height);
    }

    function getState() {
    return {
        pWidth,
        pHeight,
        selectedPatternId,
        playlistGrid: playlistGrid.map(row => [...row]),
    };
    }

    function reset() {
    setPWidth(64);
    setPHeight(8);
    setSelectedPatternId(null);
    setPlaylistGrid(Array.from({ length: 8 }, () => Array.from({ length: 64 }, () => null)));
    }

        function setState(data) {
        if (!data) return;

        const w = data.pWidth ?? 64;
        const h = data.pHeight ?? 8;

        setPWidth(w);
        setPHeight(h);
        setSelectedPatternId(data.selectedPatternId ?? null);

        if (data.playlistGrid) {
            // normaliser dimensions
            const grid = Array.from({ length: h }, (_, r) =>
            Array.from({ length: w }, (_, c) => data.playlistGrid?.[r]?.[c] ?? null)
            );
            setPlaylistGrid(grid);
        } else {
            // fallback vide
            setPlaylistGrid(Array.from({ length: h }, () => Array.from({ length: w }, () => null)));
        }
        }

        const value = {
            // État
            playlistGrid,
            pWidth,
            pHeight,
            selectedPatternId,
            
            // Setters
            setPWidth,
            setPHeight,
            setSelectedPatternId,
            setPlaylistDimensions,
            
            // Actions
            placePattern,
            clearCell,
            clearPlaylist,
            
            // Import/Export
            getState, setState, reset
        };

    return (
        <PlaylistContext.Provider value={value}>
            {children}
        </PlaylistContext.Provider>
    );
}

export function usePlaylist() {
    const context = useContext(PlaylistContext);
    if (!context) {
        throw new Error('usePlaylist must be used within PlaylistProvider');
    }
    return context;
}