export const ROWS = 48;
export const CELL_WIDTH = 20;
export const CELL_HEIGHT = 20;

export const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Convertit un index de ligne (row) en nom de note (ex: C4, D#5, etc.)
 * @param {number} row - index dans la grille piano roll (0 = note la plus haute)
 * @returns {string} nom de la note
 */
export function rowToNoteName(row) {
  const pitch = ROWS - 1 - row;
  const octave = Math.floor(pitch / 12) + 2;
  const noteIndex = pitch % 12;
  return `${noteNames[noteIndex]}${octave}`;
}