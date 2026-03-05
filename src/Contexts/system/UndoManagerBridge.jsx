import { useEffect } from 'react';
import { useUndoManagerContext } from './UndoManagerContext';
import { useChannelStore } from '../../stores/useChannelStore';

export function UndoManagerBridge() {
    const { setChannelState, channelState } = useUndoManagerContext();

    const setChannelCommit = useChannelStore(s => s._setCommit);
    const applyChannelSnap = useChannelStore(s => s._applySnapshot);

    useEffect(() => {
        setChannelCommit((scope, next) => {
            setChannelState(draft => {
                Object.keys(next).forEach(key => {
                    draft[key] = next[key];
                });
            });
        });

        return () => setChannelCommit(null);
    }, [setChannelState, setChannelCommit]);

    useEffect(() => {
        if (channelState) applyChannelSnap(channelState);
    }, [channelState]);

    return null;
}