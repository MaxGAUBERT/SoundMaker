import { useRef, useState } from "react";


export default function useSongSelection(){
    const selectionRef = useRef({
    start: null,
    end: null
    });

    const isSelecting = useRef(false);
    const holdTimer = useRef(null);
    const [selectedIds, setSelectedIds] = useState(new Set());

    const clearSelection = () => {
        setSelectedIds(new Set());
        selectionRef.current = {start: null, end: null};
    }

    return {
        selectionRef, isSelecting, holdTimer, selectedIds, setSelectedIds, clearSelection
    }
}