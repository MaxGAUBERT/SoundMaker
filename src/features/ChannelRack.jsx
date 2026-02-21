import { useState, useRef, useCallback, memo } from "react";
import { useChannelStore } from "../stores/useChannelStore";
import { useTransport } from "../Contexts/features/TransportContext";
import { useGlobalColorContext } from "../Contexts/UI/GlobalColorContext";
import { IoAddCircle, IoAddOutline } from "react-icons/io5";
import { MdDelete } from "react-icons/md";
import { BsBarChartSteps } from "react-icons/bs";

const Cell = memo(({ value, index, currentStep, isPlaying, onToggle, onClear }) => {
  return (
    <div
      onClick={onToggle}
      onContextMenu={(e) => { e.preventDefault(); onClear(); }}
      className={`
        w-5 h-8 cursor-pointer transition-all
        ${index === currentStep && isPlaying  ? 'ring-2 ring-green-500' : ''}
        ${index === currentStep && !isPlaying ? 'ring-2 ring-red-500'   : ''}
        ${index % 4 === 0 ? 'ml-1' : ''}
        ${value
          ? "bg-green-500 hover:bg-green-400 shadow-md shadow-green-500/25"
          : "bg-gray-700 hover:bg-gray-600 border border-gray-600"
        }
      `}
    />
  );
});


const ChannelRow = memo(({ ch, index, currentPatternID, currentStep, isPlaying,
  colorsComponent, canDelete, isDragging, dragOverIndex, dragIndexRef,
  toggleCell, clearCell, renameChannel, loadSample, deleteChannel,
  moveChannel, setDragOverIndex, setIsDragging
}) => {
  const [renamingChannelId, setRenamingChannelId] = useState(null);
  const [newName, setNewName] = useState("");

  function startRename() { setRenamingChannelId(ch.id); setNewName(ch.name); }
  function confirmRename() {
    if (newName.trim()) renameChannel(ch.id, newName.trim());
    setRenamingChannelId(null); setNewName("");
  }
  function cancelRename() { setRenamingChannelId(null); setNewName(""); }

  function handleDragStart(e) {
    dragIndexRef.current = index;
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";  
    e.dataTransfer.setData("text/plain", index);
  }

  function handleDrop(e) {
    e.preventDefault();
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === index) return;  
    moveChannel(fromIndex, index);
    dragIndexRef.current = null;
    setDragOverIndex(null);
    setIsDragging(false);
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
      onDragEnter={() => setDragOverIndex(index)}
      onDragLeave={() => setDragOverIndex(null)}
      onDragEnd={() => { dragIndexRef.current = null; setDragOverIndex(null); setIsDragging(false); }}
      onDrop={handleDrop}
      className={`
        flex gap-1 mb-2 rounded transition-all
        ${isDragging && dragOverIndex === index ? 'border-2 border-blue-400 bg-blue-900/30' : 'border-2 border-transparent'}
        ${dragIndexRef.current === index ? 'opacity-50' : 'opacity-100'}
      `}
    >
      {/* Label / rename */}
      {renamingChannelId === ch.id ? (
        <input
          type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
          onBlur={confirmRename}
          onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') cancelRename(); }}
          autoFocus
          style={{ color: colorsComponent.Text, backgroundColor: colorsComponent.background }}
          className="w-24 text-sm sticky left-0 z-10 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <span
          onDoubleClick={startRename}
          style={{ color: colorsComponent.Text, backgroundColor: colorsComponent.background }}
          className="w-24 text-sm sticky left-0 z-10 flex items-center px-2 cursor-pointer hover:bg-gray-700 rounded transition-colors"
          title="Double-click to rename"
        >
          {ch.name}
        </span>
      )}

      <input
        type="file" accept="audio/*" title="Load Sample"
        onChange={(e) => loadSample(e, ch.id)}
        style={{ color: colorsComponent.Text }}
        className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-1 file:text-xs file:bg-gray-700 file:text-white hover:file:bg-gray-600"
      />

      <button
        disabled={!canDelete}
        title={canDelete ? "Delete channel" : "Cannot delete (minimum 2 channels required)"}
        onClick={() => deleteChannel(ch.id)}
      >
        <MdDelete style={{ color: colorsComponent.Text }} className="hover:text-red-500 transition-colors" />
      </button>

      {/* Cellules */}
      <div className="flex gap-1">
        {ch.grid.map((cell, i) => (
          <Cell
            key={i}
            value={cell}
            index={i}
            currentStep={currentStep}
            isPlaying={isPlaying}
            onToggle={() => toggleCell(currentPatternID, ch.id, i)}
            onClear={() => clearCell(currentPatternID, ch.id, i)}
          />
        ))}
      </div>
    </div>
  );
});

