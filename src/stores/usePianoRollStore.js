// store/usePianoRollStore.js
// État UI du Piano Roll — mode, sélection, resize, zoom.
// Séparé du store DrumRack car le Piano Roll a son propre cycle de vie.
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const initialState = {
  mode:            "draw",   // draw | paint | resize | delete | chords
  selectedNoteId:  null,
  isMouseDown:     false,
  // Resize
  isResizing:      false,
  resizeMode:      null,     // 'left' | 'right'
  resizeDirection: null,     // pour le mode resize via grille
  initialMouseX:   0,
  initialNote:     null,
  // Zoom
  windowRange:     [0, 100], // [startPercent, endPercent]
  // Chord
  selectedChordType: "major",
};

export const usePianoRollStore = create(
  immer((set) => ({
    ...initialState,

    setMode:           (mode)      => set({ mode }),
    setSelectedNoteId: (id)        => set({ selectedNoteId: id }),
    setIsMouseDown:    (value)     => set({ isMouseDown: value }),
    setWindowRange:    (range)     => set({ windowRange: range }),
    setSelectedChordType: (type)  => set({ selectedChordType: type }),

    // ── Resize ───────────────────────────────────────────────────────────────
    startResize: (note, mode, mouseX) =>
      set({
        isResizing:    true,
        resizeMode:    mode,
        initialMouseX: mouseX,
        initialNote:   { ...note },
        selectedNoteId: note.id,
      }),

    startResizeGrid: (noteId, direction) =>
      set({
        isResizing:      true,
        resizeDirection: direction,
        selectedNoteId:  noteId,
      }),

    endResize: () =>
      set({
        isResizing:      false,
        resizeMode:      null,
        resizeDirection: null,
        initialNote:     null,
        initialMouseX:   0,
      }),

    reset: () => set(initialState),
  }))
);