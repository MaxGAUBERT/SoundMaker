import { useCallback } from "react";
import { useChannelStore } from "../../stores/useChannelStore";
import { useHistoryContext } from "../../Contexts/system/HistoryProvider";

export function usePianoRollNotes() {

  const {
    patterns,
    currentPatternID,
    currentChannelID,
    setPatterns
  } = useChannelStore();

  const { dispatchAction } = useHistoryContext();

  // ─────────────────────────────────────────────
  const setNotes = useCallback((updater) => {

    const patternIndex = patterns.findIndex(p => p.id === currentPatternID);
    if (patternIndex === -1) return;

    const channelIndex = patterns[patternIndex].ch.findIndex(
      c => c.id === currentChannelID
    );
    if (channelIndex === -1) return;

    const prevNotes =
      patterns[patternIndex].ch[channelIndex].pianoData ?? [];

    const nextNotes =
      typeof updater === "function" ? updater(prevNotes) : updater;

    if (prevNotes === nextNotes) return;

    const newPatterns = [...patterns];

    newPatterns[patternIndex] = {
      ...newPatterns[patternIndex],
      ch: [...newPatterns[patternIndex].ch]
    };

    newPatterns[patternIndex].ch[channelIndex] = {
      ...newPatterns[patternIndex].ch[channelIndex],
      pianoData: nextNotes
    };

    setPatterns(newPatterns);

    dispatchAction({
      type: "setNotes",
      payload: { currentPatternID, currentChannelID },
      apply: () => setPatterns(newPatterns),
      revert: () => {
        const reverted = [...patterns];
        reverted[patternIndex].ch[channelIndex] = {
          ...reverted[patternIndex].ch[channelIndex],
          pianoData: prevNotes
        };
        setPatterns(reverted);
      }
    });

  }, [patterns, currentPatternID, currentChannelID, setPatterns, dispatchAction]);

  // ─────────────────────────────────────────────

  const addNote = useCallback(note => {
    setNotes(prev => [...prev, note]);
  }, [setNotes]);

  const removeNote = useCallback(noteId => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
  }, [setNotes]);

  const updateNote = useCallback((noteId, patch) => {
    setNotes(prev =>
      prev.map(n => n.id === noteId ? { ...n, ...patch } : n)
    );
  }, [setNotes]);

  const clearNotes = useCallback(() => {
    setNotes([]);
  }, [setNotes]);

  const filterNotesInRange = useCallback((maxCols) => {
    setNotes(prev => prev.filter(n => n.start < maxCols));
  }, [setNotes]);

  return {
    addNote,
    setNotes,
    removeNote,
    updateNote,
    clearNotes,
    filterNotesInRange
  };
}