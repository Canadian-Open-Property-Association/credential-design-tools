/**
 * Credential Detail Component
 *
 * Displays detailed information about an imported credential.
 * Follows the same pattern as EntityDetail in EntityManager.
 */

import { useState, useEffect } from 'react';
import { useCatalogueStore } from '../../../store/catalogueStore';
import type { CatalogueCredential } from '../../../types/catalogue';

interface CredentialDetailProps {
  credential: CatalogueCredential;
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Parse Orbit error to extract structured details
function parseOrbitError(errorString: string): {
  summary: string;
  statusCode?: number;
  details?: Record<string, unknown>;
  rawResponse?: string;
} {
  // Pattern: "Failed to import schema to Orbit: 400 - {...json...}"
  const match = errorString.match(/^(.*?):\s*(\d+)\s*-\s*(.*)$/);
  if (match) {
    const [, prefix, status, jsonPart] = match;
    try {
      const parsed = JSON.parse(jsonPart);
      return {
        summary: parsed.message || prefix,
        statusCode: parseInt(status, 10),
        details: parsed,
        rawResponse: jsonPart,
      };
    } catch {
      return {
        summary: prefix,
        statusCode: parseInt(status, 10),
        rawResponse: jsonPart,
      };
    }
  }
  return { summary: errorString };
}

export default function CredentialDetail({ credential }: CredentialDetailProps) {
  const { deleteCredential, clearSelection, updateCredential, ecosystemTags, fetchTags } =
    useCatalogueStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingTag, setIsEditingTag] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState(credential.ecosystemTag || 'other');
  const [isUpdatingTag, setIsUpdatingTag] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // Fetch tags on mount
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Reset selected tag when credential changes
  useEffect(() => {
    setSelectedTagId(credential.ecosystemTag || 'other');
    setIsEditingTag(false);
  }, [credential.id, credential.ecosystemTag]);

  const ecosystemTag = ecosystemTags.find((t) => t.id === credential.ecosystemTag);

  const handleSaveTag = async () => {
    if (selectedTagId === credential.ecosystemTag) {
      setIsEditingTag(false);
      return;
    }

    setIsUpdatingTag(true);
    try {
      await updateCredential(credential.id, { ecosystemTag: selectedTagId });
      setIsEditingTag(false);
    } catch (err) {
      console.error('Failed to update ecosystem tag:', err);
    } finally {
      setIsUpdatingTag(false);
    }
  };

