import {useState } from 'react';
import { useGlobalColorContext } from '../../Contexts/UI/GlobalColorContext';

const SaveAsProjectModal = ({ onClose, onSaveAs }) => {
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const {colorsComponent} = useGlobalColorContext();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation du nom
    const trimmedName = projectName.trim();
    
    if (!trimmedName) {
      setError('Project name is required');
      return;
    }
    
    if (trimmedName.length < 2) {
      setError('Project name must be at least 2 characters');
      return;
    }
    
    if (trimmedName.length > 50) {
      setError('Project name must be less than 50 characters');
      return;
    }
    
    // Réinitialiser l'erreur
    setError('');
    
    // Appeler la fonction de sauvegarde avec le nom
    onSaveAs(trimmedName);
    onClose();
  };

  const handleInputChange = (e) => {
    setProjectName(e.target.value);
    // Effacer l'erreur quand l'utilisateur tape
    if (error) setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-10" style={{backgroundColor: colorsComponent.Background, color: colorsComponent.Text}}>
      <div className="p-6 rounded-xl shadow-xl w-full max-w-md relative bg-white border">
        <h2 className="text-2xl font-bold mb-4 text-black">Save Project As</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">
          <div>
            <label className="block text-sm font-medium mb-2">
              Project Name:
            </label>
            <input
              type="text"
              value={projectName}
              onChange={handleInputChange}
              placeholder="Enter project name..."
              className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 ${
                error 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              autoFocus
              maxLength={50}
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {projectName.length}/50 characters
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!projectName.trim()}
              className={`flex-1 px-4 py-2 rounded transition-colors ${
                projectName.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Save As
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
        
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default SaveAsProjectModal;