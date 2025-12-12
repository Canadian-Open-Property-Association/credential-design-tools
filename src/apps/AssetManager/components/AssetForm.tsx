import { useCallback, useState } from 'react';
import { useAssetManagerStore } from '../../../store/assetManagerStore';
import { AssetType, ASSET_TYPE_CONFIG } from '../../../types/asset';

export default function AssetForm() {
  const currentAsset = useAssetManagerStore((state) => state.currentAsset);
  const updateAsset = useAssetManagerStore((state) => state.updateAsset);
  const uploadImage = useAssetManagerStore((state) => state.uploadImage);
  const entities = useAssetManagerStore((state) => state.entities);
  const isLoadingEntities = useAssetManagerStore((state) => state.isLoadingEntities);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setIsUploading(true);
      await uploadImage(file);
      setIsUploading(false);
    }
  }, [uploadImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      await uploadImage(file);
      setIsUploading(false);
    }
  }, [uploadImage]);

  if (!currentAsset) {
    return (
      <div className="text-center py-8 text-gray-500">
        No asset selected
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Asset Details</h2>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : currentAsset.localUri
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
            <p className="text-gray-600">Uploading...</p>
          </div>
        ) : currentAsset.localUri ? (
          <div className="space-y-4">
            <img
              src={currentAsset.localUri}
              alt={currentAsset.name || 'Uploaded asset'}
              className="max-h-32 mx-auto object-contain"
            />
            <p className="text-sm text-green-600 font-medium">Image uploaded</p>
            <label className="inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer text-sm">
              Replace Image
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-gray-600">Drag and drop an image here, or</p>
              <label className="inline-block mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer text-sm">
                Browse Files
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500">PNG, JPEG, GIF, SVG, or WebP (max 5MB)</p>
          </div>
        )}
      </div>

      {/* Asset Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Asset Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={currentAsset.name || ''}
          onChange={(e) => updateAsset({ name: e.target.value })}
          placeholder="Enter asset name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      {/* Asset Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Asset Type <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {(Object.keys(ASSET_TYPE_CONFIG) as AssetType[]).map((type) => (
            <label
              key={type}
              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                currentAsset.type === type
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="assetType"
                value={type}
                checked={currentAsset.type === type}
                onChange={() => updateAsset({ type })}
                className="mt-1"
              />
              <div>
                <span className="font-medium text-gray-800">{ASSET_TYPE_CONFIG[type].label}</span>
                <p className="text-xs text-gray-500 mt-0.5">{ASSET_TYPE_CONFIG[type].description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Entity Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Linked Entity <span className="text-red-500">*</span>
        </label>
        {isLoadingEntities ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
            <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
            Loading entities...
          </div>
        ) : entities.length === 0 ? (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              No entities found. Create entities in the Entity Manager first.
            </p>
          </div>
        ) : (
          <select
            value={currentAsset.entityId || ''}
            onChange={(e) => updateAsset({ entityId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Select an entity...</option>
            {entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name} ({entity.id})
              </option>
            ))}
          </select>
        )}
        <p className="text-xs text-gray-500 mt-1">
          The entity this asset belongs to. For logos, the entity ID determines the filename.
        </p>
      </div>

      {/* Publishing Info */}
      {currentAsset.localUri && currentAsset.type && currentAsset.entityId && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Publishing Info</h4>
          <p className="text-xs text-blue-700">
            When published, this asset will be saved to:
          </p>
          <code className="block mt-1 text-xs bg-white px-2 py-1 rounded border border-blue-200 break-all">
            {ASSET_TYPE_CONFIG[currentAsset.type].githubPath}/
            {currentAsset.type === 'entity-logo'
              ? `${currentAsset.entityId}.${currentAsset.filename?.split('.').pop() || 'png'}`
              : `${(currentAsset.name || 'asset').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.${currentAsset.filename?.split('.').pop() || 'png'}`
            }
          </code>
        </div>
      )}
    </div>
  );
}
