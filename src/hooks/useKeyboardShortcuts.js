import { useEffect } from 'react';
import { useChannels } from '../Contexts/features/ChannelProvider';
import { useTransport } from '../Contexts/features/TransportContext';
import { useStorage } from '../Contexts/system/StorageContext';
import { useMenuActions } from '../Contexts/system/MenuActionsContext';

export function useKeyboardShortcuts() {
  const { undo, redo, canUndo, canRedo } = useChannels();
  const {play, pause, stop, toggleLoop, toggleMetronome} = useTransport();
  const {actions} = useMenuActions();
  
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

      if (e.code === 'Space') {
        e.preventDefault();
        play();
      }

      if (e.code === 'KeyP') {
        e.preventDefault();
        pause();
      }

      if (e.code === 'KeyS') {
        e.preventDefault();
        stop();
      }

      if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMetronome();
      }

      if (e.code === 'KeyL') {
        console.log("Toggling loop");
        e.preventDefault();
        toggleLoop();
      }

      // Stockage 

      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        actions["New Project"]();
        console.log("New Project triggered");
      }

      if (e.altKey && e.key === 'l') {
        e.preventDefault();
        actions["Load Project"]();
        console.log("Load Project triggered");
      }

      if (e.altKey && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        actions["Save As"]();
        console.log("Save As triggered");
      }

      if (e.altKey && e.key === 's' && e.shiftKey) {
        e.preventDefault();
        actions["Save"]();
        console.log("Save triggered");
      }

      if (e.altKey && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        actions["Settings"]();
        console.log("Settings triggered");
      }

      if (e.altKey && e.key === 'F4') {
        e.preventDefault();
        actions["Exit"]();
        console.log("Exit triggered");
      }
    };



    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);
}