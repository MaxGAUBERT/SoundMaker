import { useCallback, useMemo, useRef } from "react";
import { useChannelStore } from "../../stores/useChannelStore";

export function usePianoRollNotes(currentPatternID,currentChannelID) {
  const patterns = useChannelStore(s => s.patterns);
  //const currentPatternID = useChannelStore(s => s.currentPatternID);
  //const currentChannelID = useChannelStore(s => s.currentChannelID);
  const _mutate  = useChannelStore(s => s._mutate);

  const notes = useMemo(() => {
    const pattern = patterns.find(p => p.id === currentPatternID);
    const channel = pattern?.ch.find(c => c.id === currentChannelID);
    return channel?.pianoData ?? [];
  }, [patterns, currentPatternID, currentChannelID]);

  const setNotes = useCallback((notesOrUpdater) => {
  const { patterns: freshPatterns, currentPatternID, currentChannelID } = useChannelStore.getState();

  const freshPattern = freshPatterns.find(p => p.id === currentPatternID);
  const freshChannel = freshPattern?.ch.find(c => c.id === currentChannelID);
  const currentNotes = freshChannel?.pianoData ?? [];

  const next =
    typeof notesOrUpdater === "function"
      ? notesOrUpdater([...currentNotes])
      : notesOrUpdater;

  _mutate({
    currentPatternID,
    currentChannelID,  
    patterns: freshPatterns.map(p =>
      p.id !== currentPatternID
        ? p
        : {
            ...p,
            ch: p.ch.map(ch =>
              ch.id !== currentChannelID
                ? ch
                : { ...ch, pianoData: next }
            )
          }
    )
  });
}, [_mutate]);


  // ─────────────────────────────────────────────
  // Actions dérivées
  // ─────────────────────────────────────────────

  const addNote = useCallback((note) => {
    setNotes(prev => [...prev, note]);
  }, [setNotes]);

  const removeNote = useCallback((noteId) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
  }, [setNotes]);

  const updateNote = useCallback((noteId, patch) => {
    setNotes(prev =>
      prev.map(n => n.id === noteId ? { ...n, ...patch } : n)
    );
  }, [setNotes]);

  const clearNotes = useCallback(() => {
    setNotes([]);
    console.log("notes cleared: ", setNotes)
  }, [setNotes]);

  const filterNotesInRange = useCallback((maxCols) => {
    setNotes(prev => prev.filter(n => n.start < maxCols));
  }, [setNotes]);

  return {
    notes,
    setNotes,
    addNote,
    removeNote,
    updateNote,
    clearNotes,
    filterNotesInRange,
  };
}