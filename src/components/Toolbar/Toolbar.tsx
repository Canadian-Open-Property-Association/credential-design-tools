import { useState, useRef } from 'react';
import { useVctStore } from '../../store/vctStore';
import { useAuthStore } from '../../store/authStore';
import LoginButton from '../Auth/LoginButton';
import VctLibrary from '../Library/VctLibrary';
import SaveToRepoModal from '../Library/SaveToRepoModal';

export default function Toolbar() {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showSaveToRepo, setShowSaveToRepo] = useState(false);
  const [projectName, setProjectName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const currentProjectName = useVctStore((state) => state.currentProjectName);
  const savedProjects = useVctStore((state) => state.savedProjects);
  const newProject = useVctStore((state) => state.newProject);
  const saveProject = useVctStore((state) => state.saveProject);
  const loadProject = useVctStore((state) => state.loadProject);
  const deleteProject = useVctStore((state) => state.deleteProject);
  const exportVct = useVctStore((state) => state.exportVct);
  const importVct = useVctStore((state) => state.importVct);

  const handleSave = () => {
    setProjectName(currentProjectName);
    setShowSaveDialog(true);
  };

  const handleSaveConfirm = () => {
    if (projectName.trim()) {
      saveProject(projectName.trim());
      setShowSaveDialog(false);
    }
  };

  const handleExport = () => {
    const json = exportVct();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProjectName.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          importVct(json);
        } catch (error) {
          alert('Failed to import VCT file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    e.target.value = '';
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-2">
        <button
          onClick={() => newProject()}
          className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-1"
        >
          <span>📄</span> New
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-1"
        >
          <span>💾</span> Save
        </button>
        <button
          onClick={() => setShowLoadDialog(true)}
          className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-1"
        >
          <span>📂</span> Load
        </button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <button
          onClick={handleImport}
          className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-1"
        >
          <span>📥</span> Import JSON
        </button>
        <button
          onClick={handleExport}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md flex items-center gap-1"
        >
          <span>📤</span> Export JSON
        </button>

        {/* GitHub Integration Section */}
        {isAuthenticated && (
          <>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <button
              onClick={() => setShowLibrary(true)}
              className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Library
            </button>
            <button
              onClick={() => setShowSaveToRepo(true)}
              className="px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded-md flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Save to Repo
            </button>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Login Button */}
        <LoginButton />

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Save Project</h3>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfirm}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Load Project</h3>
            {savedProjects.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No saved projects yet
              </p>
            ) : (
              <div className="space-y-2">
                {savedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        loadProject(project.id);
                        setShowLoadDialog(false);
                      }}
                    >
                      <p className="font-medium">{project.name}</p>
                      <p className="text-xs text-gray-500">
                        Updated: {new Date(project.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${project.name}"?`)) {
                          deleteProject(project.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VCT Library Modal */}
      <VctLibrary isOpen={showLibrary} onClose={() => setShowLibrary(false)} />

      {/* Save to Repo Modal */}
      <SaveToRepoModal isOpen={showSaveToRepo} onClose={() => setShowSaveToRepo(false)} />
    </>
  );
}
