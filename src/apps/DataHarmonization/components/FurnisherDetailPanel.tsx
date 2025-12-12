import { useHarmonizationStore } from '../../../store/harmonizationStore';
import { migrateDataSchema } from '../../../types/entity';
import type { Entity, FurnisherDataSource } from '../../../types/entity';
import FieldMappingRow from './FieldMappingRow';

function resolveLogoUri(logoUri: string | undefined): string | undefined {
  if (!logoUri) return undefined;
  if (logoUri.startsWith('http')) return logoUri;
  if (logoUri.startsWith('/')) return logoUri;
  return `/assets/${logoUri}`;
}

interface FurnisherDetailPanelProps {
  entity: Entity;
}

export default function FurnisherDetailPanel({ entity }: FurnisherDetailPanelProps) {
  const { getMappingForField } = useHarmonizationStore();

  const schema = migrateDataSchema(entity.dataSchema);
  const sources = schema.sources || [];

  // Count total and mapped fields
  let totalFields = 0;
  let mappedFields = 0;
  for (const source of sources) {
    for (const field of source.fields || []) {
      totalFields++;
      if (getMappingForField(entity.id, source.id, field.id)) {
        mappedFields++;
      }
    }
  }

  return (
    <div className="p-6">
      {/* Entity Header */}
      <div className="mb-6">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-gray-200"
            style={{ backgroundColor: entity.primaryColor ? `${entity.primaryColor}10` : '#f3f4f6' }}
          >
            {entity.logoUri ? (
              <img
                src={resolveLogoUri(entity.logoUri)}
                alt={entity.name}
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <span
                className="text-xl font-bold"
                style={{ color: entity.primaryColor || '#6b7280' }}
              >
                {entity.name.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          {/* Entity Info */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{entity.name}</h2>
            {entity.description && (
              <p className="text-sm text-gray-500 mt-1">{entity.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-600">
                {sources.length} source{sources.length !== 1 ? 's' : ''}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-sm text-gray-600">
                {totalFields} field{totalFields !== 1 ? 's' : ''}
              </span>
              <span className="text-gray-300">•</span>
              <span className={`text-sm ${mappedFields === totalFields && totalFields > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                {mappedFields} mapped
              </span>
              {totalFields > 0 && mappedFields < totalFields && (
                <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                  {totalFields - mappedFields} unmapped
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      {sources.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-lg font-medium">No data sources configured</p>
          <p className="text-sm mt-1">Add data sources in Entity Manager to define fields for mapping</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sources.map((source) => (
            <SourceCard
              key={source.id}
              entity={entity}
              source={source}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Source Card Component
interface SourceCardProps {
  entity: Entity;
  source: FurnisherDataSource;
}

function SourceCard({ entity, source }: SourceCardProps) {
  const { getMappingForField } = useHarmonizationStore();

  const fields = source.fields || [];
  const mappedCount = fields.filter(f => getMappingForField(entity.id, source.id, f.id)).length;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Source Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Source Type Icon */}
            {source.type === 'credential' ? (
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
            )}
            <div>
              <h3 className="font-medium text-gray-900">{source.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  source.type === 'credential'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {source.type === 'credential' ? 'Credential' : 'Direct Feed'}
                </span>
                <span className="text-xs text-gray-500">
                  {fields.length} field{fields.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          {fields.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${(mappedCount / fields.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 min-w-[3rem]">
                {mappedCount}/{fields.length}
              </span>
            </div>
          )}
        </div>

        {/* Source Details */}
        {(source.directFeedConfig?.apiEndpoint || source.credentialConfig?.issuerDid) && (
          <div className="mt-2 text-xs text-gray-500 font-mono truncate">
            {source.type === 'direct-feed' && source.directFeedConfig?.apiEndpoint && (
              <span>{source.directFeedConfig.apiEndpoint}</span>
            )}
            {source.type === 'credential' && source.credentialConfig?.issuerDid && (
              <span>{source.credentialConfig.issuerDid}</span>
            )}
          </div>
        )}
      </div>

      {/* Fields Table */}
      {fields.length === 0 ? (
        <div className="px-4 py-6 text-center text-gray-500 text-sm">
          No fields defined for this source
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">Type</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mapped To</th>
              <th className="px-4 py-2 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fields.map((field) => (
              <FieldMappingRow
                key={field.id}
                entity={entity}
                source={source}
                field={field}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
