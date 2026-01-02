import { useEffect, useState, useCallback, useRef } from 'react';
import { useBadgeStore } from '../../store/badgeStore';
import { useBadgesSettingsStore } from '../../store/badgesSettingsStore';
import BadgeForm from './components/BadgeForm';
import BadgeJsonPreview from './components/BadgeJsonPreview';
import BadgePreview from './components/BadgePreview';
import BadgesToolbar from './components/BadgesToolbar';

type MobilePanel = 'form' | 'json' | 'preview';

// Resizable divider component
function ResizableDivider({ onDrag }: { onDrag: (delta: number) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      startXRef.current = e.clientX;
      onDrag(delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onDrag]);

  return (
    <div
      className={`hidden md:flex w-1 bg-gray-300 hover:bg-amber-400 cursor-col-resize flex-shrink-0 items-center justify-center transition-colors ${
        isDragging ? 'bg-amber-500' : ''
      }`}
      onMouseDown={handleMouseDown}
    >
      <div className="w-0.5 h-8 bg-gray-400 rounded" />
    </div>
  );
}

export default function BadgesApp() {
  const {
    fetchBadges,
    badges,
    currentBadge,
    newBadge,
    selectBadge,
    isDirty,
    isLoading,
    error,
    closeEditor,
  } = useBadgeStore();

  const { fetchSettings } = useBadgesSettingsStore();

  const [showLoadModal, setShowLoadModal] = useState(false);

  // Panel visibility state for responsive layout
  const [showFormPanel, setShowFormPanel] = useState(true);
  const [showJsonPanel, setShowJsonPanel] = useState(true);
  const [showPreviewPanel, setShowPreviewPanel] = useState(true);
  const [mobileActivePanel, setMobileActivePanel] = useState<MobilePanel>('form');

  // Panel widths for resizable panels (in pixels)
  const [formPanelWidth, setFormPanelWidth] = useState(420);
  const [jsonPanelWidth, setJsonPanelWidth] = useState(380);

  // Minimum and maximum panel widths
  const MIN_PANEL_WIDTH = 200;
  const MAX_PANEL_WIDTH = 600;

  const handleFormDividerDrag = useCallback((delta: number) => {
    setFormPanelWidth((prev) => Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, prev + delta)));
  }, []);

  const handleJsonDividerDrag = useCallback((delta: number) => {
    setJsonPanelWidth((prev) => Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, prev + delta)));
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchBadges();
    fetchSettings();
  }, [fetchBadges, fetchSettings]);

  // Reset to welcome screen when entering the app
  useEffect(() => {
    closeEditor();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoad = (id: string) => {
    if (isDirty && !confirm('You have unsaved changes. Load anyway?')) {
      return;
    }
    selectBadge(id);
    setShowLoadModal(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this badge?')) {
      const { deleteBadge } = useBadgeStore.getState();
      await deleteBadge(id);
    }
  };

  // Show welcome screen if not editing
  if (!currentBadge) {
    return (
      <div className="flex flex-col h-full bg-gray-100">
        {/* Welcome Screen */}
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-lg">
            <div className="mb-8">
              <svg
                className="w-20 h-20 mx-auto text-amber-300 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome to Badge Builder</h2>
              <p className="text-gray-500">
                Define badge governance rules and publish badge definitions to the VDR
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              {/* Create New */}
              <button
                onClick={() => newBadge()}
                className="flex flex-col items-center gap-3 px-8 py-6 bg-white border-2 border-gray-200 rounded-xl hover:border-amber-400 hover:bg-amber-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <svg
                    className="w-6 h-6 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <div>
                  <span className="block font-medium text-gray-800">Create New</span>
                  <span className="text-sm text-gray-500">Start fresh</span>
                </div>
              </button>

              {/* Open Existing */}
              <button
                onClick={() => setShowLoadModal(true)}
                className="flex flex-col items-center gap-3 px-8 py-6 bg-white border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <span className="block font-medium text-gray-800">Open Existing</span>
                  <span className="text-sm text-gray-500">
                    {badges.length} saved badge{badges.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </button>
            </div>

            {/* Loading/Error states */}
            {isLoading && (
              <p className="mt-4 text-sm text-gray-500">Loading badges...</p>
            )}
            {error && (
              <p className="mt-4 text-sm text-red-500">{error}</p>
            )}
          </div>
        </main>

        {/* Load Modal */}
        {showLoadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Open Badge</h3>
              {badges.length === 0 ? (
                <p className="text-gray-500 text-sm">No saved badges yet.</p>
              ) : (
                <ul className="space-y-2">
                  {badges.map((badge) => (
                    <li
                      key={badge.id}
                      onClick={() => handleLoad(badge.id)}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-amber-50 hover:border-amber-300 cursor-pointer"
                    >
                      <div>
                        <div className="font-medium">{badge.name}</div>
                        <div className="text-xs text-gray-500">
                          {badge.eligibilityRules.length} rule
                          {badge.eligibilityRules.length !== 1 ? 's' : ''} •{' '}
                          {new Date(badge.updatedAt || badge.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDelete(badge.id, e)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
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
      <BadgesToolbar
        showFormPanel={showFormPanel}
        setShowFormPanel={setShowFormPanel}
        showJsonPanel={showJsonPanel}
        setShowJsonPanel={setShowJsonPanel}
        showPreviewPanel={showPreviewPanel}
        setShowPreviewPanel={setShowPreviewPanel}
      />

      {/* Mobile Panel Tabs - visible on small screens only */}
      <div className="md:hidden flex bg-gray-100 border-b border-gray-300">
        <button
          onClick={() => setMobileActivePanel('form')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            mobileActivePanel === 'form'
              ? 'bg-white text-amber-600 border-b-2 border-amber-600'
              : 'text-gray-600'
          }`}
        >
          Form
        </button>
        <button
          onClick={() => setMobileActivePanel('json')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            mobileActivePanel === 'json'
              ? 'bg-white text-amber-600 border-b-2 border-amber-600'
              : 'text-gray-600'
          }`}
        >
          JSON
        </button>
        <button
          onClick={() => setMobileActivePanel('preview')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            mobileActivePanel === 'preview'
              ? 'bg-white text-amber-600 border-b-2 border-amber-600'
              : 'text-gray-600'
          }`}
        >
          Preview
        </button>
      </div>

      {/* Main Content - Responsive Panel Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Form Input */}
        {(mobileActivePanel === 'form' || showFormPanel) && (
          <div
            className={`
              flex-col bg-white overflow-y-auto
              ${mobileActivePanel === 'form' ? 'flex w-full' : 'hidden'}
              ${showFormPanel ? 'md:flex' : 'md:hidden'}
              ${!showJsonPanel && !showPreviewPanel ? 'flex-1' : 'flex-shrink-0'}
            `}
            style={{
              width:
                mobileActivePanel === 'form'
                  ? '100%'
                  : !showJsonPanel && !showPreviewPanel
                  ? undefined
                  : `${formPanelWidth}px`,
            }}
          >
            <BadgeForm />
          </div>
        )}

        {/* Resizable divider after Form panel - shows when Form is visible */}
        {showFormPanel && <ResizableDivider onDrag={handleFormDividerDrag} />}

        {/* Middle Panel - JSON Preview */}
        {(mobileActivePanel === 'json' || showJsonPanel) && (
          <div
            className={`
              flex-col bg-gray-900 overflow-y-auto
              ${mobileActivePanel === 'json' ? 'flex w-full' : 'hidden'}
              ${showJsonPanel ? 'md:flex' : 'md:hidden'}
              ${!showPreviewPanel ? 'flex-1' : 'flex-shrink-0'}
            `}
            style={{
              width:
                mobileActivePanel === 'json'
                  ? '100%'
                  : !showPreviewPanel
                  ? undefined
                  : `${jsonPanelWidth}px`,
            }}
          >
            <div className="sticky top-0 bg-gray-800 px-4 py-2 border-b border-gray-700 flex-shrink-0">
              <h2 className="text-white font-medium">Badge JSON</h2>
            </div>
            <BadgeJsonPreview />
          </div>
        )}

        {/* Resizable divider after JSON panel - shows when JSON is visible */}
        {showJsonPanel && <ResizableDivider onDrag={handleJsonDividerDrag} />}

        {/* Right Panel - Badge Preview */}
        {(mobileActivePanel === 'preview' || showPreviewPanel) && (
          <div
            className={`
              flex-col flex-1 bg-gray-50 overflow-y-auto transition-all duration-300
              ${mobileActivePanel === 'preview' ? 'flex w-full' : 'hidden'}
              ${showPreviewPanel ? 'md:flex' : 'md:hidden'}
            `}
          >
            {/* Preview Header */}
            <div className="sticky top-0 z-10 bg-white px-4 py-2 border-b border-gray-200">
              <h2 className="font-medium text-gray-800">Badge Preview</h2>
            </div>
            <BadgePreview />
          </div>
        )}
      </main>
    </div>
  );
}
