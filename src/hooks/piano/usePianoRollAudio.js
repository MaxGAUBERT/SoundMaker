import { useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";
import { useTransport} from "../../Contexts/features/TransportContext";
import { useChannelStore} from "../../stores/useChannelStore";
import { rowToNoteName } from "../../features/PianoRoll/utils/noteUtils";

export function usePianoRollAudio(steps) {
  const {isPlaying, mode} = useTransport();
  const selectedPatternID = useChannelStore((s) => s.currentPatternID);
  const pattern = useChannelStore((s) => s.pattern);

  // Refs stables — évitent de recréer la Loop à chaque changement d'pattern
  const patternRef    = useRef(pattern);
  const selectedPatternIDRef = useRef(selectedPatternID);
  const playModeRef          = useRef(mode);
  const widthRef           = useRef(steps);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => { patternRef.current    = pattern;    }, [pattern]);
  useEffect(() => { selectedPatternIDRef.current = selectedPatternID; }, [selectedPatternID]);
  useEffect(() => { playModeRef.current = mode; }, [mode]);
  useEffect(() => { widthRef.current           = steps;           }, [steps]);
  useEffect(() => {isPlayingRef.current = isPlaying;}, [isPlaying]);

  const stepRef       = useRef(0);
  const setStepRef    = useRef(null);
  const loopRef       = useRef(null);

  // Le composant injecte son setter de currentStep ici
  const registerStepSetter = useCallback((setter) => {
    setStepRef.current = setter;
  }, []);

  useEffect(() => {
    if (!isPlaying || mode !== "pattern") {
      // Nettoyage
      loopRef.current?.dispose();
      loopRef.current = null;
      Tone.Transport.stop();
      Tone.Transport.position = 0;
      stepRef.current = 0;
      setStepRef.current?.(0);
      return;
    }

    if (loopRef.current) {
      console.log("detected loop ref as:", loopRef.current);
      return;
    }

    loopRef.current = new Tone.Loop((time) => {
      const step       = stepRef.current;
      const iList      = patternRef.current;
      const patternID  = selectedPatternIDRef.current;
      const pMode      = playModeRef.current;
      const cols       = widthRef.current;

      setStepRef.current?.(step);

      if (pMode === "Pattern") {
        Object.entries(iList).forEach(([name, data]) => {
          if (data.muted) return;
          const sampler    = data.sampler;
          const pianoData  = data.pianoData?.[patternID] ?? [];

          pianoData
            .filter((n) => n.start === step)
            .forEach((n) => {
              const noteName = rowToNoteName(n.row);
              const duration = new Tone.Time("4n").toSeconds() * n.length;
              try {
                if (sampler?.loaded) sampler.triggerAttackRelease(noteName, duration, time);
              } catch (err) {
                console.error(`[PianoRoll] Playback error ${name}:`, err);
              }
            });
        });
      }

      stepRef.current = (step + 1) % cols;
    }, "16n");

    loopRef.current.start(0);
    Tone.Transport.start();

    return () => {
      loopRef.current?.dispose();
      loopRef.current = null;
    };
  }, [isPlaying, mode]);

  // Arrêt propre
  useEffect(() => {
    if (!isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.position = 0;
      stepRef.current = 0;
      setStepRef.current?.(0);
    }
  }, [isPlaying]);

  return { registerStepSetter };
}