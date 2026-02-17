import { useState } from 'react';
import { useStorage } from '../../Contexts/system/StorageContext';

export default function LoadProjectModal({ onClose, onLoad}) {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const {savedProjects, deleteProject, deleteAllProject} = useStorage();

  const handleLoadProject = (projectId) => {
    onLoad(projectId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" >
      <div className="p-6 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] relative overflow-y-auto bg-white border">
        <h2 className="text-2xl font-bold mb-4 text-black">Load Project</h2>
         <button 
            onClick={(e) => {
              e.stopPropagation();
              deleteAllProject;
            }}
            className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
          >
            Delete All Project
          </button>
        
        {savedProjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No saved projects found</p>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">Select a project to load:</p>
            
            <div className="max-h-96 overflow-y-auto space-y-2">
              {savedProjects.map(project => (
                <div
                  key={project.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedProjectId === project.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{project?.name}</h3>
                      <div className="text-sm text-gray-600 mt-1 space-y-1">
                        {project.createdAt && (
                          <p>Created: {new Date(project.createdAt).toLocaleString()}</p>
                        )}
                        {project.lastSaved && (
                          <p>Last saved: {new Date(project.lastSaved).toLocaleString()}</p>
                        )}
                        <div className="flex gap-4">
                          {project.patterns && (
                            <span>Patterns: {project.patterns.length}</span>
                          )}
                          {project.numSteps && (
                            <span>Steps: {project.numSteps}</span>
                          )}
                          {project.instrumentList && (
                            <span>Instruments: {Object.keys(project.instrumentList).length}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadProject(project.id);
                      }}
                      className="ml-4 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Load
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedProjectId && (
              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => handleLoadProject(selectedProjectId)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Load Selected Project
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
        
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
        >
          ✕
        </button>
      </div>
    </div>
  );
}