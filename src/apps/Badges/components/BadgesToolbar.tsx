import { useState } from 'react';
import { useBadgeStore } from '../../../store/badgeStore';
import BadgeSettings from './BadgeSettings';
import PublishBadgeModal from './PublishBadgeModal';

interface BadgesToolbarProps {
  showFormPanel: boolean;
  setShowFormPanel: (show: boolean) => void;
  showJsonPanel: boolean;
  setShowJsonPanel: (show: boolean) => void;
  showPreviewPanel: boolean;
  setShowPreviewPanel: (show: boolean) => void;
}

export default function BadgesToolbar({
  showFormPanel,
  setShowFormPanel,
  showJsonPanel,
  setShowJsonPanel,
  showPreviewPanel,
  setShowPreviewPanel,
}: BadgesToolbarProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLocalLibrary, setShowLocalLibrary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [badgeName, setBadgeName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const {
    currentBadge,
    badges,
    isDirty,
    newBadge,
    saveBadge,
    selectBadge,
    deleteBadge,
  } = useBadgeStore();

  const handleSave = async () => {
    if (!currentBadge) return;

    if (currentBadge.id && badges.some((b) => b.id === currentBadge.id)) {
      // Already saved, update
      await saveBadge();
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } else {
      // First save, show dialog
      setBadgeName(currentBadge.name);
      setShowSaveDialog(true);
    }
  };

  const handleSaveConfirm = async () => {
    if (badgeName.trim()) {
      await saveBadge();
      setShowSaveDialog(false);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    }
  };

  const handleNew = () => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to create a new badge?')) {
        newBadge();
      }
    } else {
      newBadge();
    }
  };

  const handleLoadBadge = (id: string) => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Load this badge anyway?')) {
        selectBadge(id);
        setShowLocalLibrary(false);
      }
    } else {
      selectBadge(id);
      setShowLocalLibrary(false);
    }
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-2">
        <button
          onClick={handleNew}
          className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-1"
        >
          <span>📄</span> New
        </button>
        <button
          onClick={handleSave}
          disabled={!currentBadge}
          className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1 transition-colors ${
            !currentBadge
              ? 'text-gray-400 cursor-not-allowed'
              : showSaveSuccess
              ? 'text-green-700 bg-green-100'
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
              <span>💾</span> Save
            </>
          )}
        </button>
        <button
          onClick={() => setShowLocalLibrary(true)}
          className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Badge Library
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>

        {/* Panel Visibility Toggles */}
        <div className="ml-auto hidden md:flex items-center gap-1">
          <span className="text-xs text-gray-400 mr-1">Panels:</span>
          <button
            onClick={() => setShowFormPanel(!showFormPanel)}
            className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 transition-colors ${
              showFormPanel
                ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
            }`}
            title={showFormPanel ? 'Hide Form panel' : 'Show Form panel'}
          >
            {showFormPanel ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            )}
            Form
          </button>
          <button
            onClick={() => setShowJsonPanel(!showJsonPanel)}
            className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 transition-colors ${
              showJsonPanel
                ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
            }`}
            title={showJsonPanel ? 'Hide JSON panel' : 'Show JSON panel'}
          >
            {showJsonPanel ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            )}
            JSON
          </button>
          <button
            onClick={() => setShowPreviewPanel(!showPreviewPanel)}
            className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 transition-colors ${
              showPreviewPanel
                ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
            }`}
            title={showPreviewPanel ? 'Hide Preview panel' : 'Show Preview panel'}
          >
            {showPreviewPanel ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            )}
            Preview
          </button>
        </div>

        {/* Create Pull Request - far right */}
        <div className="w-px h-6 bg-gray-300 mx-2 hidden md:block" />
        <button
          onClick={() => setShowPublishModal(true)}
          disabled={!currentBadge}
          className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1 ${
            !currentBadge
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          Create Pull Request
        </button>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Save Badge</h3>
            <input
              type="text"
              value={badgeName}
              onChange={(e) => setBadgeName(e.target.value)}
              placeholder="Badge name"
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
                className="px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Badge Library Dialog */}
      {showLocalLibrary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Badge Library</h3>
                <button
                  onClick={() => setShowLocalLibrary(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">Your saved badge definitions</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {badges.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <p className="mb-2">No saved badges yet</p>
                  <p className="text-sm">Create a badge and click Save to add it to your library.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-amber-50 hover:border-amber-300 transition-colors"
                    >
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleLoadBadge(badge.id)}
                      >
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{badge.name}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            badge.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {badge.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {badge.eligibilityRules.length} rule{badge.eligibilityRules.length !== 1 ? 's' : ''} • Updated: {new Date(badge.updatedAt || badge.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {deleteConfirm === badge.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              deleteBadge(badge.id);
                              setDeleteConfirm(null);
                            }}
                            className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(badge.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete badge"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setShowLocalLibrary(false)}
                className="w-full px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && <BadgeSettings onClose={() => setShowSettings(false)} />}

      {/* Publish Modal */}
      {showPublishModal && currentBadge && (
        <PublishBadgeModal
          badgeId={currentBadge.id}
          onClose={() => setShowPublishModal(false)}
        />
      )}
    </>
  );
}