  const handleCancelEdit = () => {
    setSelectedTagId(credential.ecosystemTag || 'other');
    setIsEditingTag(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCredential(credential.id);
      clearSelection();
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Failed to delete credential:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      {/* Banner Header */}
      <div className="h-16 relative bg-gradient-to-r from-purple-600 to-purple-700">
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/20" />
      </div>

      {/* Content area */}
      <div className="px-6 pb-6">
        {/* Icon overlapping banner */}
        <div className="flex items-end -mt-6 relative z-10 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white shadow-lg border-4 border-white flex items-center justify-center overflow-hidden flex-shrink-0">
            <svg
              className="w-6 h-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        </div>

        {/* Name and badges */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-semibold text-gray-900">{credential.name}</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              v{credential.version}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isEditingTag ? (
              <div className="flex items-center gap-2">
                <select
                  value={selectedTagId}
                  onChange={(e) => setSelectedTagId(e.target.value)}
                  className="text-xs px-2 py-1 border border-purple-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isUpdatingTag}
                >
                  {ecosystemTags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSaveTag}
                  disabled={isUpdatingTag}
                  className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                  title="Save"
                >
                  {isUpdatingTag ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isUpdatingTag}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Cancel"
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
            ) : (
              <button
                onClick={() => setIsEditingTag(true)}
                className="group inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors"
                title="Click to edit ecosystem tag"
              >
                {ecosystemTag?.name || credential.ecosystemTag}
                <svg
                  className="w-3 h-3 text-purple-400 group-hover:text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            )}
            <span className="text-sm text-gray-500">{credential.ledger}</span>
          </div>
        </div>

        {/* Issuer Info */}
        {credential.issuerName && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="text-gray-400">Issuer:</span>{' '}
              <span className="font-medium">{credential.issuerName}</span>
            </p>
          </div>
        )}

        {/* Orbit Registration Status */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
            Orbit Registration
          </h3>

          {credential.orbitRegistrationError ? (
            (() => {
              const parsedError = parseOrbitError(credential.orbitRegistrationError);
              return (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden">
                  <div className="p-3">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800">Registration Failed</p>
                        <p className="text-xs text-yellow-700 mt-1">{parsedError.summary}</p>
                        {(parsedError.statusCode || parsedError.rawResponse) && (
                          <button
                            onClick={() => setShowErrorDetails(!showErrorDetails)}
                            className="mt-2 text-xs text-yellow-600 hover:text-yellow-800 flex items-center gap-1"
                          >
                            <svg
                              className={`w-3 h-3 transition-transform ${showErrorDetails ? 'rotate-90' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            {showErrorDetails ? 'Hide' : 'Show'} technical details
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Error Details */}
                  {showErrorDetails && (parsedError.statusCode || parsedError.rawResponse) && (
                    <div className="border-t border-yellow-200 bg-yellow-100/50 p-3 space-y-2">
                      {parsedError.statusCode && (
                        <div className="text-xs">
                          <span className="text-yellow-700 font-medium">Status Code:</span>
                          <span className="ml-2 text-yellow-800">{parsedError.statusCode}</span>
                        </div>
                      )}
                      {parsedError.details && (
                        <div className="text-xs">
                          <span className="text-yellow-700 font-medium">Error Type:</span>
                          <span className="ml-2 text-yellow-800">
                            {String(parsedError.details.error || 'Unknown')}
                          </span>
                        </div>
                      )}
                      {parsedError.rawResponse && (
                        <div className="text-xs">
                          <span className="text-yellow-700 font-medium">Full Response:</span>
                          <pre className="mt-1 p-2 bg-white rounded border border-yellow-200 text-yellow-800 text-xs font-mono overflow-x-auto max-h-32 overflow-y-auto whitespace-pre-wrap">
                            {(() => {
                              try {
                                return JSON.stringify(JSON.parse(parsedError.rawResponse), null, 2);
                              } catch {
                                return parsedError.rawResponse;
                              }
                            })()}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()
          ) : credential.orbitSchemaId || credential.orbitCredDefId ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-800">Registered with Orbit</p>
                  <div className="mt-1 space-y-1 text-xs text-green-700">
                    {credential.orbitSchemaId && (
                      <p>
                        Schema ID:{' '}
                        <code className="bg-green-100 px-1 rounded">
                          {credential.orbitSchemaId}
                        </code>
                      </p>
                    )}
                    {credential.orbitCredDefId && (
                      <p>
                        Cred Def ID:{' '}
                        <code className="bg-green-100 px-1 rounded">
                          {credential.orbitCredDefId}
                        </code>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-700">Not Registered with Orbit</p>
                  <p className="text-xs text-gray-500 mt-1">
                    This credential was imported without Orbit registration.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Identifiers */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
              />
            </svg>
            Identifiers
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500">Schema ID</label>
              <code className="block bg-white px-3 py-2 rounded border border-gray-200 text-xs text-gray-800 font-mono break-all mt-1">
                {credential.schemaId}
              </code>
            </div>

            <div>
              <label className="text-xs text-gray-500">Credential Definition ID</label>
              <code className="block bg-white px-3 py-2 rounded border border-gray-200 text-xs text-gray-800 font-mono break-all mt-1">
                {credential.credDefId}
              </code>
            </div>

            {credential.issuerDid && (
              <div>
                <label className="text-xs text-gray-500">Issuer DID</label>
                <code className="block bg-white px-3 py-2 rounded border border-gray-200 text-xs text-gray-800 font-mono break-all mt-1">
                  {credential.issuerDid}
                </code>
              </div>
            )}
          </div>
        </div>

        {/* Attributes */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            Attributes ({credential.attributes.length})
          </h3>

          <div className="grid grid-cols-2 gap-2">
            {credential.attributes.map((attr, idx) => (
              <div
                key={idx}
                className="px-3 py-2 bg-white border border-gray-200 rounded text-xs font-mono text-gray-700"
              >
                {attr}
              </div>
            ))}
          </div>
        </div>

        {/* Source URLs */}
        {(credential.schemaSourceUrl || credential.credDefSourceUrl) && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              Source URLs
            </h3>

            <div className="space-y-2">
              {credential.schemaSourceUrl && (
                <div>
                  <label className="text-xs text-gray-500">Schema URL</label>
                  <a
                    href={credential.schemaSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-blue-600 hover:text-blue-800 break-all mt-1"
                  >
                    {credential.schemaSourceUrl}
                  </a>
                </div>
              )}

              {credential.credDefSourceUrl && (
                <div>
                  <label className="text-xs text-gray-500">Credential Definition URL</label>
                  <a
                    href={credential.credDefSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-blue-600 hover:text-blue-800 break-all mt-1"
                  >
                    {credential.credDefSourceUrl}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metadata Footer */}
        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <span>Imported {formatDateTime(credential.importedAt)}</span>
            {credential.importedBy && <span> by {credential.importedBy}</span>}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Danger Zone</h4>
              <p className="text-xs text-gray-500 mt-0.5">Remove this credential from catalogue</p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Credential</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete{' '}
                <span className="font-semibold">{credential.name}</span>? This will remove it from
                your catalogue.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
