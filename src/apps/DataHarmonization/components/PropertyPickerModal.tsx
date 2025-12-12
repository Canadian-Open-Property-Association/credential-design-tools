import { useState, useMemo, useEffect } from 'react';
import { useHarmonizationStore, type MappingFieldContext } from '../../../store/harmonizationStore';
import { useDictionaryStore } from '../../../store/dictionaryStore';
import type { FlattenedProperty } from '../../../types/dictionary';
import { generateFieldPath } from '../../../types/harmonization';
import ColumnFilter from '../../DataDictionary/components/ColumnFilter';

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

interface PropertyPickerModalProps {
  context: MappingFieldContext;
  onClose: () => void;
}

export default function PropertyPickerModal({ context, onClose }: PropertyPickerModalProps) {
  const {
    createMapping,
    updateMapping,
    getMappingForField,
    fetchMappings,
  } = useHarmonizationStore();

  const {
    getAllProperties,
    isPropertyFavourite,
    fetchVocabTypes,
    fetchPropertyFavourites,
  } = useDictionaryStore();

  // Load dictionary data on mount
  useEffect(() => {
    fetchVocabTypes();
    fetchPropertyFavourites();
  }, [fetchVocabTypes, fetchPropertyFavourites]);

  const [search, setSearch] = useState('');
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<FlattenedProperty | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Column filter state
  const [vocabTypeFilter, setVocabTypeFilter] = useState<Set<string>>(new Set());
  const [valueTypeFilter, setValueTypeFilter] = useState<Set<string>>(new Set());

  // Get existing mapping for this field
  const existingMapping = getMappingForField(context.entityId, context.sourceId, context.field.id);

  // Get all properties from dictionary store
  const allProperties = getAllProperties();

  // Get unique values for filters
  const uniqueVocabTypes = useMemo(() => allProperties.map(p => p.vocabTypeName), [allProperties]);
  const uniqueValueTypes = useMemo(() => allProperties.map(p => p.valueType), [allProperties]);

  // Count values for filters
  const vocabTypeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    allProperties.forEach(p => counts.set(p.vocabTypeName, (counts.get(p.vocabTypeName) || 0) + 1));
    return counts;
  }, [allProperties]);

  const valueTypeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    allProperties.forEach(p => counts.set(p.valueType, (counts.get(p.valueType) || 0) + 1));
    return counts;
  }, [allProperties]);

  // Filter properties
  const filteredProperties = useMemo(() => {
    let result = [...allProperties];

    // Filter by search
    if (search.length >= 2) {
      const searchLower = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.displayName?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.vocabTypeName.toLowerCase().includes(searchLower)
      );
    }

    // Filter by favourites
    if (showFavouritesOnly) {
      result = result.filter(p => isPropertyFavourite(p.vocabTypeId, p.id));
    }

    // Apply column filters
    if (vocabTypeFilter.size > 0) {
      result = result.filter(p => vocabTypeFilter.has(p.vocabTypeName));
    }
    if (valueTypeFilter.size > 0) {
      result = result.filter(p => valueTypeFilter.has(p.valueType));
    }

    // Sort alphabetically
    result.sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name));

    return result;
  }, [allProperties, search, showFavouritesOnly, vocabTypeFilter, valueTypeFilter, isPropertyFavourite]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedProperty) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const fieldPath = generateFieldPath(context.entityId, context.sourceId, context.field.name);

      const mappingData = {
        entityId: context.entityId,
        entityName: context.entityName,
        sourceId: context.sourceId,
        sourceName: context.sourceName,
        sourceType: context.sourceType,
        furnisherFieldId: context.field.id,
        furnisherFieldName: context.field.displayName || context.field.name,
        fieldPath,
        vocabTypeId: selectedProperty.vocabTypeId,
        vocabTypeName: selectedProperty.vocabTypeName,
        vocabPropertyId: selectedProperty.id,
        vocabPropertyName: selectedProperty.displayName || selectedProperty.name,
      };

      if (existingMapping) {
        await updateMapping(existingMapping.id, mappingData);
      } else {
        await createMapping(mappingData);
      }

      await fetchMappings();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create mapping');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {existingMapping ? 'Change Mapping' : 'Map Field to COPA Vocabulary'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Select a COPA property to map this field to
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Source Field Info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Source Field</div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {context.field.displayName || context.field.name}
              </span>
              <span className="text-gray-400">from</span>
              <span className="text-gray-700">{context.entityName}</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-700">{context.sourceName}</span>
              {context.field.dataType && (
                <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">
                  {VALUE_TYPE_LABELS[context.field.dataType] || context.field.dataType}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 flex items-center gap-4 border-b border-gray-200">
          <button
            onClick={() => setShowFavouritesOnly(false)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              !showFavouritesOnly
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All Properties
          </button>
          <button
            onClick={() => setShowFavouritesOnly(true)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
              showFavouritesOnly
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Favourites
          </button>
        </div>

        {/* Search & Filters */}
        <div className="px-6 py-3 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search properties..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <ColumnFilter
                label="Vocab Type"
                values={uniqueVocabTypes}
                selectedValues={vocabTypeFilter}
                onSelectionChange={setVocabTypeFilter}
                valueCounts={vocabTypeCounts}
              />
              <ColumnFilter
                label="Type"
                values={uniqueValueTypes}
                selectedValues={valueTypeFilter}
                onSelectionChange={setValueTypeFilter}
                valueFormatter={(v) => VALUE_TYPE_LABELS[v] || v}
                valueCounts={valueTypeCounts}
              />
            </div>
          </div>
        </div>

        {/* Properties Table */}
        <div className="flex-1 overflow-auto">
          {filteredProperties.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="font-medium">
                  {showFavouritesOnly ? 'No favourite properties' : 'No properties found'}
                </p>
                <p className="text-sm mt-1">
                  {showFavouritesOnly
                    ? 'Star properties in Data Dictionary to see them here'
                    : 'Try a different search term or adjust filters'}
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vocab Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProperties.map((prop) => {
                  const isFavourite = isPropertyFavourite(prop.vocabTypeId, prop.id);
                  const isSelected = selectedProperty?.fullId === prop.fullId;

                  return (
                    <tr
                      key={prop.fullId}
                      onClick={() => setSelectedProperty(prop)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-purple-50 ring-1 ring-inset ring-purple-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        {isFavourite && (
                          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <svg className="w-4 h-4 text-purple-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          <div>
                            <span className="font-medium text-gray-900">{prop.displayName}</span>
                            <span className="text-xs text-gray-400 ml-2 font-mono">{prop.name}</span>
                            {prop.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{prop.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                          {prop.vocabTypeName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {VALUE_TYPE_LABELS[prop.valueType] || prop.valueType}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 py-2 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-500">
            {filteredProperties.length} properties
            {selectedProperty && (
              <span className="ml-2 text-purple-600 font-medium">
                • {selectedProperty.displayName || selectedProperty.name} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedProperty || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {existingMapping ? 'Update Mapping' : 'Create Mapping'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
