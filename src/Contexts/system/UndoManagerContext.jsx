import { createContext, useContext } from 'react';
import { useUndoManager } from '../../hooks/system/useUndoManager';
import { buildInitialState } from "../../stores/useChannelStore";

const UndoManagerContext = createContext(null);

export function UndoManagerProvider({ children }) {
    const { state, setScoped, undo, redo, canUndo, canRedo } = useUndoManager(() => ({
        channel: buildInitialState()
    }));

    const value = {
        channelState: state.channel,

        setChannelState: (updater) => setScoped('channel', updater),

        undo,
        redo,
        canUndo,
        canRedo,
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