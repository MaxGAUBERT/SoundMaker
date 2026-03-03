import { createContext, useContext, useRef, useReducer, useEffect, useCallback } from "react";
import * as Tone from "tone";
import { useChannels } from "./ChannelProvider";
import { TRANSPORT_ACTIONS, initialState, transportReducer } from "../../reducers/transportReducer";
import { usePlaylist } from "./PlaylistProvider";
import { rowToNoteName } from "../../features/PianoRoll/utils/noteUtils";
import { usePlaylistStore } from "../../stores/usePlaylistStore";

const TransportContext = createContext();

export function TransportProvider({ children }) {
  const [state, dispatch] = useReducer(transportReducer, initialState);
  const { patterns, currentPatternID, width} = useChannels();
  const { playlistGrid } = usePlaylist();
  const pWidth = usePlaylistStore(s => s.pWidth);
  
  // song selection
  const isSelecting = usePlaylistStore(s => s.isSelecting);
  const startSelection = usePlaylistStore(s => s.startSelection);
  const selectionEnd = usePlaylistStore(s => s.selectionEnd);
  const loopRef = useRef(null);
  const metronomeSynthRef = useRef(null);
  const samplersRef = useRef(new Map());
  const stepIndexRef = useRef(0);
  const widthOfPlaylist = useRef(pWidth);

  // Refs 
  const metronomeEnabledRef = useRef(state.metronomeEnabled);
  const modeRef = useRef(state.mode);
  const isPlayingRef = useRef(state.isPlaying);
  const loopEnabledRef = useRef(state.loopEnabled);
  const widthRef = useRef(width);
  const patternsRef = useRef(patterns);
  const currentPatternIDRef = useRef(currentPatternID);
  const playlistGridRef = useRef(playlistGrid);
  const isSelectingRef = useRef(isSelecting);
  const startSelectionRef = useRef(startSelection);
  const selectionEndRef = useRef(selectionEnd);

  useEffect(() => { metronomeEnabledRef.current = state.metronomeEnabled; }, [state.metronomeEnabled]);
  useEffect(() => { modeRef.current = state.mode; }, [state.mode]);
  useEffect(() => { isPlayingRef.current = state.isPlaying; }, [state.isPlaying]);
  useEffect(() => { widthRef.current = width; }, [width]);
  useEffect(() => { patternsRef.current = patterns; }, [patterns]);
  useEffect(() => { currentPatternIDRef.current = currentPatternID; }, [currentPatternID]);
  useEffect(() => { playlistGridRef.current = playlistGrid; }, [playlistGrid]);
  useEffect(() => { 
    loopEnabledRef.current = state.loopEnabled; 
  }, [state.loopEnabled]);
  useEffect(() => { isSelectingRef.current = isSelecting; }, [isSelecting]);
  useEffect(() => { startSelectionRef.current = startSelection; }, [startSelection]);
  useEffect(() => { selectionEndRef.current = selectionEnd; }, [selectionEnd]);

  useEffect(() => {widthOfPlaylist.current = pWidth;}, [pWidth]);


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

  useEffect(() => {
  // ── Nettoyage systématique avant tout ────────────────────────────────────
  const cleanup = () => {
    if (loopRef.current) {
      loopRef.current.stop();
      loopRef.current.dispose();
      loopRef.current = null;
    }
    Tone.Transport.stop();
    Tone.Transport.cancel(); 
    Tone.Transport.position = 0;
    stepIndexRef.current = 0;
    dispatch({ type: TRANSPORT_ACTIONS.SET_CURRENT_STEP, payload: 0 });
  };

  if (!state.isPlaying) {
    cleanup();
    return;
  }

  const start = async () => {
    await Tone.start();

    // nettoyage
    cleanup();

    let step = 0;

    loopRef.current = new Tone.Loop((time) => {
      const mode      = modeRef.current;
      const w         = widthRef.current;
      const pats      = patternsRef.current;
      const curPatId  = currentPatternIDRef.current;
      const pg        = playlistGridRef.current;

      // ── Métronome ─────────────────────────────────────────────────────────
      if (metronomeEnabledRef.current && step % 4 === 0 && metronomeSynthRef.current) {
        metronomeSynthRef.current.triggerAttackRelease(
          step % w === 0 ? "C6" : "C5",
          "16n",
          time
        );
      }

      // ── Pattern mode ──────────────────────────────────────────────────────
      if (mode === "pattern") {
        const localStep = step % w;
        const pat = pats.find((p) => p.id === curPatId);

        if (pat) {
          pat.ch.forEach((ch) => {
            const sampler = samplersRef.current.get(ch.id);
            if (!sampler?.loaded) return;

            if (ch.pianoData?.length > 0) {
              ch.pianoData
                .filter((n) => n.start === localStep)
                .forEach((n) => {
                  const noteName = rowToNoteName(n.row);
                  const duration = new Tone.Time("16n").toSeconds() * n.length;
                  try {
                    sampler.triggerAttackRelease(noteName, duration, time);
                  } catch (err) {
                    console.error(`[PianoRoll] ${ch.id}:`, err);
                  }
                });
              return; 
            }

            // Step sequencer classique
            if (ch.grid?.[localStep]) {
              sampler.triggerAttackRelease("C5", "16n", time);
            }
          });
        }

        Tone.Draw.schedule(() => {
          dispatch({ type: TRANSPORT_ACTIONS.SET_CURRENT_STEP, payload: localStep });
          stepIndexRef.current = localStep;
        }, time);

        
        step = (step + 1) % w;
        return;
      }

      // ── Song mode ─────────────────────────────────────────────────────────
      if (mode === "song") {
        const patternLength = w;
        const sel   = isSelectingRef.current;
        const start = startSelectionRef.current;
        const end   = selectionEndRef.current;
        const HEADER_TO_GRID = widthOfPlaylist.current / 2;
        const offset = sel && start !== null
        ? Math.round(start / HEADER_TO_GRID)
        : 0;
        const totalCols = sel && start !== null
        ? Math.round((end - start + 1) / HEADER_TO_GRID)
        : pg?.[0]?.grid?.length ?? 0;
        console.log(HEADER_TO_GRID);
        pg?.[0]?.grid?.length ?? 0;
        if (!totalCols) return;

        
        const colIndex  = (Math.floor(step / patternLength) % totalCols) + offset;
        const localStep = step % patternLength;

        pg.forEach((track) => {
          const patternId = track.grid?.[colIndex];
          if (!patternId) return;

          const pat = pats.find((p) => p.id === patternId);
          if (!pat) return;

          pat.ch.forEach((ch) => {
            const sampler = samplersRef.current.get(ch.id);
            if (!sampler?.loaded) return;

            if (ch.pianoData?.length > 0) {
              ch.pianoData
                .filter((n) => n.start === localStep)
                .forEach((n) => {
                  const noteName = rowToNoteName(n.row);
                  const duration = new Tone.Time("16n").toSeconds() * n.length;
                  try {
                    sampler.triggerAttackRelease(noteName, duration, time);
                  } catch (err) {
                    console.error(`[PianoRoll Song] ${ch.id}:`, err);
                  }
                });
              return;
            }

            if (ch.grid?.[localStep]) {
              sampler.triggerAttackRelease("C5", "16n", time);
            }
          });
        });

        Tone.Draw.schedule(() => {
          const globalStep = (step % (patternLength * totalCols)) + (offset * patternLength);
          dispatch({ type: TRANSPORT_ACTIONS.SET_CURRENT_STEP, payload: globalStep });
          stepIndexRef.current = globalStep;
        }, time);

        const totalSteps = patternLength * totalCols;

        step = (step + 1) % totalSteps;

        console.log({
        isSelecting,
        startSelection,
        selectionEnd,
        HEADER_TO_GRID,
        totalCols,
        offset,
        pWidth: widthOfPlaylist.current
      });

      console.log(pWidth);
       
      }
    }, "16n");

    loopRef.current.start(0);
    Tone.Transport.start();
  };

  start();

  return cleanup; 
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
    stepIndexRef.current = isSelecting ? startSelection : 0;
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