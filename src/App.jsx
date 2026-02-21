// App.jsx ou main.jsx
import { useState } from 'react';
import ChannelRack from './features/ChannelRack';
import Playlist from './features/Playlist';
import StripMenu from './UI/StripMenu';
import TransportBar from './UI/TransportBar';
import AppProviders from './Contexts/features/AppProviders';


export default function App() {
  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX;
    const startWidth = leftWidth;

    const onMouseMove = (e) => {
      const delta = ((e.clientX - startX) / window.innerWidth) * 100;
      const newWidth = Math.min(Math.max(startWidth + delta, 25), 75);
      setLeftWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <AppProviders>
      <div style={{fontFamily: "Tomorrow, sans-serif"}} className="flex flex-col h-screen bg-gray-900 overflow-hidden">
        {/* Menu supérieur */}
        <div className="border-b flex-shrink-0 z-50">
          <label className="text-gray-400 font-bold top-0 right-0 text-xl absolute italic">Sound maker</label>
          <StripMenu />
          {/* TransportBar fixe en haut */}
          <div className="fixed top-1 right-100 z-50 bg-gray-900 ">
            <TransportBar />
          </div>
        </div>

        {/* Zone de travail */}
        <div className="flex flex-1 overflow-hidden">
          {/* Channel Rack */}
          <div
            className="h-full flex flex-col bg-gray-800 border-r border-gray-700"
            style={{ width: `${leftWidth}%` }}
          >
            <ChannelRack />
          </div>

          {/* Diviseur */}
          <div
            className={`w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize transition-colors flex-shrink-0 ${
              isDragging ? 'bg-blue-500' : ''
            }`}
            onMouseDown={handleMouseDown}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-0.5 h-8 bg-gray-600"></div>
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