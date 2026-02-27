import { createContext, useContext, useRef, useReducer, useEffect, useCallback } from "react";
import * as Tone from "tone";
import { useChannels } from "./ChannelProvider";
import { TRANSPORT_ACTIONS, initialState, transportReducer } from "../../reducers/transportReducer";
import { usePlaylist } from "./PlaylistProvider";

const TransportContext = createContext();

export function TransportProvider({ children }) {
  const [state, dispatch] = useReducer(transportReducer, initialState);
  const { patterns, currentPatternID, width } = useChannels();
  const { playlistGrid } = usePlaylist();

  const loopRef = useRef(null);
  const metronomeSynthRef = useRef(null);
  const samplersRef = useRef(new Map());
  const stepIndexRef = useRef(0);

  // Refs pour éviter de relancer la loop quand ces flags changent
  const metronomeEnabledRef = useRef(state.metronomeEnabled);
  const modeRef = useRef(state.mode);
  const isPlayingRef = useRef(state.isPlaying);
  const widthRef = useRef(width);
  const patternsRef = useRef(patterns);
  const currentPatternIDRef = useRef(currentPatternID);
  const playlistGridRef = useRef(playlistGrid);

  useEffect(() => { metronomeEnabledRef.current = state.metronomeEnabled; }, [state.metronomeEnabled]);
  useEffect(() => { modeRef.current = state.mode; }, [state.mode]);
  useEffect(() => { isPlayingRef.current = state.isPlaying; }, [state.isPlaying]);
  useEffect(() => { widthRef.current = width; }, [width]);
  useEffect(() => { patternsRef.current = patterns; }, [patterns]);
  useEffect(() => { currentPatternIDRef.current = currentPatternID; }, [currentPatternID]);
  useEffect(() => { playlistGridRef.current = playlistGrid; }, [playlistGrid]);

  // ─────────────────────────────────────────────────────────────
  // Load samplers (1 par channel id)
  useEffect(() => {
    let cancelled = false;

    const loadSamples = async () => {
      samplersRef.current.forEach((s) => s.dispose());
      samplersRef.current.clear();

      const pat = patterns.find((p) => p.id === currentPatternID);
      if (!pat) return;

      const loaders = pat.ch
        .filter((ch) => ch.sampleUrl)
        .map(async (ch) => {
          const sampler = new Tone.Sampler({
            urls: { C5: ch.sampleUrl },
          }).toDestination();

          samplersRef.current.set(ch.id, sampler);
          await sampler.loaded; // IMPORTANT
        });

      await Promise.all(loaders);

      if (!cancelled) {
        // console.log("Samples ready");
      }
    };

    loadSamples();

    return () => {
      cancelled = true;
      samplersRef.current.forEach((s) => s.dispose());
      samplersRef.current.clear();
    };
  }, [currentPatternID, patterns]);

  // ─────────────────────────────────────────────────────────────
  // Metronome synth (créé une fois)
  useEffect(() => {
    if (!metronomeSynthRef.current) {
      metronomeSynthRef.current = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
        volume: -8,
      }).toDestination();
    }

    return () => {
      if (metronomeSynthRef.current) {
        metronomeSynthRef.current.dispose();
        metronomeSynthRef.current = null;
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Main loop (ne dépend que de isPlaying)
  useEffect(() => {
    const start = async () => {
      if (!state.isPlaying) {
        Tone.Transport.stop();
        if (loopRef.current) {
          loopRef.current.dispose();
          loopRef.current = null;
        }
        stepIndexRef.current = 0;
        dispatch({ type: TRANSPORT_ACTIONS.SET_CURRENT_STEP, payload: 0 });
        return;
      }

      await Tone.start();

      stepIndexRef.current = 0;
      let step = 0;

      if (loopRef.current) {
        loopRef.current.dispose();
        loopRef.current = null;
      }

      loopRef.current = new Tone.Loop((time) => {
        const global = step;

        const mode = modeRef.current;
        const w = widthRef.current;
        const pats = patternsRef.current;
        const curPatId = currentPatternIDRef.current;
        const pg = playlistGridRef.current;

        // METRONOME
        if (metronomeEnabledRef.current && global % 4 === 0 && metronomeSynthRef.current) {
          metronomeSynthRef.current.triggerAttackRelease(global === 0 ? "C6" : "C5", "16n", time);
        }

        // PATTERN MODE
        if (mode === "pattern") {
          const localStep = global % w;
          const pat = pats.find((p) => p.id === curPatId);
          if (!pat) return;

          pat.ch.forEach((ch) => {
            if (!ch.grid?.[localStep]) return;
            const sampler = samplersRef.current.get(ch.id);
            if (!sampler) return;
            sampler.triggerAttackRelease("C5", "16n", time);
          });

          Tone.Draw.schedule(() => {
            dispatch({ type: TRANSPORT_ACTIONS.SET_CURRENT_STEP, payload: global });
            stepIndexRef.current = global;
          }, time);

          step = (global + 1) % w;
          return;
        }

        // SONG MODE
        if (mode === "song") {
          const patternLength = w;
          const totalCols = pg?.[0]?.grid?.length ?? 0;
          if (!totalCols) return;

          const colIndex = Math.floor(global / patternLength) % totalCols;
          const localStep = global % patternLength;

          pg.forEach((track) => {
            const patternId = track.grid?.[colIndex];
            if (!patternId) return;

            const pat = pats.find((p) => p.id === patternId);
            if (!pat) return;

            pat.ch.forEach((ch) => {
              if (!ch.grid?.[localStep]) return;
              const sampler = samplersRef.current.get(ch.id);
              if (!sampler) return;
              sampler.triggerAttackRelease("C5", "16n", time);
            });
          });

          Tone.Draw.schedule(() => {
            dispatch({ type: TRANSPORT_ACTIONS.SET_CURRENT_STEP, payload: global });
            stepIndexRef.current = global;
          }, time);

          const totalSteps = patternLength * totalCols;
          step = (global + 1) % totalSteps;
        }
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
  }, [state.isPlaying]);

  // BPM
  useEffect(() => {
    Tone.Transport.bpm.rampTo(state.bpm, 0.1);
  }, [state.bpm]);

  // ─────────────────────────────────────────────────────────────
  // Actions
  const play = useCallback(() => dispatch({ type: TRANSPORT_ACTIONS.PLAY }), []);
  const pause = useCallback(() => dispatch({ type: TRANSPORT_ACTIONS.PAUSE }), []);
  const stop = useCallback(() => {
    stepIndexRef.current = 0;
    dispatch({ type: TRANSPORT_ACTIONS.STOP });
  }, []);

  const toggleMetronome = useCallback(() => dispatch({ type: TRANSPORT_ACTIONS.TOGGLE_METRONOME }), []);
  const toggleLoop = useCallback(() => dispatch({ type: TRANSPORT_ACTIONS.TOGGLE_LOOP }), []);
  const setBpm = useCallback((bpm) => dispatch({ type: TRANSPORT_ACTIONS.SET_BPM, payload: bpm }), []);
  const setCurrentStep = useCallback((step) => {
    stepIndexRef.current = step;
    dispatch({ type: TRANSPORT_ACTIONS.SET_CURRENT_STEP, payload: step });
  }, []);
  const setMode = useCallback((mode) => dispatch({ type: TRANSPORT_ACTIONS.SET_MODE, payload: mode }), []);
  const setTimeSignature = useCallback(
    (numerator, denominator) =>
      dispatch({ type: TRANSPORT_ACTIONS.SET_TIME_SIGNATURE, payload: { numerator, denominator } }),
    []
  );

  // State IO
  const getState = useCallback(() => {
    return {
      bpm: state.bpm,
      timeSignature: state.timeSignature,
      loopEnabled: state.loopEnabled,
      metronomeEnabled: state.metronomeEnabled,
    };
  }, [state.bpm, state.timeSignature, state.loopEnabled, state.metronomeEnabled]);

  const setState = useCallback(
    (data) => {
      if (!data) return;

      stop();

      if (typeof data.bpm === "number") dispatch({ type: TRANSPORT_ACTIONS.SET_BPM, payload: data.bpm });
      if (data.timeSignature) dispatch({ type: TRANSPORT_ACTIONS.SET_TIME_SIGNATURE, payload: data.timeSignature });
      if (typeof data.loopEnabled === "boolean" && data.loopEnabled !== state.loopEnabled)
        dispatch({ type: TRANSPORT_ACTIONS.TOGGLE_LOOP });
      if (typeof data.metronomeEnabled === "boolean" && data.metronomeEnabled !== state.metronomeEnabled)
        dispatch({ type: TRANSPORT_ACTIONS.TOGGLE_METRONOME });
    },
    [stop, state.loopEnabled, state.metronomeEnabled]
  );

  const reset = useCallback(() => {
    stop();
    dispatch({ type: TRANSPORT_ACTIONS.SET_BPM, payload: 120 });
    dispatch({ type: TRANSPORT_ACTIONS.SET_TIME_SIGNATURE, payload: { numerator: 4, denominator: 4 } });
  }, [stop]);

  const value = {
    ...state,
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

  return <TransportContext.Provider value={value}>{children}</TransportContext.Provider>;
}

export function useTransport() {
  const context = useContext(TransportContext);
  if (!context) throw new Error("useTransport must be used within a TransportProvider");
  return context;
}

export { TRANSPORT_ACTIONS };