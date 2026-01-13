/**
 * Clone Preview Modal
 *
 * Preview dialog that shows what will be created when cloning
 * a credential for issuance. Allows user to confirm before proceeding.
 */

import { useState } from 'react';
import type { CatalogueCredential, ImportErrorDetails } from '../../../types/catalogue';

interface ClonePreviewModalProps {
  credential: CatalogueCredential;
  onClose: () => void;
  onConfirm: (credDefTag: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  errorDetails?: ImportErrorDetails | null;
}

export default function ClonePreviewModal({
  credential,
  onClose,
  onConfirm,
  isLoading,
  error,
  errorDetails,
}: ClonePreviewModalProps) {
  const [credDefTag, setCredDefTag] = useState('default');
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const handleConfirm = async () => {
    await onConfirm(credDefTag);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Clone for Issuance</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 mb-4">
            This will create a new schema and credential definition on your agent's ledger
            (BCOVRIN-TEST) that you can use to issue test credentials.
          </p>

          {/* Source Schema Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Source Schema
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Name</span>
                <span className="text-sm font-medium text-gray-900">{credential.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Version</span>
                <span className="text-sm font-medium text-gray-900">{credential.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Attributes</span>
                <span className="text-sm font-medium text-gray-900">
                  {credential.attributes.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Source Ledger</span>
                <span className="text-sm font-medium text-gray-900">{credential.ledger}</span>
              </div>
            </div>
          </div>

          {/* What Will Be Created */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h3 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">
              Will Create
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-blue-600">Target Ledger</span>
                <span className="text-sm font-medium text-blue-900">BCOVRIN-TEST</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-600">Schema</span>
                <span className="text-sm font-medium text-blue-900">
                  {credential.name} v{credential.version}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-600">Cred Def Tag</span>
                <input
                  type="text"
                  value={credDefTag}
                  onChange={(e) => setCredDefTag(e.target.value)}
                  className="w-32 px-2 py-1 text-sm border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="default"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Attributes Preview */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Attributes to Clone ({credential.attributes.length})
            </h3>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {credential.attributes.map((attr) => (
                <span
                  key={attr}
                  className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                >
                  {attr}
                </span>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Clone Failed</p>
                  <p className="text-xs text-red-600 mt-1">{error}</p>

                  {/* Show Details Toggle */}
                  {errorDetails && (
                    <button
                      onClick={() => setShowErrorDetails(!showErrorDetails)}
                      className="mt-2 text-xs text-red-700 hover:text-red-800 underline"
                    >
                      {showErrorDetails ? 'Hide API Details' : 'Show API Details'}
                    </button>
                  )}

                  {/* Detailed Error Logs */}
                  {showErrorDetails && errorDetails && (
                    <div className="mt-3 bg-white/50 rounded border border-red-200 p-3 text-xs font-mono space-y-2">
                      <div>
                        <span className="text-gray-500">Timestamp:</span>{' '}
                        <span className="text-gray-700">{errorDetails.timestamp}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Request URL:</span>{' '}
                        <span className="text-gray-700 break-all">{errorDetails.requestUrl}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Method:</span>{' '}
                        <span className="text-gray-700">{errorDetails.requestMethod}</span>
                      </div>
                      {errorDetails.statusCode && (
                        <div>
                          <span className="text-gray-500">Status Code:</span>{' '}
                          <span className="text-gray-700">{errorDetails.statusCode}</span>
                        </div>
                      )}
                      {errorDetails.requestPayload && (
                        <div>
                          <span className="text-gray-500 block mb-1">Request Payload:</span>
                          <pre className="text-gray-700 bg-gray-100 p-2 rounded overflow-x-auto text-[10px]">
                            {JSON.stringify(errorDetails.requestPayload, null, 2)}
                          </pre>
                        </div>
                      )}
                      {errorDetails.responseBody && (
                        <div>
                          <span className="text-gray-500 block mb-1">Response Body:</span>
                          <pre className="text-gray-700 bg-gray-100 p-2 rounded overflow-x-auto text-[10px] max-h-32 overflow-y-auto">
                            {errorDetails.responseBody}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Info Note */}
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <svg
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>
              The cloned credential will be registered with Orbit and can be used in the Test
              Issuer app to issue credentials. Once created, schema and credential definitions
              exist permanently on the ledger.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !credDefTag.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Create Clone
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
