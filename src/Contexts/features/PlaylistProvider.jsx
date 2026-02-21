// Contexts/features/PlaylistProvider.jsx
import { createContext, useContext } from 'react';
import { usePlaylistStore } from '../../stores/usePlaylistStore';

const PlaylistContext = createContext(null);

export { buildInitialPlaylistState } from '../../stores/usePlaylistStore';

export function PlaylistProvider({ children }) {
    const store = usePlaylistStore();

    const value = {
        playlistGrid:       store.playlistGrid,
        pWidth:             store.pWidth,
        pHeight:            store.pHeight,
        selectedPatternId:  store.selectedPatternId,

        setPWidth:              store.setPWidth,
        setPHeight:             store.setPHeight,
        setSelectedPatternId:   store.setSelectedPatternId,
        setPlaylistDimensions:  store.setPlaylistDimensions,
        placePattern:           store.placePattern,
        clearCell:              store.clearCell,
        clearPlaylist:          store.clearPlaylist,
        renameTracks:           store.renameTracks,
        getState:               store.getState,
        setState:               store.setState,
        reset:                  store.reset,
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