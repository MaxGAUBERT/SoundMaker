import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useAnimate, stagger } from 'motion/react';

import ChannelRack    from './features/ChannelRack';
import Playlist       from './features/Playlist';
import StripMenu      from './UI/StripMenu';
import TransportBar   from './UI/TransportBar';
import AppProviders   from './Contexts/features/AppProviders';
import PianoRoll      from './features/PianoRoll/PianoRoll';
import SoundMakerLogo from './UI/Animation';

// Scanlines 
function ScanLines() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      pointerEvents: 'none', zIndex: 10,
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.13) 2px, rgba(0,0,0,0.13) 4px)',
      mixBlendMode: 'multiply',
    }} />
  );
}

// ── Splash Screen ────────────────────────────────────────────
function SplashScreen({ onStart }) {
  return (
    <motion.div
      key="splash"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: 'fixed', inset: 0,
        background: '#070709',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        gap: '2.5rem',
        overflow: 'hidden',
      }}
    >
      <ScanLines />

      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 4.5, ease: 'easeOut' }}
        style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, #000 0%, #000 60%, transparent 100%)',
          pointerEvents: 'none', zIndex: 5,
        }}
      />

      {/* Logo animé */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.8, ease: 'easeOut' }}
        style={{ position: 'relative', zIndex: 6 }}
      >
        <SoundMakerLogo />
      </motion.div>

      {/* Bouton START */}
      <motion.button
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 1.8, ease: 'easeOut' }}
        onClick={onStart}
        whileHover={{
          scale: 1.04,
          borderColor: '#ff6a00',
          color: '#ff6a00',
          boxShadow: '0 0 18px #ff6a0033',
        }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'relative', zIndex: 6,
          padding: '10px 52px',
          background: 'transparent',
          border: '1px solid #2a2a35',
          borderRadius: 3,
          color: '#b0b0b8',
          fontFamily: "'Courier New', monospace",
          fontSize: '0.85rem',
          fontWeight: 900,
          letterSpacing: '0.4em',
          cursor: 'pointer',
          transition: 'border-color 0.2s, color 0.2s, box-shadow 0.2s',
        }}
      >
        START
      </motion.button>

      {/* Version */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.8, duration: 0.8 }}
        style={{
          position: 'absolute', bottom: 24, zIndex: 6,
          fontFamily: "'Courier New', monospace",
          fontSize: '1.2rem',
          color: "red",
          letterSpacing: '0.25em',
        }}
      >
        SOUND MAKER
      </motion.span>
    </motion.div>
  );
}

