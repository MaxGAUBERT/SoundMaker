import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const initialState = {
  mode:            "draw", 
  selectedNoteId:  null,
  isMouseDown:     false,
  // Resize
  isResizing:      false,
  resizeMode:      null,     
  resizeDirection: null,    
  initialMouseX:   0,
  initialNote:     null,
  // Zoom
  windowRange:     [0, 150],
  // Chord
  selectedChordType: "major",
};

export const usePianoRollStore = create(
  immer((set) => ({
    ...initialState,

    setMode:              (mode)  => set({ mode }),
    setSelectedNoteId:    (id)    => set({ selectedNoteId: id }),
    setIsMouseDown:       (value) => set({ isMouseDown: value }),
    setWindowRange:       (range) => set(state => {

      state.windowRange = typeof range === "function"
        ? range(state.windowRange)
        : range;
    }),
    setSelectedChordType: (type)  => set({ selectedChordType: type }),

    // ── Resize ──────────────────────────────────────────────────────────────
    startResize: (note, mode, mouseX) =>
      set({
        isResizing:     true,
        resizeMode:     mode,
        initialMouseX:  mouseX,
        initialNote:    { ...note },
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