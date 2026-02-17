import { createContext, useContext, useState } from "react";
import { useChannels } from "../../Contexts/features/ChannelProvider";
import NewProjectModal from "../../UI/Modals/NewProjectModal";
import LoadProjectModal from "../../UI/Modals/LoadProjectModal";
import SaveAsProjectModal from "../../UI/Modals/SaveAsProjectModal";
import { useStorage } from "../system/StorageContext";

const MenuActionsContext = createContext(null); 

export function MenuActionsProvider({ children }) { 
    const { undo, redo, canUndo, canRedo, getChannelStates } = useChannels();
    const {createNewProject, loadProject, saveCurrentProject, collectProjectData} = useStorage();
    const [showModal, setShowModal] = useState({
        "New" : false,
        "Save As": false,
        "Load": false,
        "Settings": false,
        "Exit": false
    });
    
    const actions = {
        "New Project": () => {
            setShowModal({"New": true});
        },
        "Load Project": () => {
            setShowModal({"Load": true});
        },
        "Save": () => {
            // ✅ Collecter toutes les données
            const channelData = getChannelStates();
            
            const projectData = {
                project: {
                    bpm: 120, // À récupérer depuis TransportProvider si vous l'avez
                    timeSignature: { numerator: 4, denominator: 4 },
                    sampleRate: 44100,
                    duration: 0,
                },
                channels: channelData.patterns, // Les patterns avec leurs channels
                currentPatternID: channelData.currentPatternID,
                width: channelData.width,
                transport: {
                    isPlaying: false,
                    currentTime: 0,
                    loopStart: 0,
                    loopEnd: 0,
                    loopEnabled: false,
                },
                arrangement: [],
            };
            
            saveCurrentProject(projectData);
            console.log("Project saved!", projectData);
        },
        "Save As": () => {
            // Créer une copie du projet actuel
            const projectData = collectProjectData;
            createNewProject("Copy of Project");
            saveCurrentProject(projectData);
        },
        "Settings": () => {
            setShowModal({"Settings": true});
        },
        "Exit": () => {
            console.log("Exit");
        },
        "Undo": () => undo(),
        "Redo": () => redo()
    };

    const executeAction = (actionKey) => {
        const action = actions[actionKey];
        
        if (action) {
            action();
        } else {
            console.warn(`Action "${actionKey}" not found`);
        }
    };
    
    const values = {
        executeAction,
        actions,
        canUndo,
        canRedo
    };

    return (
        <MenuActionsContext.Provider value={values}>
            {children}
            {showModal["New"] && (
                <NewProjectModal 
                    onClose={() => setShowModal({"New": false})}
                    onCreate={createNewProject}
                />
            )}

            {showModal["Load"] && (
                <LoadProjectModal 
                    onClose={() => setShowModal({"Load": false})}
                    onLoad={loadProject}
                />
            )}

            {showModal["Save As"] && (
                <SaveAsProjectModal 
                    onClose={() => setShowModal({"Save As": false})}
                    onSaveAs={saveCurrentProject}
                />
            )}
        </MenuActionsContext.Provider>
    );
}

export function useMenuActions() { 
    const context = useContext(MenuActionsContext);
    if (!context) {
        throw new Error('useMenuActions must be used within MenuActionsProvider');
    }
    return context;
}