import { useState, useRef, useEffect } from 'react';
import type { Entity, EntityType, FurnisherDataSchema, EntityAsset } from '../../../types/entity';
import { ENTITY_TYPE_CONFIG, migrateDataSchema } from '../../../types/entity';
import { useEntityStore } from '../../../store/entityStore';
import DataSourcesSection from './DataSourcesSection';
import AssetsSection from './AssetsSection';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5174';

interface EntityDetailProps {
  entity: Entity;
  onEdit: () => void;
}

// Inline editable section component
interface EditableSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  editContent?: React.ReactNode;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  className?: string;
}

function EditableSection({
  title,
  icon,
  children,
  editContent,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  className = '',
}: EditableSectionProps) {
  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-blue-600 p-1 transition-colors"
            title={`Edit ${title}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
      </div>
      {isEditing && editContent ? editContent : children}
    </div>
  );
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

function resolveLogoUri(logoUri: string | undefined): string | undefined {
  if (!logoUri) return undefined;
  if (logoUri.startsWith('http')) return logoUri;
  if (logoUri.startsWith('/')) return logoUri;
  return `/assets/${logoUri}`;
}

function getTypeColor(type: EntityType): string {
  const colors: Record<EntityType, string> = {
    'issuer': 'bg-blue-100 text-blue-800',
    'data-furnisher': 'bg-green-100 text-green-800',
    'network-partner': 'bg-purple-100 text-purple-800',
    'service-provider': 'bg-orange-100 text-orange-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

// All available entity types
const ALL_ENTITY_TYPES: EntityType[] = ['issuer', 'data-furnisher', 'network-partner', 'service-provider'];

export default function EntityDetail({ entity, onEdit: _onEdit }: EntityDetailProps) {
  const brandColour = entity.primaryColor || '#1a365d';
  const { updateEntity, selectEntity } = useEntityStore();
  const isDataFurnisher = entity.types?.includes('data-furnisher');
  const [activeTab, setActiveTab] = useState<'about' | 'data-schema' | 'assets'>('about');

  // Inline editing states
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Entity>>({});

  // Entity types editing state
  const [editingTypes, setEditingTypes] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<EntityType[]>(entity.types || []);

  // Track the current entity ID to reset tab only when switching entities
  const currentEntityIdRef = useRef(entity.id);

  // Asset count for the tab badge
  const [assetCount, setAssetCount] = useState(0);

  // Fetch asset count for this entity
  useEffect(() => {
    const fetchAssetCount = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/assets?entityId=${entity.id}`, { credentials: 'include' });
        if (res.ok) {
          const assets: EntityAsset[] = await res.json();
          setAssetCount(assets.length);
        }
      } catch (err) {
        console.error('Failed to fetch asset count:', err);
      }
    };
    fetchAssetCount();
  }, [entity.id, activeTab]); // Re-fetch when switching to assets tab (in case assets were added)

  // Only reset to 'about' tab when switching to a different entity
  useEffect(() => {
    if (currentEntityIdRef.current !== entity.id) {
      currentEntityIdRef.current = entity.id;
      setActiveTab('about');
      setEditingSection(null);
      setEditingTypes(false);
      setSelectedTypes(entity.types || []);
    }
  }, [entity.id]);

  // Sync selectedTypes when entity.types changes (e.g., after save)
  useEffect(() => {
    if (!editingTypes) {
      setSelectedTypes(entity.types || []);
    }
  }, [entity.types, editingTypes]);

  const handleUpdateSchema = async (schema: FurnisherDataSchema) => {
    try {
      await updateEntity(entity.id, { dataSchema: schema });
    } catch (error) {
      console.error('Failed to update schema:', error);
    }
  };

  const startEditing = (section: string) => {
    setEditingSection(section);
    setEditFormData({ ...entity });
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditFormData({});
  };

  const saveSection = async () => {
    try {
      await updateEntity(entity.id, editFormData);
      setEditingSection(null);
      setEditFormData({});
    } catch (error) {
      console.error('Failed to update entity:', error);
    }
  };

  const updateFormField = (field: keyof Entity, value: string | undefined) => {
    setEditFormData(prev => ({ ...prev, [field]: value || undefined }));
  };

  // Entity type editing handlers
  const toggleType = (type: EntityType) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        // Don't allow removing the last type
        if (prev.length === 1) return prev;
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const saveTypes = async () => {
    try {
      await updateEntity(entity.id, { types: selectedTypes });
      setEditingTypes(false);
    } catch (error) {
      console.error('Failed to update entity types:', error);
    }
  };

  const cancelTypeEditing = () => {
    setEditingTypes(false);
    setSelectedTypes(entity.types || []);
  };

  return (
    <div>
      {/* Banner Header with Brand Colour */}
      <div
        className="h-20 relative"
        style={{ backgroundColor: brandColour }}
      >
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/20" />
      </div>

      {/* Content area */}
      <div className="px-6 pb-6">
        {/* Logo overlapping banner */}
        <div className="flex items-end -mt-8 relative z-10 mb-4">
          <div
            className="w-16 h-16 rounded-xl bg-white shadow-lg border-4 border-white flex items-center justify-center overflow-hidden flex-shrink-0"
          >
            {entity.logoUri ? (
              <img
                src={resolveLogoUri(entity.logoUri)}
                alt={entity.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <span
                className="text-xl font-bold"
                style={{ color: brandColour }}
              >
                {entity.name.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Name and badges - completely below banner */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 truncate mb-2">
            {entity.name}
          </h2>

          {/* Entity Types - View Mode */}
          {!editingTypes && (
            <div className="flex items-center gap-2 flex-wrap">
              {entity.types?.map((type) => (
                <span
                  key={type}
                  className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(type)}`}
                >
                  {ENTITY_TYPE_CONFIG[type]?.label}
                </span>
              ))}
              <button
                onClick={() => setEditingTypes(true)}
                className="text-gray-400 hover:text-blue-600 p-1 transition-colors"
                title="Edit entity types"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}

          {/* Entity Types - Edit Mode */}
          {editingTypes && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-600">Select entity types:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={cancelTypeEditing}
                    className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveTypes}
                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_ENTITY_TYPES.map((type) => {
                  const isSelected = selectedTypes.includes(type);
                  const config = ENTITY_TYPE_CONFIG[type];
                  return (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`text-xs px-3 py-1.5 rounded-full border-2 transition-all ${
                        isSelected
                          ? `${getTypeColor(type)} border-current`
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {isSelected && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {config?.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selectedTypes.length === 1 && (
                <p className="text-xs text-gray-400 mt-2">At least one type is required</p>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {entity.description && (
          <p className="text-sm text-gray-600 mb-4 max-w-2xl">{entity.description}</p>
        )}

        {/* Tabs - always show for all entities */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('about')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'about'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              About
            </button>
            {isDataFurnisher && (
              <button
                onClick={() => setActiveTab('data-schema')}
                className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'data-schema'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Data Sources
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === 'data-schema' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {migrateDataSchema(entity.dataSchema).sources?.length || 0}
                </span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('assets')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'assets'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Assets
              {assetCount > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === 'assets' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {assetCount}
                </span>
              )}
            </button>
          </nav>
        </div>

      {/* Tab Content: About */}
      {activeTab === 'about' && (
        <>
          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Contact & Web Section */}
            <EditableSection
              title="Contact & Web"
              isEditing={editingSection === 'contact'}
              onEdit={() => startEditing('contact')}
              onSave={saveSection}
              onCancel={cancelEditing}
              editContent={
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Website</label>
                    <input
                      type="url"
                      value={editFormData.website || ''}
                      onChange={(e) => updateFormField('website', e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={editFormData.contactName || ''}
                      onChange={(e) => updateFormField('contactName', e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <input
                      type="email"
                      value={editFormData.contactEmail || ''}
                      onChange={(e) => updateFormField('contactEmail', e.target.value)}
                      placeholder="contact@example.com"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editFormData.contactPhone || ''}
                      onChange={(e) => updateFormField('contactPhone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              }
            >
              <div className="space-y-3">
                {entity.website && (
                  <div>
                    <label className="text-xs text-gray-500">Website</label>
                    <a
                      href={entity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-blue-600 hover:underline truncate"
                    >
                      {entity.website}
                    </a>
                  </div>
                )}
                {entity.contactName && (
                  <div>
                    <label className="text-xs text-gray-500">Contact Person</label>
                    <p className="text-sm text-gray-800">{entity.contactName}</p>
                  </div>
                )}
                {entity.contactEmail && (
                  <div>
                    <label className="text-xs text-gray-500">Email</label>
                    <a
                      href={`mailto:${entity.contactEmail}`}
                      className="block text-sm text-blue-600 hover:underline"
                    >
                      {entity.contactEmail}
                    </a>
                  </div>
                )}
                {entity.contactPhone && (
                  <div>
                    <label className="text-xs text-gray-500">Phone</label>
                    <a
                      href={`tel:${entity.contactPhone}`}
                      className="block text-sm text-blue-600 hover:underline"
                    >
                      {entity.contactPhone}
                    </a>
                  </div>
                )}
                {!entity.website && !entity.contactEmail && !entity.contactName && !entity.contactPhone && (
                  <p className="text-sm text-gray-400 italic">No contact information</p>
                )}
              </div>
            </EditableSection>

            {/* Technical Identity Section */}
            <EditableSection
              title="Technical Identity"
              isEditing={editingSection === 'technical'}
              onEdit={() => startEditing('technical')}
              onSave={saveSection}
              onCancel={cancelEditing}
              editContent={
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Entity ID</label>
                    <p className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">{entity.id}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Decentralized Identifier (DID)</label>
                    <input
                      type="text"
                      value={editFormData.did || ''}
                      onChange={(e) => updateFormField('did', e.target.value)}
                      placeholder="did:web:example.com"
                      className="w-full px-3 py-1.5 text-sm font-mono border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Logo URI</label>
                    <input
                      type="text"
                      value={editFormData.logoUri || ''}
                      onChange={(e) => updateFormField('logoUri', e.target.value)}
                      placeholder="/assets/logo.png or https://..."
                      className="w-full px-3 py-1.5 text-sm font-mono border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Brand Colour</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editFormData.primaryColor || '#1a365d'}
                        onChange={(e) => updateFormField('primaryColor', e.target.value)}
                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editFormData.primaryColor || ''}
                        onChange={(e) => updateFormField('primaryColor', e.target.value)}
                        placeholder="#1a365d"
                        className="flex-1 px-3 py-1.5 text-sm font-mono border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              }
            >
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">Entity ID</label>
                  <p className="text-sm font-mono text-gray-800">{entity.id}</p>
                </div>
                {entity.did && (
                  <div>
                    <label className="text-xs text-gray-500">Decentralized Identifier (DID)</label>
                    <p className="text-sm font-mono text-gray-800 break-all">{entity.did}</p>
                  </div>
                )}
                {entity.logoUri && (
                  <div>
                    <label className="text-xs text-gray-500">Logo URI</label>
                    <p className="text-sm font-mono text-gray-600 break-all">{entity.logoUri}</p>
                  </div>
                )}
                {entity.primaryColor && (
                  <div>
                    <label className="text-xs text-gray-500">Brand Colour</label>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border border-gray-200"
                        style={{ backgroundColor: entity.primaryColor }}
                      />
                      <span className="text-sm font-mono text-gray-800">{entity.primaryColor}</span>
                    </div>
                  </div>
                )}
                {!entity.did && !entity.logoUri && !entity.primaryColor && (
                  <p className="text-sm text-gray-400 italic">No technical details configured</p>
                )}
              </div>
            </EditableSection>
          </div>

          {/* Regions Covered - Only shown for Data Furnishers with regions */}
          {entity.regionsCovered && entity.regionsCovered.length > 0 && (
            <div className="mt-6 bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Regions Covered
                <span className="ml-auto text-xs font-normal text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  Data Furnisher
                </span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {entity.regionsCovered.map((region) => (
                  <span
                    key={region}
                    className="px-2 py-1 text-sm bg-white border border-green-200 text-green-800 rounded-lg"
                  >
                    {region}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              {/* Created Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Created</h4>
                <div className="space-y-1">
                  {entity.createdAt && (
                    <p className="text-sm text-gray-800">{formatDateTime(entity.createdAt)}</p>
                  )}
                  {entity.createdBy && (
                    <p className="text-xs text-gray-500">
                      by <span className="font-medium text-gray-700">{entity.createdBy.name || entity.createdBy.login}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Updated Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Last Updated</h4>
                <div className="space-y-1">
                  {entity.updatedAt && (
                    <p className="text-sm text-gray-800">{formatDateTime(entity.updatedAt)}</p>
                  )}
                  {entity.updatedBy && (
                    <p className="text-xs text-gray-500">
                      by <span className="font-medium text-gray-700">{entity.updatedBy.name || entity.updatedBy.login}</span>
                    </p>
                  )}
                  {!entity.updatedBy && entity.updatedAt && (
                    <p className="text-xs text-gray-400 italic">No user information</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tab Content: Data Sources - Only shown for Data Furnisher entities */}
      {isDataFurnisher && activeTab === 'data-schema' && (
        <DataSourcesSection entity={entity} onUpdateSchema={handleUpdateSchema} />
      )}

      {/* Tab Content: Assets - Available for all entities */}
      {activeTab === 'assets' && (
        <AssetsSection entity={entity} onRefreshEntity={() => selectEntity(entity.id)} />
      )}
      </div>
    </div>
  );
}
