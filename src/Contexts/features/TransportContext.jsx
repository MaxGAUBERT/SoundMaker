import { createContext, useContext, useRef, useReducer, useEffect, useCallback, useMemo } from "react";
import * as Tone from "tone";
import { useChannels } from "./ChannelProvider";
import { TRANSPORT_ACTIONS, initialState, transportReducer } from "../../reducers/transportReducer";
import { rowToNoteName } from "../../features/PianoRoll/utils/noteUtils";
import { useChannelStore } from "../../stores/useChannelStore";

const TransportContext = createContext();

export function TransportProvider({ children }) {
  const [state, dispatch] = useReducer(transportReducer, initialState);

  // ── Store unifié ──────────────────────────────────────────────────────────
  const { patterns, currentPatternID, width } = useChannels();
  const clips         = useChannelStore(s => s.clips);
  const pCols         = useChannelStore(s => s.pCols);
  const isSelecting   = useChannelStore(s => s.isSelecting);
  const startSelection = useChannelStore(s => s.startSelection);
  const selectionEnd  = useChannelStore(s => s.selectionEnd);

  // ── Refs audio ────────────────────────────────────────────────────────────
  const loopRef           = useRef(null);
  const metronomeSynthRef = useRef(null);
  const samplersRef       = useRef(new Map());
  const stepIndexRef      = useRef(0);

  // ── Refs réactifs (lus dans le Tone.Loop sans re-créer la loop) ───────────
  const metronomeEnabledRef = useRef(state.metronomeEnabled);
  const modeRef             = useRef(state.mode);
  const widthRef            = useRef(width);
  const patternsRef         = useRef(patterns);
  const currentPatternIDRef = useRef(currentPatternID);
  const clipsRef            = useRef(clips);
  const pColsRef            = useRef(pCols);
  const isSelectingRef      = useRef(isSelecting);
  const startSelectionRef   = useRef(startSelection);
  const selectionEndRef     = useRef(selectionEnd);

  useEffect(() => { metronomeEnabledRef.current = state.metronomeEnabled; }, [state.metronomeEnabled]);
  useEffect(() => { modeRef.current             = state.mode;             }, [state.mode]);
  useEffect(() => { widthRef.current            = width;                  }, [width]);
  useEffect(() => { patternsRef.current         = patterns;               }, [patterns]);
  useEffect(() => { currentPatternIDRef.current = currentPatternID;       }, [currentPatternID]);
  useEffect(() => { clipsRef.current            = clips;                  }, [clips]);
  useEffect(() => { pColsRef.current            = pCols;                  }, [pCols]);
  useEffect(() => { isSelectingRef.current      = isSelecting;            }, [isSelecting]);
  useEffect(() => { startSelectionRef.current   = startSelection;         }, [startSelection]);
  useEffect(() => { selectionEndRef.current     = selectionEnd;           }, [selectionEnd]);

  // ── Chargement des samplers (pattern courant) ─────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const loadSamples = async () => {
      samplersRef.current.forEach(s => s.dispose());
      samplersRef.current.clear();

      const pat = patterns.find(p => p.id === currentPatternID);
      if (!pat) return;

      await Promise.all(
        pat.ch
          .filter(ch => ch.sampleUrl)
          .map(async ch => {
            const sampler = new Tone.Sampler({ urls: { C5: ch.sampleUrl } }).toDestination();
            samplersRef.current.set(ch.id, sampler);
            await sampler.loaded;
          })
      );
    };

    if (!cancelled) loadSamples();

    return () => {
      cancelled = true;
      samplersRef.current.forEach(s => s.dispose());
      samplersRef.current.clear();
    };
  }, [currentPatternID, patterns]);

  // ── Métronome ─────────────────────────────────────────────────────────────
  useEffect(() => {
    metronomeSynthRef.current = new Tone.Synth({
      oscillator: { type: "square" },
      envelope:   { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
      volume: -8,
    }).toDestination();

    return () => {
      metronomeSynthRef.current?.dispose();
      metronomeSynthRef.current = null;
    };
  }, []);

  // ── Helpers lecture ───────────────────────────────────────────────────────
  function playChannels(ch_list, localStep, time) {
    ch_list.forEach(ch => {
      const sampler = samplersRef.current.get(ch.id);
      if (!sampler?.loaded) return;

      if (ch.pianoData?.length) {
        ch.pianoData
          .filter(n => n.start === localStep)
          .forEach(n => {
            const note = rowToNoteName(n.row);
            const dur  = Tone.Time(ch.duration).toSeconds() * n.length;
            sampler.triggerAttackRelease(note, dur, time);
          });
        return;
      }

      if (ch.grid?.[localStep] && !ch.muted) {
        sampler.triggerAttackRelease("C5", ch.duration, time);
      }
    });
  }

  // ── Transport loop ────────────────────────────────────────────────────────
  useEffect(() => {
    const cleanup = () => {
      loopRef.current?.stop();
      loopRef.current?.dispose();
      loopRef.current = null;
      Tone.Transport.stop();
      Tone.Transport.cancel();
      Tone.Transport.position = 0;
      stepIndexRef.current = 0;
      dispatch({ type: TRANSPORT_ACTIONS.SET_CURRENT_STEP, payload: 0 });
    };

    if (!state.isPlaying) { cleanup(); return; }

    const start = async () => {
      await Tone.start();
      //cleanup();

      loopRef.current = new Tone.Loop((time) => {
        const mode       = modeRef.current;
        const w          = widthRef.current;
        const curPatId   = currentPatternIDRef.current;
        const clips      = clipsRef.current;
        const selecting  = isSelectingRef.current;
        const selStart   = startSelectionRef.current;
        const selEnd     = selectionEndRef.current;

        let step = stepIndexRef.current;

        // ── Pattern mode ────────────────────────────────────────────────
        if (mode === "pattern") {
          const localStep = step % w;
          const pat       = patternsRef.current.find(p => p.id === curPatId);

          if (pat) playChannels(pat.ch, localStep, time);

          const nextStep = (step + 1) % w;
          stepIndexRef.current = nextStep;

          Tone.Draw.schedule(() => {
            dispatch({ type: TRANSPORT_ACTIONS.SET_CURRENT_STEP, payload: nextStep });
          }, time);

          return;
        }

        // ── Song mode ───────────────────────────────────────────────────
        if (mode === "song") {
          console.log("mode:", mode, "step:", step);
          const patternLength = w;
  
          clips.forEach(clip => {
          const { patternId, start, length } = clip;
          const clipStart = start * patternLength;
          const clipEnd   = clipStart + length * patternLength;

          if (step < clipStart || step >= clipEnd) return;

          const pat = patternsRef.current.find(p => p.id === patternId); 
          if (!pat) return;

          const localStep = (step - clipStart) % patternLength;
          playChannels(pat.ch, localStep, time);
      });

          const n = step + 1;
          let nextStep;

          if (selecting && selStart !== null && selEnd !== null) {
  
          const startStep = selStart * patternLength;
          const endStep   = (selEnd + 1) * patternLength;
          nextStep = n >= endStep ? startStep : n;

        } else {
          nextStep = n;
        }

          stepIndexRef.current = nextStep;

          console.log(stepIndexRef.current);

          Tone.Draw.schedule(() => {
            dispatch({ type: TRANSPORT_ACTIONS.SET_CURRENT_STEP, payload: nextStep });
          }, time);
        }

      }, "16n");

      loopRef.current.start(0);
      Tone.Transport.start();
    };

    start();
    return cleanup;
  }, [state.isPlaying]);

  // ── BPM ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    Tone.Transport.bpm.rampTo(state.bpm, 0.1);
  }, [state.bpm]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const play  = useCallback(() => dispatch({ type: TRANSPORT_ACTIONS.PLAY }),  []);
  const pause = useCallback(() => dispatch({ type: TRANSPORT_ACTIONS.PAUSE }), []);

  const stop = useCallback(() => {
    stepIndexRef.current = isSelecting && startSelection !== null ? startSelection : 0;
    dispatch({ type: TRANSPORT_ACTIONS.STOP });
  }, [isSelecting, startSelection]);

  const toggleMetronome  = useCallback(() => dispatch({ type: TRANSPORT_ACTIONS.TOGGLE_METRONOME }), []);
  const toggleLoop       = useCallback(() => dispatch({ type: TRANSPORT_ACTIONS.TOGGLE_LOOP }),       []);
  const setBpm           = useCallback((bpm)  => dispatch({ type: TRANSPORT_ACTIONS.SET_BPM,           payload: bpm  }), []);
  const setMode          = useCallback((mode) => dispatch({ type: TRANSPORT_ACTIONS.SET_MODE,          payload: mode }), []);
  const setCurrentStep   = useCallback((step) => {
    stepIndexRef.current = step;
    dispatch({ type: TRANSPORT_ACTIONS.SET_CURRENT_STEP, payload: step });
  }, []);
  const setTimeSignature = useCallback((numerator, denominator) =>
    dispatch({ type: TRANSPORT_ACTIONS.SET_TIME_SIGNATURE, payload: { numerator, denominator } }),
  []);

  // ── State IO ──────────────────────────────────────────────────────────────
  const getState = useCallback(() => ({
    bpm:              state.bpm,
    timeSignature:    state.timeSignature,
    loopEnabled:      state.loopEnabled,
    metronomeEnabled: state.metronomeEnabled,
  }), [state.bpm, state.timeSignature, state.loopEnabled, state.metronomeEnabled]);

  const setState = useCallback((data) => {
    if (!data) return;
    stop();
    if (typeof data.bpm === "number")
      dispatch({ type: TRANSPORT_ACTIONS.SET_BPM, payload: data.bpm });
    if (data.timeSignature)
      dispatch({ type: TRANSPORT_ACTIONS.SET_TIME_SIGNATURE, payload: data.timeSignature });
    if (typeof data.loopEnabled === "boolean" && data.loopEnabled !== state.loopEnabled)
      dispatch({ type: TRANSPORT_ACTIONS.TOGGLE_LOOP });
    if (typeof data.metronomeEnabled === "boolean" && data.metronomeEnabled !== state.metronomeEnabled)
      dispatch({ type: TRANSPORT_ACTIONS.TOGGLE_METRONOME });
  }, [stop, state.loopEnabled, state.metronomeEnabled]);

  const reset = useCallback(() => {
    stop();
    dispatch({ type: TRANSPORT_ACTIONS.SET_BPM,            payload: 120 });
    dispatch({ type: TRANSPORT_ACTIONS.SET_TIME_SIGNATURE, payload: { numerator: 4, denominator: 4 } });
  }, [stop]);

  // ── Context value ─────────────────────────────────────────────────────────
  const value = {
    ...state,
    play, pause, stop,
    setMode, toggleMetronome, toggleLoop,
    setBpm, setCurrentStep, setTimeSignature,
    getState, setState, reset,
  };

  return <TransportContext.Provider value={value}>{children}</TransportContext.Provider>;
}

export function useTransport() {
  const context = useContext(TransportContext);
  if (!context) throw new Error("useTransport must be used within a TransportProvider");
  return context;
}

export { TRANSPORT_ACTIONS };