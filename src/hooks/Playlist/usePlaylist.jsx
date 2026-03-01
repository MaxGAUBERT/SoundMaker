import { useRef, useState } from "react";


export default function usePlaylist(){
    const selectionRef = useRef({
    start: null,
    end: null
    });

    const isSelecting = useRef(false);
    const holdTimer = useRef(null);
    const [selectedIds, setSelectedIds] = useState(new Set());



    return {
        selectionRef, isSelecting, holdTimer, selectedIds, setSelectedIds
    }
}