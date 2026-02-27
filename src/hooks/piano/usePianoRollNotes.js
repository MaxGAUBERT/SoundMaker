import { useCallback } from "react";
import { useChannelStore } from "../../stores/useChannelStore";
import { useHistoryContext } from "../../Contexts/system/HistoryProvider";

export function usePianoRollNotes() {

  const {
    currentPatternID,
    currentChannelID,
    patterns,
    _mutate
  } = useChannelStore();

  const { dispatchAction } = useHistoryContext();


  // ── Lecture des notes du channel courant ──────────────────────────────────
  const getNotes = useCallback(() => {
    const pattern = patterns.find(p => p.id === currentPatternID);
    const channel = pattern?.ch.find(c => c.id === currentChannelID);
    return channel?.pianoData ?? [];
  }, [patterns, currentPatternID, currentChannelID]);
  /*
  const setNotes = useCallback((notesOrUpdater) => {
    const currentNotes = getNotes();
    const next = typeof notesOrUpdater === "function"
      ? notesOrUpdater(currentNotes)
      : notesOrUpdater;

    _mutate({
      patterns: patterns.map(p =>
        p.id !== currentPatternID ? p : {
          ...p,
          ch: p.ch.map(ch =>
            ch.id !== currentChannelID ? ch : {
              ...ch,
              pianoData: next,
            }
          ),
        }
      ),
    });
  }, [patterns, currentPatternID, currentChannelID, getNotes, _mutate]);
  */

  const setNotes = useCallback((notesOrUpdater) => {

  const state = useChannelStore.getState();

  const pattern = state.patterns.find(p => p.id === state.currentPatternID);
  if (!pattern) return;

  const channel = pattern.ch.find(c => c.id === state.currentChannelID);
  if (!channel) return;

  const currentNotes = channel.pianoData ?? [];

  const next =
    typeof notesOrUpdater === "function"
      ? notesOrUpdater([...currentNotes])   // ← clone sécurisée
      : notesOrUpdater;

  state._mutate({
    patterns: state.patterns.map(p =>
      p.id !== state.currentPatternID ? p : {
        ...p,
        ch: p.ch.map(ch =>
          ch.id !== state.currentChannelID ? ch : {
            ...ch,
            pianoData: next
          }
        )
      }
    )
  });

  console.log(next);

  }, [patterns]);

  // ── Actions dérivées ──────────────────────────────────────────────────────

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
    getNotes,
    setNotes,
    addNote,
    removeNote,
    updateNote,
    clearNotes,
    filterNotesInRange,
  };
}