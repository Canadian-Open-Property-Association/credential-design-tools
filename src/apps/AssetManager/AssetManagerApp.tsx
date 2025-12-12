import { useState, useEffect } from 'react';
import { useAssetManagerStore, reloadAssetProjects } from '../../store/assetManagerStore';
import { useAppTracking } from '../../hooks/useAppTracking';
import { ASSET_TYPE_CONFIG } from '../../types/asset';
import AssetToolbar from './components/AssetToolbar';
import AssetForm from './components/AssetForm';
import AssetPreview from './components/AssetPreview';

export default function AssetManagerApp() {
  useAppTracking('asset-manager', 'Asset Manager');

  // Load projects from server on mount
  useEffect(() => {
    reloadAssetProjects();
  }, []);

  // Reset to welcome screen when entering the app
  const closeProject = useAssetManagerStore((state) => state.closeProject);
  useEffect(() => {
    closeProject();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isEditing = useAssetManagerStore((state) => state.isEditing);
  const savedProjects = useAssetManagerStore((state) => state.savedProjects);
  const newAsset = useAssetManagerStore((state) => state.newAsset);
  const loadProject = useAssetManagerStore((state) => state.loadProject);
  const deleteProject = useAssetManagerStore((state) => state.deleteProject);
  const isDirty = useAssetManagerStore((state) => state.isDirty);
  const loadEntities = useAssetManagerStore((state) => state.loadEntities);

  const [showLoadModal, setShowLoadModal] = useState(false);

  // Load entities on mount
  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  const handleLoad = (id: string) => {
    if (isDirty && !confirm('You have unsaved changes. Load anyway?')) {
      return;
    }
    loadProject(id);
    setShowLoadModal(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this asset project?')) {
      await deleteProject(id);
    }
  };

  // Show welcome screen if not editing
  if (!isEditing) {
    return (
      <div className="flex flex-col h-full bg-gray-100">
        {/* Welcome Screen */}
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-lg">
            <div className="mb-8">
              <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome to Asset Manager</h2>
              <p className="text-gray-500">Manage logos, backgrounds, and icons for your credentials and entities</p>
            </div>

            <div className="flex gap-4 justify-center">
              {/* Create New */}
              <button
                onClick={() => newAsset()}
                className="flex flex-col items-center gap-3 px-8 py-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <span className="block font-medium text-gray-800">Upload New</span>
                  <span className="text-sm text-gray-500">Add an asset</span>
                </div>
              </button>

              {/* Open Existing */}
              <button
                onClick={() => setShowLoadModal(true)}
                className="flex flex-col items-center gap-3 px-8 py-6 bg-white border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <div>
                  <span className="block font-medium text-gray-800">Open Existing</span>
                  <span className="text-sm text-gray-500">{savedProjects.length} saved asset{savedProjects.length !== 1 ? 's' : ''}</span>
                </div>
              </button>
            </div>
          </div>
        </main>

        {/* Load Modal */}
        {showLoadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Open Asset Project</h3>
              {savedProjects.length === 0 ? (
                <p className="text-gray-500 text-sm">No saved assets yet.</p>
              ) : (
                <ul className="space-y-2">
                  {savedProjects.map((project) => (
                    <li
                      key={project.id}
                      onClick={() => handleLoad(project.id)}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {project.asset.localUri && (
                          <img
                            src={project.asset.localUri}
                            alt={project.name}
                            className="w-10 h-10 object-contain bg-gray-100 rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium">{project.name}</div>
                          <div className="text-xs text-gray-500">
                            {ASSET_TYPE_CONFIG[project.asset.type]?.label || project.asset.type}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDelete(project.id, e)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowLoadModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Toolbar */}
      <AssetToolbar />

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Form Panel */}
        <div className="w-1/2 border-r border-gray-200 bg-white overflow-y-auto p-6">
          <AssetForm />
        </div>

        {/* Preview Panel */}
        <div className="w-1/2 bg-gray-50 overflow-y-auto p-6">
          <AssetPreview />
        </div>
      </main>
    </div>
  );
}