// ── Composant principal ───────────────────────────────────────────────────────
export default function ChannelRack() {

  const width            = useChannelStore(s => s.width);
  const patterns         = useChannelStore(s => s.patterns);
  const currentPatternID = useChannelStore(s => s.currentPatternID);
  const currentPattern   = useChannelStore(s => s.getCurrentPattern());
  const setWidth             = useChannelStore(s => s.setWidth);
  const setCurrentPatternID  = useChannelStore(s => s.setCurrentPatternID);
  const toggleCell           = useChannelStore(s => s.toggleCell);
  const clearCell            = useChannelStore(s => s.clearCell);
  const renameChannel        = useChannelStore(s => s.renameChannel);
  const handleAddChannel     = useChannelStore(s => s.handleAddChannel);
  const handleAddPattern     = useChannelStore(s => s.handleAddPattern);
  const loadSample           = useChannelStore(s => s.loadSample);
  const resetSamples         = useChannelStore(s => s.resetSamples);
  const moveChannel          = useChannelStore(s => s.moveChannel);
  const deleteChannel        = useChannelStore(s => s.deleteChannel);

  const { colorsComponent } = useGlobalColorContext();
  const { isPlaying, currentStep } = useTransport();

  const dragIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isDragging, setIsDragging]       = useState(false);

  const canDelete = currentPattern?.ch.length > 1;

  return (
    <div className="flex flex-col h-150">
      {/* Header fixe */}
      <div style={{ backgroundColor: colorsComponent.background, borderColor: colorsComponent.Border }} className="p-3 border-b flex-shrink-0">
        <div className="flex items-center gap-4 mb-3">
          <h2 className="text-white font-semibold text-lg">Channel Rack</h2>

          <select
            value={currentPatternID}
            onChange={e => setCurrentPatternID(Number(e.target.value))}
            style={{ backgroundColor: colorsComponent.background, color: colorsComponent.TextIO }}
            className="px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {patterns.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <button onClick={handleAddPattern} className="bg-gray-500 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors">
            <IoAddOutline title="Add patterns" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <input type="range" min={16} max={128} value={width} onChange={e => setWidth(Number(e.target.value))} className="flex-1" />
          <span style={{ color: colorsComponent.Text }} className="text-sm font-mono w-12">
            <BsBarChartSteps title="step length" />{width}
          </span>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-auto p-4">
        {currentPattern && (
          <div>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {currentPattern.ch.map((ch, index) => (
                  <ChannelRow
                    key={ch.id}
                    ch={ch}
                    index={index}
                    currentPatternID={currentPatternID}
                    currentStep={currentStep}
                    isPlaying={isPlaying}
                    colorsComponent={colorsComponent}
                    canDelete={canDelete}
                    isDragging={isDragging}
                    dragOverIndex={dragOverIndex}
                    dragIndexRef={dragIndexRef}
                    toggleCell={toggleCell}
                    clearCell={clearCell}
                    renameChannel={renameChannel}
                    loadSample={loadSample}
                    deleteChannel={deleteChannel}
                    moveChannel={moveChannel}
                    setDragOverIndex={setDragOverIndex}
                    setIsDragging={setIsDragging}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleAddChannel}
              style={{ color: colorsComponent.Text, backgroundColor: colorsComponent.Background }}
              className="mt-4 hover:bg-gray-700 px-4 py-2 rounded text-sm transition-colors w-13.5"
            >
              <IoAddCircle title="Add channels" />
            </button>

            <button
              onClick={resetSamples}
              disabled={currentPattern.ch.every(ch => ch.sampleUrl === null)}
              style={{ color: colorsComponent.Text, backgroundColor: colorsComponent.Background }}
              className="mt-4 ml-2 hover:bg-gray-700 px-4 py-2 rounded text-sm"
            >
              Reset samples
            </button>
          </div>
        )}
      </div>
    </div>
  );
}