// ── Désintégration gauche → droite ────────────────────────────────────────────
function DisintegrationReveal({ children }) {
  const COLS      = 36;
  const PARTICLES = 60;
  const [showParticles, setShowParticles] = useState(true);
  const [scope, animate] = useAnimate();

  useEffect(() => {
    const run = async () => {
      await animate(
        '.col',
        { opacity: [0, 1, 0], scaleY: [0.4, 1, 0.2], y: [20, 0, -30] },
        {
          duration: 0.8,
          delay: stagger(0.035, { from: 'first' }),
          ease: ['easeOut', 'easeIn'],
        }
      );
      setShowParticles(false);
    };
    run();
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>

      {/* Contenu réel — révélé par clip-path gauche → droite */}
      <motion.div
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: 'inset(0 0% 0 0)' }}
        transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', height: '100%' }}
      >
        {children}
      </motion.div>

      {/* Rideau de particules orange */}
      {showParticles && (
        <div
          ref={scope}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex',
            pointerEvents: 'none',
            zIndex: 50,
            overflow: 'hidden',
          }}
        >
          {Array.from({ length: COLS }).map((_, c) => (
            <div
              key={c}
              className="col"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-around',
                alignItems: 'center',
                opacity: 0,
              }}
            >
              {Array.from({ length: PARTICLES }).map((_, p) => {
                const size   = 2 + Math.random() * 8;
                const bright = Math.random() > 0.65;
                return (
                  <div
                    key={p}
                    style={{
                      width: size, height: size,
                      borderRadius: Math.random() > 0.5 ? '50%' : 1,
                      background: bright ? 'red' : '#3a1800',
                      boxShadow: bright ? '0 0 6px #ff6a00' : 'none',
                      opacity: 0.6 + Math.random() * 0.4,
                      flexShrink: 0,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [started, setStarted] = useState(false);

  const [leftWidth,   setLeftWidth]   = useState(60);
  const [isDraggingH, setIsDraggingH] = useState(false);
  const [topHeight,   setTopHeight]   = useState(50);
  const [isDraggingV, setIsDraggingV] = useState(false);
  const leftPanelRef = useRef(null);

  // Diviseur horizontal (panel gauche / Playlist)
  const handleMouseDownH = (e) => {
    e.preventDefault();
    setIsDraggingH(true);
    const startX     = e.clientX;
    const startWidth = leftWidth;
    const onMouseMove = (e) => {
      const delta = ((e.clientX - startX) / window.innerWidth) * 100;
      setLeftWidth(Math.min(Math.max(startWidth + delta, 25), 75));
    };
    const onMouseUp = () => {
      setIsDraggingH(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup',   onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
  };

  // Diviseur vertical (ChannelRack / PianoRoll)
  const handleMouseDownV = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingV(true);
    const startY         = e.clientY;
    const startTopHeight = topHeight;
    const panelHeight    = leftPanelRef.current?.getBoundingClientRect().height || window.innerHeight;
    const onMouseMove = (e) => {
      const delta = ((e.clientY - startY) / panelHeight) * 100;
      setTopHeight(Math.min(Math.max(startTopHeight + delta, 20), 80));
    };
    const onMouseUp = () => {
      setIsDraggingV(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup',   onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
  }, [topHeight]);

  return (
    <>
      {/* ── Splash screen Digitone ── */}
      <AnimatePresence mode="wait">
        {!started && <SplashScreen onStart={() => setStarted(true)} />}
      </AnimatePresence>

      {/* ── App — désintégration gauche → droite ── */}
      <AnimatePresence>
        {started && (
          <DisintegrationReveal key="app">
            <AppProviders>
              <div
                style={{
                  fontFamily: 'Tomorrow, sans-serif',
                  userSelect: isDraggingV || isDraggingH ? 'none' : 'auto',
                }}
                className="flex flex-col h-screen bg-gray-900 overflow-hidden"
              >
                {/* Menu supérieur */}
                <div className="border-b flex-shrink-0 z-50">
                  <label className="text-gray-400 font-bold top-0 right-0 text-xl absolute italic">
                    Sound maker
                  </label>
                  <StripMenu />
                  <div className="fixed top-1 right-100 z-50 bg-gray-900">
                    <TransportBar />
                  </div>
                </div>

                {/* Zone de travail */}
                <div className="flex flex-1 overflow-hidden">

                  {/* Panel gauche : ChannelRack + PianoRoll */}
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

                    {/* Diviseur vertical */}
                    <div
                      className={`h-1.5 flex-shrink-0 cursor-row-resize transition-colors flex items-center justify-center group ${
                        isDraggingV ? 'bg-blue-500' : 'bg-gray-700 hover:bg-blue-400'
                      }`}
                      onMouseDown={handleMouseDownV}
                      title="Hold to resize"
                    >
                      <div className="flex gap-1 pointer-events-none">
                        <div className={`w-1 h-1 rounded-full transition-colors ${
                          isDraggingV ? 'bg-white' : 'bg-gray-500 group-hover:bg-blue-200'
                        }`} />
                      </div>
                    </div>

                    {/* Piano Roll */}
                    <div className="flex-1 overflow-auto">
                      <PianoRoll />
                    </div>
                  </div>

                  {/* Diviseur horizontal */}
                  <div
                    className={`w-1.5 bg-gray-700 hover:bg-blue-500 cursor-col-resize transition-colors flex-shrink-0 flex items-center justify-center group ${
                      isDraggingH ? 'bg-blue-500' : ''
                    }`}
                    onMouseDown={handleMouseDownH}
                    title="Maintenir pour redimensionner"
                  >
                    <div className="flex flex-col gap-1 pointer-events-none">
                      <div className={`w-1 h-1 rounded-full transition-colors ${
                        isDraggingH ? 'bg-white' : 'bg-gray-500 group-hover:bg-blue-200'
                      }`} />
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
          </DisintegrationReveal>
        )}
      </AnimatePresence>
    </>
  );
}