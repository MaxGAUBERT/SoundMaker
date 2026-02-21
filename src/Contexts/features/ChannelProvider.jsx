// Contexts/features/ChannelProvider.jsx
import { createContext, useContext } from 'react';
import { useChannelStore } from '../../stores/useChannelStore';

const ChannelContext = createContext();

export { buildInitialChannelState } from '../../stores/useChannelStore';

export function ChannelProvider({ children }) {
    const store = useChannelStore();

    const value = {
        width:            store.width,
        patterns:         store.patterns,
        currentPatternID: store.currentPatternID,
        currentPattern:   store.getCurrentPattern(),

        setWidth:           store.setWidth,
        setCurrentPatternID:store.setCurrentPatternID,
        toggleCell:         store.toggleCell,
        clearCell:          store.clearCell,
        handleAddChannel:   store.handleAddChannel,
        handleAddPattern:   store.handleAddPattern,
        renameChannel:      store.renameChannel,
        deletePattern:      store.deletePattern,
        deleteChannel:      store.deleteChannel,
        moveChannel:        store.moveChannel,
        loadSample:         store.loadSample,
        resetSamples:       store.resetSamples,
        getChannelStates:   store.getChannelStates,
        setState:           store.setState,
        reset:              store.reset,
        createGrid:         (w = store.width) => Array(w).fill(false),
    };

    return <ChannelContext.Provider value={value}>{children}</ChannelContext.Provider>;
}

export function useChannels() {
    const ctx = useContext(ChannelContext);
    if (!ctx) throw new Error('useChannels must be used within a ChannelProvider');
    return ctx;
}