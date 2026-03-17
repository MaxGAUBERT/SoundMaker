import React, { useCallback, useEffect, useMemo } from "react";
import { ImPencil } from "react-icons/im";
import { HiPaintBrush } from "react-icons/hi2";
import { RxWidth } from "react-icons/rx";
import { IoMusicalNotesSharp } from "react-icons/io5";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { GrClear } from "react-icons/gr";

export const CHORD_TYPES = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],
};


const ModeButton = React.memo(({ mode, currentMode, onClick, icon: Icon, title }) => {
  const isActive = mode === currentMode;
  const buttonClass = `px-4 py-2 rounded transition-colors ${
    isActive 
      ? 'bg-green-600 hover:bg-green-700' 
      : 'bg-gray-800 hover:bg-gray-700'
  }`;

  return (
    <button 
      onClick={onClick} 
      className={buttonClass}
      title={title}
      aria-label={title}
      aria-pressed={isActive}
    >
      <Icon size={20} />
    </button>
  );
});


const ChordSelector = React.memo(({ selectedChordType, onChordTypeChange, disabled }) => {
  const chordOptions = useMemo(() => 
    Object.keys(CHORD_TYPES).map((chordName) => (
      <option key={chordName} value={chordName}>
        {chordName}
      </option>
    )), []
  );

  return (
    <select
      value={selectedChordType}
      onChange={onChordTypeChange}
      className="p-2 ml-2 bg-gray-800 rounded transition-colors hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={disabled}
      aria-label="Chord type selector"
    >
      {chordOptions}
    </select>
  );
});

const ColsSlider = React.memo(({ cols, onColsChange }) => {
  return (
    <div className="flex items-center gap-2 ml-4">
      <label htmlFor="cols-slider" className="text-sm text-gray-300">
        Cols: {cols}
      </label>
      <input
        id="cols-slider"
        type="range"
        min={8}
        max={128}
        value={cols}
        step={4}
        onChange={onColsChange}
        className="w-20 accent-green-600"
        aria-label={`Grid columns: ${cols}`}
      />
    </div>
  );
});

export const TopBar = ({
  selectedInstrument,
  selectedPattern,
  mode,
  toggleMode,
  clearAll,
  selectedChordType,
  setSelectedChordType,
  width,
  setWidth
}) => {

  const handleDrawMode = useCallback(() => toggleMode('draw'), [toggleMode]);
  const handlePaintMode = useCallback(() => toggleMode('paint'), [toggleMode]);
  const handleResizeMode = useCallback(() => toggleMode('resize'), [toggleMode]);
  const handleChordsMode = useCallback(() => toggleMode('chords'), [toggleMode]);
  const deleteSelectedNotes = useCallback(() => toggleMode('delete'), [toggleMode]);
  
  const handleChordTypeChange = useCallback((e) => {
    setSelectedChordType(e.target.value);
  }, [setSelectedChordType]);

  const handleColsChange = useCallback((e) => {
    setWidth(Number(e.target.value));
  }, [setWidth]);

   // 🎹 Ajout des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return; 
      switch (e.key.toLowerCase()) {
        case "d": // Draw
          handleDrawMode();
          break;
        case "p": // Paint
          handlePaintMode();
          break;
        case "r": // Resize
          handleResizeMode();
          break;
        case "c": // Chords
          handleChordsMode();
          break;
        case "x": // Delete
          deleteSelectedNotes();
          break;
        case "a": // Clear all
          clearAll();
          break;
        case "escape": // Fermer
          onClose();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleDrawMode,
    handlePaintMode,
    handleResizeMode,
    handleChordsMode,
    deleteSelectedNotes,
    clearAll,
  ]);

  const modeButtons = useMemo(() => [
    {
      mode: 'draw',
      onClick: handleDrawMode,
      icon: ImPencil,
      title: 'Draw in piano roll (d)'
    },
    {
      mode: 'paint',
      onClick: handlePaintMode,
      icon: HiPaintBrush,
      title: 'Paint in piano roll (p)'
    },
    {
      mode: 'resize',
      onClick: handleResizeMode,
      icon: RxWidth,
      title: 'Resize notes (r)'
    },
    {
      mode: 'delete',
      onClick: deleteSelectedNotes,
      icon: GrClear,
      title: 'Delete selected notes (x)'
    },
    {
      mode: 'chords',
      onClick: handleChordsMode,
      icon: IoMusicalNotesSharp,
      title: 'Add notes from chords (c)'
    }
  ], [handleDrawMode, handlePaintMode, handleResizeMode, handleChordsMode, deleteSelectedNotes]);

  const isChordSelectorDisabled = mode !== "chords";

  return (
    <div className="flex gap-2 mb-2 items-center ml-10">
      {/* Instrument Label */}
      <div>
        {selectedInstrument} - {selectedPattern}
      </div>

      {/* Close Button */}
      <button 
        //onClick={onClose} 
        className="px-1 py-2 left-0 static bg-gray-800 hover:bg-gray-700 rounded ml-4 transition-colors"
        title="Close Piano Roll"
        aria-label="Close Piano Roll"
      >
        <IoClose size={15} />
      </button>
      {/* Mode Buttons */}
      {modeButtons.map(({ mode: buttonMode, onClick, icon, title }) => (
        <ModeButton
          key={buttonMode}
          mode={buttonMode}
          currentMode={mode}
          onClick={onClick}
          icon={icon}
          title={title}
        />
      ))}

      {/* Clear All Button */}
      <button 
        onClick={clearAll} 
        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
        title="Clear All Notes"
        aria-label="Clear All Notes"
      >
        <MdOutlineDeleteOutline size={20} />
      </button>

      {/* Chord Type Selector */}
      <ChordSelector
        selectedChordType={selectedChordType}
        onChordTypeChange={handleChordTypeChange}
        disabled={isChordSelectorDisabled}
      />

      {/* Columns Slider */}
      <ColsSlider
        cols={width}
        onColsChange={handleColsChange}
      />
    </div>
  );
};

TopBar.displayName = 'TopBar';
ModeButton.displayName = 'ModeButton';
ChordSelector.displayName = 'ChordSelector';
ColsSlider.displayName = 'ColsSlider';


function areEqual (prevProps, nextProps) {
  if (prevProps.selectedInstrument !== nextProps.selectedInstrument) return false;
  if (prevProps.mode !== nextProps.mode) return false;
  if (prevProps.toggleMode !== nextProps.toggleMode) return false;
  if (prevProps.clearAll !== nextProps.clearAll) return false;
  if (prevProps.selectedChordType !== nextProps.selectedChordType) return false;
  if (prevProps.setSelectedChordType !== nextProps.setSelectedChordType) return false;
  if (prevProps.onClose !== nextProps.onClose) return false;
  return true;
}
export default React.memo(TopBar, areEqual);


