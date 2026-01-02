import { useState } from 'react';
import { useBadgeStore } from '../../../store/badgeStore';
import { useBadgesSettingsStore } from '../../../store/badgesSettingsStore';

type ViewMode = 'visual' | 'json';

export default function BadgePreview() {
  const { currentBadge, updateCurrentBadge, getExportJson } = useBadgeStore();
  const { settings } = useBadgesSettingsStore();

  const [viewMode, setViewMode] = useState<ViewMode>('visual');

  if (!currentBadge) return null;

  // Get category color for the badge
  const getCategoryColor = () => {
    const category = settings?.categories.find((c) => c.id === currentBadge.categoryId);
    return category?.color || '#6B7280';
  };

  // Get the export JSON for preview
  const exportJson = currentBadge.id ? getExportJson(currentBadge.id) : null;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Badge Preview</h3>
          <p className="text-xs text-gray-500 mt-1">
            Preview how your badge will appear and its export format
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setViewMode('visual')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === 'visual'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Visual
          </button>
          <button
            onClick={() => setViewMode('json')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === 'json'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            JSON
          </button>
        </div>
      </div>

      {viewMode === 'visual' ? (
        <div className="space-y-6">
          {/* Badge visual preview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-center">
              <div className="relative">
                {/* Badge shape */}
                <div
                  className="w-48 h-48 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${getCategoryColor()}20, ${getCategoryColor()}40)`,
                    border: `3px solid ${getCategoryColor()}`,
                  }}
                >
                  <div className="text-center">
                    {/* Badge icon */}
                    <svg
                      className="w-16 h-16 mx-auto mb-2"
                      style={{ color: getCategoryColor() }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                    {/* Badge name */}
                    <div className="text-sm font-semibold text-gray-800 px-4">
                      {currentBadge.name || 'Badge Name'}
                    </div>
                  </div>
                </div>

                {/* Status indicator */}
                {currentBadge.status === 'published' && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Badge description */}
            {currentBadge.description && (
              <p className="text-center text-sm text-gray-600 mt-4 max-w-xs mx-auto">
                {currentBadge.description}
              </p>
            )}
          </div>

          {/* Template URI input */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Badge Template Image URL
            </label>
            <input
              type="text"
              value={currentBadge.templateUri || ''}
              onChange={(e) => updateCurrentBadge('templateUri', e.target.value)}
              placeholder="https://example.com/badges/my-badge.png"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">
              Enter the URL to a PNG or SVG image that will be used as the badge template. The badge
              manifest will be embedded in this image when issued.
            </p>

            {/* Template preview */}
            {currentBadge.templateUri && (
              <div className="mt-4 flex justify-center">
                <img
                  src={currentBadge.templateUri}
                  alt="Badge template preview"
                  className="max-w-xs max-h-48 object-contain rounded-lg border border-gray-200"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Badge info summary */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Badge Summary</h4>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">ID</dt>
                <dd className="font-mono text-gray-900">{currentBadge.id || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Schema</dt>
                <dd className="font-mono text-gray-900">{currentBadge.schemaId || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Category</dt>
                <dd className="text-gray-900">
                  {settings?.categories.find((c) => c.id === currentBadge.categoryId)?.label ||
                    currentBadge.categoryId ||
                    '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Proof Method</dt>
                <dd className="text-gray-900">
                  {settings?.proofMethods.find((m) => m.id === currentBadge.proofMethod)?.label ||
                    currentBadge.proofMethod}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Eligibility Rules</dt>
                <dd className="text-gray-900">
                  {currentBadge.eligibilityRules.length}{' '}
                  {currentBadge.eligibilityRules.length === 1 ? 'rule' : 'rules'} (
                  {currentBadge.ruleLogic === 'all' ? 'ALL must pass' : 'ANY must pass'})
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Evidence Sources</dt>
                <dd className="text-gray-900">
                  {currentBadge.evidenceConfig.length}{' '}
                  {currentBadge.evidenceConfig.length === 1 ? 'source' : 'sources'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-700">Export JSON Preview</h4>
            {exportJson && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(exportJson);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy
              </button>
            )}
          </div>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-xs font-mono">
            {exportJson || JSON.stringify(currentBadge, null, 2)}
          </pre>
          <p className="text-xs text-gray-500 mt-2">
            This is the JSON that will be published to the Verifiable Data Registry
          </p>
        </div>
      )}
    </div>
  );
}
