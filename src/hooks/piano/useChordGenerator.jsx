// hooks/useChordGenerator.js
import { useCallback } from 'react';
import { CHORD_TYPES } from '../../features/PianoRoll/TopBar';

export const useChordGenerator = ({ ROWS, selectedChordType, noteLabelsRef, handlePlaySound }) => {
  const generateChordNotes = useCallback((row, col) => {
    const chordIntervals = CHORD_TYPES[selectedChordType];

    return chordIntervals
      .map(interval => {
        const chordRow = row - interval;
        if (chordRow < 0 || chordRow >= ROWS) return null;
        return {
          id: crypto.randomUUID(),
          row: chordRow,
          start: col,
          length: 2,
          height: 1,
          pitch: ROWS - 1 - chordRow
        };
      })
      .filter(Boolean);
  }, [selectedChordType, ROWS]);

  const playChord = useCallback((row) => {
    const chordIntervals = CHORD_TYPES[selectedChordType];
    chordIntervals.forEach(interval => {
      const r = row - interval;
      if (r >= 0 && r < ROWS) {
        handlePlaySound(null, r);
      }
    });
  }, [selectedChordType, ROWS, handlePlaySound]);

  return { generateChordNotes, playChord };
};
