import { createContext, useContext, useState, useEffect } from 'react';

const PlaylistContext = createContext(null);

export function PlaylistProvider({ children }) {
    const [pWidth, setPWidth] = useState(64);
    const [pHeight, setPHeight] = useState(8);
    const [selectedPatternId, setSelectedPatternId] = useState(null);

    const [playlistGrid, setPlaylistGrid] = useState(
        Array.from({ length: pHeight }, () =>
            Array.from({ length: pWidth }, () => null)
        )
    );

    // Mettre à jour la grille quand les dimensions changent
    useEffect(() => {
        setPlaylistGrid(prev => {
            const newGrid = Array.from({ length: pHeight }, (_, rIdx) =>
                Array.from({ length: pWidth }, (_, cIdx) => {
                    if (prev[rIdx] && prev[rIdx][cIdx] !== undefined) {
                        return prev[rIdx][cIdx];
                    }
                    return null;
                })
            );
            return newGrid;
        });
    }, [pWidth, pHeight]);

    function placePattern(rowIdx, colIdx, patternId = selectedPatternId) {
        if (!patternId) return;

        setPlaylistGrid(prev => {
            const newGrid = prev.map(row => [...row]);
            newGrid[rowIdx][colIdx] = patternId;
            return newGrid;
        });
    }

    function clearCell(rowIdx, colIdx) {
        setPlaylistGrid(prev => {
            const newGrid = prev.map(row => [...row]);
            newGrid[rowIdx][colIdx] = null;
            return newGrid;
        });
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