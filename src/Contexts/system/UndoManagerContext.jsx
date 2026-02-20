// Contexts/system/UndoManagerContext.jsx
// Contexte racine qui centralise l'historique undo/redo pour
// ChannelProvider et PlaylistProvider dans un ordre chronologique.

import { createContext, useContext } from 'react';
import { useUndoManager } from '../../hooks/useUndoManager';
import { buildInitialChannelState } from '../features/ChannelProvider';
import { buildInitialPlaylistState } from '../features/PlaylistProvider';

const UndoManagerContext = createContext(null);

export function UndoManagerProvider({ children }) {
    const { state, setScoped, undo, redo, canUndo, canRedo, reset } =
        useUndoManager(() => ({
            channel:  buildInitialChannelState(),
            playlist: buildInitialPlaylistState(),
        }), 100);

    const value = {
        // États scopés
        channelState:  state.channel,
        playlistState: state.playlist,

        // Setters scopés (remplacent les setState de chaque provider)
        setChannelState:  (updater) => setScoped('channel',  updater),
        setPlaylistState: (updater) => setScoped('playlist', updater),

        // Undo/Redo global et chronologique
        undo,
        redo,
        canUndo,
        canRedo,
        reset,
    };

    return (
        <UndoManagerContext.Provider value={value}>
            {children}
        </UndoManagerContext.Provider>
    );
}

export function useUndoManagerContext() {
    const ctx = useContext(UndoManagerContext);
    if (!ctx) throw new Error('useUndoManagerContext must be used within UndoManagerProvider');
    return ctx;
}