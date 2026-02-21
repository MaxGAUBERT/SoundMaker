import { useEffect } from 'react';
import { useUndoManagerContext } from './UndoManagerContext';
import { useChannelStore } from '../../stores/useChannelStore';
import { usePlaylistStore } from '../../stores/usePlaylistStore';

export function UndoManagerBridge() {
    const { setChannelState, setPlaylistState, channelState, playlistState } =
        useUndoManagerContext();

    const setChannelCommit  = useChannelStore(s => s._setCommit);
    const setPlaylistCommit = usePlaylistStore(s => s._setCommit);
    const applyChannelSnap  = useChannelStore(s => s._applySnapshot);
    const applyPlaylistSnap = usePlaylistStore(s => s._applySnapshot);

    useEffect(() => {
        setChannelCommit((scope, next) => {
            setChannelState(draft => Object.assign(draft, next));
        });

        setPlaylistCommit((scope, next) => {
            setPlaylistState(draft => Object.assign(draft, next));
        });

        return () => {
        
            setChannelCommit(null);
            setPlaylistCommit(null);
        };
    }, [setChannelState, setPlaylistState, setChannelCommit, setPlaylistCommit]);
    
    useEffect(() => {
        applyChannelSnap(channelState);
    }, [channelState]); 

    useEffect(() => {
        applyPlaylistSnap(playlistState);
    }, [playlistState]); 

    return null; 
}