// hooks/useKeyboardShortcuts.js
import { useEffect } from 'react';
import { useChannels } from '../Contexts/features/ChannelProvider';

export function useKeyboardShortcuts() {
  const { undo, redo, canUndo, canRedo } = useChannels();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey && canUndo) {
        e.preventDefault();
        undo();
      }

      // Redo: Ctrl+Y ou Ctrl+Shift+Z
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        if (canRedo) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);
}