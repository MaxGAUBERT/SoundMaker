import { createContext, useContext, useState, useEffect } from "react";

const StorageContext = createContext(null);

export function StorageProvider({ children }) {
    const [currentProjectId, setCurrentProjectId] = useState(null);
    const [savedProjects, setSavedProjects] = useState([
    {
        id: 0,
        name: "Untitled Project",
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        datas: {
            // Paramètres globaux
            project: {
                bpm: 120,
                timeSignature: { numerator: 4, denominator: 4 },
                sampleRate: 44100,
                duration: 0, // en secondes
            },
            
            // Channels/Pistes
            channels: [
                {
                    id: "channel_1",
                    name: "Channel 1",
                    color: "#FF5733",
                    volume: 0.8,
                    pan: 0,
                    mute: false,
                    solo: false,
                }
            ],
            
            // Transport
            transport: {
                isPlaying: false,
                currentTime: 0,
                loopStart: 0,
                loopEnd: 0,
                loopEnabled: false,
            },
            
            // Timeline/Arrangement
            arrangement: [
                {
                    id: "clip_1",
                    channelId: "channel_1",
                    startTime: 0,
                    duration: 4,
                    audioBuffer: null, // ou référence au fichier
                    midi: null, // données MIDI si applicable
                }
            ],
            
            // Historique pour Undo/Redo
            history: {
                past: [],
                present: {},
                future: [],
            }
        }
    }
    ]);

     function updateProjectChannels(channels) {
        if (!currentProjectId) return;
        
        const updatedProjects = savedProjects.map(project => 
            project.id === currentProjectId
                ? {
                    ...project,
                    lastModified: new Date().toISOString(),
                    datas: {
                        ...project.datas,
                        channels
                    }
                }
                : project
        );
        
        setSavedProjects(updatedProjects);
        saveProjectsToStorage(updatedProjects);
    }

     function updateProjectTransport(transport) {
        if (!currentProjectId) return;
        
        const updatedProjects = savedProjects.map(project => 
            project.id === currentProjectId
                ? {
                    ...project,
                    lastModified: new Date().toISOString(),
                    datas: {
                        ...project.datas,
                        transport
                    }
                }
                : project
        );
        
        setSavedProjects(updatedProjects);
        saveProjectsToStorage(updatedProjects);
    }

    function updateProjectSettings(settings) {
        if (!currentProjectId) return;
        
        const updatedProjects = savedProjects.map(project => 
            project.id === currentProjectId
                ? {
                    ...project,
                    lastModified: new Date().toISOString(),
                    datas: {
                        ...project.datas,
                        project: {
                            ...project.datas.project,
                            ...settings
                        }
                    }
                }
                : project
        );
        
        setSavedProjects(updatedProjects);
        saveProjectsToStorage(updatedProjects);
    }

    function getCurrentProjectData() {
        const project = savedProjects.find(p => p.id === currentProjectId);
        return project?.datas || null;
    }



    // Charger les projets au démarrage
    useEffect(() => {
        loadProjectsFromStorage();
    }, []);

    function loadProjectsFromStorage() {
        const stored = localStorage.getItem("daw_projects");
        if (stored) {
            try {
                const projects = JSON.parse(stored);
                setSavedProjects(projects);
            } catch (error) {
                console.error("Error loading projects:", error);
            }
        }
    }

    function saveProjectsToStorage(projects) {
        try {
            localStorage.setItem("daw_projects", JSON.stringify(projects));
        } catch (error) {
            console.error("Error saving projects:", error);
        }
    }

    function createNewProject(name = "Untitled Project") {
        const newProject = {
            id: Date.now(),
            name,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            datas: {
                project: {
                    bpm: 120,
                    timeSignature: { numerator: 4, denominator: 4 },
                    sampleRate: 44100,
                    duration: 0,
                },
                channels: [],
                transport: {
                    isPlaying: false,
                    currentTime: 0,
                    loopStart: 0,
                    loopEnd: 0,
                    loopEnabled: false,
                },
                arrangement: [],
                history: {
                    past: [],
                    present: {},
                    future: [],
                }
            }
        };
        
        const updatedProjects = [...savedProjects, newProject];
        setSavedProjects(updatedProjects);
        saveProjectsToStorage(updatedProjects);
        setCurrentProjectId(newProject.id);
        console.log(saveCurrentProject);
        return newProject;
    }

    function saveCurrentProject(projectData) {
        const updatedProjects = savedProjects.map(project => 
            project.id === currentProjectId
                ? {
                    ...project,
                    lastModified: new Date().toISOString(),
                    datas: projectData
                }
                : project
        );
        
        setSavedProjects(updatedProjects);
        saveProjectsToStorage(updatedProjects);
    }

    function loadProject(projectId) {
        const project = savedProjects.find(p => p.id === projectId);
        if (project) {
            setCurrentProjectId(projectId);
            return project.datas;
        }
        return null;
    }

    function deleteProject(projectId) {
        const updatedProjects = savedProjects.filter(p => p.id !== projectId);
        setSavedProjects(updatedProjects);
        saveProjectsToStorage(updatedProjects);
        
        if (currentProjectId === projectId) {
            setCurrentProjectId(null);
        }
    }

    function deleteAllProjects(){
        setSavedProjects([]);
        setCurrentProjectId(null);
        console.log(savedProjects);

    }

    function getCurrentProject() {
        return savedProjects.find(p => p.id === currentProjectId);
    }

    const values = {
        savedProjects, setSavedProjects,
        currentProjectId,
        createNewProject,
        saveCurrentProject,
        loadProject,
        deleteProject,
        deleteAllProjects,
        getCurrentProject,
        saveProjectsToStorage,
        updateProjectChannels, 
        updateProjectSettings,
        updateProjectTransport
    };

    return (
        <StorageContext.Provider value={values}>
            {children}
        </StorageContext.Provider>
    );
}

export function useStorage() {
    const context = useContext(StorageContext);
    if (!context) {
        throw new Error('useStorage must be used within StorageProvider');
    }
    return context;
}