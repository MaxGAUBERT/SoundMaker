import { createContext, useContext, useRef, useReducer, useEffect } from 'react';
import * as Tone from "tone";
import { useChannels } from './ChannelProvider';

const TransportContext = createContext();

// Actions types
const TRANSPORT_ACTIONS = {
  PLAY: 'PLAY',
  PAUSE: 'PAUSE',
  STOP: 'STOP',
  TOGGLE_METRONOME: 'TOGGLE_METRONOME',
  TOGGLE_LOOP: 'TOGGLE_LOOP',
  SET_BPM: 'SET_BPM',
  SET_CURRENT_STEP: 'SET_CURRENT_STEP',
  SET_TIME_SIGNATURE: 'SET_TIME_SIGNATURE',
};

// État initial
const initialState = {
  isPlaying: false,
  isPaused: false,
  currentStep: 0,
  bpm: 130,
  metronomeEnabled: false,
  loopEnabled: true,
  timeSignature: { numerator: 4, denominator: 4 },
};

// Reducer
function transportReducer(state, action) {
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

export function TransportProvider({ children }) {
  const [state, dispatch] = useReducer(transportReducer, initialState);
  const { patterns, currentPatternID, width } = useChannels();

  const loopRef = useRef(null);
  const metronomeEventRef = useRef(null);
  const metronomeSynthRef = useRef(null);

  const playersRef = useRef(new Map());
  const stepIndexRef = useRef(0);

  useEffect(() => {
    const loadSamples = async () => {
      playersRef.current.forEach(player => player.dispose());
      playersRef.current.clear();

      const currentPattern = patterns.find(p => p.id === currentPatternID);
      if (!currentPattern) return;

      // Charger tous les samples du pattern actuel
      const loadPromises = currentPattern.ch
        .filter(channel => channel.sampleUrl)
        .map(async (channel) => {
          try {
            const player = new Tone.Player({
              url: channel.sampleUrl,
              onload: () => {
                console.log(`✅ Sample loaded: ${channel.name}`);
              }
            }).toDestination();

            // Attendre que le player soit chargé
            await Tone.loaded();
            
            playersRef.current.set(channel.id, player);
          } catch (error) {
            console.error(`❌ Error loading sample for ${channel.name}:`, error);
          }
        });

      await Promise.all(loadPromises);
      console.log(`✅ All samples loaded for pattern ${currentPatternID}`);
    };

    loadSamples();

    return () => {
      // Cleanup : disposer tous les players
      playersRef.current.forEach(player => player.dispose());
      playersRef.current.clear();
    };
  }, [currentPatternID]);

  useEffect(() => {
    const startPlayback = async () => {
      if (!state.isPlaying) {
        Tone.Transport.stop();
        if (loopRef.current) {
          loopRef.current.dispose();
          loopRef.current = null;
        }
        dispatch({ 
          type: TRANSPORT_ACTIONS.SET_CURRENT_STEP, 
          payload: 0
        });
        return;
      }

      // Démarrer Tone.js
      await Tone.start();
      //Tone.Transport.bpm.value = state.bpm;

      const currentPattern = patterns.find(p => p.id === currentPatternID);
      if (!currentPattern) return;

      let stepIndex = state.isPaused ? stepIndexRef.current : state.currentStep;

      // Créer la boucle
      loopRef.current = new Tone.Loop((time) => {
        // Jouer les samples actifs
        currentPattern.ch.forEach((channel) => {
          if (channel.grid[stepIndex]) {
            const player = playersRef.current.get(channel.id);
            
            if (player && player.loaded) {
              const tempPlayer = new Tone.Player(player.buffer).toDestination();
              tempPlayer.start(time);
              

              Tone.Transport.schedule(() => {
                tempPlayer.dispose();
              }, time + 1);
            } else {
              console.warn(`⚠️ Player not loaded for channel ${channel.name}`);
            }
          }
        });

        // Mettre à jour le step visuel
        Tone.Draw.schedule(() => {
          dispatch({ 
            type: TRANSPORT_ACTIONS.SET_CURRENT_STEP, 
            payload: stepIndex
          });
          stepIndexRef.current = stepIndex;
        }, time);

        stepIndex = (stepIndex + 1) % width;

      }, "16n");

      loopRef.current.start(0);
      Tone.Transport.start();
    };

    startPlayback();

    return () => {
      Tone.Transport.stop();
      if (loopRef.current) {
        loopRef.current.dispose();
        loopRef.current = null;
      }
    };
  }, [state.isPlaying, currentPatternID, width]);

    useEffect(() => {
    if (!state.metronomeEnabled || !state.isPlaying) {
      // Arrêter le métronome
      if (metronomeEventRef.current) {
        Tone.Transport.clear(metronomeEventRef.current);
        metronomeEventRef.current = null;
      }
      if (metronomeSynthRef.current) {
        metronomeSynthRef.current.dispose();
        metronomeSynthRef.current = null;
      }
      return;
    }

    // ✅ Créer le synth seulement s'il n'existe pas
    if (!metronomeSynthRef.current) {
      metronomeSynthRef.current = new Tone.Synth({
        oscillator: { 
          type: "sine"
        },
        envelope: { 
          attack: 0.001, 
          decay: 0.1, 
          sustain: 0, 
          release: 0.1 
        },
        volume: 0
      }).toDestination();
    }

    metronomeEventRef.current = Tone.Transport.scheduleRepeat((time) => {
      if (metronomeSynthRef.current) {
        metronomeSynthRef.current.triggerAttackRelease("C5", "16n", time);
      }
    }, "4n"); 

    return () => {
      if (metronomeEventRef.current) {
        Tone.Transport.clear(metronomeEventRef.current);
        metronomeEventRef.current = null;
      }
      
    };
  }, [state.metronomeEnabled, state.isPlaying]);

  // ✅ Cleanup final du synth au démontage du composant
  useEffect(() => {
    return () => {
      if (metronomeSynthRef.current) {
        metronomeSynthRef.current.dispose();
        metronomeSynthRef.current = null;
      }
    };
  }, []); 

  useEffect(() => {
    Tone.Transport.bpm.value = state.bpm;
  }, [state.bpm]);

  // Actions helpers
  const play = () => dispatch({ type: TRANSPORT_ACTIONS.PLAY });
  const pause = () => dispatch({ type: TRANSPORT_ACTIONS.PAUSE });
  const stop = () => {
    stepIndexRef.current = 0;
    dispatch({ type: TRANSPORT_ACTIONS.STOP });
  };
  const toggleMetronome = () => dispatch({ type: TRANSPORT_ACTIONS.TOGGLE_METRONOME });
  const toggleLoop = () => dispatch({ type: TRANSPORT_ACTIONS.TOGGLE_LOOP });
  const setBpm = (bpm) => dispatch({ type: TRANSPORT_ACTIONS.SET_BPM, payload: bpm });
  const setCurrentStep = (step) => {stepIndexRef.current = step; dispatch({ type: TRANSPORT_ACTIONS.SET_CURRENT_STEP, payload: step })};
  const setTimeSignature = (numerator, denominator) => 
    dispatch({ type: TRANSPORT_ACTIONS.SET_TIME_SIGNATURE, payload: { numerator, denominator } });

  function getState() {
  return {
    bpm: state.bpm,
    timeSignature: state.timeSignature,
    loopEnabled: state.loopEnabled,
    metronomeEnabled: state.metronomeEnabled,
  };
}

function setState(data) {
  if (!data) return;

  stop();

  if (typeof data.bpm === "number") dispatch({ type: TRANSPORT_ACTIONS.SET_BPM, payload: data.bpm });
  if (data.timeSignature) dispatch({ type: TRANSPORT_ACTIONS.SET_TIME_SIGNATURE, payload: data.timeSignature });
  if (typeof data.loopEnabled === "boolean" && data.loopEnabled !== state.loopEnabled) dispatch({ type: TRANSPORT_ACTIONS.TOGGLE_LOOP });
  if (typeof data.metronomeEnabled === "boolean" && data.metronomeEnabled !== state.metronomeEnabled) dispatch({ type: TRANSPORT_ACTIONS.TOGGLE_METRONOME });
}

function reset() {
  stop();
  dispatch({ type: TRANSPORT_ACTIONS.SET_BPM, payload: 120 });
  dispatch({ type: TRANSPORT_ACTIONS.SET_TIME_SIGNATURE, payload: { numerator: 4, denominator: 4 } });
  // remettre loop + metronome à tes defaults
}



  const value = {
    // État
    ...state,
    
    // Actions
    play,
    pause,
    stop,
    toggleMetronome,
    toggleLoop,
    setBpm,
    setCurrentStep,
    setTimeSignature,
    getState,
    setState,
    reset
  };

  return (
    <TransportContext.Provider value={value}>
      {children}
    </TransportContext.Provider>
  );
}

export function useTransport() {
  const context = useContext(TransportContext);
  if (!context) {
    throw new Error('useTransport must be used within a TransportProvider');
  }
  return context;
}

export { TRANSPORT_ACTIONS };