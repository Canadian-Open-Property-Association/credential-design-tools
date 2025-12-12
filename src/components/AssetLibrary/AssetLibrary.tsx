import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';

// Local asset (from server storage)
interface LocalAsset {
  id: string;
  filename: string;
  originalName: string;
  name: string;
  mimetype: string;
  size: number;
  hash: string;
  uri: string;
  createdAt: string;
  uploader?: {
    id: string;
    login: string;
    name?: string;
  };
}

// Published asset (from GitHub VDR)
interface PublishedAsset {
  id: string;
  name: string;
  filename: string;
  type: 'entity-logo' | 'credential-background' | 'credential-icon';
  uri: string;
  downloadUrl: string;
  sha: string;
}

type Asset = LocalAsset | PublishedAsset;

type SourceMode = 'local' | 'published' | 'both';

interface AssetLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (uri: string, hash?: string) => void;
  title?: string;
  /** Which assets to show: 'local' (drafts), 'published' (from VDR), or 'both' */
  source?: SourceMode;
  /** Filter by asset type when showing published assets */
  assetType?: 'entity-logo' | 'credential-background' | 'credential-icon';
}

// Use relative URL so it works on any deployment (localhost, Render, etc.)
const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5174';

export default function AssetLibrary({
  isOpen,
  onClose,
  onSelect,
  title = 'Asset Library',
  source = 'both',
  assetType,
}: AssetLibraryProps) {
  const [localAssets, setLocalAssets] = useState<LocalAsset[]>([]);
  const [publishedAssets, setPublishedAssets] = useState<PublishedAsset[]>([]);
  const [activeTab, setActiveTab] = useState<'local' | 'published'>(source === 'published' ? 'published' : 'local');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = useAuthStore((state) => state.user);

  // Combined assets based on active tab
  const assets = activeTab === 'local' ? localAssets : publishedAssets;

  // Type guards
  const isLocalAsset = (asset: Asset): asset is LocalAsset => 'uploader' in asset || 'createdAt' in asset;

  // Check if current user can manage (delete/rename) an asset
  const canManageAsset = (asset: Asset) => {
    if (!isLocalAsset(asset)) return false; // Can't manage published assets
    if (!currentUser) return false;
    // User can manage if they're the uploader or if asset has no uploader (legacy)
    return !asset.uploader || asset.uploader.id === String(currentUser.id);
  };

  const fetchLocalAssets = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/assets`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch local assets');
      const data = await response.json();
      setLocalAssets(data);
    } catch (err) {
      console.error('Error fetching local assets:', err);
    }
  };

  const fetchPublishedAssets = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/github/published-assets`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch published assets');
      let data: PublishedAsset[] = await response.json();
      // Filter by asset type if specified
      if (assetType) {
        data = data.filter((asset) => asset.type === assetType);
      }
      setPublishedAssets(data);
    } catch (err) {
      console.error('Error fetching published assets:', err);
    }
  };

  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const promises = [];
      if (source === 'local' || source === 'both') {
        promises.push(fetchLocalAssets());
      }
      if (source === 'published' || source === 'both') {
        promises.push(fetchPublishedAssets());
      }
      await Promise.all(promises);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAssets();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name.replace(/\.[^/.]+$/, ''));

    try {
      const response = await fetch(`${API_BASE}/api/assets`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      await fetchLocalAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/assets/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete');
      }
      await fetchLocalAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/api/assets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: editName.trim() }),
      });

      if (!response.ok) throw new Error('Failed to rename');
      setEditingId(null);
      await fetchLocalAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rename failed');
    }
  };

  const startEdit = (asset: Asset) => {
    setEditingId(asset.id);
    setEditName(asset.name);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-[800px] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs (only show if both sources) */}
        {source === 'both' && (
          <div className="px-6 border-b border-gray-200">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('published')}
                className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === 'published'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Published Assets
                <span className="ml-1 text-xs text-gray-400">({publishedAssets.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('local')}
                className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === 'local'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Local Drafts
                <span className="ml-1 text-xs text-gray-400">({localAssets.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Upload Section (only for local tab or local-only source) */}
        {(activeTab === 'local' || source === 'local') && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp"
                onChange={handleUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <span className="animate-spin">...</span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <span>+</span>
                    Upload Image
                  </>
                )}
              </button>
              <span className="text-sm text-gray-500">
                Supported: PNG, JPEG, GIF, SVG, WebP (max 5MB)
              </span>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
        )}

        {/* Published info banner */}
        {activeTab === 'published' && source === 'both' && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
            <p className="text-sm text-blue-700">
              These assets are published to the COPA Verifiable Data Registry and available for use in credentials.
            </p>
          </div>
        )}

        {/* Assets Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading assets...</div>
          ) : assets.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {activeTab === 'published' ? (
                <>
                  <p>No published assets found</p>
                  <p className="text-sm mt-1">Use the Asset Manager to publish assets to the VDR</p>
                </>
              ) : (
                <>
                  <p>No local assets uploaded yet</p>
                  <p className="text-sm mt-1">Upload images to use in your VCT</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {assets.map((asset) => {
                const local = isLocalAsset(asset);
                return (
                  <div
                    key={asset.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    {/* Image Preview */}
                    <div className="aspect-video bg-gray-100 flex items-center justify-center p-2">
                      <img
                        src={asset.uri}
                        alt={asset.name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af">Error</text></svg>';
                        }}
                      />
                    </div>

                    {/* Asset Info */}
                    <div className="p-3">
                      {editingId === asset.id && local ? (
                        <div className="flex gap-1 mb-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border rounded"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename(asset.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleRename(asset.id)}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <p
                          className={`font-medium text-sm truncate ${canManageAsset(asset) ? 'cursor-pointer hover:text-blue-600' : ''}`}
                          onClick={() => canManageAsset(asset) && startEdit(asset)}
                          title={canManageAsset(asset) ? 'Click to rename' : asset.name}
                        >
                          {asset.name}
                        </p>
                      )}
                      {local ? (
                        <>
                          <p className="text-xs text-gray-500 truncate" title={(asset as LocalAsset).mimetype}>
                            {formatFileSize((asset as LocalAsset).size)} - {(asset as LocalAsset).mimetype.split('/')[1].toUpperCase()}
                          </p>
                          {(asset as LocalAsset).uploader && (
                            <p className="text-xs text-gray-400 truncate mt-0.5" title={`Uploaded by ${(asset as LocalAsset).uploader?.name || (asset as LocalAsset).uploader?.login}`}>
                              by {(asset as LocalAsset).uploader?.name || (asset as LocalAsset).uploader?.login}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-gray-500 truncate">
                          {(asset as PublishedAsset).type.replace(/-/g, ' ')}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="mt-2 flex gap-1">
                        <button
                          onClick={() => onSelect(asset.uri, local ? (asset as LocalAsset).hash : undefined)}
                          className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Select
                        </button>
                        <button
                          onClick={() => copyToClipboard(asset.uri)}
                          className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          title="Copy URI"
                        >
                          Copy
                        </button>
                        {canManageAsset(asset) && (
                          <button
                            onClick={() => handleDelete(asset.id)}
                            className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
                            title="Delete"
                          >
                            Del
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
