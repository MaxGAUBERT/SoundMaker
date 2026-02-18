import { createContext, useContext, useState, useEffect } from "react";

const StorageContext = createContext(null);

export function StorageProvider({ children }) {

  const [savedProjects, setSavedProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);

  useEffect(loadFromDisk, []);

  function loadFromDisk() {
    const raw = localStorage.getItem("daw_projects");
    if (!raw) return;

    try {
      const projects = JSON.parse(raw);
      setSavedProjects(projects);
      if (projects[0]) setCurrentProjectId(projects[0].id);
    } catch {}
  }

  function persist(projects) {
    localStorage.setItem("daw_projects", JSON.stringify(projects));
  }

  function createProject(name, data) {
    // ✅ Crée l'objet directement, sans s'appeler elle-même
    const project = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data
    };

    const next = [...savedProjects, project];

    setSavedProjects(next);
    persist(next);
    setCurrentProjectId(project.id);

    return project;
  }

  function saveProject(id, data) {
    const next = savedProjects.map(p =>
      p.id === id
        ? { ...p, updatedAt: Date.now(), data }
        : p
    );

    setSavedProjects(next);
    persist(next);
  }

  function loadProject(id) {
    return savedProjects.find(p => p.id === id)?.data ?? null;
  }

  function deleteProject(id) {
    const next = savedProjects.filter(p => p.id !== id);

    setSavedProjects(next);
    persist(next);

    if (id === currentProjectId)
      setCurrentProjectId(next[0]?.id ?? null);
  }

  const values = {
    savedProjects,
    currentProjectId,
    setCurrentProjectId,
    createProject,
    saveProject,
    loadProject,
    deleteProject,
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