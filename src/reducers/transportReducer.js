// Actions types
export const TRANSPORT_ACTIONS = {
  PLAY: 'PLAY',
  PAUSE: 'PAUSE',
  STOP: 'STOP',
  TOGGLE_METRONOME: 'TOGGLE_METRONOME',
  TOGGLE_LOOP: 'TOGGLE_LOOP',
  SET_MODE: "SET_MODE",
  SET_BPM: 'SET_BPM',
  SET_CURRENT_STEP: 'SET_CURRENT_STEP',
  SET_TIME_SIGNATURE: 'SET_TIME_SIGNATURE',
};

// État initial
export const initialState = {
  isPlaying: false,
  isPaused: false,
  currentStep: 0,
  bpm: 130,
  mode: "pattern", 
  metronomeEnabled: false,
  loopEnabled: true,
  timeSignature: { numerator: 4, denominator: 4 },
};


// Reducer
export function transportReducer(state, action) {
  switch (action.type) {
    case TRANSPORT_ACTIONS.PLAY:
      return {
        ...state,
        isPlaying: true,
        isPaused: false
      };

    case TRANSPORT_ACTIONS.PAUSE:
      return {
        ...state,
        isPlaying: false,
        isPaused: true
      };

    case TRANSPORT_ACTIONS.STOP:
      return {
        ...state,
        isPlaying: false,
        isPaused: false,
        currentStep: 0,
      };

    case TRANSPORT_ACTIONS.TOGGLE_METRONOME:
      return {
        ...state,
        metronomeEnabled: !state.metronomeEnabled
      };

    case TRANSPORT_ACTIONS.TOGGLE_LOOP:
      return {
        ...state,
        loopEnabled: !state.loopEnabled,
      };

    case TRANSPORT_ACTIONS.SET_MODE:
      return {
        ...state,
        mode: action.payload
      };

    case TRANSPORT_ACTIONS.SET_BPM:
      return {
        ...state,
        bpm: Math.max(20, Math.min(300, action.payload)),
      };

    case TRANSPORT_ACTIONS.SET_CURRENT_STEP:
      return {
        ...state,
        currentStep: action.payload,
      };

    case TRANSPORT_ACTIONS.SET_TIME_SIGNATURE:
      return {
        ...state,
        timeSignature: action.payload,
      };

    default:
      return state;
  }
}