// stores/useChannelStore.js
import { create } from 'zustand';
import { DRUM_SAMPLES, DEFAULT_CHANNELS } from '../hooks/Samples/useSamples';


export const PATTERN_WIDTH  = 16;
export const PLAYLIST_COLS  = 8;
export const PLAYLIST_ROWS  = 8;

// ── Helpers ────────────────────────────────────────────────────────────────

function createGrid(width = PATTERN_WIDTH) {
    return Array(width).fill(false);
}

export function buildPlaylistTracks(cols, rows, prev = []) {
    return Array.from({ length: rows }, (_, r) => ({
        id:   r,
        name: prev[r]?.name ?? `Track ${r + 1}`,
        grid: Array.from({ length: cols }, (_, c) => prev[r]?.grid?.[c] ?? null),
    }));
}

export function makeInitialChannels(width) {
    return [
        { id: 0, name: 'Kick',  grid: createGrid(width), sampleUrl: DRUM_SAMPLES.kick,  pianoData: [], duration: "4n", muted: false },
        { id: 1, name: 'Snare', grid: createGrid(width), sampleUrl: DRUM_SAMPLES.snare, pianoData: [], duration: "4n", muted: false },
        { id: 2, name: 'Hihat', grid: createGrid(width), sampleUrl: DRUM_SAMPLES.hihat, pianoData: [], duration: "4n", muted: false },
        { id: 3, name: 'Clap',  grid: createGrid(width), sampleUrl: DRUM_SAMPLES.clap,  pianoData: [], duration: "4n", muted: false },
    ];
}

