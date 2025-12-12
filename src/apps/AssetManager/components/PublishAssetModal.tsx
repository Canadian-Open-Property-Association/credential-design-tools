import { useState } from 'react';
import { useAssetManagerStore } from '../../../store/assetManagerStore';
import { getGitHubFilePath, getPublishedUri } from '../../../types/asset';

interface PublishAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PublishAssetModal({ isOpen, onClose }: PublishAssetModalProps) {
  const currentAsset = useAssetManagerStore((state) => state.currentAsset);
  const entities = useAssetManagerStore((state) => state.entities);
  const updateAsset = useAssetManagerStore((state) => state.updateAsset);

  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);

  if (!isOpen || !currentAsset) return null;

  const linkedEntity = entities.find((e) => e.id === currentAsset.entityId);
  const BASE_URL = 'https://openpropertyassociation.ca';
  const githubPath = currentAsset.type && currentAsset.entityId && currentAsset.filename
    ? getGitHubFilePath(currentAsset)
    : null;
  const publishedUri = currentAsset.type && currentAsset.entityId && currentAsset.filename
    ? getPublishedUri(currentAsset, BASE_URL)
    : null;

  const handlePublish = async () => {
    if (!currentAsset.localUri || !currentAsset.type || !currentAsset.entityId) {
      setError('Asset must have an image, type, and linked entity to publish');
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5174';
      const response = await fetch(`${API_BASE}/api/github/asset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          assetId: currentAsset.id,
          localUri: currentAsset.localUri,
          type: currentAsset.type,
          entityId: currentAsset.entityId,
          name: currentAsset.name,
          mimetype: currentAsset.mimetype,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to publish asset');
      }

      const data = await response.json();
      setPrUrl(data.prUrl);

      // Update asset with published info
      updateAsset({
        isPublished: true,
        publishedUri: publishedUri || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish asset');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Publish Asset to GitHub</h2>
        </div>

        <div className="p-6 space-y-4">
          {prUrl ? (
            // Success state
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-green-600">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg font-medium">Pull Request Created!</span>
              </div>
              <p className="text-sm text-gray-600">
                Your asset has been submitted for publication. Once the PR is merged,
                the asset will be available at the published URL.
              </p>
              <a
                href={prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Pull Request
              </a>
            </div>
          ) : (
            // Publish form
            <>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-gray-800">Publication Details</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Asset Name:</span>
                    <span className="font-medium text-gray-800">{currentAsset.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className="font-medium text-gray-800">{currentAsset.type || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Linked Entity:</span>
                    <span className="font-medium text-gray-800">
                      {linkedEntity?.name || currentAsset.entityId || '-'}
                    </span>
                  </div>
                </div>

                {githubPath && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">GitHub Path:</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                      {githubPath}
                    </code>
                  </div>
                )}

                {publishedUri && (
                  <div className="pt-2">
                    <p className="text-xs text-gray-500 mb-1">Published URL:</p>
                    <code className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded block break-all">
                      {publishedUri}
                    </code>
                  </div>
                )}
              </div>

              {currentAsset.isPublished && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">This asset has already been published</p>
                    <p className="text-yellow-700">Publishing again will create a new PR to update the existing file.</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <p className="text-sm text-gray-600">
                This will create a pull request to add this asset to the Verifiable Data Registry.
                Once approved and merged, the asset will be publicly accessible.
              </p>
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {prUrl ? 'Close' : 'Cancel'}
          </button>
          {!prUrl && (
            <button
              onClick={handlePublish}
              disabled={isPublishing || !currentAsset.localUri || !currentAsset.type || !currentAsset.entityId}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isPublishing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Publishing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Create Pull Request
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
