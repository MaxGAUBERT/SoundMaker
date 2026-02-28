import { useCallback, useMemo, useRef, useEffect } from "react";
import { useChannelStore } from "../../stores/useChannelStore";

export function usePianoRollNotes(currentChannelID, currentPatternID) {

  const patterns = useChannelStore(s => s.patterns);
  const _mutate  = useChannelStore(s => s._mutate);

  // ── Refs toujours à jour sur les IDs courants ──────────────────────────────
  // Permet à setNotes (stable) de lire les bons IDs sans les capturer
  // dans sa closure (ce qui causerait le retour au canal 0).
  const channelIDRef = useRef(currentChannelID);
  const patternIDRef = useRef(currentPatternID);

  useEffect(() => {
    channelIDRef.current = currentChannelID;
  }, [currentChannelID]);

  useEffect(() => {
    patternIDRef.current = currentPatternID;
  }, [currentPatternID]);

  // ─────────────────────────────────────────────
  // Lecture notes (réactive, pour le rendu)
  // ─────────────────────────────────────────────
  const notes = useMemo(() => {
    const pattern = patterns.find(p => p.id === currentPatternID);
    const channel = pattern?.ch.find(c => c.id === currentChannelID);
    return channel?.pianoData ?? [];
  }, [patterns, currentPatternID, currentChannelID]);

  // ─────────────────────────────────────────────
  // Écriture notes — stable grâce aux refs
  // Les IDs sont toujours frais via channelIDRef/patternIDRef.
  // patterns est lu via getState() pour éviter la stale closure.
  // ─────────────────────────────────────────────
  const setNotes = useCallback((notesOrUpdater) => {
    // IDs toujours frais via les refs
    const channelID = channelIDRef.current;
    const patternID = patternIDRef.current;

    // patterns lu au moment de l'appel (jamais périmé)
    const freshPatterns = useChannelStore.getState().patterns;

    const freshPattern = freshPatterns.find(p => p.id === patternID);
    const freshChannel = freshPattern?.ch.find(c => c.id === channelID);
    const currentNotes = freshChannel?.pianoData ?? [];

    const next =
      typeof notesOrUpdater === "function"
        ? notesOrUpdater([...currentNotes])
        : notesOrUpdater;

    _mutate({
      patterns: freshPatterns.map(p =>
        p.id !== patternID
          ? p
          : {
              ...p,
              ch: p.ch.map(ch =>
                ch.id !== channelID
                  ? ch
                  : { ...ch, pianoData: next }
              )
            }
      )
    });
  }, [_mutate]); // stable — tout est lu via refs ou getState()

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