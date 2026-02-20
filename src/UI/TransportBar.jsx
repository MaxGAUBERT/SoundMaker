import { useTransport } from "../Contexts/features/TransportContext"
import { IoPause, IoPlay, IoStop } from "react-icons/io5";
import { PiMetronomeFill } from "react-icons/pi";


export default function TransportBar(){
    const { play, isPlaying, pause, stop, toggleMetronome, metronomeEnabled,
        toggleLoop, loopEnabled, bpm, setBpm, state} = useTransport();


    return (
    
            <div className="flex flex-row">
                <button onClick={play} disabled={isPlaying}>
                    <IoPlay title="Play"/>
                </button>

                <button onClick={pause} disabled={!isPlaying}>
                    <IoPause title="Pause"/>
                </button>

                <button onClick={stop}>
                    <IoStop title="Stop"/>
                </button>

                <button
                onClick={toggleMetronome}
                className={`px-2 md:px-3 py-1.5 rounded text-sm transition-colors ${
                    metronomeEnabled
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Metronome"
                >
                <span className="hidden md:inline"><PiMetronomeFill title="metronome"/></span>
                </button>

                 <button
                onClick={toggleLoop}
                className={`px-2 md:px-3 py-1.5 rounded text-sm transition-colors ${
                    loopEnabled
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Loop"
                >
                <span className="md:hidden">🔁</span>
                <span className="hidden md:inline">🔁 Loop</span>
                </button>

                <input
                    type="number"
                    value={bpm}
                    min={5}
                    max={300}
                    step={1}
                    onChange={(e) => {

                        let v = Number(e.target.value);

                        if (Number.isNaN(v)) return;

                        v = Math.max(5, Math.min(300, v));

                        setBpm(v);
                }}
                    />
            </div>
    
    )
}