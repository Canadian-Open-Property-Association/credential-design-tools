import type { VocabProperty } from '../../../types/dictionary';

interface PropertyDetailModalProps {
  property: VocabProperty;
  vocabTypeName: string;
  onClose: () => void;
}

// Property type code descriptions
const PROPERTY_TYPE_LABELS: Record<string, string> = {
  RESI: 'Residential',
  RLSE: 'Residential Lease',
  RINC: 'Residential Income',
  LAND: 'Land',
  MOBI: 'Mobile',
  FARM: 'Farm',
  COMS: 'Commercial Sale',
  COML: 'Commercial Lease',
  BUSO: 'Business Opportunity',
};

// Value type display labels
const VALUE_TYPE_LABELS: Record<string, string> = {
  string: 'Text',
  number: 'Number',
  integer: 'Integer',
  boolean: 'Yes/No',
  date: 'Date',
  datetime: 'Date & Time',
  array: 'List',
  object: 'Object',
  currency: 'Currency',
  url: 'URL',
  email: 'Email',
  phone: 'Phone',
};

export default function JsonPreviewModal({ property, vocabTypeName, onClose }: PropertyDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{property.displayName || property.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5 font-mono">{property.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Description */}
          {property.description && (
            <div>
              <p className="text-gray-700">{property.description}</p>
            </div>
          )}

          {/* Core Properties */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <dt className="text-xs text-gray-500 uppercase mb-1">Value Type</dt>
              <dd className="font-medium text-gray-800">
                {VALUE_TYPE_LABELS[property.valueType] || property.valueType}
              </dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <dt className="text-xs text-gray-500 uppercase mb-1">Required</dt>
              <dd className="font-medium text-gray-800">{property.required ? 'Yes' : 'No'}</dd>
            </div>
          </div>

          {/* Constraints */}
          {property.constraints && Object.keys(property.constraints).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Constraints</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.constraints.maxLength !== undefined && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <dt className="text-xs text-blue-600 uppercase mb-1">Max Length</dt>
                    <dd className="font-medium text-gray-800">{property.constraints.maxLength}</dd>
                  </div>
                )}
                {property.constraints.minLength !== undefined && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <dt className="text-xs text-blue-600 uppercase mb-1">Min Length</dt>
                    <dd className="font-medium text-gray-800">{property.constraints.minLength}</dd>
                  </div>
                )}
                {property.constraints.precision !== undefined && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <dt className="text-xs text-blue-600 uppercase mb-1">Precision</dt>
                    <dd className="font-medium text-gray-800">{property.constraints.precision} decimals</dd>
                  </div>
                )}
                {property.constraints.minimum !== undefined && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <dt className="text-xs text-blue-600 uppercase mb-1">Minimum</dt>
                    <dd className="font-medium text-gray-800">{property.constraints.minimum}</dd>
                  </div>
                )}
                {property.constraints.maximum !== undefined && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <dt className="text-xs text-blue-600 uppercase mb-1">Maximum</dt>
                    <dd className="font-medium text-gray-800">{property.constraints.maximum}</dd>
                  </div>
                )}
                {property.constraints.format && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <dt className="text-xs text-blue-600 uppercase mb-1">Format</dt>
                    <dd className="font-medium text-gray-800">{property.constraints.format}</dd>
                  </div>
                )}
                {property.constraints.pattern && (
                  <div className="bg-blue-50 rounded-lg p-3 col-span-2">
                    <dt className="text-xs text-blue-600 uppercase mb-1">Pattern</dt>
                    <dd className="font-mono text-sm text-gray-800 break-all">{property.constraints.pattern}</dd>
                  </div>
                )}
              </div>
              {property.constraints.enum && property.constraints.enum.length > 0 && (
                <div className="mt-3">
                  <dt className="text-xs text-blue-600 uppercase mb-2">Allowed Values ({property.constraints.enum.length})</dt>
                  <dd className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {property.constraints.enum.map((val, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                        {val}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </div>
          )}

          {/* Internationalization */}
          {(property.displayNameFr || property.displayNameEs) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Translations</h4>
              <div className="space-y-2">
                {property.displayNameFr && (
                  <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                    <span className="text-xs font-medium text-gray-500 uppercase w-8">FR</span>
                    <span className="text-gray-800">{property.displayNameFr}</span>
                  </div>
                )}
                {property.displayNameEs && (
                  <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                    <span className="text-xs font-medium text-gray-500 uppercase w-8">ES</span>
                    <span className="text-gray-800">{property.displayNameEs}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RESO Classification */}
          {(property.resoGroups || property.resoPropertyTypes || property.resoLookupName || property.resoElementStatus) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">RESO Classification</h4>
              <div className="space-y-3">
                {property.resoGroups && property.resoGroups.length > 0 && (
                  <div>
                    <dt className="text-xs text-gray-500 uppercase mb-1.5">Groups</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {property.resoGroups.map((group, i) => (
                        <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                          {group}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                {property.resoPropertyTypes && property.resoPropertyTypes.length > 0 && (
                  <div>
                    <dt className="text-xs text-gray-500 uppercase mb-1.5">Property Types</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {property.resoPropertyTypes.map((type, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium"
                          title={PROPERTY_TYPE_LABELS[type] || type}
                        >
                          {type}
                          {PROPERTY_TYPE_LABELS[type] && (
                            <span className="ml-1 text-green-600">({PROPERTY_TYPE_LABELS[type]})</span>
                          )}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                {property.resoLookupName && (
                  <div>
                    <dt className="text-xs text-gray-500 uppercase mb-1">Lookup Name</dt>
                    <dd className="font-mono text-sm text-gray-800">{property.resoLookupName}</dd>
                  </div>
                )}
                {property.resoElementStatus && (
                  <div>
                    <dt className="text-xs text-gray-500 uppercase mb-1">Element Status</dt>
                    <dd>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        property.resoElementStatus === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {property.resoElementStatus}
                      </span>
                    </dd>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Synonyms */}
          {property.synonyms && property.synonyms.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Synonyms</h4>
              <div className="flex flex-wrap gap-1.5">
                {property.synonyms.map((syn, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    {syn}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* JSON-LD & Technical */}
          {(property.jsonLdTerm || property.sampleValue) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Technical Details</h4>
              <div className="space-y-2">
                {property.jsonLdTerm && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <dt className="text-xs text-gray-500 uppercase mb-1">JSON-LD Term</dt>
                    <dd className="font-mono text-sm text-blue-600">{property.jsonLdTerm}</dd>
                  </div>
                )}
                {property.sampleValue && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <dt className="text-xs text-gray-500 uppercase mb-1">Sample Value</dt>
                    <dd className="font-mono text-sm text-gray-800">{property.sampleValue}</dd>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Wiki Link */}
          {property.wikiUrl && (
            <div>
              <a
                href={property.wikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View RESO Wiki Documentation
              </a>
            </div>
          )}

          {/* Vocab Type Context */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Part of <span className="font-medium text-gray-700">{vocabTypeName}</span> vocabulary type
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