export function buildInitialState() {
    const width    = PATTERN_WIDTH;
    const channels = makeInitialChannels(width);
    return {
        // ── Patterns ──────────────────────────────────────────────────────
        width,
        currentPatternID:  1,
        currentChannelID:  0,
        patterns: [
            { id: 1, name: 'P1', steps: width, ch: channels.map(ch => ({ ...ch, grid: [...ch.grid], pianoData: [] })) },
            { id: 2, name: 'P2', steps: width, ch: channels.map(ch => ({ ...ch, grid: [...ch.grid], pianoData: [] })) },
        ],

        // ── Playlist (source de vérité audio) ─────────────────────────────
        clips: [
            { id: 1, patternId: 1, start: 0, track: 0, length: 1 },
        ],

        // ── Playlist UI ───────────────────────────────────────────────────
        pCols:         PLAYLIST_COLS,
        pRows:         PLAYLIST_ROWS,
        playlistTracks: buildPlaylistTracks(PLAYLIST_COLS, PLAYLIST_ROWS),

        // ── Sélection timeline ────────────────────────────────────────────
        isSelecting:    false,
        startSelection: null,
        selectionEnd:   null,
        selectedIds:    [],

        // ── Pattern sélectionné dans la palette ───────────────────────────
        selectedPatternId: null,
    };
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useChannelStore = create((set, get) => ({
    ...buildInitialState(),

    // ── Undo/redo bridge ──────────────────────────────────────────────────
    _commit: null,
    _setCommit: (fn) => set({ _commit: fn }),
    _applySnapshot: (snapshot) => set(snapshot),
    _mutate: (next) => {
        const { _commit } = get();
        _commit ? _commit('channel', next) : set(s => ({ ...s, ...next }));
    },

    // ── Sélecteurs dérivés ────────────────────────────────────────────────
    getCurrentPattern:    () => get().patterns.find(p => p.id === get().currentPatternID),
    getCurrentChannel:    () => get().getCurrentPattern()?.ch.find(c => c.id === get().currentChannelID),
    getCurrentChannelUrl: () => get().getCurrentChannel()?.sampleUrl,
    getCurrentChannelName:() => get().getCurrentChannel()?.name,
    getDuration: () => get().getCurrentChannel()?.duration,

    // ── Navigation (non-undoable) ─────────────────────────────────────────
    setCurrentPatternID:  (id) => set({ currentPatternID: id }),
    setCurrentChannelID:  (id) => set({ currentChannelID: id }),
    setSelectedPatternId: (id) => set({ selectedPatternId: id }),

    // ── Séquenceur ────────────────────────────────────────────────────────
    toggleCell: (patternId, channelId, cellIndex) => {
        const { patterns } = get();
        get()._mutate({
            currentPatternID: patternId,
            patterns: patterns.map(p => p.id !== patternId ? p : {
                ...p,
                ch: p.ch.map(ch => ch.id !== channelId ? ch : {
                    ...ch,
                    grid: ch.grid.map((v, i) => i === cellIndex ? !v : v),
                }),
            }),
        });
    },

    updateDuration: (patternId, channelId, newValue) => {
        const {patterns} = get();
        get()._mutate({
            patterns: patterns.map(p => p.id !== patternId ? p :{
                ...p,
                ch: p.ch.map(ch => ch.id !== channelId ?
                    ch : {
                        ...ch,
                        duration: newValue
                    }
                )
            })
        })
        console.log(newValue);
    },

    updateMute: (patternId, channelId, muted) => {
        const {patterns} = get();
        get()._mutate({
            patterns: patterns.map(p => p.id !== patternId ? p :{
                ...p,
                ch: p.ch.map(ch => ch.id !== channelId ?
                    ch : {
                        ...ch,
                        muted
                    }
                )
            })
        })
    },

    clearCell: (patternId, channelId, cellIndex) => {
        const { patterns } = get();
        get()._mutate({
            patterns: patterns.map(p => p.id !== patternId ? p : {
                ...p,
                ch: p.ch.map(ch => ch.id !== channelId ? ch : {
                    ...ch,
                    grid: ch.grid.map((v, i) => i === cellIndex ? false : v),
                }),
            }),
        });
    },

    clearSteps: (patternId, channelId) => {
        const {patterns} = get();

        get()._mutate({
            patterns: patterns.map(p => p.id !== patternId ? p : {
                ...p,
                ch: p.ch.map(ch => ch.id !== channelId ? ch : {
                    ...ch,
                    grid: ch.grid.map((n, i) => i >= 0 && i < 16 ? false : n)
                })
            })
        })
    },

    fillSteps: (patternId, channelId, startIndex, n, value = true) => {
        const { patterns } = get();
        get()._mutate({
            patterns: patterns.map(p => p.id !== patternId ? p : {
                ...p,
                ch: p.ch.map(ch => ch.id !== channelId ? ch : {
                    ...ch,
                    grid: ch.grid.map((cell, i) => {
                        if (typeof n === 'number') {
                            return (i >= startIndex && i < startIndex + n) ? value : null;
                        }
                        if (typeof n === 'string') {
                            const step = parseInt(n.split('/')[1], 10);
                            return (!isNaN(step) && i >= startIndex && (i - startIndex) % step === 2) ? value : null;
                        }
                        //return cell;
                    }),
                }),
            }),
        });
    },

    // ── Patterns ──────────────────────────────────────────────────────────
    handleAddPattern: () => {
        const { patterns, width } = get();
        const newId = patterns.length + 1;
        const ch = makeInitialChannels(width).map(c => ({ ...c, grid: createGrid(width), pianoData: [] }));
        get()._mutate({ patterns: [...patterns, { id: newId, name: `P${newId}`, steps: width, ch }] });
    },

    handleClonePattern: () => {
        const { patterns } = get();
        const newId = patterns.length + 1;
        const src   = patterns[0];
        const ch    = src.ch.map(c => ({ ...c, grid: [...c.grid], pianoData: [...c.pianoData] }));
        get()._mutate({ patterns: [...patterns, { id: newId, name: `P${newId}`, steps: src.steps, ch }] });
    },

    placeClip: (track, colIdx, patternId) => {
        const { clips, playlistTracks } = get();
        const id = patternId ?? get().selectedPatternId;
        if (!id) return;

        const alreadyExists = clips.some(c => c.start === colIdx && c.track === track);
        const newClips = alreadyExists ? clips : [
            ...clips,
            { id: Date.now(), patternId: id, start: colIdx, track, length: 1 },
        ];

        get()._mutate({
            clips: newClips,
            playlistTracks: playlistTracks.map((t, r) => r !== track ? t : {
                ...t,
                grid: t.grid.map((v, c) => c === colIdx ? id : v),
            }),
        });
    },

    deletePattern: (patternId) => {
    const {patterns, currentPatternID} = get();
    const newPattern = patterns.filter(p => p.id !== patternId);
    if (newPattern.length === 0) return;

    const newId = currentPatternID === patternId ?
        newPattern[newPattern.length - 1].id
        : currentPatternID;
        
    get()._mutate({ patterns: newPattern, currentPatternID: newId });
    },

    setPWidth: (newPWidth) => {
        const { pRows, playlistTracks } = get();
        get()._mutate({
            pCols: newPWidth,
            playlistTracks: buildPlaylistTracks(newPWidth, pRows, playlistTracks),
        });
    },

    setPHeight: (newPHeight) => {
        const { pCols, playlistTracks } = get();
        get()._mutate({
            pRows: newPHeight,
            playlistTracks: buildPlaylistTracks(pCols, newPHeight, playlistTracks),
        });
    },
    setWidth: (newWidth) => {
        const { patterns } = get();
        get()._mutate({
            width: newWidth,
            patterns: patterns.map(p => ({
                ...p,
                ch: p.ch.map(ch => {
                    const next = Array(newWidth).fill(false);
                    for (let i = 0; i < Math.min(ch.grid.length, newWidth); i++) next[i] = ch.grid[i];
                    return { ...ch, grid: next };
                }),
            })),
        });
    },

    // ── Channels ──────────────────────────────────────────────────────────
    handleAddChannel: () => {
        const { patterns, width } = get();
        const newId = patterns[0].ch.length;
        get()._mutate({
            patterns: patterns.map(p => ({
                ...p,
                ch: [...p.ch, { id: newId, name: `Channel ${newId}`, grid: createGrid(width), sampleUrl: null, pianoData: [] }],
            })),
        });
    },

    deleteChannel: (channelId) => {
        get()._mutate({
            patterns: get().patterns.map(p => ({ ...p, ch: p.ch.filter(ch => ch.id !== channelId) })),
        });
    },

    moveChannel: (fromIdx, toIdx) => {
        get()._mutate({
            patterns: get().patterns.map(p => {
                const ch = [...p.ch];
                ch.splice(toIdx, 0, ch.splice(fromIdx, 1)[0]);
                return { ...p, ch };
            }),
        });
    },

    renameChannel: (channelId, newName) => {
        if (newName.length > 8) return;
        get()._mutate({
            patterns: get().patterns.map(p => ({
                ...p,
                ch: p.ch.map(ch => ch.id === channelId ? { ...ch, name: newName } : ch),
            })),
        });
    },

    loadSample: (e, patternID, channelId) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    get()._mutate({
        patterns: get().patterns.map(p => p.id !== patternID ? p : {
            ...p,
            ch: p.ch.map(ch => {
                if (ch.id !== channelId) return ch;
                if (ch.sampleUrl?.startsWith('blob:')) URL.revokeObjectURL(ch.sampleUrl);
                return { ...ch, sampleUrl: url };
            }),
        }),
    });
    },

    resetSamples: () => {
        get()._mutate({
            patterns: get().patterns.map(p => ({
                ...p,
                ch: p.ch.map(ch => {
                    const def = DEFAULT_CHANNELS.find(d => d.id === ch.id);
                    return { ...ch, sampleUrl: def?.sampleUrl ?? null, pianoData: [] };
                }),
            })),
        });
    },

   resizeClip: (clipId, newLength) => {
    const { clips, playlistTracks } = get();
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;

    const newClips = clips.map(c => c.id !== clipId ? c : { ...c, length: newLength });

    const newTracks = playlistTracks.map((t, r) => r !== clip.track ? t : {
        ...t,
        grid: t.grid.map((v, c) => {
            const wasInClip = c >= clip.start && c < clip.start + clip.length;

            const isInNewClip = c >= clip.start && c < clip.start + newLength;
            if (isInNewClip) return clip.patternId;
            if (wasInClip) return null;
            return v;
        }),
    });

    get()._mutate({ clips: newClips, playlistTracks: newTracks });
    },

    removeClip: (track, colIdx) => {
        const { clips, playlistTracks } = get();
        get()._mutate({
            clips: clips.filter(c => !(c.start === colIdx && c.track === track)),
            playlistTracks: playlistTracks.map((t, r) => r !== track ? t : {
                ...t,
                grid: t.grid.map((v, c) => c === colIdx ? null : v),
            }),
        });
    },

    clearPlaylist: () => {
        const { pCols, pRows } = get();
        get()._mutate({
            clips: [],
            playlistTracks: buildPlaylistTracks(pCols, pRows),
        });
    },

    // ── Playlist UI ───────────────────────────────────────────────────────
    setPCols: (value) => {
        const { pRows, playlistTracks } = get();
        get()._mutate({ pCols: value, playlistTracks: buildPlaylistTracks(value, pRows, playlistTracks) });
    },

    setPRows: (value) => {
        const { pCols, playlistTracks } = get();
        get()._mutate({ pRows: value, playlistTracks: buildPlaylistTracks(pCols, value, playlistTracks) });
    },

    renameTrack: (trackId, newName) => {
        get()._mutate({
            playlistTracks: get().playlistTracks.map(t => t.id !== trackId ? t : { ...t, name: newName }),
        });
    },

    // ── Sélection timeline ────────────────────────────────────────────────
    setSelection: (start, end) => set({
        isSelecting:    true,
        startSelection: start,
        selectionEnd:   end,
        selectedIds:    Array.from({ length: end - start + 1 }, (_, i) => start + i),
    }),
    
    clearSelection: () => set({
        isSelecting:    false,
        startSelection: null,
        selectionEnd:   null,
        selectedIds:    [],
    }),

    // ── Import / Export ────────────────────────────────────────────────────
    getState: () => {
        const { width, currentPatternID, patterns, clips, pCols, pRows, playlistTracks, selectedPatternId } = get();
        return {
            width, currentPatternID, selectedPatternId,
            pCols, pRows,
            patterns: patterns.map(p => ({
                id: p.id, name: p.name,
                channels: p.ch.map(ch => ({ id: ch.id, name: ch.name, grid: [...ch.grid], sampleUrl: ch.sampleUrl, pianoData: ch.pianoData, duration: ch.duration, muted: ch.muted })),
            })),
            clips: [...clips],
            playlistTracks: playlistTracks.map(t => ({ ...t, grid: [...t.grid] })),
        };
    },

    setState: (data) => {
    if (!data) return;
    const pCols = data.pCols ?? PLAYLIST_COLS;
    const pRows = data.pRows ?? PLAYLIST_ROWS;
    set({
        width:             data.width ?? PATTERN_WIDTH,
        currentPatternID:  data.currentPatternID ?? 1,
        selectedPatternId: data.selectedPatternId ?? null,
        patterns: (data.patterns ?? []).map(p => ({
            id: p.id, name: p.name,
            steps: p.channels?.[0]?.grid?.length ?? PATTERN_WIDTH,
            ch: p.channels.map(ch => ({
                id: ch.id, name: ch.name,
                grid: [...ch.grid],
                sampleUrl: ch.sampleUrl ?? null,
                pianoData: ch.pianoData ?? [],
                duration: ch.duration
            })),
        })),
        clips: data.clips ?? [],
        pCols,
        pRows,
        playlistTracks: buildPlaylistTracks(pCols, pRows, data.playlistTracks ?? []),
    });
    },

    reset: () => set(buildInitialState()),
}));