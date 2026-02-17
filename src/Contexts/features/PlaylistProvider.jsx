// Contexts/features/PlaylistProvider.jsx
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

    // ✅ Fonction pour exporter l'état (pour sauvegarde)
    function getPlaylistState() {
        // Convertir la grille 2D en liste d'items avec positions
        const items = [];
        
        playlistGrid.forEach((row, rowIdx) => {
            row.forEach((patternId, colIdx) => {
                if (patternId !== null) {
                    items.push({
                        id: `${rowIdx}-${colIdx}`, // ID unique basé sur la position
                        patternId,
                        row: rowIdx,
                        col: colIdx,
                        track: rowIdx,
                        startTime: colIdx, // Position temporelle
                    });
                }
            });
        });

        return {
            width: pWidth,
            height: pHeight,
            grid: playlistGrid, // Sauvegarder la grille complète
            items, // Liste formatée pour faciliter l'utilisation
            selectedPatternId,
        };
    }

    function loadPlaylistState(state) {
        if (!state) return;

        setPWidth(state.width || 64);
        setPHeight(state.height || 8);
        setSelectedPatternId(state.selectedPatternId || null);
        
        if (state.grid) {
            setPlaylistGrid(state.grid);
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
        getPlaylistState,
        loadPlaylistState,
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