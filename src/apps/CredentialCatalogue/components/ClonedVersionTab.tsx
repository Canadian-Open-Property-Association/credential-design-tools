/**
 * Cloned Version Tab
 *
 * Displays information about the cloned (issuable) version of a credential.
 * Shows the new schema and cred def IDs on the target ledger, Orbit IDs,
 * and provides links to Test Issuer and delete actions.
 */

import { useState } from 'react';
import type { CatalogueCredential } from '../../../types/catalogue';

interface ClonedVersionTabProps {
  credential: CatalogueCredential;
  onDeleteClone: () => Promise<void>;
  isDeleting: boolean;
}

export default function ClonedVersionTab({
  credential,
  onDeleteClone,
  isDeleting,
}: ClonedVersionTabProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSchemaLog, setShowSchemaLog] = useState(false);
  const [showCredDefLog, setShowCredDefLog] = useState(false);

  const handleDelete = async () => {
    await onDeleteClone();
    setShowDeleteConfirm(false);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Clone Info Header */}
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-green-800">Issuable Clone Created</h3>
            <p className="text-xs text-green-600 mt-1">
              This credential has been cloned for issuance on {credential.clonedLedger?.toUpperCase()}.
              You can now issue test credentials using this schema.
            </p>
            {credential.clonedAt && (
              <p className="text-xs text-green-500 mt-2">
                Created {formatDate(credential.clonedAt)}
                {credential.clonedBy && ` by ${credential.clonedBy}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Ledger Identifiers */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Cloned Ledger Identifiers</h3>
        <div className="space-y-3">
          {/* Target Ledger */}
          <div>
            <label className="text-xs text-gray-500">Target Ledger</label>
            <p className="text-sm font-medium text-gray-800 mt-1">
              {credential.clonedLedger?.toUpperCase() || 'BCOVRIN-TEST'}
            </p>
          </div>

          {/* Schema ID */}
          {credential.clonedSchemaId && (
            <div>
              <label className="text-xs text-gray-500">Schema ID</label>
              <p className="text-xs font-mono text-gray-800 mt-1 break-all bg-white p-2 rounded border border-gray-200">
                {credential.clonedSchemaId}
              </p>
            </div>
          )}

          {/* Cred Def ID */}
          {credential.clonedCredDefId && (
            <div>
              <label className="text-xs text-gray-500">Credential Definition ID</label>
              <p className="text-xs font-mono text-gray-800 mt-1 break-all bg-white p-2 rounded border border-gray-200">
                {credential.clonedCredDefId}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Orbit Registration */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Orbit Registration</h3>
        <div className="space-y-3">
          {/* Orbit Schema ID */}
          {credential.clonedOrbitSchemaId && (
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs text-gray-500">Orbit Schema ID</label>
                <p className="text-sm font-medium text-gray-800 mt-1">
                  {credential.clonedOrbitSchemaId}
                </p>
              </div>
              {credential.clonedOrbitSchemaLog && (
                <button
                  onClick={() => setShowSchemaLog(!showSchemaLog)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  {showSchemaLog ? 'Hide' : 'View'} Log
                </button>
              )}
            </div>
          )}

          {/* Schema Log Details */}
          {showSchemaLog && credential.clonedOrbitSchemaLog && (
            <div className="bg-white rounded border border-gray-200 p-3 text-xs space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Status: </span>
                  <span
                    className={
                      credential.clonedOrbitSchemaLog.success
                        ? 'text-green-600 font-medium'
                        : 'text-red-600 font-medium'
                    }
                  >
                    {credential.clonedOrbitSchemaLog.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                {credential.clonedOrbitSchemaLog.statusCode && (
                  <div>
                    <span className="text-gray-500">HTTP Status: </span>
                    <span className="font-medium">{credential.clonedOrbitSchemaLog.statusCode}</span>
                  </div>
                )}
              </div>
              {credential.clonedOrbitSchemaLog.timestamp && (
                <div>
                  <span className="text-gray-500">Timestamp: </span>
                  <span>{formatDate(credential.clonedOrbitSchemaLog.timestamp)}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Request URL: </span>
                <code className="block mt-1 p-2 bg-gray-50 rounded border border-gray-200 font-mono break-all">
                  POST {credential.clonedOrbitSchemaLog.requestUrl}
                </code>
              </div>
              {credential.clonedOrbitSchemaLog.requestPayload && (
                <div>
                  <span className="text-gray-500">Request Payload:</span>
                  <pre className="mt-1 p-2 bg-gray-50 rounded border border-gray-200 font-mono overflow-x-auto max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {JSON.stringify(credential.clonedOrbitSchemaLog.requestPayload, null, 2)}
                  </pre>
                </div>
              )}
              {credential.clonedOrbitSchemaLog.responseBody && (
                <div>
                  <span className="text-gray-500">Response Body:</span>
                  <pre className="mt-1 p-2 bg-gray-50 rounded border border-gray-200 font-mono overflow-x-auto max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(credential.clonedOrbitSchemaLog.responseBody), null, 2);
                      } catch {
                        return credential.clonedOrbitSchemaLog.responseBody;
                      }
                    })()}
                  </pre>
                </div>
              )}
              {credential.clonedOrbitSchemaLog.errorMessage && (
                <div>
                  <span className="text-red-600">Error: </span>
                  <span className="text-red-700">{credential.clonedOrbitSchemaLog.errorMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Orbit Cred Def ID */}
          {credential.clonedOrbitCredDefId && (
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs text-gray-500">Orbit Credential Definition ID</label>
                <p className="text-sm font-medium text-gray-800 mt-1">
                  {credential.clonedOrbitCredDefId}
                </p>
              </div>
              {credential.clonedOrbitCredDefLog && (
                <button
                  onClick={() => setShowCredDefLog(!showCredDefLog)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  {showCredDefLog ? 'Hide' : 'View'} Log
                </button>
              )}
            </div>
          )}

          {/* Cred Def Log Details */}
          {showCredDefLog && credential.clonedOrbitCredDefLog && (
            <div className="bg-white rounded border border-gray-200 p-3 text-xs space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Status: </span>
                  <span
                    className={
                      credential.clonedOrbitCredDefLog.success
                        ? 'text-green-600 font-medium'
                        : 'text-red-600 font-medium'
                    }
                  >
                    {credential.clonedOrbitCredDefLog.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                {credential.clonedOrbitCredDefLog.statusCode && (
                  <div>
                    <span className="text-gray-500">HTTP Status: </span>
                    <span className="font-medium">{credential.clonedOrbitCredDefLog.statusCode}</span>
                  </div>
                )}
              </div>
              {credential.clonedOrbitCredDefLog.timestamp && (
                <div>
                  <span className="text-gray-500">Timestamp: </span>
                  <span>{formatDate(credential.clonedOrbitCredDefLog.timestamp)}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Request URL: </span>
                <code className="block mt-1 p-2 bg-gray-50 rounded border border-gray-200 font-mono break-all">
                  POST {credential.clonedOrbitCredDefLog.requestUrl}
                </code>
              </div>
              {credential.clonedOrbitCredDefLog.requestPayload && (
                <div>
                  <span className="text-gray-500">Request Payload:</span>
                  <pre className="mt-1 p-2 bg-gray-50 rounded border border-gray-200 font-mono overflow-x-auto max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {JSON.stringify(credential.clonedOrbitCredDefLog.requestPayload, null, 2)}
                  </pre>
                </div>
              )}
              {credential.clonedOrbitCredDefLog.responseBody && (
                <div>
                  <span className="text-gray-500">Response Body:</span>
                  <pre className="mt-1 p-2 bg-gray-50 rounded border border-gray-200 font-mono overflow-x-auto max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(credential.clonedOrbitCredDefLog.responseBody), null, 2);
                      } catch {
                        return credential.clonedOrbitCredDefLog.responseBody;
                      }
                    })()}
                  </pre>
                </div>
              )}
              {credential.clonedOrbitCredDefLog.errorMessage && (
                <div>
                  <span className="text-red-600">Error: </span>
                  <span className="text-red-700">{credential.clonedOrbitCredDefLog.errorMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Open in Test Issuer */}
        <a
          href="/apps/test-issuer"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          Open in Test Issuer
        </a>

        {/* Delete Clone */}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 text-red-600 text-sm font-medium border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete Cloned Version
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 mb-3">
              Are you sure you want to delete this cloned version? The schema and credential
              definition will remain on the ledger, but you won't be able to issue credentials
              using this clone from the catalogue.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Clone'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Note about permanence */}
      <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
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
          Note: Schemas and credential definitions published to a ledger exist permanently
          and cannot be deleted. Deleting the clone only removes it from this catalogue.
        </p>
      </div>
    </div>
  );
}
