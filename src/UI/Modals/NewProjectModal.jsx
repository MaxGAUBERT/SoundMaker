import { useState } from "react";
import { useGlobalColorContext } from '../../Contexts/UI/GlobalColorContext';

export default function NewProjectModal({onClose, onCreate}) {
  const {colorsComponent} = useGlobalColorContext();
  const [newProjectName, setNewProjectName] = useState("");

  const handleCreateProject = () => {
    if (newProjectName.trim() === '') return;
    onCreate(newProjectName);
    onClose();
  }

    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" >
      <div style={{backgroundColor: colorsComponent.BackgroundIO, color: colorsComponent.Text}} className=" p-6 rounded-xl shadow-xl w-full max-w-md relative border z-50">
        <h2 className="text-2xl font-bold mb-4 text-black">Create New Project</h2>
        <form className="space-y-4 text-gray-600">
          <input
            type="text"
            placeholder="Project Name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          />
          <button
            type="button"
            onClick={handleCreateProject}
            className="px-4 py-2 rounded hover:bg-gray-400"
          >
            Create
          </button>
        </form>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 hover:text-black"
        >
          ✕
        </button>
      </div>
    </div>
    )
}