/**
 * Template Config Panel
 *
 * Two-pane layout for configuring a proof template:
 * - Left pane: Template metadata and claims list
 * - Right pane: Selected claim editor
 */

import { useProofTemplateStore } from '../../../store/proofTemplateStore';
import ClaimEditor from './ClaimEditor';

export default function TemplateConfigPanel() {
  const {
    currentTemplate,
    selectedClaimId,
    isLoading,
    error,
    updateTemplateName,
    updateTemplatePurpose,
    updateTemplateMetadata,
    addClaim,
    updateClaim,
    removeClaim,
    selectClaim,
    clearError,
    templateTypes,
  } = useProofTemplateStore();

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
            {/* Template name */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Template Name</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentTemplate.name}
                  onChange={(e) => updateTemplateName(e.target.value)}
                  className="flex-1 text-sm font-medium text-gray-900 border border-gray-200 rounded px-2 py-1.5 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Template name..."
                />
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                  currentTemplate.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentTemplate.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>

            {/* Purpose */}
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

            {/* Category and Version */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                <select
                  value={currentTemplate.metadata.category}
                  onChange={(e) => updateTemplateMetadata({ category: e.target.value })}
                  className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {templateTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
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
    </div>
  );
}
