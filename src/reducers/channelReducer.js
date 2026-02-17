// channelReducer.js
const ACTIONS = {
  TOGGLE_CELL: 'TOGGLE_CELL',
  ADD_CHANNEL: 'ADD_CHANNEL',
  ADD_PATTERN: 'ADD_PATTERN',
  RENAME_CHANNEL: 'RENAME_CHANNEL',
  SET_STATE: 'SET_STATE', 
};

function channelReducer(state, action) {
  switch (action.type) {
    case ACTIONS.TOGGLE_CELL:
      return state.map(p => {
        if (p.id !== action.patternId) return p;

        return {
          ...p,
          ch: p.ch.map(channel => {
            if (ch.id !== action.channelId) return ch;

            const newGrid = [...channel.grid];
            newGrid[action.cellIndex] = !newGrid[action.cellIndex];

            return {...ch, grid: newGrid};
          })
        }
      })

    case ACTIONS.ADD_CHANNEL:
      return state.map(p => ({
        ...p,
        ch: [...p.ch, action.newChannel],
      }));

    case ACTIONS.SET_STATE:
      return action.payload;

    default:
      return state;
  }
}

export { channelReducer, ACTIONS };

