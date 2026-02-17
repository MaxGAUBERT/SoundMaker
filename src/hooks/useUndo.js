// hooks/useUndo.js
import { useState, useCallback } from 'react';
import { produce } from 'immer';

export function useUndo(initialState, maxHistory = 50) {
  const [history, setHistory] = useState([initialState]);
  const [index, setIndex] = useState(0);

  const state = history[index];

  // setState avec support d'Immer
  const setState = useCallback((updater) => {
    const newState = produce(state, draft => {
      if (typeof updater === 'function') {
        updater(draft);
      } else {
        return updater;
      }
    });

    // Supprimer le futur si on fait une nouvelle action après un undo
    const newHistory = history.slice(0, index + 1);
    newHistory.push(newState);

    // Limiter la taille de l'historique
    if (newHistory.length > maxHistory) {
      newHistory.shift();
      setHistory(newHistory);
      setIndex(newHistory.length - 1);
    } else {
      setHistory(newHistory);
      setIndex(index + 1);
    }
  }, [state, history, index, maxHistory]);

  const undo = useCallback(() => {
    if (index > 0) {
      setIndex(prev => prev - 1);
    }
  }, [index]);

  const redo = useCallback(() => {
    if (index < history.length - 1) {
      setIndex(prev => prev + 1);
    }
  }, [index, history.length]);

  const canUndo = index > 0;
  const canRedo = index < history.length - 1;

  const reset = useCallback((newState) => {
    setHistory([newState]);
    setIndex(0);
  }, []);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
  };
}