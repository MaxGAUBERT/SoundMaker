// hooks/useKeyboardShortcuts.js
import { useEffect } from 'react';
import { useUndoManagerContext } from '../Contexts/system/UndoManagerContext';
import { useTransport } from '../Contexts/features/TransportContext';
import { useMenuActions } from '../Contexts/system/MenuActionsContext';

export function useKeyboardShortcuts() {
  const { undo, redo } = useUndoManagerContext();
  const { play, pause, stop, toggleLoop, toggleMetronome } = useTransport();
  const { actions } = useMenuActions();

  useEffect(() => {
    const handleKeyDown = (e) => {

      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
      }

      if (e.code === 'Space') { e.preventDefault(); play(); }
      if (e.code === 'KeyP')  { e.preventDefault(); pause(); }
      if (e.code === 'KeyS')  { e.preventDefault(); stop(); }
      if (e.code === 'KeyM')  { e.preventDefault(); toggleMetronome(); }
      if (e.code === 'KeyL')  { e.preventDefault(); toggleLoop(); }

      if (e.altKey && e.key === 'n')                 { e.preventDefault(); actions["New Project"](); }
      if (e.altKey && e.key === 'l')                 { e.preventDefault(); actions["Load Project"](); }
      if (e.altKey && e.key === 's' && !e.shiftKey)  { e.preventDefault(); actions["Save As"](); }
      if (e.altKey && e.key === 's' && e.shiftKey)   { e.preventDefault(); actions["Save"](); }
      if (e.altKey && e.shiftKey && e.key === 'p')   { e.preventDefault(); actions["Settings"](); }
      if (e.altKey && e.key === 'F4')                { e.preventDefault(); actions["Exit"](); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, play, pause, stop, toggleLoop, toggleMetronome, actions]);
}