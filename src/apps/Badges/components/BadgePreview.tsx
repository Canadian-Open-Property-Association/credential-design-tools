import { useBadgeStore } from '../../../store/badgeStore';
import { useBadgesSettingsStore } from '../../../store/badgesSettingsStore';

export default function BadgePreview() {
  const { currentBadge, updateCurrentBadge } = useBadgeStore();
  const { settings } = useBadgesSettingsStore();

  if (!currentBadge) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 p-4">
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
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
          <p className="text-sm">No badge selected</p>
        </div>
      </div>
    );
  }

  // Get category color for the badge
  const getCategoryColor = () => {
    const category = settings?.categories.find((c) => c.id === currentBadge.categoryId);
    return category?.color || '#F59E0B';
  };

  const categoryColor = getCategoryColor();

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Badge visual preview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="relative">
            {/* Badge shape */}
            <div
              className="w-48 h-48 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${categoryColor}20, ${categoryColor}40)`,
                border: `3px solid ${categoryColor}`,
              }}
            >
              <div className="text-center">
                {/* Badge icon */}
                <svg
                  className="w-16 h-16 mx-auto mb-2"
                  style={{ color: categoryColor }}
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
          Enter the URL to a PNG or SVG image that will be used as the badge template.
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
  );
}
