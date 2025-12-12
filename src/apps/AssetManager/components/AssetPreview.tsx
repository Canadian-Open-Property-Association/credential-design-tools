import { useAssetManagerStore } from '../../../store/assetManagerStore';
import { ASSET_TYPE_CONFIG } from '../../../types/asset';

export default function AssetPreview() {
  const currentAsset = useAssetManagerStore((state) => state.currentAsset);
  const entities = useAssetManagerStore((state) => state.entities);

  if (!currentAsset) {
    return (
      <div className="text-center py-8 text-gray-500">
        No asset selected
      </div>
    );
  }

  const linkedEntity = entities.find((e) => e.id === currentAsset.entityId);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Preview</h2>

      {/* Image Preview */}
      {currentAsset.localUri ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-center bg-gray-100 rounded-lg p-8 min-h-[200px]">
            <img
              src={currentAsset.localUri}
              alt={currentAsset.name || 'Asset preview'}
              className="max-w-full max-h-64 object-contain"
            />
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-center bg-gray-50 rounded-lg p-8 min-h-[200px]">
            <div className="text-center text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No image uploaded</p>
            </div>
          </div>
        </div>
      )}

      {/* Asset Metadata */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-800 mb-4">Asset Information</h3>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Name</dt>
            <dd className="text-sm font-medium text-gray-800">{currentAsset.name || '-'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Type</dt>
            <dd className="text-sm font-medium text-gray-800">
              {currentAsset.type ? ASSET_TYPE_CONFIG[currentAsset.type].label : '-'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Linked Entity</dt>
            <dd className="text-sm font-medium text-gray-800">
              {linkedEntity ? linkedEntity.name : currentAsset.entityId || '-'}
            </dd>
          </div>
          {currentAsset.mimetype && (
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Format</dt>
              <dd className="text-sm font-medium text-gray-800">{currentAsset.mimetype}</dd>
            </div>
          )}
          {currentAsset.size > 0 && (
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Size</dt>
              <dd className="text-sm font-medium text-gray-800">
                {currentAsset.size < 1024
                  ? `${currentAsset.size} B`
                  : currentAsset.size < 1024 * 1024
                  ? `${(currentAsset.size / 1024).toFixed(1)} KB`
                  : `${(currentAsset.size / (1024 * 1024)).toFixed(1)} MB`}
              </dd>
            </div>
          )}
          {currentAsset.hash && (
            <div>
              <dt className="text-sm text-gray-500 mb-1">Integrity Hash (SHA-256)</dt>
              <dd className="text-xs font-mono text-gray-600 bg-gray-50 p-2 rounded break-all">
                {currentAsset.hash}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Publication Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-800 mb-4">Publication Status</h3>
        {currentAsset.isPublished && currentAsset.publishedUri ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Published</span>
            </div>
            <p className="text-xs text-gray-500">Available at:</p>
            <a
              href={currentAsset.publishedUri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline break-all"
            >
              {currentAsset.publishedUri}
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-yellow-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Not Published</span>
          </div>
        )}
      </div>
    </div>
  );
}
