/**
 * Proof Template Builder App
 *
 * Single-page layout for creating and managing proof templates.
 * - Collapsible sidebar with template list on left
 * - Two-pane config view when a template is selected
 * - Toggleable JSON preview panel on right (like Schema Builder)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppTracking } from '../../hooks/useAppTracking';
import { useProofTemplateStore } from '../../store/proofTemplateStore';
import TemplateSidebar from './components/TemplateSidebar';
import TemplateConfigPanel from './components/TemplateConfigPanel';
import PresentationPreview from './components/PresentationPreview';
import TemplateSettingsModal from './components/TemplateSettingsModal';

// Resizable divider component for horizontal panel resizing
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
      className={`w-1 bg-gray-300 hover:bg-blue-400 cursor-col-resize flex-shrink-0 flex items-center justify-center transition-colors ${
        isDragging ? 'bg-blue-500' : ''
      }`}
      onMouseDown={handleMouseDown}
    >
      <div className="w-0.5 h-8 bg-gray-400 rounded" />
    </div>
  );
}

export default function ProofTemplatesApp() {
  useAppTracking('proofs-template-builder', 'Proof Template Builder');

  const {
    showSidebar,
    showJsonPreview,
    selectedTemplateId,
    toggleSidebar,
    toggleJsonPreview,
    createTemplate,
    setSelectedTemplateId,
    getPresentationDefinition,
    currentTemplate,
    saveTemplate,
    publishTemplate,
    isSaving,
    templateTypes,
  } = useProofTemplateStore();

  // Panel width for resizable JSON preview (in pixels)
  const [configPanelWidth, setConfigPanelWidth] = useState(600);
  const MIN_PANEL_WIDTH = 400;
  const MAX_PANEL_WIDTH = 900;

  const handleDividerDrag = useCallback((delta: number) => {
    setConfigPanelWidth((prev) => Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, prev + delta)));
  }, []);

  // Create template modal state
  const [showNewModal, setShowNewModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [isCreating, setIsCreating] = useState(false);

  // Publish modal state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishMessage, setPublishMessage] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ success: boolean; prUrl?: string; error?: string } | null>(null);

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track changes
  useEffect(() => {
    if (currentTemplate) {
      setHasUnsavedChanges(true);
    }
  }, [currentTemplate?.name, currentTemplate?.description, currentTemplate?.purpose, currentTemplate?.claims, currentTemplate?.metadata]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!currentTemplate || !hasUnsavedChanges) return;
    try {
      await saveTemplate();
      setHasUnsavedChanges(false);
    } catch {
      // Error handled in store
    }
  }, [currentTemplate, hasUnsavedChanges, saveTemplate]);

  // Handle publish
  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishResult(null);
    try {
      const result = await publishTemplate(publishMessage || undefined);
      setPublishResult({ success: true, prUrl: result.prUrl });
    } catch (err) {
      setPublishResult({ success: false, error: err instanceof Error ? err.message : 'Failed to publish' });
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle create template
  const handleCreate = async () => {
    if (!newName.trim()) return;

    setIsCreating(true);
    try {
      const template = await createTemplate(newName.trim(), newDescription.trim(), newCategory);
      setShowNewModal(false);
      setNewName('');
      setNewDescription('');
      setNewCategory('general');
      setSelectedTemplateId(template.id);
    } catch (err) {
      // Error handled in store
    } finally {
      setIsCreating(false);
    }
  };

  // Get presentation definition for JSON preview
  const definition = getPresentationDefinition();

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header with toggles and actions */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left side - Save/Publish actions when template selected */}
          <div className="flex items-center gap-2">
            {currentTemplate && (
              <>
                <button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || isSaving}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save
                </button>
                <button
                  onClick={() => setShowPublishModal(true)}
                  disabled={currentTemplate.claims.length === 0}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Create PR
                </button>
                {hasUnsavedChanges && (
                  <span className="text-xs text-gray-400">Unsaved</span>
                )}
                {isSaving && (
                  <span className="text-xs text-blue-600">Saving...</span>
                )}
              </>
            )}
          </div>

          {/* Right side - Panel toggles and settings */}
          <div className="flex items-center gap-2">
            {/* Panel Visibility Toggles */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 mr-1">Panels:</span>
              {/* Sidebar toggle */}
              <button
                onClick={toggleSidebar}
                className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 transition-colors ${
                  showSidebar
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                    : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
                }`}
                title={showSidebar ? 'Hide template list' : 'Show template list'}
              >
                {showSidebar ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
                List
              </button>
              {/* JSON toggle */}
              <button
                onClick={toggleJsonPreview}
                className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 transition-colors ${
                  showJsonPreview
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                    : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
                }`}
                title={showJsonPreview ? 'Hide JSON panel' : 'Show JSON panel'}
              >
                {showJsonPreview ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
                JSON
              </button>
            </div>

            {/* Settings button */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
            <TemplateSidebar onCreateTemplate={() => setShowNewModal(true)} />
          </div>
        )}

        {/* Config panel (or empty state) */}
        {selectedTemplateId ? (
          <>
            <div
              className="bg-white flex flex-col overflow-hidden flex-shrink-0"
              style={{ width: showJsonPreview ? `${configPanelWidth}px` : '100%' }}
            >
              <TemplateConfigPanel />
            </div>

            {/* Resizable Divider and JSON Preview Panel */}
            {showJsonPreview && (
              <>
                <ResizableDivider onDrag={handleDividerDrag} />
                <div className="flex-1 bg-gray-900 flex flex-col overflow-hidden">
                  <PresentationPreview definition={definition} />
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <p className="text-lg font-medium text-gray-700">Select a Template</p>
              <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                Choose a template from the sidebar to configure its verification rules
              </p>
              {!showSidebar && (
                <button
                  onClick={toggleSidebar}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700"
                >
                  Show template list
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* New Template Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Create New Proof Template</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Age Verification, Income Proof"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {templateTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description of what this template verifies..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewModal(false);
                  setNewName('');
                  setNewDescription('');
                  setNewCategory('general');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || isCreating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreating && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                )}
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && <TemplateSettingsModal onClose={() => setShowSettings(false)} />}

      {/* Publish Modal */}
      {showPublishModal && currentTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Publish to VDR</h2>
              <p className="text-gray-600 text-sm mt-1">
                This will create a pull request to add this proof template to the Verifiable Data Registry.
              </p>
            </div>

            {publishResult ? (
              <div className="p-6">
                {publishResult.success ? (
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Pull Request Created!</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Your proof template has been submitted for review.
                    </p>
                    <a
                      href={publishResult.prUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      View Pull Request
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Publishing Failed</h3>
                    <p className="text-red-600 text-sm">{publishResult.error}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commit Message (optional)
                  </label>
                  <input
                    type="text"
                    value={publishMessage}
                    onChange={(e) => setPublishMessage(e.target.value)}
                    placeholder={`Add proof template: ${currentTemplate.name}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Template Summary</h4>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Name:</dt>
                      <dd className="font-medium">{currentTemplate.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Category:</dt>
                      <dd>{currentTemplate.metadata.category}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Claims:</dt>
                      <dd>{currentTemplate.claims.length}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPublishModal(false);
                  setPublishMessage('');
                  setPublishResult(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {publishResult ? 'Close' : 'Cancel'}
              </button>
              {!publishResult && (
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isPublishing && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  )}
                  Create Pull Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
