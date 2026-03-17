import { useTransport } from "../Contexts/features/TransportContext"
import { IoPause, IoPlay, IoStop } from "react-icons/io5";
import { PiMetronomeFill } from "react-icons/pi";
import { SlLoop } from "react-icons/sl";
import { FaItunesNote } from "react-icons/fa";
import { BiSolidPlaylist } from "react-icons/bi";
import { useSettings } from "../Contexts/system/SettingsContexts";

export default function TransportBar(){
    const { play, isPlaying, pause, stop, toggleMetronome, metronomeEnabled,
        toggleLoop, loopEnabled, mode, setMode} = useTransport();
    
        const {settings, updateSetting} = useSettings();

    return (
    
            <div className="flex flex-row">
                <button onClick={play} disabled={isPlaying} title="Play">
                    
                    <IoPlay title="Play"/>
                </button>

                <button onClick={pause} disabled={!isPlaying} title="Pause">
                    <IoPause title="Pause"/>
                </button>

                <button onClick={stop} title="stop">
                    <IoStop title="Stop"/>
                </button>

                <button
                title="Toggle mode"
                onClick={() => setMode(mode === "pattern" ? "song" : "pattern")}
                >
                {mode === "pattern" ? <FaItunesNote title="pattern mode"/> : <BiSolidPlaylist title="song mode"/>}
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
                <span className="md:hidden"><SlLoop title="Loop"/></span>
                <span className="hidden md:inline"><SlLoop title="Loop"/></span>
                </button>

                <input
                    type="number"
                    value={settings.bpm}
                    min={1}
                    max={300}
                    step={1}
                    onChange={(e) => updateSetting("bpm", Number(e.target.value))}
                    />
            </div>
    
    )
}