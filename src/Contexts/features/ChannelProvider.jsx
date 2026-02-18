// Contexts/ChannelProvider.jsx
import { createContext, useContext, useState } from 'react';
import { useUndo } from '../../hooks/useUndo';
import { DRUM_SAMPLES, DEFAULT_CHANNELS} from '../../hooks/useSamples';

const ChannelContext = createContext();

export function ChannelProvider({ children }) {
  const [width, setWidth] = useState(16);

  function createGrid() {
    return Array(width).fill(false);
  }

  function cloneChannels(channels) {
    return channels.map(ch => ({
      ...ch,
      grid: [...ch.grid]
    }));
  }

  function createChannels() {
    return [
      { id: 0, name: "Kick", grid: createGrid(), sampleUrl: DRUM_SAMPLES.kick },
      { id: 1, name: "Snare", grid: createGrid(), sampleUrl: DRUM_SAMPLES.snare  },
      { id: 2, name: "Hihat", grid: createGrid(), sampleUrl: DRUM_SAMPLES.hihat },
      { id: 3, name: "Clap", grid: createGrid(), sampleUrl: DRUM_SAMPLES.clap },
    ];
  }

  function createChannels() {
    return DEFAULT_CHANNELS.map(ch => ({
        ...ch,
        grid: createGrid(),
    }));
}

  function loadSample(e, channelId){
    const file = e.target.files[0];

    if (!file) return;

    const url = URL.createObjectURL(file);

    if (!url) return;

    setPatterns(draft => {
      draft.forEach(pattern => {
        const channel = pattern.ch.find(p => p.id === channelId);
        if (channel){
          if (channel.sampleUrl) {
            URL.revokeObjectURL(channel.sampleUrl);
          }

          channel.sampleUrl = url;
        }
    })
    });

    console.log('Sample loaded:', file.name);
  }

  function setState(data) {
  if (!data) return;

  if (typeof data.width === "number") {
    updateWidth(data.width);
  }

  if (data.patterns) {
    const restored = data.patterns.map(pattern => ({
      id: pattern.id,
      name: pattern.name,
      steps: pattern.channels?.[0]?.grid?.length ?? width,
      ch: pattern.channels.map(ch => ({
        id: ch.id,
        name: ch.name,
        grid: [...ch.grid],
        sampleUrl: ch.sampleUrl ?? null
      }))
    }));
    setPatterns(restored);
  }

  if (typeof data.currentPatternID !== "undefined") {
    setCurrentPatternID(data.currentPatternID);
  }
}

  // État initial
  const initialPatterns = [
    {
      id: 1,
      name: "P1",
      ch: cloneChannels(createChannels()),
      steps: width
    },
    {
      id: 2,
      name: "P2",
      ch: cloneChannels(createChannels()),
      steps: width
    },
  ];

  const {
    state: patterns,
    setState: setPatterns,
    canUndo,
    canRedo,
    undo,
    redo
  } = useUndo(initialPatterns, 100);

  const [currentPatternID, setCurrentPatternID] = useState(patterns[0].id);
  const currentPattern = patterns.find(p => p.id === currentPatternID);

  function toggleCell(patternId, channelId, cellIndex) {
    setPatterns(draft => {
      const pattern = draft.find(p => p.id === patternId);
      if (!pattern) return;

      const channel = pattern.ch.find(ch => ch.id === channelId);
      if (!channel) return;

      channel.grid[cellIndex] = !channel.grid[cellIndex];
    });
  }

  function clearCell(patternId, channelId, cellIndex) {
    setPatterns(draft => {
      const pattern = draft.find(p => p.id === patternId);
      if (!pattern) return;

      const channel = pattern.ch.find(ch => ch.id === channelId);
      if (!channel) return;

      channel.grid[cellIndex] = false;
    });
  }

  function handleAddChannel() {
    setPatterns(draft => {
      const newChannelId = draft[0].ch.length;

      draft.forEach(pattern => {
        pattern.ch.push({
          id: newChannelId,
          name: "Channel " + newChannelId,
          grid: createGrid(),
          sampleUrl: null
        });
      });
    });
  }

  function handleAddPattern() {
    setPatterns(draft => {
      const newPatternID = draft.length + 1;

      draft.push({
        id: newPatternID,
        name: "P" + newPatternID,
        ch: cloneChannels(draft[0].ch)
      });
    });
  }

  function renameChannel(channelId, newName) {
    setPatterns(draft => {
      draft.forEach(pattern => {
        const channel = pattern.ch.find(ch => ch.id === channelId);
        if (channel) {
          channel.name = newName;
        }
      });
    });
  }

  function deletePattern(patternId) {
    setPatterns(draft => {
      const index = draft.findIndex(p => p.id === patternId);
      if (index !== -1) {
        draft.splice(index, 1);
      }
    });
  }

  function deleteChannel(channelId) {
    setPatterns(draft => {
      const pattern = draft.find(p => p.id === currentPatternID);
      if (!pattern) return;
      const idx = pattern.ch.findIndex(ch => ch.id === channelId);
      if (idx === -1 || pattern.ch.length <= 2) return;
      pattern.ch.splice(idx, 1);
    })
  }

  function getChannelStates() {
    return {
      patterns: patterns.map(pattern => ({
        id: pattern.id,
        name: pattern.name,
        channels: pattern.ch.map(ch => ({
          id: ch.id,
          name: ch.name,
          grid: [...ch.grid], 
          sampleUrl: ch.sampleUrl
        }))
      })),
      currentPatternID,
      width
    };
  }

  function updateWidth(newWidth) {
    setWidth(newWidth);
    
    setPatterns(draft => {
      draft.forEach(pattern => {
        pattern.ch.forEach(channel => {
          const oldGrid = channel.grid;
          const newGrid = Array(newWidth).fill(false);

          // Copier les valeurs existantes
          for (let i = 0; i < Math.min(oldGrid.length, newWidth); i++) {
            newGrid[i] = oldGrid[i];
          }

          channel.grid = newGrid;
        });
      });
    });
  }

  function moveChannel(fromIdx, toIdx) {
    setPatterns(draft => {
      draft.forEach(pattern => {
        const ch = pattern.ch.splice(fromIdx, 1)[0];
        pattern.ch.splice(toIdx, 0, ch);
      });
    });
  }

  function deleteChannel(channelId) {
    setPatterns(draft => {
      draft.forEach(pattern => {
        const index = pattern.ch.findIndex(ch => ch.id === channelId);
        if (index !== -1) {
          pattern.ch.splice(index, 1);
        }
      });
    });
  }


  function reset() {
    updateWidth(16);
    setPatterns(initialPatterns);
    setCurrentPatternID(initialPatterns[0].id);
  }
  
  const value = {
    width,
    setWidth: updateWidth,
    patterns,
    setPatterns,
    currentPatternID,
    setCurrentPatternID,
    currentPattern,
    toggleCell,
    clearCell,
    reset,
    handleAddChannel,
    handleAddPattern,
    loadSample,
    renameChannel,
    deletePattern,
    deleteChannel,
    cloneChannels,
    createChannels,
    moveChannel,
    deleteChannel,
    getChannelStates,
    createGrid,
    undo, redo,
    getChannelStates,
    setState,
    canUndo, canRedo
  };

  return (
    <ChannelContext.Provider value={value}>
      {children}
    </ChannelContext.Provider>
  );
}

export function useChannels() {
  const context = useContext(ChannelContext);
  if (!context) {
    throw new Error('useChannels must be used within a ChannelProvider');
  }
  return context;
}