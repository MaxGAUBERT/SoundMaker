import { useState, useRef, useCallback } from 'react';
import ChannelRack from './features/ChannelRack';
import Playlist from './features/Playlist';
import StripMenu from './UI/StripMenu';
import TransportBar from './UI/TransportBar';
import AppProviders from './Contexts/features/AppProviders';
import PianoRoll from './features/PianoRoll/PianoRoll';

export default function App() {
  const [leftWidth, setLeftWidth] = useState(60);
  const [isDraggingH, setIsDraggingH] = useState(false);

  const [topHeight, setTopHeight] = useState(50);
  const [isDraggingV, setIsDraggingV] = useState(false);
  const leftPanelRef = useRef(null);

  // Horizontal divider (left vs right panel)
  const handleMouseDownH = (e) => {
    e.preventDefault();
    setIsDraggingH(true);
    const startX = e.clientX;
    const startWidth = leftWidth;

    const onMouseMove = (e) => {
      const delta = ((e.clientX - startX) / window.innerWidth) * 100;
      const newWidth = Math.min(Math.max(startWidth + delta, 25), 75);
      setLeftWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDraggingH(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Vertical divider (ChannelRack vs PianoRoll)
  const handleMouseDownV = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingV(true);

    const startY = e.clientY;
    const startTopHeight = topHeight;
    const panelHeight = leftPanelRef.current?.getBoundingClientRect().height || window.innerHeight;

    const onMouseMove = (e) => {
      const delta = ((e.clientY - startY) / panelHeight) * 100;
      const newHeight = Math.min(Math.max(startTopHeight + delta, 20), 80);
      setTopHeight(newHeight);
    };

    const onMouseUp = () => {
      setIsDraggingV(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [topHeight]);

  return (
    <AppProviders>
      <div
        style={{ fontFamily: "Tomorrow, sans-serif", userSelect: isDraggingV || isDraggingH ? 'none' : 'auto' }}
        className="flex flex-col h-screen bg-gray-900 overflow-hidden"
      >
        {/* Menu supérieur */}
        <div className="border-b flex-shrink-0 z-50">
          <label className="text-gray-400 font-bold top-0 right-0 text-xl absolute italic">Sound maker</label>
          <StripMenu />
          {/* TransportBar fixe en haut */}
          <div className="fixed top-1 right-100 z-50 bg-gray-900">
            <TransportBar />
          </div>
        </div>

        {/* Zone de travail */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel: ChannelRack + PianoRoll */}
          <div
            ref={leftPanelRef}
            className="h-full flex flex-col bg-gray-800 border-r border-gray-700 overflow-hidden"
            style={{ width: `${leftWidth}%` }}
          >
            {/* Channel Rack */}
            <div
              className="overflow-hidden flex-shrink-0"
              style={{ height: `${topHeight}%` }}
            >
              <ChannelRack />
            </div>

            {/* Diviseur vertical (ChannelRack / PianoRoll) */}
            <div
              className={`h-1.5 flex-shrink-0 cursor-row-resize transition-colors flex items-center justify-center group ${
                isDraggingV
                  ? 'bg-blue-500'
                  : 'bg-gray-700 hover:bg-blue-400'
              }`}
              onMouseDown={handleMouseDownV}
              title="Hold to resize"
            >
              {/* Grip dots */}
              <div className="flex gap-1 pointer-events-none">
                {[Array(1)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-1 rounded-full transition-colors ${
                      isDraggingV ? 'bg-white' : 'bg-gray-500 group-hover:bg-blue-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Piano Roll */}
            <div className="flex-1 overflow-hidden">
              <PianoRoll />
            </div>
          </div>

          {/* Diviseur horizontal (left panel / Playlist) */}
          <div
            className={`w-1.5 bg-gray-700 hover:bg-blue-500 cursor-col-resize transition-colors flex-shrink-0 flex items-center justify-center group ${
              isDraggingH ? 'bg-blue-500' : ''
            }`}
            onMouseDown={handleMouseDownH}
            title="Maintenir pour redimensionner"
          >
            <div className="flex flex-col gap-1 pointer-events-none">
              {[Array(0)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-1 rounded-full transition-colors ${
                    isDraggingH ? 'bg-white' : 'bg-gray-500 group-hover:bg-blue-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Playlist */}
          <div
            className="h-full flex flex-col bg-gray-900"
            style={{ width: `${100 - leftWidth}%` }}
          >
            <Playlist />
          </div>
        </div>
      </div>
    </AppProviders>
  );
}