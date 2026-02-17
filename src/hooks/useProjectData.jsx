// hooks/useProjectData.js
import { useChannels } from "../Contexts/features/ChannelProvider";
import { useTransport } from "../Contexts/features/TransportContext";
import { useStorage } from "../Contexts/system/StorageContext";


export default function useProjectData() {
    const { getChannelsState } = useChannels();
    const { transport, getTransportState } = useTransport();
    
    // Fonction pour collecter toutes les données actuelles
    const collectProjectData = () => {
        return {
            project: {
                bpm: transport.bpm || 120,
                timeSignature: transport.timeSignature || { numerator: 4, denominator: 4 },
                sampleRate: 44100,
                duration: transport.duration || 0,
            },
            channels: getChannelsState(), 
            transport: getTransportState(),
            arrangement: [], 
            history: {
                past: [],
                present: {},
                future: [],
            }
        };
    };
    
    return { collectProjectData };
}