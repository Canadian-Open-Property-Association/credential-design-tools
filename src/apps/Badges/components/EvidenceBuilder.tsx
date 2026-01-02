import { useBadgeStore } from '../../../store/badgeStore';
import type { EvidenceType } from '../../../types/badge';
import { EVIDENCE_TYPE_LABELS } from '../../../types/badge';

export default function EvidenceBuilder() {
  const {
    currentBadge,
    addEvidenceConfig,
    updateEvidenceConfig,
    removeEvidenceConfig,
  } = useBadgeStore();

  if (!currentBadge) return null;

  const evidenceConfigs = currentBadge.evidenceConfig;

  const evidenceTypes: EvidenceType[] = [
    'credential_attestation',
    'data_furnisher',
    'self_attestation',
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Evidence Requirements</h3>
          <p className="text-xs text-gray-500 mt-1">
            Define what evidence must be provided to earn this badge
          </p>
        </div>
        <button
          onClick={addEvidenceConfig}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Evidence
        </button>
      </div>

      {/* Evidence list */}
      {evidenceConfigs.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 px-6 py-10 text-center">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm text-gray-600 mb-2">No evidence requirements defined</p>
          <p className="text-xs text-gray-400 mb-4">
            Add evidence sources that must be provided for this badge
          </p>
          <button
            onClick={addEvidenceConfig}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Evidence Source
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {evidenceConfigs.map((config, index) => (
            <div
              key={config.id}
              className="bg-white rounded-lg border border-gray-200 p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Evidence Source {index + 1}
                </span>
                <button
                  onClick={() => removeEvidenceConfig(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove evidence source"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Evidence Type
                  </label>
                  <select
                    value={config.type}
                    onChange={(e) =>
                      updateEvidenceConfig(index, { type: e.target.value as EvidenceType })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    {evidenceTypes.map((type) => (
                      <option key={type} value={type}>
                        {EVIDENCE_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Required */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Required</label>
                  <div className="flex items-center gap-4 h-10">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`required-${index}`}
                        checked={config.required}
                        onChange={() => updateEvidenceConfig(index, { required: true })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`required-${index}`}
                        checked={!config.required}
                        onChange={() => updateEvidenceConfig(index, { required: false })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-gray-700">No</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input
                  type="text"
                  value={config.description}
                  onChange={(e) => updateEvidenceConfig(index, { description: e.target.value })}
                  placeholder="Describe what this evidence proves..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              {/* Type-specific hint */}
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                {config.type === 'credential_attestation' && (
                  <span>
                    Proof that the user holds certain credentials (without revealing specific
                    details)
                  </span>
                )}
                {config.type === 'data_furnisher' && (
                  <span>Attestation from an authorized data furnisher in the ecosystem</span>
                )}
                {config.type === 'self_attestation' && (
                  <span>
                    Self-reported information by the user (lower trust level, use sparingly)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
