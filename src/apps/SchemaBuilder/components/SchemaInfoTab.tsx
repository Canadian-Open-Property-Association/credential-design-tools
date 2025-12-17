/**
 * SchemaInfoTab Component
 *
 * Tab 1 of the Schema Builder - contains schema/context metadata:
 * - Title & Description (both modes)
 * - Credential Name / Filename (JSON-LD Context mode only)
 * - Governance Docs (JSON Schema mode only)
 *
 * JSON Schema mode is simplified - schemas only define credentialSubject validation.
 * JWT wrapper claims, VCT, and issuer are separate concerns.
 * Vocabulary/context mappings are managed in the VCT, not here.
 */

import { useSchemaStore } from '../../../store/schemaStore';
import { generateContextUrl } from '../../../types/schema';
import GovernanceDocsList from './GovernanceDocsList';

export default function SchemaInfoTab() {
  const metadata = useSchemaStore((state) => state.metadata);
  const updateMetadata = useSchemaStore((state) => state.updateMetadata);
  const currentProjectId = useSchemaStore((state) => state.currentProjectId);
  const saveSchema = useSchemaStore((state) => state.saveSchema);

  const isJsonLdMode = metadata.mode === 'jsonld-context';

  // Convert title to kebab-case for credential name suggestion
  const suggestCredentialName = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (title: string) => {
    updateMetadata({ title });
    // Auto-suggest credential name if empty (for JSON-LD mode)
    if (isJsonLdMode && !metadata.credentialName) {
      updateMetadata({ credentialName: suggestCredentialName(title) });
    }
    // Update the project name if we have an existing project
    if (currentProjectId && title.trim()) {
      saveSchema(title.trim());
    }
  };

  return (
    <div className="overflow-y-auto h-full">
      {/* Basic Metadata Section */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {isJsonLdMode ? 'Context Metadata' : 'Schema Metadata'}
        </h3>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={metadata.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g., Home Credential"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={metadata.description}
              onChange={(e) => updateMetadata({ description: e.target.value })}
              placeholder="Describe the schema/context..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* W3C Compliance: Additional Properties Toggle */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center pt-0.5">
                <input
                  type="checkbox"
                  checked={metadata.additionalProperties !== true}
                  onChange={(e) => updateMetadata({ additionalProperties: !e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 transition-colors"></div>
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform"></div>
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  Strict validation mode
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Reject credentials with extra fields not defined in schema (W3C recommended)
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* JSON-LD Mode: Credential Name / Filename */}
      {isJsonLdMode && (
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Publishing
          </h3>

          {/* Credential Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Credential Name
            </label>
            <input
              type="text"
              value={metadata.credentialName || ''}
              onChange={(e) => updateMetadata({ credentialName: e.target.value || undefined })}
              placeholder="e.g., home-credential"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
          </div>

          {/* Filename Preview */}
          {metadata.credentialName && (
            <div className="mt-3 p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700">
                <span className="font-medium">Filename:</span>{' '}
                <code className="bg-purple-100 px-1.5 py-0.5 rounded text-xs">
                  {metadata.credentialName}.context.jsonld
                </code>
              </p>
              <p className="text-xs text-purple-600 mt-1.5">
                <span className="font-medium">Context URL:</span>{' '}
                <code className="bg-purple-100 px-1 rounded break-all">
                  {generateContextUrl(metadata.title, metadata.category, metadata.credentialName)}
                </code>
              </p>
            </div>
          )}
        </div>
      )}

      {/* JSON Schema Mode: Governance Docs */}
      {!isJsonLdMode && (
        <div className="border-b border-gray-200">
          <GovernanceDocsList />
        </div>
      )}
    </div>
  );
}
