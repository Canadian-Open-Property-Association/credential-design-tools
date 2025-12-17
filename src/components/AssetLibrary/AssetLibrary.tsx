import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useFurnisherSettingsStore } from '../../store/furnisherSettingsStore';
import type { Entity } from '../../types/entity';

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
  localUri?: string;
  createdAt: string;
  type?: 'entity-logo' | 'credential-background' | 'credential-icon';
  entityId?: string;
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

// Hierarchy item for the left sidebar
interface HierarchyItem {
  id: string;
  label: string;
  type: 'entity-type' | 'provider-type' | 'all';
  parentId?: string; // For nested items
}

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
  const [entities, setEntities] = useState<Entity[]>([]);
  const [activeTab, setActiveTab] = useState<'local' | 'published'>(source === 'published' ? 'published' : 'local');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [selectedHierarchy, setSelectedHierarchy] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['data-furnisher', 'service-provider']));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = useAuthStore((state) => state.user);
  const { settings, fetchSettings } = useFurnisherSettingsStore();

  // Type guards
  const isLocalAsset = (asset: Asset): asset is LocalAsset => 'uploader' in asset || 'createdAt' in asset;

  // Get entity name by ID
  const getEntityName = (entityId: string | undefined): string | null => {
    if (!entityId) return null;
    const entity = entities.find(e => e.id === entityId);
    return entity?.name || null;
  };

  // Build hierarchy items from settings
  const buildHierarchy = (): HierarchyItem[] => {
    const items: HierarchyItem[] = [
      { id: 'all', label: 'All Assets', type: 'all' },
    ];

    if (settings?.entityTypes) {
      settings.entityTypes.forEach(entityType => {
        items.push({
          id: entityType.id,
          label: entityType.label,
          type: 'entity-type',
        });

        // Add nested provider types based on entity type
        if (entityType.id === 'data-furnisher' && settings.dataProviderTypes) {
          settings.dataProviderTypes.forEach(providerType => {
            items.push({
              id: `${entityType.id}:${providerType.id}`,
              label: providerType.label,
              type: 'provider-type',
              parentId: entityType.id,
            });
          });
        } else if (entityType.id === 'service-provider' && settings.serviceProviderTypes) {
          settings.serviceProviderTypes.forEach(serviceType => {
            items.push({
              id: `${entityType.id}:${serviceType.id}`,
              label: serviceType.label,
              type: 'provider-type',
              parentId: entityType.id,
            });
          });
        }
      });
    }

    return items;
  };

  const hierarchyItems = buildHierarchy();
  const topLevelItems = hierarchyItems.filter(item => !item.parentId);
  const getChildItems = (parentId: string) => hierarchyItems.filter(item => item.parentId === parentId);

  // Filter assets based on hierarchy selection
  const getFilteredAssets = (): Asset[] => {
    const assets = activeTab === 'local' ? localAssets : publishedAssets;

    if (selectedHierarchy === 'all') {
      return assets;
    }

    // Get entities matching the hierarchy selection
    let matchingEntityIds: string[] = [];

    if (selectedHierarchy.includes(':')) {
      // Provider type selected (e.g., "data-furnisher:identity")
      const [entityTypeId, providerTypeId] = selectedHierarchy.split(':');

      if (entityTypeId === 'data-furnisher') {
        matchingEntityIds = entities
          .filter(e =>
            e.entityTypes?.includes('data-furnisher') &&
            (e.dataProviderTypes as string[] | undefined)?.includes(providerTypeId)
          )
          .map(e => e.id);
      } else if (entityTypeId === 'service-provider') {
        matchingEntityIds = entities
          .filter(e =>
            e.entityTypes?.includes('service-provider') &&
            e.serviceProviderTypes?.includes(providerTypeId)
          )
          .map(e => e.id);
      }
    } else {
      // Entity type selected (e.g., "data-furnisher")
      matchingEntityIds = entities
        .filter(e => e.entityTypes?.includes(selectedHierarchy))
        .map(e => e.id);
    }

    // Filter assets by matching entity IDs
    return assets.filter(asset => {
      if (isLocalAsset(asset)) {
        return asset.entityId && matchingEntityIds.includes(asset.entityId);
      }
      // For published assets, we need to check the filename pattern (entityId prefix)
      return matchingEntityIds.some(id => asset.filename.startsWith(id));
    });
  };

  const filteredAssets = getFilteredAssets();

  // Check if current user can manage (delete/rename) an asset
  const canManageAsset = (asset: Asset) => {
    if (!isLocalAsset(asset)) return false; // Can't manage published assets
    if (!currentUser) return false;
    // User can manage if they're the uploader or if asset has no uploader (legacy)
    return !asset.uploader || asset.uploader.id === String(currentUser.id);
  };

  const fetchEntities = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/entities`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch entities');
      const data = await response.json();
      setEntities(data);
    } catch (err) {
      console.error('Error fetching entities:', err);
    }
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
      const promises = [fetchEntities()];
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
      if (!settings) {
        fetchSettings();
      }
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

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Get count of assets for a hierarchy item
  const getAssetCount = (hierarchyId: string): number => {
    const assets = activeTab === 'local' ? localAssets : publishedAssets;

    if (hierarchyId === 'all') {
      return assets.length;
    }

    let matchingEntityIds: string[] = [];

    if (hierarchyId.includes(':')) {
      const [entityTypeId, providerTypeId] = hierarchyId.split(':');
      if (entityTypeId === 'data-furnisher') {
        matchingEntityIds = entities
          .filter(e =>
            e.entityTypes?.includes('data-furnisher') &&
            (e.dataProviderTypes as string[] | undefined)?.includes(providerTypeId)
          )
          .map(e => e.id);
      } else if (entityTypeId === 'service-provider') {
        matchingEntityIds = entities
          .filter(e =>
            e.entityTypes?.includes('service-provider') &&
            e.serviceProviderTypes?.includes(providerTypeId)
          )
          .map(e => e.id);
      }
    } else {
      matchingEntityIds = entities
        .filter(e => e.entityTypes?.includes(hierarchyId))
        .map(e => e.id);
    }

    return assets.filter(asset => {
      if (isLocalAsset(asset)) {
        return asset.entityId && matchingEntityIds.includes(asset.entityId);
      }
      return matchingEntityIds.some(id => asset.filename.startsWith(id));
    }).length;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-[1000px] max-h-[85vh] flex flex-col"
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

        {/* Main Content: Left Hierarchy + Right Assets Grid */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Entity Type Hierarchy */}
          <div className="w-56 border-r border-gray-200 bg-gray-50 overflow-y-auto flex-shrink-0">
            <div className="p-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Filter by Entity Type
              </h3>
              <nav className="space-y-0.5">
                {topLevelItems.map(item => {
                  const children = getChildItems(item.id);
                  const hasChildren = children.length > 0;
                  const isExpanded = expandedItems.has(item.id);
                  const isSelected = selectedHierarchy === item.id;
                  const count = getAssetCount(item.id);

                  return (
                    <div key={item.id}>
                      <div
                        className={`flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-sm ${
                          isSelected
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => {
                          setSelectedHierarchy(item.id);
                          if (hasChildren && !isExpanded) {
                            toggleExpand(item.id);
                          }
                        }}
                      >
                        {hasChildren && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(item.id);
                            }}
                            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600"
                          >
                            <svg
                              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        )}
                        {!hasChildren && <span className="w-4" />}
                        <span className="flex-1 truncate">{item.label}</span>
                        <span className="text-xs text-gray-400">{count}</span>
                      </div>

                      {/* Nested children */}
                      {hasChildren && isExpanded && (
                        <div className="ml-4 mt-0.5 space-y-0.5">
                          {children.map(child => {
                            const childSelected = selectedHierarchy === child.id;
                            const childCount = getAssetCount(child.id);

                            return (
                              <div
                                key={child.id}
                                className={`flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-sm ${
                                  childSelected
                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                onClick={() => setSelectedHierarchy(child.id)}
                              >
                                <span className="w-4" />
                                <span className="flex-1 truncate">{child.label}</span>
                                <span className="text-xs text-gray-400">{childCount}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Right: Assets Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-center text-gray-500 py-8">Loading assets...</div>
            ) : filteredAssets.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {selectedHierarchy !== 'all' ? (
                  <>
                    <p>No assets found for this category</p>
                    <p className="text-sm mt-1">Try selecting a different category or "All Assets"</p>
                  </>
                ) : activeTab === 'published' ? (
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
                {filteredAssets.map((asset) => {
                  const local = isLocalAsset(asset);
                  const entityName = local ? getEntityName((asset as LocalAsset).entityId) : null;

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

                        {/* Entity name label */}
                        {entityName && (
                          <p className="text-xs text-blue-600 font-medium truncate mt-0.5" title={entityName}>
                            {entityName}
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
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''}
            {selectedHierarchy !== 'all' && (
              <span className="text-gray-400">
                {' '}(filtered)
              </span>
            )}
          </span>
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
