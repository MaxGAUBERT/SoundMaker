import React from 'react';

const CELL_HEIGHT = 20;

export const NoteLabels = ({ noteLabels, handlePlaySound, isBlackKey }) => {
  return (
    <div className="flex flex-col flex-shrink-0 mt-6">
      {noteLabels.map((label, i) => (
        <button
          key={i}
          className={`w-15 h-5 border-gray-600 flex items-center justify-end ${
            isBlackKey(i) ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'
          }`}
          onClick={() => handlePlaySound(label, i)}
          style={{ height: `${CELL_HEIGHT}px` }}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

function areEqual(prevProps, nextProps) {
  if (prevProps.noteLabels !== nextProps.noteLabels) return false;
  if (prevProps.handlePlaySound !== nextProps.handlePlaySound) return false;
  if (prevProps.isBlackKey !== nextProps.isBlackKey) return false;
  return true;
}
export default React.memo(NoteLabels, areEqual);


