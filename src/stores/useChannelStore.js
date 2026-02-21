// stores/useChannelStore.js
import { create } from 'zustand';
import { DRUM_SAMPLES, DEFAULT_CHANNELS } from '../hooks/useSamples';

const DEFAULT_WIDTH = 16;

function createGrid(width = DEFAULT_WIDTH) {
    return Array(width).fill(false);
}

export function buildInitialChannelState() {
    const width = DEFAULT_WIDTH;
    const initialChannels = [
        { id: 0, name: 'Kick',  grid: createGrid(width), sampleUrl: DRUM_SAMPLES.kick  },
        { id: 1, name: 'Snare', grid: createGrid(width), sampleUrl: DRUM_SAMPLES.snare },
        { id: 2, name: 'Hihat', grid: createGrid(width), sampleUrl: DRUM_SAMPLES.hihat },
        { id: 3, name: 'Clap',  grid: createGrid(width), sampleUrl: DRUM_SAMPLES.clap  },
    ];
    return {
        width,
        currentPatternID: 1,
        patterns: [
            { id: 1, name: 'P1', ch: initialChannels.map(ch => ({ ...ch, grid: [...ch.grid] })), steps: width },
            { id: 2, name: 'P2', ch: initialChannels.map(ch => ({ ...ch, grid: [...ch.grid] })), steps: width },
        ],
    };
}

export const useChannelStore = create((set, get) => ({
    // ── State métier ───────────────────────────────────────────────────────
    ...buildInitialChannelState(),
    _commit: null,
    _setCommit: (fn) => set({ _commit: fn }),


    _applySnapshot: (snapshot) => set(snapshot),

   
    _mutate: (next) => {
        const { _commit } = get();
        if (_commit) {
            _commit('channel', next); 
        } else {
            set(next);           
        }
    },

    // ── Sélecteur dérivé ──────────────────────────────────────────────────
    getCurrentPattern: () => {
        const { patterns, currentPatternID } = get();
        return patterns.find(p => p.id === currentPatternID);
    },

    // ── Actions non-undoables (navigation) ───────────────────────────────
    setCurrentPatternID: (id) => set({ currentPatternID: id }),

    // ── Actions undoables ─────────────────────────────────────────────────

    toggleCell: (patternId, channelId, cellIndex) => {
        const state = get();
        get()._mutate({
            patterns: state.patterns.map(p =>
                p.id !== patternId ? p : {
                    ...p,
                    ch: p.ch.map(ch =>
                        ch.id !== channelId ? ch : {
                            ...ch,
                            grid: ch.grid.map((v, i) => i === cellIndex ? !v : v),
                        }
                    ),
                }
            ),
        });
    },

    clearCell: (patternId, channelId, cellIndex) => {
        const state = get();
        get()._mutate({
            patterns: state.patterns.map(p =>
                p.id !== patternId ? p : {
                    ...p,
                    ch: p.ch.map(ch =>
                        ch.id !== channelId ? ch : {
                            ...ch,
                            grid: ch.grid.map((v, i) => i === cellIndex ? false : v),
                        }
                    ),
                }
            ),
        });
    },

    handleAddChannel: () => {
        const state = get();
        const newId = state.patterns[0].ch.length;
        get()._mutate({
            patterns: state.patterns.map(p => ({
                ...p,
                ch: [...p.ch, { id: newId, name: `Channel ${newId}`, grid: createGrid(state.width), sampleUrl: null }],
            })),
        });
    },

    handleAddPattern: () => {
        const state = get();
        const newId = state.patterns.length + 1;
        const clone = state.patterns[0].ch.map(ch => ({ ...ch, grid: [...ch.grid] }));
        get()._mutate({
            patterns: [...state.patterns, { id: newId, name: `P${newId}`, ch: clone, steps: state.width }],
        });
    },

    renameChannel: (channelId, newName) => {
        const state = get();
        get()._mutate({
            patterns: state.patterns.map(p => ({
                ...p,
                ch: p.ch.map(ch => ch.id === channelId ? { ...ch, name: newName } : ch),
            })),
        });
    },

    deletePattern: (patternId) => {
        const state = get();
        get()._mutate({ patterns: state.patterns.filter(p => p.id !== patternId) });
    },

    deleteChannel: (channelId) => {
        const state = get();
        get()._mutate({
            patterns: state.patterns.map(p => ({
                ...p,
                ch: p.ch.filter(ch => ch.id !== channelId),
            })),
        });
    },

    moveChannel: (fromIdx, toIdx) => {
        const state = get();
        get()._mutate({
            patterns: state.patterns.map(p => {
                const ch = [...p.ch];
                const [moved] = ch.splice(fromIdx, 1);
                ch.splice(toIdx, 0, moved);
                return { ...p, ch };
            }),
        });
    },

    setWidth: (newWidth) => {
        const state = get();
        get()._mutate({
            width: newWidth,
            patterns: state.patterns.map(p => ({
                ...p,
                ch: p.ch.map(ch => {
                    const next = Array(newWidth).fill(false);
                    for (let i = 0; i < Math.min(ch.grid.length, newWidth); i++) next[i] = ch.grid[i];
                    return { ...ch, grid: next };
                }),
            })),
        });
    },

    loadSample: (e, channelId) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        const state = get();
        get()._mutate({
            patterns: state.patterns.map(p => ({
                ...p,
                ch: p.ch.map(ch => {
                    if (ch.id !== channelId) return ch;
                    if (ch.sampleUrl?.startsWith('blob:')) URL.revokeObjectURL(ch.sampleUrl);
                    return { ...ch, sampleUrl: url };
                }),
            })),
        });
    },

    resetSamples: () => {
        const state = get();
        get()._mutate({
            patterns: state.patterns.map(p => ({
                ...p,
                ch: p.ch.map(ch => {
                    const def = DEFAULT_CHANNELS.find(d => d.id === ch.id);
                    return { ...ch, sampleUrl: def?.sampleUrl ?? null };
                }),
            })),
        });
    },

    // ── Import / Export ────────────────────────────────────────────────────
    getChannelStates: () => {
        const { patterns, currentPatternID, width } = get();
        return {
            currentPatternID, width,
            patterns: patterns.map(p => ({
                id: p.id, name: p.name,
                channels: p.ch.map(ch => ({ id: ch.id, name: ch.name, grid: [...ch.grid], sampleUrl: ch.sampleUrl })),
            })),
        };
    },

    setState: (data) => {
        if (!data) return;
        set({
            width: data.width ?? DEFAULT_WIDTH,
            currentPatternID: data.currentPatternID ?? 1,
            patterns: data.patterns.map(p => ({
                id: p.id, name: p.name,
                steps: p.channels?.[0]?.grid?.length ?? DEFAULT_WIDTH,
                ch: p.channels.map(ch => ({ id: ch.id, name: ch.name, grid: [...ch.grid], sampleUrl: ch.sampleUrl ?? null })),
            })),
        });
    },

    reset: () => set(buildInitialChannelState()),
}));