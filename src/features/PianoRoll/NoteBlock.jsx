import React from 'react';

const CELL_WIDTH = 20;
const CELL_HEIGHT = 20;

export const NoteBlock = ({
  note,
  selected,
  noteLabel,
  onMouseDown,
  onResizeLeft,
  onResizeRight
}) => {
  return (
    <div
      className={`absolute rounded border-2 cursor-grab ${
        selected ? 'bg-red-800 border-red-800 shadow-md' : 'bg-blue-600 border-blue-400 hover:bg-blue-500'
      }`}
      style={{
        left: `${note.start * CELL_WIDTH}px`,
        top: `${note.row * CELL_HEIGHT}px`,
        width: `${note.length * CELL_WIDTH}px`,
        height: `${note.height * CELL_HEIGHT}px`
      }}
      onMouseDown={(e) => onMouseDown(e, note)}
    >
      {/* Resize zones */}
      <div
        className="absolute left-0 top-0 w-2 h-full cursor-ew-resize bg-blue-300 bg-opacity-50 hover:bg-opacity-80"
        onMouseDown={(e) => onResizeLeft(e, note)}
      />
      <div
        className="absolute right-0 top-0 w-2 h-full cursor-ew-resize bg-blue-300 bg-opacity-50 hover:bg-opacity-80"
        onMouseDown={(e) => onResizeRight(e, note)}
      />

      {/* Label */}
      <div className="absolute inset-2 flex items-center justify-center text-xs font-semibold text-white">
        {noteLabel}
      </div>
    </div>
  );
};

function areEqual(prevProps, nextProps) {
  if (prevProps.noteLabel !== nextProps.noteLabel) return false;

  // Compare les propriétés de note
  const prevNote = prevProps.note;
  const nextNote = nextProps.note;
  if (
    prevNote.start !== nextNote.start ||
    prevNote.row !== nextNote.row ||
    prevNote.length !== nextNote.length ||
    prevNote.height !== nextNote.height
  ) {
    return false;
  }

  // Compare les références des handlers (supposés stables)
  if (prevProps.onMouseDown !== nextProps.onMouseDown) return false;
  if (prevProps.onResizeLeft !== nextProps.onResizeLeft) return false;
  if (prevProps.onResizeRight !== nextProps.onResizeRight) return false;

  return true;
}

export default React.memo(NoteBlock, areEqual);
