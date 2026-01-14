/**
 * Template Config Panel
 *
 * Two-pane layout for configuring a proof template:
 * - Left pane: Template metadata and claims list
 * - Right pane: Selected claim editor
 */

import { useEffect, useCallback, useState } from 'react';
import { useProofTemplateStore } from '../../../store/proofTemplateStore';
import { PROOF_TEMPLATE_CATEGORIES } from '../../../types/proofTemplate';
import ClaimEditor from './ClaimEditor';

export default function TemplateConfigPanel() {
  const {
    currentTemplate,
    selectedClaimId,
    isLoading,
    isSaving,
    error,
    saveTemplate,
    publishTemplate,
    updateTemplateName,
    updateTemplatePurpose,
    updateTemplateMetadata,
    addClaim,
    updateClaim,
    removeClaim,
    selectClaim,
    clearError,
  } = useProofTemplateStore();

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishMessage, setPublishMessage] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ success: boolean; prUrl?: string; error?: string } | null>(null);

  // Track changes
  useEffect(() => {
    if (currentTemplate) {
      setHasUnsavedChanges(true);
    }
  }, [currentTemplate?.name, currentTemplate?.description, currentTemplate?.purpose, currentTemplate?.claims, currentTemplate?.metadata]);

  // Auto-save after changes (debounced)
  const handleSave = useCallback(async () => {
    if (!currentTemplate || !hasUnsavedChanges) return;
    try {
      await saveTemplate();
      setHasUnsavedChanges(false);
    } catch (err) {
      // Error handled in store
    }
  }, [currentTemplate, hasUnsavedChanges, saveTemplate]);

  // Debounced auto-save
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const timer = setTimeout(handleSave, 2000);
    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, handleSave]);

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

  const selectedClaim = currentTemplate?.claims.find((c) => c.id === selectedClaimId);

  // Loading state
  if (isLoading && !currentTemplate) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Loading template...</p>
        </div>
      </div>
    );
  }

  // No template selected
  if (!currentTemplate) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
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
          <p className="text-sm text-gray-500 mt-1">Choose a template from the sidebar to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with actions */}
      <div className="flex-shrink-0 bg-gray-100 border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-2">
          {/* Template name input */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <input
              type="text"
              value={currentTemplate.name}
              onChange={(e) => updateTemplateName(e.target.value)}
              className="text-sm font-medium text-gray-900 border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-w-[200px] max-w-[400px]"
              placeholder="Template name..."
            />
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
              currentTemplate.status === 'published'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {currentTemplate.status === 'published' ? 'Published' : 'Draft'}
            </span>
            {hasUnsavedChanges && (
              <span className="text-xs text-gray-400 flex-shrink-0">Unsaved</span>
            )}
            {isSaving && (
              <span className="text-xs text-blue-600 flex-shrink-0">Saving...</span>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex-1" />
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
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex-shrink-0 bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between">
          <span className="text-red-800 text-sm">{error}</span>
          <button onClick={clearError} className="text-red-600 hover:text-red-800">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Two-pane layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left pane - Template metadata and claims list */}
        <div className="w-80 flex-shrink-0 bg-white border-r flex flex-col overflow-hidden">
          {/* Template metadata */}
          <div className="p-4 border-b space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Purpose</label>
              <textarea
                value={currentTemplate.purpose}
                onChange={(e) => updateTemplatePurpose(e.target.value)}
                placeholder="What does this template verify? (shown to credential holders)"
                rows={2}
                className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                <select
                  value={currentTemplate.metadata.category}
                  onChange={(e) => updateTemplateMetadata({ category: e.target.value })}
                  className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {PROOF_TEMPLATE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-gray-500 mb-1">Version</label>
                <input
                  type="text"
                  value={currentTemplate.metadata.version}
                  onChange={(e) => updateTemplateMetadata({ version: e.target.value })}
                  className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Claims list */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 border-b bg-gray-50 flex items-center justify-between sticky top-0">
              <h3 className="text-sm font-medium text-gray-700">Claims ({currentTemplate.claims.length})</h3>
              <button
                onClick={addClaim}
                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                title="Add claim"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {currentTemplate.claims.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">No claims yet</p>
                <button
                  onClick={addClaim}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Add your first claim
                </button>
              </div>
            ) : (
              <div className="divide-y">
                {currentTemplate.claims.map((claim, index) => (
                  <div
                    key={claim.id}
                    onClick={() => selectClaim(claim.id)}
                    className={`p-3 cursor-pointer transition-colors ${
                      selectedClaimId === claim.id
                        ? 'bg-blue-50 border-l-2 border-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {claim.label || claim.name || `Claim ${index + 1}`}
                        </div>
                        {claim.purpose && (
                          <div className="text-xs text-gray-500 truncate mt-0.5">{claim.purpose}</div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {claim.required && (
                            <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">Required</span>
                          )}
                          {claim.constraints.length > 0 && (
                            <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                              {claim.constraints.length} constraint{claim.constraints.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeClaim(claim.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove claim"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right pane - Claim editor */}
        <div className="flex-1 bg-gray-50 overflow-y-auto">
          {selectedClaim ? (
            <ClaimEditor
              claim={selectedClaim}
              onUpdate={(updates) => updateClaim(selectedClaim.id, updates)}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <p>Select a claim to edit</p>
                <p className="text-sm mt-1">or add a new claim to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
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
