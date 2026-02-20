import { createContext, useContext, useRef, useReducer, useEffect } from 'react';
import * as Tone from "tone";
import { useChannels } from './ChannelProvider';
import { TRANSPORT_ACTIONS, initialState, transportReducer } from '../../reducers/transportReducer';
const TransportContext = createContext();


export function TransportProvider({ children }) {
  const [state, dispatch] = useReducer(transportReducer, initialState);
  const { patterns, currentPatternID, width } = useChannels();

  const loopRef = useRef(null);
  const metronomeEventRef = useRef(null);
  const metronomeSynthRef = useRef(null);

  const playersRef = useRef(new Map());
  const stepIndexRef = useRef(0);

  // Ref pour lire metronomeEnabled depuis la boucle audio sans la redémarrer
  const metronomeEnabledRef = useRef(state.metronomeEnabled);
  useEffect(() => {
    metronomeEnabledRef.current = state.metronomeEnabled;
  }, [state.metronomeEnabled]);

  useEffect(() => {

  const loadSamples = async () => {

    playersRef.current.forEach(p => p.dispose());
    playersRef.current.clear();

    const pattern = patterns.find(p => p.id === currentPatternID);
    if (!pattern) return;

    const loaders = pattern.ch
      .filter(ch => ch.sampleUrl)
      .map(ch => {

        const player = new Tone.Player(ch.sampleUrl).toDestination();
        playersRef.current.set(ch.id, player);

        return player.load();
      });

    await Promise.all(loaders);

    console.log("Samples ready");
  };

  loadSamples();

  return () => {
    playersRef.current.forEach(p => p.dispose());
    playersRef.current.clear();
  };

}, [currentPatternID, patterns]);

  useEffect(() => {

  const start = async () => {

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

    await Tone.start();

    const pattern = patterns.find(p => p.id === currentPatternID);
    if (!pattern) return;


    if (!metronomeSynthRef.current) {

      metronomeSynthRef.current = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
        volume: -8
      }).toDestination();
    }


    let step = stepIndexRef.current;


    loopRef.current = new Tone.Loop((time) => {

      // METRONOME
      if (state.metronomeEnabled && step % 4 === 0) {

        metronomeSynthRef.current.triggerAttackRelease(
          step === 0 ? "C6" : "C5",
          "16n",
          time
        );
      }


      // SAMPLES
      pattern.ch.forEach(ch => {

        if (!ch.grid[step]) return;

        const player = playersRef.current.get(ch.id);

        if (player?.loaded) {
          player.start(time);
        }
      });


      // UI
      Tone.Draw.schedule(() => {

        dispatch({
          type: TRANSPORT_ACTIONS.SET_CURRENT_STEP,
          payload: step
        });

        stepIndexRef.current = step;

      }, time);


      step = (step + 1) % width;

    }, "16n");


    loopRef.current.start(0);
    Tone.Transport.start();
  };


  start();


  return () => {

    Tone.Transport.stop();

    if (loopRef.current) {
      loopRef.current.dispose();
      loopRef.current = null;
    }
  };

}, [
  state.isPlaying,
  state.metronomeEnabled,
  currentPatternID,
  state.currentStep,
  width
]);

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
    Tone.Transport.bpm.rampTo(state.bpm, 0.1);
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
  const setMode = (mode) => dispatch({ type: TRANSPORT_ACTIONS.SET_MODE, payload: mode });
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
}

  const value = {
    // État
    ...state,
    // Actions
    play,
    pause,
    stop,
    setMode,
    toggleMetronome,
    toggleLoop,
    setBpm,
    setCurrentStep,
    setTimeSignature,
    getState,
    setState,
    reset,
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