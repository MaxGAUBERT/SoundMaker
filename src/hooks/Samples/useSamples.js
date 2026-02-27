export const DRUM_SAMPLES = {
    kick:  '/Audio/Drums/Progressive_Kick.wav',
    snare: '/Audio/Drums/VEC2_Snares_020.wav',
    hihat: '/Audio/Drums/VEE_Open_Hihat_06.wav',
    clap:  '/Audio/Drums/VEH3_Claps_011.wav',
};


export const DEFAULT_CHANNELS = [
  { id: 0, name: "Kick",  sampleMap: { C5: DRUM_SAMPLES.kick  } },
  { id: 1, name: "Snare", sampleMap: { C5: DRUM_SAMPLES.snare } },
  { id: 2, name: "Hihat", sampleMap: { C5: DRUM_SAMPLES.hihat } },
  { id: 3, name: "Clap",  sampleMap: { C5: DRUM_SAMPLES.clap  } },
];