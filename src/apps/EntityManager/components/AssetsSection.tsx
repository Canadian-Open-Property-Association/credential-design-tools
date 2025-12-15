import { useState, useEffect, useRef } from 'react';
import type { Entity, EntityAsset, EntityAssetType } from '../../../types/entity';
import { ENTITY_ASSET_TYPE_CONFIG } from '../../../types/entity';

interface AssetsSectionProps {
  entity: Entity;
  onRefreshEntity: () => void;
}

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5174';

export default function AssetsSection({ entity, onRefreshEntity }: AssetsSectionProps) {
  const [assets, setAssets] = useState<EntityAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<EntityAssetType | 'all'>('all');
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || null;

  // Load assets for this entity
  useEffect(() => {
    fetchAssets();
  }, [entity.id]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/assets?entityId=${entity.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch assets');
      const data = await res.json();
      setAssets(data);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  // Filter assets
  const filteredAssets = filterType === 'all'
    ? assets
    : assets.filter((a) => a.type === filterType);

  // Handle file upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    // Check if entity already has a logo
    const hasExistingLogo = entity.logoUri || assets.some(a => a.type === 'entity-logo');

    try {
      let firstUploadedAsset: EntityAsset | null = null;

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name.replace(/\.[^/.]+$/, ''));
        formData.append('entityId', entity.id);

        const res = await fetch(`${API_BASE}/api/assets`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Upload failed');
        }

        // Save the first uploaded asset
        if (!firstUploadedAsset) {
          firstUploadedAsset = await res.json();
        }
      }

      await fetchAssets();

      // Auto-set first uploaded image as entity logo if no logo exists
      if (!hasExistingLogo && firstUploadedAsset) {
        await setAsEntityLogo(firstUploadedAsset);
        setSuccessMessage(`Uploaded ${files.length} file(s) and set as entity logo`);
      } else {
        setSuccessMessage(`Uploaded ${files.length} file(s)`);
      }
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Update asset metadata
  const updateAssetField = (field: keyof EntityAsset, value: string | undefined) => {
    if (!selectedAssetId) return;
    setAssets((prev) =>
      prev.map((a) => (a.id === selectedAssetId ? { ...a, [field]: value } : a))
    );
    setHasChanges(true);
  };

  // Save all changes to server
  const saveChanges = async () => {
    if (!hasChanges) return;
    setSaving(true);
    setError(null);

    try {
      for (const asset of assets) {
        await fetch(`${API_BASE}/api/assets/${asset.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: asset.name,
            type: asset.type,
            entityId: entity.id,
          }),
        });
      }
      setHasChanges(false);
      setSuccessMessage('Changes saved');
      setTimeout(() => setSuccessMessage(null), 3000);
      // Refresh entity to update logo if needed
      onRefreshEntity();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Delete asset
  const deleteAsset = async (id: string) => {
    if (!confirm('Delete this asset?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/assets/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete');
      if (selectedAssetId === id) setSelectedAssetId(null);
      await fetchAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  // Set as entity logo (with single-logo constraint)
  const setAsEntityLogo = async (asset: EntityAsset) => {
    try {
      // First, find and unset any existing entity-logo for this entity
      const existingLogo = assets.find(a =>
        a.type === 'entity-logo' && a.id !== asset.id
      );

      if (existingLogo) {
        // Change existing logo type to undefined (untagged)
        await fetch(`${API_BASE}/api/assets/${existingLogo.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ type: null }),
        });
      }

      // Update asset type to entity-logo
      await fetch(`${API_BASE}/api/assets/${asset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'entity-logo' }),
      });

      // Update entity logoUri
      await fetch(`${API_BASE}/api/entities/${entity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ logoUri: asset.localUri }),
      });

      await fetchAssets();
      onRefreshEntity();
      setSuccessMessage('Logo updated');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set logo');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Check if this asset is the current entity logo
  const isCurrentLogo = (asset: EntityAsset) => {
    return asset.localUri === entity.logoUri || asset.type === 'entity-logo';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with actions */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp"
            onChange={handleUpload}
            multiple
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {uploading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload Assets
              </>
            )}
          </button>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as EntityAssetType | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Types ({assets.length})</option>
            <option value="entity-logo">Logos ({assets.filter((a) => a.type === 'entity-logo').length})</option>
            <option value="credential-background">Backgrounds ({assets.filter((a) => a.type === 'credential-background').length})</option>
            <option value="credential-icon">Icons ({assets.filter((a) => a.type === 'credential-icon').length})</option>
          </select>
        </div>

        {hasChanges && (
          <button
            onClick={saveChanges}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {successMessage}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">Loading assets...</div>
      ) : assets.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500 py-12">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium">No assets for this entity</p>
            <p className="text-xs mt-1">Upload images to add logos, backgrounds, or icons</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex mt-4 border border-gray-200 rounded-lg overflow-hidden">
          {/* Asset Grid - Left Side */}
          <div className={`flex-1 overflow-y-auto p-4 bg-white ${selectedAsset ? 'border-r border-gray-200' : ''}`}>
            <div className="grid grid-cols-3 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAssetId(asset.id)}
                  className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                    selectedAssetId === asset.id
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gray-100 flex items-center justify-center p-2 relative">
                    <img
                      src={asset.localUri}
                      alt={asset.name}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {/* Current Logo Badge */}
                    {isCurrentLogo(asset) && (
                      <span className="absolute top-1 right-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                        Logo
                      </span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-2 bg-white">
                    <p className="text-sm font-medium text-gray-800 truncate">{asset.name || 'Untitled'}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {asset.type ? ENTITY_ASSET_TYPE_CONFIG[asset.type]?.label : 'Untagged'}
                      </span>
                      {asset.isPublished && (
                        <span className="w-2 h-2 bg-green-500 rounded-full" title="Published" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Edit Panel - Right Side */}
          {selectedAsset && (
            <div className="w-80 bg-gray-50 flex flex-col">
              {/* Panel Header */}
              <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-medium text-gray-900 text-sm">Edit Asset</h3>
                <button
                  onClick={() => setSelectedAssetId(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Close panel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Preview */}
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center mb-3">
                    <img
                      src={selectedAsset.localUri}
                      alt={selectedAsset.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="space-y-1 text-xs text-gray-500">
                    <p>Size: <span className="text-gray-700">{formatFileSize(selectedAsset.size)}</span></p>
                    <p>Format: <span className="text-gray-700">{selectedAsset.mimetype}</span></p>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={selectedAsset.name || ''}
                      onChange={(e) => updateAssetField('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Asset name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={selectedAsset.type || ''}
                      onChange={(e) => updateAssetField('type', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Select type --</option>
                      <option value="entity-logo">Entity Logo</option>
                      <option value="credential-background">Credential Background</option>
                      <option value="credential-icon">Credential Icon</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  {!isCurrentLogo(selectedAsset) && (
                    <button
                      onClick={() => setAsEntityLogo(selectedAsset)}
                      className="w-full px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Set as Entity Logo
                    </button>
                  )}
                  {isCurrentLogo(selectedAsset) && (
                    <div className="flex items-center justify-center gap-2 text-green-600 text-sm py-2 bg-green-50 rounded-lg">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Current entity logo
                    </div>
                  )}
                  <button
                    onClick={() => deleteAsset(selectedAsset.id)}
                    className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Delete Asset
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
