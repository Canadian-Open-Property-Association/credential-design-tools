/**
 * JsonPreviewModal Component
 *
 * Modal to preview JSON output of vocabulary properties.
 */

import type { VocabProperty } from '../../../types/dictionary';

interface JsonPreviewModalProps {
  property: VocabProperty;
  vocabTypeName: string;
  onClose: () => void;
}

export default function JsonPreviewModal({ property, vocabTypeName, onClose }: JsonPreviewModalProps) {
  // Build JSON Schema representation of the property
  const jsonSchema = {
    $id: `https://openpropertyassociation.ca/vocab/${vocabTypeName}/${property.name}`,
    title: property.displayName,
    description: property.description,
    type: property.valueType,
  };


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[600px] max-w-[90vw] max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{property.displayName} - JSON Schema</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-gray-900">
          <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap">
            {JSON.stringify(jsonSchema, null, 2)}
          </pre>
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
