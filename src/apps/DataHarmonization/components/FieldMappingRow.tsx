import { useHarmonizationStore } from '../../../store/harmonizationStore';
import type { Entity, FurnisherDataSource, FurnisherField } from '../../../types/entity';

const DATA_TYPE_LABELS: Record<string, string> = {
  string: 'Text',
  number: 'Number',
  integer: 'Integer',
  boolean: 'Yes/No',
  date: 'Date',
  datetime: 'Date & Time',
  array: 'List',
  object: 'Object',
};

interface FieldMappingRowProps {
  entity: Entity;
  source: FurnisherDataSource;
  field: FurnisherField;
}

export default function FieldMappingRow({ entity, source, field }: FieldMappingRowProps) {
  const { getMappingForField, openMappingModal, deleteMapping } = useHarmonizationStore();

  const mapping = getMappingForField(entity.id, source.id, field.id);
  const isMapped = !!mapping;

  const handleMapClick = () => {
    openMappingModal({
      entityId: entity.id,
      entityName: entity.name,
      sourceId: source.id,
      sourceName: source.name,
      sourceType: source.type,
      field: field,
    });
  };

  const handleRemoveMapping = async () => {
    if (mapping && confirm('Remove this mapping?')) {
      await deleteMapping(mapping.id);
    }
  };

  return (
    <tr className={`${isMapped ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}>
      {/* Field Name */}
      <td className="px-4 py-3">
        <div>
          <span className="font-medium text-gray-900">
            {field.displayName || field.name}
          </span>
          {field.displayName && (
            <span className="text-xs text-gray-400 ml-2 font-mono">{field.name}</span>
          )}
        </div>
        {field.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{field.description}</p>
        )}
      </td>

      {/* Data Type */}
      <td className="px-4 py-3">
        <span className="text-xs text-gray-600">
          {field.dataType ? (DATA_TYPE_LABELS[field.dataType] || field.dataType) : '-'}
        </span>
      </td>

      {/* Mapped To */}
      <td className="px-4 py-3">
        {isMapped ? (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="min-w-0">
              <span className="text-sm text-gray-900 font-medium">
                {mapping.vocabPropertyName || mapping.vocabPropertyId}
              </span>
              {mapping.vocabTypeName && (
                <span className="text-xs text-gray-500 ml-2">
                  in {mapping.vocabTypeName}
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">Not mapped</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        {isMapped ? (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={handleMapClick}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Change mapping"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleRemoveMapping}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Remove mapping"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={handleMapClick}
            className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Map
          </button>
        )}
      </td>
    </tr>
  );
}
