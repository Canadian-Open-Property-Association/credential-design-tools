import { useState, useRef, useEffect } from 'react';
import type { Entity, EntityType, FurnisherDataSchema, EntityAsset } from '../../../types/entity';
import { ENTITY_TYPE_CONFIG, migrateDataSchema, DATA_PROVIDER_TYPE_CONFIG, ALL_DATA_PROVIDER_TYPES } from '../../../types/entity';
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

  // Entity types editing state (used in Entity Classification section)
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
      setSelectedTypes(entity.types || []);
    }
  }, [entity.id]);

  // Sync selectedTypes when entity.types changes (e.g., after save)
  useEffect(() => {
    if (editingSection !== 'classification') {
      setSelectedTypes(entity.types || []);
    }
  }, [entity.types, editingSection]);

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

  // Entity type toggle handler (used in Entity Classification section)
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

          {/* Entity Types - Read-only badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {entity.types?.map((type) => (
              <span
                key={type}
                className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(type)}`}
              >
                {ENTITY_TYPE_CONFIG[type]?.label}
              </span>
            ))}
          </div>
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
          {/* Organization Details - Merged Contact & Technical */}
          <EditableSection
            title="Organization Details"
            icon={
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            isEditing={editingSection === 'organization'}
            onEdit={() => startEditing('organization')}
            onSave={saveSection}
            onCancel={cancelEditing}
            editContent={
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-xs text-gray-500 mb-1">DID (Decentralized Identifier)</label>
                  <input
                    type="text"
                    value={editFormData.did || ''}
                    onChange={(e) => updateFormField('did', e.target.value)}
                    placeholder="did:web:example.com"
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
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Entity ID</label>
                <p className="text-sm font-mono text-gray-800">{entity.id}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Website</label>
                {entity.website ? (
                  <a
                    href={entity.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-blue-600 hover:underline truncate"
                  >
                    {entity.website}
                  </a>
                ) : (
                  <p className="text-sm text-gray-400">—</p>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500">Contact Person</label>
                <p className="text-sm text-gray-800">{entity.contactName || <span className="text-gray-400">—</span>}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Email</label>
                {entity.contactEmail ? (
                  <a
                    href={`mailto:${entity.contactEmail}`}
                    className="block text-sm text-blue-600 hover:underline"
                  >
                    {entity.contactEmail}
                  </a>
                ) : (
                  <p className="text-sm text-gray-400">—</p>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500">Phone</label>
                {entity.contactPhone ? (
                  <a
                    href={`tel:${entity.contactPhone}`}
                    className="block text-sm text-blue-600 hover:underline"
                  >
                    {entity.contactPhone}
                  </a>
                ) : (
                  <p className="text-sm text-gray-400">—</p>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500">DID</label>
                <p className="text-sm font-mono text-gray-800 break-all">{entity.did || <span className="text-gray-400 font-sans">—</span>}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Brand Colour</label>
                {entity.primaryColor ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded border border-gray-200"
                      style={{ backgroundColor: entity.primaryColor }}
                    />
                    <span className="text-sm font-mono text-gray-800">{entity.primaryColor}</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">—</p>
                )}
              </div>
            </div>
          </EditableSection>

          {/* Entity Classification Section */}
          <div className="mt-6">
            <EditableSection
              title="Entity Classification"
              icon={
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              }
              isEditing={editingSection === 'classification'}
              onEdit={() => {
                setEditingSection('classification');
                setSelectedTypes(entity.types || []);
                setEditFormData({ ...entity });
              }}
              onSave={async () => {
                try {
                  await updateEntity(entity.id, {
                    types: selectedTypes,
                    regionsCovered: editFormData.regionsCovered,
                    dataProviderTypes: editFormData.dataProviderTypes
                  });
                  setEditingSection(null);
                  setEditFormData({});
                } catch (error) {
                  console.error('Failed to update entity:', error);
                }
              }}
              onCancel={() => {
                setEditingSection(null);
                setSelectedTypes(entity.types || []);
                setEditFormData({});
              }}
              editContent={
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Entity Types</label>
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

                  {/* Regions - only if data-furnisher is selected */}
                  {selectedTypes.includes('data-furnisher') && (
                    <div>
                      <span className="block text-xs font-medium text-gray-600 mb-2">Regions Covered</span>
                      <div className="grid grid-cols-4 gap-2">
                        {['BC', 'AB', 'SK', 'MB', 'ON', 'QC', 'NB', 'NS', 'PE', 'NL', 'YT', 'NT', 'NU'].map((region) => {
                          const isSelected = editFormData.regionsCovered?.includes(region);
                          return (
                            <div
                              key={region}
                              onClick={() => {
                                const current = editFormData.regionsCovered || [];
                                if (isSelected) {
                                  setEditFormData(prev => ({ ...prev, regionsCovered: current.filter(r => r !== region) }));
                                } else {
                                  setEditFormData(prev => ({ ...prev, regionsCovered: [...current, region] }));
                                }
                              }}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded border cursor-pointer transition-colors select-none ${
                                isSelected
                                  ? 'bg-green-50 border-green-300 text-green-800'
                                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              <span className="text-sm">{region}</span>
                              {isSelected && (
                                <svg className="w-3 h-3 text-green-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Data Provider Types - only if data-furnisher is selected */}
                  {selectedTypes.includes('data-furnisher') && (
                    <div>
                      <span className="block text-xs font-medium text-gray-600 mb-2">Data Provider Types</span>
                      <div className="grid grid-cols-2 gap-2">
                        {ALL_DATA_PROVIDER_TYPES.map((providerType) => {
                          const isSelected = editFormData.dataProviderTypes?.includes(providerType);
                          const config = DATA_PROVIDER_TYPE_CONFIG[providerType];
                          return (
                            <div
                              key={providerType}
                              onClick={() => {
                                const current = editFormData.dataProviderTypes || [];
                                if (isSelected) {
                                  setEditFormData(prev => ({ ...prev, dataProviderTypes: current.filter(t => t !== providerType) }));
                                } else {
                                  setEditFormData(prev => ({ ...prev, dataProviderTypes: [...current, providerType] }));
                                }
                              }}
                              className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-colors select-none ${
                                isSelected
                                  ? 'bg-blue-50 border-blue-300 text-blue-800'
                                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              <span className="text-sm">{config.label}</span>
                              {isSelected && (
                                <svg className="w-3 h-3 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              }
            >
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">Entity Types</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {entity.types?.map((type) => (
                      <span
                        key={type}
                        className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(type)}`}
                      >
                        {ENTITY_TYPE_CONFIG[type]?.label}
                      </span>
                    ))}
                  </div>
                </div>
                {isDataFurnisher && (
                  <>
                    <div>
                      <label className="text-xs text-gray-500">Regions Covered</label>
                      {entity.regionsCovered && entity.regionsCovered.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {entity.regionsCovered.map((region) => (
                            <span
                              key={region}
                              className="px-2 py-0.5 text-xs bg-green-50 border border-green-200 text-green-800 rounded"
                            >
                              {region}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No regions specified</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Data Provider Types</label>
                      {entity.dataProviderTypes && entity.dataProviderTypes.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {entity.dataProviderTypes.map((providerType) => (
                            <span
                              key={providerType}
                              className="px-2 py-0.5 text-xs bg-blue-50 border border-blue-200 text-blue-800 rounded"
                            >
                              {DATA_PROVIDER_TYPE_CONFIG[providerType]?.label}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No data provider types specified</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </EditableSection>
          </div>

          {/* Metadata Footer - outside grey box */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                {entity.createdAt && (
                  <span>
                    Created {formatDateTime(entity.createdAt)}
                    {entity.createdBy && (
                      <span> by {entity.createdBy.name || entity.createdBy.login}</span>
                    )}
                  </span>
                )}
              </div>
              <div>
                {entity.updatedAt && (
                  <span>
                    Updated {formatDateTime(entity.updatedAt)}
                    {entity.updatedBy && (
                      <span> by {entity.updatedBy.name || entity.updatedBy.login}</span>
                    )}
                  </span>
                )}
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
