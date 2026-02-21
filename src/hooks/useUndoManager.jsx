import { useReducer, useCallback } from 'react';
import { produce } from 'immer';

function applyUpdater(current, updater) {
    return produce(current, draft => {
        if (typeof updater === 'function') {
            updater(draft);
        } else {
            return updater;
        }
    });
}

function reducer(state, action) {
    const { history, index } = state;

    switch (action.type) {

        case 'SET': {
            const current = history[index];
            const newEntry = {
                ...current,
                [action.scope]: applyUpdater(current[action.scope], action.updater),
            };

            const newHistory = [...history.slice(0, index + 1), newEntry];

            if (newHistory.length > action.maxHistory) {
                newHistory.shift();
                return { history: newHistory, index: newHistory.length - 1 };
            }

            return { history: newHistory, index: index + 1 };
        }

        case 'UNDO':
            if (index <= 0) return state;
            return { ...state, index: index - 1 };

        case 'REDO':
            if (index >= history.length - 1) return state;
            return { ...state, index: index + 1 };

        case 'RESET':
            return { history: [action.newState], index: 0 };

        default:
            return state;
    }
}

export function useUndoManager(initialState, maxHistory = 100) {
    const [{ history, index }, dispatch] = useReducer(reducer, undefined, () => {
        const resolved = typeof initialState === 'function' ? initialState() : initialState;
        return { history: [resolved], index: 0 };
    });

    const state = history[index];
    
    const setScoped = useCallback((scope, updater) => {
        dispatch({ type: 'SET', scope, updater, maxHistory });
    }, [maxHistory]);

    const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
    const redo = useCallback(() => dispatch({ type: 'REDO' }), []);

    const reset = useCallback((newState) => {
        dispatch({ type: 'RESET', newState });
    }, []);

    const canUndo = index > 0;
    const canRedo = index < history.length - 1;

    return { state, setScoped, undo, redo, canUndo, canRedo, reset };
}