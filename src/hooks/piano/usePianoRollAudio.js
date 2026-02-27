import { useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";
import { useTransport} from "../../Contexts/features/TransportContext";
import { useChannelStore} from "../../stores/useChannelStore";
import { rowToNoteName } from "../../features/PianoRoll/utils/noteUtils";

export function usePianoRollAudio(numCols) {
  const { isPlaying, playMode } = useTransport();
  const selectedPatternID = useChannelStore((s) => s.selectedPatternID);
  const pattern = useChannelStore((s) => s.pattern);

  // Refs stables — évitent de recréer la Loop à chaque changement d'pattern
  const patternRef    = useRef(pattern);
  const selectedPatternIDRef = useRef(selectedPatternID);
  const playModeRef          = useRef(playMode);
  const numColsRef           = useRef(numCols);

  useEffect(() => { patternRef.current    = pattern;    }, [pattern]);
  useEffect(() => { selectedPatternIDRef.current = selectedPatternID; }, [selectedPatternID]);
  useEffect(() => { playModeRef.current          = playMode;          }, [playMode]);
  useEffect(() => { numColsRef.current           = numCols;           }, [numCols]);

  const stepRef       = useRef(0);
  const setStepRef    = useRef(null); // setter exposé pour le playhead UI
  const loopRef       = useRef(null);

  // Le composant injecte son setter de currentStep ici
  const registerStepSetter = useCallback((setter) => {
    setStepRef.current = setter;
  }, []);

  useEffect(() => {
    if (!isPlaying || playMode !== "Pattern") {
      // Nettoyage
      loopRef.current?.dispose();
      loopRef.current = null;
      Tone.Transport.stop();
      Tone.Transport.position = 0;
      stepRef.current = 0;
      setStepRef.current?.(0);
      return;
    }

    if (loopRef.current) return; // déjà actif

    loopRef.current = new Tone.Loop((time) => {
      const step       = stepRef.current;
      const iList      = patternRef.current;
      const patternID  = selectedPatternIDRef.current;
      const pMode      = playModeRef.current;
      const cols       = numColsRef.current;

      setStepRef.current?.(step);

      if (pMode === "Pattern") {
        Object.entries(iList).forEach(([name, data]) => {
          if (data.muted) return;
          const sampler    = selectedPatternID.sampler;
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
  }, [isPlaying, playMode]);

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