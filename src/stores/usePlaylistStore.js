// stores/usePlaylistStore.js
import { create } from 'zustand';

const DEFAULT_WIDTH  = 8;
const DEFAULT_HEIGHT = 8;

function buildGrid(width, height, prev = []) {
    return Array.from({ length: height }, (_, r) => {
        const old = prev[r];
        return {
            id:   r,
            name: old?.name ?? `Track ${r + 1}`,
            grid: Array.from({ length: width }, (_, c) => old?.grid?.[c] ?? null),
        };
    });
}

export function buildInitialPlaylistState() {
    return {
        pWidth:  DEFAULT_WIDTH,
        pHeight: DEFAULT_HEIGHT,
        playlistGrid: buildGrid(DEFAULT_WIDTH, DEFAULT_HEIGHT),
        selectedPatternId: null,
    };
}

export const usePlaylistStore = create((set, get) => ({
    // ── State métier ───────────────────────────────────────────────────────
    ...buildInitialPlaylistState(),

    _commit: null,
    _setCommit: (fn) => set({ _commit: fn }),


    _applySnapshot: (snapshot) => set(snapshot),

 
    _mutate: (next) => {
        const { _commit } = get();
        if (_commit) {
            _commit('playlist', next);
        } else {
            set(next);
        }
    },

    // ── Actions non-undoables ─────────────────────────────────────────────
    setSelectedPatternId: (id) => set({ selectedPatternId: id }),

    // ── Actions undoables ─────────────────────────────────────────────────

    setPWidth: (value) => {
        const state = get();
        get()._mutate({
            pWidth: value,
            playlistGrid: buildGrid(value, state.pHeight, state.playlistGrid),
        });
    },

    setPHeight: (value) => {
        const state = get();
        get()._mutate({
            pHeight: value,
            playlistGrid: buildGrid(state.pWidth, value, state.playlistGrid),
        });
    },

    setPlaylistDimensions: (width, height) => {
        const state = get();
        get()._mutate({
            pWidth: width,
            pHeight: height,
            playlistGrid: buildGrid(width, height, state.playlistGrid),
        });
    },

    placePattern: (rowIdx, colIdx, patternId) => {
        const state = get();
        const id = patternId ?? state.selectedPatternId;;
        if (!id) return;
        get()._mutate({
            playlistGrid: state.playlistGrid.map((track, r) =>
                r !== rowIdx ? track : {
                    ...track,
                    grid: track.grid.map((v, c) => c === colIdx ? id : v),
                }
            ),
        });
    },

    clearCell: (rowIdx, colIdx) => {
        const state = get();
        get()._mutate({
            playlistGrid: state.playlistGrid.map((track, r) =>
                r !== rowIdx ? track : {
                    ...track,
                    grid: track.grid.map((v, c) => c === colIdx ? null : v),
                }
            ),
        });
    },

    renameTracks: (trackId, newName) => {
        const state = get();
        get()._mutate({
            playlistGrid: state.playlistGrid.map(track =>
                track.id !== trackId ? track : { ...track, name: newName }
            ),
        });
    },

    clearPlaylist: () => {
        const state = get();
        get()._mutate({ playlistGrid: buildGrid(state.pWidth, state.pHeight) });
    },

    // ── Import / Export ────────────────────────────────────────────────────
    getState: () => {
        const { pWidth, pHeight, selectedPatternId, playlistGrid } = get();
        return {
            pWidth, pHeight, selectedPatternId,
            playlistGrid: playlistGrid.map(track => ({ ...track, grid: [...track.grid] })),
        };
    },

    setState: (data) => {
        if (!data) return;
        const pWidth  = data.pWidth  ?? DEFAULT_WIDTH;
        const pHeight = data.pHeight ?? DEFAULT_HEIGHT;
        set({
            pWidth, pHeight,
            selectedPatternId: data.selectedPatternId ?? null,
            playlistGrid: buildGrid(pWidth, pHeight, data.playlistGrid ?? []),
        });
    },

    reset: () => set(buildInitialPlaylistState()),
}));