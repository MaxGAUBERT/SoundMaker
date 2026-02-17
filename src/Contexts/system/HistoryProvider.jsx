import { createContext, useCallback, useContext, useReducer } from 'react';

const HistoryContext = createContext(null);
export const useHistoryContext = () => useContext(HistoryContext);

function historyReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return { past: [...state.past, action.payload], future: [] };
    case 'UNDO': {
      const last = state.past[state.past.length - 1];
      if (!last) return state;
      return { past: state.past.slice(0, -1), future: [last, ...state.future] };
    }
    case 'REDO': {
      const next = state.future[0];
      if (!next) return state;
      return { past: [...state.past, next], future: state.future.slice(1) };
    }
    case 'CLEAR':
      return { past: [], future: [] };
    default:
      return state;
  }
}

export function HistoryProvider({ children }) {
  const [state, dispatch] = useReducer(historyReducer, { past: [], future: [] });

  const dispatchAction = useCallback((actionOrData) => {
  
    if (actionOrData && typeof actionOrData.apply === 'function' && typeof actionOrData.revert === 'function') {
      actionOrData.apply();             
      dispatch({ type: 'ADD', payload: actionOrData }); 
      return;
    }

   
    const { do: doFn, undo: undoFn, ...rest } = actionOrData ?? {};
    if (typeof doFn === 'function' && typeof undoFn === 'function') {
      const normalized = {
        ...rest,
        apply: doFn,
        revert: undoFn,
      };
      normalized.apply();
      dispatch({ type: 'ADD', payload: normalized });
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.warn('[History] dispatchAction appelé sans apply/revert');
    }
  }, []);

  const addAction = useCallback((action) => {
    dispatchAction(action);
  }, [dispatchAction]);

  const undo = useCallback(() => {
    const last = state.past[state.past.length - 1];
    if (!last) return;
    if (typeof last.revert === 'function') last.revert();
    dispatch({ type: 'UNDO' });
  }, [state.past]);

  const redo = useCallback(() => {
    const next = state.future[0];
    if (!next) return;
    if (typeof next.apply === 'function') next.apply();
    dispatch({ type: 'REDO' });
  }, [state.future]);

  const clear = useCallback(() => { dispatch({ type: 'CLEAR' }); }, []);

  return (
    <HistoryContext.Provider
      value={{
        dispatchAction,  
        addAction,   
        undo,
        redo,
        clear,
        state,
        canUndo: state.past.length > 0,
        canRedo: state.future.length > 0,
        history: state.past,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
}
