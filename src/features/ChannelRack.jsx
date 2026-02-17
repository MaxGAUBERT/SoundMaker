import { useState, useRef } from "react";
import { useChannels } from "../Contexts/features/ChannelProvider";
import { useTransport } from "../Contexts/features/TransportContext";
import { useGlobalColorContext } from "../Contexts/UI/GlobalColorContext";
import { IoAddCircle, IoAddOutline } from "react-icons/io5";
import { MdDelete } from "react-icons/md";
import { BsBarChartSteps } from "react-icons/bs";

export default function ChannelRack() {
  const {width,
    setWidth,
    patterns,
    currentPatternID,
    setCurrentPatternID,
    currentPattern,
    toggleCell,
    renameChannel,
    handleAddChannel,
    handleAddPattern,
    loadSample, moveChannel, deleteChannel,
    clearCell} = useChannels();

    const {colorsComponent} = useGlobalColorContext();

    const {isPlaying, currentStep} = useTransport();

    const [renamingChannelId, setRenamingChannelId] = useState(null);
    const [newName, setNewName] = useState("");

    const dragIndexRef = useRef(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

  function startRename(channelId, currentName) {
    setRenamingChannelId(channelId);
    setNewName(currentName);
  }

  function confirmRename(channelId) {
    if (newName.trim()) {
      renameChannel(channelId, newName.trim());
    }
    setRenamingChannelId(null);
    setNewName("");
  }

  function cancelRename() {
    setRenamingChannelId(null);
    setNewName("");
  }

  function handleDragStart(e, index) {
    dragIndexRef.current = index;
    setIsDragging(true);

    e.datatransfert.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index);
  }

  function handleDragEnter(e, index) {
      e.preventDefault();

      // ✅ Ne rien faire si on survole le channel source
      if (dragIndexRef.current === index) return;

      setDragOverIndex(index);
    }

  function handleDragOver(e){
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e, toIndex){
    e.preventDefault();

    const fromIndex = dragIndexRef.current;

    if (fromIndex === null || fromIndex === toIndex) return;

    moveChannel(fromIndex, toIndex);

    dragIndexRef.current = null;
    setDragOverIndex(null);
    setIsDragging(false);
  }

  function handleDragEnd() {
      // ✅ Nettoyer si drop annulé
      dragIndexRef.current = null;
      setDragOverIndex(null);
      setIsDragging(false);
  }

  const canDelete = currentPattern?.ch.length > 1;

  return (
    <div className="flex flex-col h-150">
      {/* Header fixe */}
      <div style={{backgroundColor: colorsComponent.background, borderColor: colorsComponent.Border}} className="p-3 border-b flex-shrink-0">
        <div className="flex items-center gap-4 mb-3">
          <h2 className="text-white font-semibold text-lg">Channel Rack</h2>
          
          <select
            value={currentPatternID}
            onChange={e => setCurrentPatternID(Number(e.target.value))}
            style={{backgroundColor: colorsComponent.background, color: colorsComponent.TextIO}}
            className="px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {patterns.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button 
            onClick={handleAddPattern}
            className="bg-gray-500 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            <IoAddOutline title="Add patterns"/>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span style={{color: colorsComponent.Text}} className="text-xs"></span>
          <input 
            type="range" 
            min={16} 
            max={128} 
            value={width} 
            onChange={e =>
              setWidth(Number(e.target.value))
            }
            className="flex-1"
          />
          <span style={{color: colorsComponent.Text}} className="text-sm font-mono w-12"><BsBarChartSteps title="step length"/>{width}</span>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-auto p-4">
        {currentPattern && (
          <div>
            {/* Grille de patterns */}
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {currentPattern.ch.map((ch, index) => (
                  <div key={ch.id} draggable onDragStart={(e) => handleDragStart(e, index)} 
                  onDragOver={(e) => handleDragOver(e, ch.id)} 
                  onDragLeave={() => setDragOverIndex(null)} 
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, ch.id)} className={`
                    flex gap-1 mb-2 rounded transition-all
                    ${isDragging && dragOverIndex === index
                        ? 'border-2 border-blue-400 bg-blue-900/30' // ✅ Highlight drop target
                        : 'border-2 border-transparent'
                    }
                    ${dragIndexRef.current === index
                        ? 'opacity-50' // ✅ Channel source semi-transparent
                        : 'opacity-100'
                    }
                `} 
                  >
                      {/* Label du canal avec rename */}
                    {renamingChannelId === ch.id ? (
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={() => confirmRename(ch.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {confirmRename(ch.id); setRenamingChannelId(false)}
                          if (e.key === 'Escape') cancelRename();
                        }}
                        autoFocus
                        style={{color: colorsComponent.Text, backgroundColor: colorsComponent.background}}
                        className="w-24 text-sm sticky left-0 z-10 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span
                        onDoubleClick={() => startRename(ch.id, ch.name)}
                        onDragEnter={() => setDragOverIndex(index)}
                        style={{color: colorsComponent.Text, backgroundColor: colorsComponent.background}}
                        className="w-24 text-sm sticky left-0 z-10 flex items-center px-2 cursor-pointer hover:bg-gray-700 rounded transition-colors"
                        title="Double-click to rename"
                      >
                        {ch.name}
                      </span>
                    )}

                    <input 
                      type="file" 
                      accept="audio/*" 
                      title="Load Sample"
                      onChange={(e) => loadSample(e, ch.id)} 
                      className="text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-1 file:text-xs file:bg-gray-700 file:text-white hover:file:bg-gray-600"
                  />

                  <button disabled={!canDelete} title={canDelete ? "Delete channel" : "Cannot delete channel (minimum 2 channels required)"}
                    onClick={() => deleteChannel(ch.id)}>
                    <MdDelete title="Delete channel" className="text-gray-400 hover:text-red-500 transition-colors"/>
                  </button>

                    <div className="flex gap-1">
                      {ch.grid.map((cell, i) => (
                        <div
                          key={i}
                          onClick={() => toggleCell(currentPatternID, ch.id, i)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            clearCell(currentPatternID, ch.id, i);
                          }}
                          className={`
                            w-5 h-8 cursor-pointer transition-all
                            ${i === currentStep && isPlaying? 'ring-2 ring-green-500' : ''}
                            ${i === currentStep && !isPlaying ? 'ring-2 ring-red-500' : ''}
                            ${i % 4 === 0 ? 'ml-1' : ''}
                            ${cell
                              ? "bg-green-500 hover:bg-green-400 shadow-md shadow-green-500/25"
                              : "bg-gray-700 hover:bg-gray-600 border border-gray-600"
                            }
                          `}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bouton ajouter channel */}
            <button 
              onClick={handleAddChannel}
              style={{color: colorsComponent.Text, backgroundColor: colorsComponent.Background}}
              className="mt-4 hover:bg-gray-700 px-4 py-2 rounded text-sm transition-colors w-13.5"
            >
              <IoAddCircle title="Add channels"/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}