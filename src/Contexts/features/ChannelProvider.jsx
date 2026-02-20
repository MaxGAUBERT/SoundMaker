// Contexts/features/ChannelProvider.jsx
import { createContext, useContext, useState } from 'react';
import { useUndoManagerContext } from '../system/UndoManagerContext';
import { DRUM_SAMPLES, DEFAULT_CHANNELS } from '../../hooks/useSamples';

const ChannelContext = createContext();

// ── État initial exporté pour UndoManagerContext ──────────────────────────
export function buildInitialChannelState() {
    const DEFAULT_WIDTH = 16;
    const width = DEFAULT_WIDTH;

    function createGrid() {
        return Array(width).fill(false);
    }

    const initialChannels = [
        { id: 0, name: "Kick",  grid: createGrid(), sampleUrl: DRUM_SAMPLES.kick  },
        { id: 1, name: "Snare", grid: createGrid(), sampleUrl: DRUM_SAMPLES.snare },
        { id: 2, name: "Hihat", grid: createGrid(), sampleUrl: DRUM_SAMPLES.hihat },
        { id: 3, name: "Clap",  grid: createGrid(), sampleUrl: DRUM_SAMPLES.clap  },
    ];

    return {
        width,
        currentPatternID: 1,
        patterns: [
            { id: 1, name: "P1", ch: initialChannels.map(ch => ({ ...ch, grid: [...ch.grid] })), steps: width },
            { id: 2, name: "P2", ch: initialChannels.map(ch => ({ ...ch, grid: [...ch.grid] })), steps: width },
        ],
    };
}

// ── Provider ──────────────────────────────────────────────────────────────
export function ChannelProvider({ children }) {
    const { channelState, setChannelState } = useUndoManagerContext();

    const { patterns, currentPatternID, width } = channelState;
    const currentPattern = patterns.find(p => p.id === currentPatternID);

    // width local pour les créations de grilles (pas dans l'historique)
    const [localWidth, setLocalWidth] = useState(width);

    function createGrid(w = localWidth) {
        return Array(w).fill(false);
    }

    // ── Actions ───────────────────────────────────────────────────────────

    function setCurrentPatternID(id) {
        setChannelState(draft => { draft.currentPatternID = id; });
    }

    function toggleCell(patternId, channelId, cellIndex) {
        setChannelState(draft => {
            const pattern = draft.patterns.find(p => p.id === patternId);
            const channel = pattern?.ch.find(ch => ch.id === channelId);
            if (channel) channel.grid[cellIndex] = !channel.grid[cellIndex];
        });
    }

    function clearCell(patternId, channelId, cellIndex) {
        setChannelState(draft => {
            const pattern = draft.patterns.find(p => p.id === patternId);
            const channel = pattern?.ch.find(ch => ch.id === channelId);
            if (channel) channel.grid[cellIndex] = false;
        });
    }

    function handleAddChannel() {
        setChannelState(draft => {
            const newId = draft.patterns[0].ch.length;
            draft.patterns.forEach(pattern => {
                pattern.ch.push({
                    id: newId,
                    name: `Channel ${newId}`,
                    grid: createGrid(),
                    sampleUrl: null,
                });
            });
        });
    }

    function handleAddPattern() {
        setChannelState(draft => {
            const newId = draft.patterns.length + 1;
            const clone = draft.patterns[0].ch.map(ch => ({ ...ch, grid: [...ch.grid] }));
            draft.patterns.push({ id: newId, name: `P${newId}`, ch: clone, steps: draft.width });
        });
    }

    function renameChannel(channelId, newName) {
        setChannelState(draft => {
            draft.patterns.forEach(pattern => {
                const ch = pattern.ch.find(c => c.id === channelId);
                if (ch) ch.name = newName;
            });
        });
    }

    function deletePattern(patternId) {
        setChannelState(draft => {
            const idx = draft.patterns.findIndex(p => p.id === patternId);
            if (idx !== -1) draft.patterns.splice(idx, 1);
        });
    }

    function deleteChannel(channelId) {
        setChannelState(draft => {
            draft.patterns.forEach(pattern => {
                const idx = pattern.ch.findIndex(ch => ch.id === channelId);
                if (idx !== -1) pattern.ch.splice(idx, 1);
            });
        });
    }

    function moveChannel(fromIdx, toIdx) {
        setChannelState(draft => {
            draft.patterns.forEach(pattern => {
                const [ch] = pattern.ch.splice(fromIdx, 1);
                pattern.ch.splice(toIdx, 0, ch);
            });
        });
    }

    function updateWidth(newWidth) {
        setLocalWidth(newWidth);
        setChannelState(draft => {
            draft.width = newWidth;
            draft.patterns.forEach(pattern => {
                pattern.ch.forEach(channel => {
                    const old = channel.grid;
                    const next = Array(newWidth).fill(false);
                    for (let i = 0; i < Math.min(old.length, newWidth); i++) next[i] = old[i];
                    channel.grid = next;
                });
            });
        });
    }

    function loadSample(e, channelId) {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setChannelState(draft => {
            draft.patterns.forEach(pattern => {
                const ch = pattern.ch.find(c => c.id === channelId);
                if (ch) {
                    if (ch.sampleUrl?.startsWith('blob:')) URL.revokeObjectURL(ch.sampleUrl);
                    ch.sampleUrl = url;
                }
            });
        });
    }

    function resetSamples() {
        setChannelState(draft => {
            draft.patterns.forEach(pattern => {
                pattern.ch.forEach(channel => {
                    const def = DEFAULT_CHANNELS.find(d => d.id === channel.id);
                    channel.sampleUrl = def?.sampleUrl ?? null;
                });
            });
        });
    }

    function getChannelStates() {
        return {
            patterns: patterns.map(p => ({
                id: p.id, name: p.name,
                channels: p.ch.map(ch => ({ id: ch.id, name: ch.name, grid: [...ch.grid], sampleUrl: ch.sampleUrl })),
            })),
            currentPatternID,
            width,
        };
    }

    function setState(data) {
        if (!data) return;
        setChannelState(() => ({
            width: data.width ?? DEFAULT_WIDTH,
            currentPatternID: data.currentPatternID ?? 1,
            patterns: data.patterns.map(p => ({
                id: p.id, name: p.name,
                steps: p.channels?.[0]?.grid?.length ?? DEFAULT_WIDTH,
                ch: p.channels.map(ch => ({ id: ch.id, name: ch.name, grid: [...ch.grid], sampleUrl: ch.sampleUrl ?? null })),
            })),
        }));
    }

    function reset() {
        setChannelState(() => buildInitialChannelState());
    }

    const value = {
        width, patterns, currentPatternID, currentPattern,
        setWidth: updateWidth,
        setCurrentPatternID,
        setPatterns: setChannelState,
        toggleCell, clearCell,
        handleAddChannel, handleAddPattern,
        renameChannel, deletePattern, deleteChannel, moveChannel,
        loadSample, resetSamples,
        getChannelStates, setState, reset,
        createGrid,
    };

    return <ChannelContext.Provider value={value}>{children}</ChannelContext.Provider>;
}

export function useChannels() {
    const ctx = useContext(ChannelContext);
    if (!ctx) throw new Error('useChannels must be used within a ChannelProvider');
    return ctx;
}