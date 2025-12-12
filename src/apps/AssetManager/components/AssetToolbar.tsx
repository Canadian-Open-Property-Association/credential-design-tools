import { useState } from 'react';
import { useAssetManagerStore } from '../../../store/assetManagerStore';
import { useAuthStore } from '../../../store/authStore';
import PublishAssetModal from './PublishAssetModal';

export default function AssetToolbar() {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const currentAsset = useAssetManagerStore((state) => state.currentAsset);
  const currentProjectName = useAssetManagerStore((state) => state.currentProjectName);
  const currentProjectId = useAssetManagerStore((state) => state.currentProjectId);
  const isDirty = useAssetManagerStore((state) => state.isDirty);
  const saveProject = useAssetManagerStore((state) => state.saveProject);
  const newAsset = useAssetManagerStore((state) => state.newAsset);

  const handleNew = () => {
    if (isDirty && !confirm('You have unsaved changes. Create new asset anyway?')) {
      return;
    }
    newAsset();
  };

  const handleSave = async () => {
    if (currentProjectId) {
      await saveProject(currentProjectName);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } else {
      setSaveName(currentProjectName);
      setShowSaveModal(true);
    }
  };

  const handleSaveConfirm = async () => {
    if (saveName.trim()) {
      await saveProject(saveName.trim());
      setShowSaveModal(false);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    }
  };

  const canPublish = currentAsset && currentAsset.localUri && currentAsset.entityId && currentAsset.type;

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-2">
        <button
          onClick={handleNew}
          className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New
        </button>

        <button
          onClick={handleSave}
          disabled={!currentAsset?.localUri}
          className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1 transition-colors ${
            showSaveSuccess
              ? 'text-green-700 bg-green-100'
              : !currentAsset?.localUri
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {showSaveSuccess ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save
            </>
          )}
        </button>

        {/* Asset Type Badge */}
        {currentAsset?.type && (
          <>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
              currentAsset.type === 'entity-logo'
                ? 'bg-purple-100 text-purple-700 border-purple-200'
                : currentAsset.type === 'credential-background'
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-green-100 text-green-700 border-green-200'
            }`}>
              {currentAsset.type === 'entity-logo'
                ? 'Entity Logo'
                : currentAsset.type === 'credential-background'
                ? 'Background'
                : 'Icon'}
            </span>
          </>
        )}

        {/* Publish to GitHub - far right */}
        {isAuthenticated && (
          <>
            <div className="flex-1" />
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <button
              onClick={() => setShowPublishModal(true)}
              disabled={!canPublish}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1 ${
                canPublish
                  ? 'text-white bg-green-600 hover:bg-green-700'
                  : 'text-gray-400 bg-gray-200 cursor-not-allowed'
              }`}
              title={!canPublish ? 'Upload an image and select an entity first' : 'Create PR to publish asset to repository'}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Publish to GitHub
            </button>
          </>
        )}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Save Asset</h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Asset name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
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

      {/* Publish Modal */}
      <PublishAssetModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
      />
    </>
  );
}
