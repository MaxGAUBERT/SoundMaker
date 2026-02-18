import { createContext, useContext, useState } from "react";

import { useChannels } from "../../Contexts/features/ChannelProvider";
import useProjectManager from "../../hooks/useProjectManager";

import NewProjectModal from "../../UI/Modals/NewProjectModal";
import LoadProjectModal from "../../UI/Modals/LoadProjectModal";
import SaveAsProjectModal from "../../UI/Modals/SaveAsProjectModal";

const MenuActionsContext = createContext(null);

export function MenuActionsProvider({ children }) {

  const { undo, redo, canUndo, canRedo } = useChannels();

  const { save, saveAs, load, newProject } = useProjectManager(); 

  const [showModal, setShowModal] = useState({
    New: false,
    Load: false,
    SaveAs: false,
    Settings: false,
    Exit: false
  });

  const open  = (key) => setShowModal(prev => ({ ...prev, [key]: true }));
  const close = (key) => setShowModal(prev => ({ ...prev, [key]: false }));

  const actions = {
    "New Project": () => open("New"),
    "Load Project": () => open("Load"),
    "Save":        () => save(),
    "Save As":     () => open("SaveAs"),
    "Settings":    () => open("Settings"),
    "Exit":        () => { if (confirm("Exit without saving?")) window.close(); },
    "Undo":        undo,
    "Redo":        redo
  };

  const executeAction = (key) => {
    const fn = actions[key];
    if (fn) fn();
    else console.warn("Unknown action:", key);
  };

  return (
    <MenuActionsContext.Provider
      value={{ executeAction, actions, canUndo, canRedo }}
    >
      {children}

      {/* New Project */}
      {showModal.New && (
        <NewProjectModal
          onClose={() => close("New")}
          onCreate={(name) => {
            newProject();   
            saveAs(name);   
            close("New");
          }}
        />
      )}

      {/* Load */}
      {showModal.Load && (
        <LoadProjectModal
          onClose={() => close("Load")}
          onLoad={(id) => {
            load(id);     
            close("Load");
          }}
        />
      )}

      {/* Save As */}
      {showModal.SaveAs && (
        <SaveAsProjectModal
          onClose={() => close("SaveAs")}
          onSaveAs={(name) => {
            saveAs(name);   
            close("SaveAs");
          }}
        />
      )}

    </MenuActionsContext.Provider>
  );
}

export function useMenuActions() {
  const ctx = useContext(MenuActionsContext);
  if (!ctx) throw new Error("useMenuActions must be used inside provider");
  return ctx;
}