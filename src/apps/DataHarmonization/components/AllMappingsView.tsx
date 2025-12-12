import { useState, useMemo } from 'react';
import { useHarmonizationStore } from '../../../store/harmonizationStore';
import type { FieldMapping } from '../../../types/harmonization';
import ColumnFilter from '../../DataDictionary/components/ColumnFilter';
import SaveMappingsToRepoModal from './SaveMappingsToRepoModal';

interface AllMappingsViewProps {
  onBack: () => void;
}

export default function AllMappingsView({ onBack }: AllMappingsViewProps) {
  const {
    mappings,
    entities,
    deleteMapping,
  } = useHarmonizationStore();

  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<Set<string>>(new Set());
  const [vocabTypeFilter, setVocabTypeFilter] = useState<Set<string>>(new Set());
  const [showSaveToRepo, setShowSaveToRepo] = useState(false);

  // Get unique values for filters
  const uniqueEntities = useMemo(() =>
    mappings.map(m => m.entityName || m.entityId),
    [mappings]
  );
  const uniqueVocabTypes = useMemo(() =>
    mappings.map(m => m.vocabTypeName || m.vocabTypeId),
    [mappings]
  );

  // Count values for filters
  const entityCounts = useMemo(() => {
    const counts = new Map<string, number>();
    mappings.forEach(m => {
      const key = m.entityName || m.entityId;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [mappings]);

  const vocabTypeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    mappings.forEach(m => {
      const key = m.vocabTypeName || m.vocabTypeId;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [mappings]);

  // Filter mappings
  const filteredMappings = useMemo(() => {
    let result = [...mappings];

    // Filter by search
    if (search.length >= 2) {
      const searchLower = search.toLowerCase();
      result = result.filter(m =>
        (m.furnisherFieldName || m.furnisherFieldId).toLowerCase().includes(searchLower) ||
        (m.vocabPropertyName || m.vocabPropertyId).toLowerCase().includes(searchLower) ||
        (m.entityName || m.entityId).toLowerCase().includes(searchLower) ||
        (m.vocabTypeName || m.vocabTypeId).toLowerCase().includes(searchLower)
      );
    }

    // Apply filters
    if (entityFilter.size > 0) {
      result = result.filter(m => entityFilter.has(m.entityName || m.entityId));
    }
    if (vocabTypeFilter.size > 0) {
      result = result.filter(m => vocabTypeFilter.has(m.vocabTypeName || m.vocabTypeId));
    }

    return result;
  }, [mappings, search, entityFilter, vocabTypeFilter]);

  // Group mappings by entity and source
  const groupedMappings = useMemo(() => {
    const groups: Record<string, { entity: string; source: string; mappings: FieldMapping[] }> = {};

    for (const mapping of filteredMappings) {
      const key = `${mapping.entityId}:${mapping.sourceId}`;
      if (!groups[key]) {
        groups[key] = {
          entity: mapping.entityName || mapping.entityId,
          source: mapping.sourceName || mapping.sourceId,
          mappings: [],
        };
      }
      groups[key].mappings.push(mapping);
    }

    // Sort groups by entity name, then source name
    return Object.values(groups).sort((a, b) => {
      const entityCompare = a.entity.localeCompare(b.entity);
      if (entityCompare !== 0) return entityCompare;
      return a.source.localeCompare(b.source);
    });
  }, [filteredMappings]);

  // Handle delete
  const handleDelete = async (mapping: FieldMapping) => {
    if (confirm(`Remove mapping from "${mapping.furnisherFieldName || mapping.furnisherFieldId}" to "${mapping.vocabPropertyName || mapping.vocabPropertyId}"?`)) {
      await deleteMapping(mapping.id);
    }
  };

  // Get entity logo
  const getEntityLogo = (entityId: string) => {
    const entity = entities.find(e => e.id === entityId);
    if (!entity?.logoUri) return null;
    if (entity.logoUri.startsWith('http') || entity.logoUri.startsWith('/')) {
      return entity.logoUri;
    }
    return `/assets/${entity.logoUri}`;
  };

  const getEntityColor = (entityId: string) => {
    const entity = entities.find(e => e.id === entityId);
    return entity?.primaryColor || '#6b7280';
  };

  const hasActiveFilters = entityFilter.size > 0 || vocabTypeFilter.size > 0;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">All Mappings</h1>
              <p className="text-sm text-gray-500">
                {filteredMappings.length} of {mappings.length} mappings
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setEntityFilter(new Set());
                      setVocabTypeFilter(new Set());
                    }}
                    className="ml-2 text-purple-600 hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </p>
            </div>
          </div>

          {/* GitHub Commit Button */}
          <button
            onClick={() => setShowSaveToRepo(true)}
            disabled={mappings.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Create Pull Request
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-md">
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
              placeholder="Search mappings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Filters:</span>
            <ColumnFilter
              label="Furnisher"
              values={uniqueEntities}
              selectedValues={entityFilter}
              onSelectionChange={setEntityFilter}
              valueCounts={entityCounts}
            />
            <ColumnFilter
              label="Vocab Type"
              values={uniqueVocabTypes}
              selectedValues={vocabTypeFilter}
              onSelectionChange={setVocabTypeFilter}
              valueCounts={vocabTypeCounts}
            />
          </div>
        </div>
      </div>

      {/* Mappings List */}
      <div className="flex-1 overflow-auto p-6">
        {filteredMappings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <p className="text-lg font-medium">No mappings found</p>
            <p className="text-sm mt-1">
              {search || hasActiveFilters
                ? 'Try adjusting your search or filters'
                : 'Create mappings by selecting a furnisher and mapping their fields'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedMappings.map((group) => (
              <div key={`${group.entity}:${group.source}`} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Group Header */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
                  {/* Entity Logo */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200"
                    style={{ backgroundColor: `${getEntityColor(group.mappings[0].entityId)}10` }}
                  >
                    {getEntityLogo(group.mappings[0].entityId) ? (
                      <img
                        src={getEntityLogo(group.mappings[0].entityId) || ''}
                        alt={group.entity}
                        className="w-full h-full object-contain p-0.5"
                      />
                    ) : (
                      <span
                        className="text-xs font-bold"
                        style={{ color: getEntityColor(group.mappings[0].entityId) }}
                      >
                        {group.entity.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{group.entity}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span>{group.source}</span>
                      <span className="text-gray-300">•</span>
                      <span>{group.mappings.length} mapping{group.mappings.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Mappings Table */}
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Furnisher Field</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-16"></th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">COPA Property</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vocab Type</th>
                      <th className="px-4 py-2 w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {group.mappings.map((mapping) => (
                      <tr key={mapping.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">
                            {mapping.furnisherFieldName || mapping.furnisherFieldId}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <svg className="w-5 h-5 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">
                            {mapping.vocabPropertyName || mapping.vocabPropertyId}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                            {mapping.vocabTypeName || mapping.vocabTypeId}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDelete(mapping)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove mapping"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save to Repo Modal */}
      {showSaveToRepo && (
        <SaveMappingsToRepoModal onClose={() => setShowSaveToRepo(false)} />
      )}
    </div>
  );
}
