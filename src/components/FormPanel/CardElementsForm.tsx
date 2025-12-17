import { useState, useEffect, useRef } from 'react';
import { useVctStore } from '../../store/vctStore';
import { useZoneTemplateStore } from '../../store/zoneTemplateStore';
import { useZoneSelectionStore } from '../../store/zoneSelectionStore';
import { useFurnisherSettingsStore } from '../../store/furnisherSettingsStore';
import {
  ZoneTemplate,
  Zone,
  ZoneContentType,
  getZoneColor,
  AssetCriteria,
  AssetEntityRole,
  AssetTypeOption,
} from '../../types/vct';
import AssetLibrary from '../AssetLibrary/AssetLibrary';
import ZoneTemplateSelector from '../ZoneEditor/ZoneTemplateSelector';
import ZoneTemplateLibrary from '../Library/ZoneTemplateLibrary';
import { getAssetCriteriaLabel } from '../../services/assetResolver';

interface CardElementsFormProps {
  displayIndex: number;
}

// Dynamic Zone Elements Form - for custom zone templates
interface DynamicZoneElementsFormProps {
  template: ZoneTemplate;
  displayIndex: number;
  claimPaths: { path: string; label: string }[];
}

function DynamicZoneElementsForm({ template, displayIndex, claimPaths }: DynamicZoneElementsFormProps) {
  const updateDynamicElement = useVctStore((state) => state.updateDynamicElement);
  const currentVct = useVctStore((state) => state.currentVct);
  const display = currentVct.display[displayIndex];
  const dynamicElements = display?.dynamic_card_elements;
  const { settings } = useFurnisherSettingsStore();

  // Zone selection state
  const selectedZoneId = useZoneSelectionStore((state) => state.selectedZoneId);
  const selectedFace = useZoneSelectionStore((state) => state.selectedFace);
  const clearSelection = useZoneSelectionStore((state) => state.clearSelection);

  const [frontExpanded, setFrontExpanded] = useState(true);
  const [backExpanded, setBackExpanded] = useState(!template.frontOnly);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [assetPickerZoneId, setAssetPickerZoneId] = useState<string | null>(null);
  const [assetPickerFace, setAssetPickerFace] = useState<'front' | 'back'>('front');

  // Refs for zone elements to enable scroll-to
  const zoneRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const frontZones = template.front.zones;
  const backZones = template.back.zones;

  // Scroll to selected zone when it changes
  useEffect(() => {
    if (selectedZoneId && selectedFace) {
      // Expand the correct section if collapsed
      if (selectedFace === 'front' && !frontExpanded) {
        setFrontExpanded(true);
      } else if (selectedFace === 'back' && !backExpanded) {
        setBackExpanded(true);
      }

      // Small delay to allow expansion animation
      setTimeout(() => {
        const ref = zoneRefs.current[selectedZoneId];
        if (ref) {
          ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add a brief highlight effect
          ref.classList.add('ring-2', 'ring-blue-400', 'ring-offset-2');
          setTimeout(() => {
            ref.classList.remove('ring-2', 'ring-blue-400', 'ring-offset-2');
            clearSelection();
          }, 1500);
        }
      }, 100);
    }
  }, [selectedZoneId, selectedFace, frontExpanded, backExpanded, clearSelection]);

  // Get element for a zone
  const getElementForZone = (face: 'front' | 'back', zoneId: string) => {
    const elements = face === 'front' ? dynamicElements?.front : dynamicElements?.back;
    return elements?.find((el) => el.zone_id === zoneId);
  };

  const handleElementChange = (
    face: 'front' | 'back',
    zoneId: string,
    field: 'claim_path' | 'static_value' | 'logo_uri' | 'label' | 'content_type' | 'alignment' | 'verticalAlignment' | 'scale' | 'textWrap' | 'asset_criteria',
    value: string | number | boolean | AssetCriteria | undefined
  ) => {
    if (updateDynamicElement) {
      updateDynamicElement(displayIndex, face, zoneId, { [field]: value });
    }
  };

  const handleContentTypeChange = (face: 'front' | 'back', zoneId: string, contentType: ZoneContentType) => {
    if (updateDynamicElement) {
      // When changing content type, clear the values from the previous type
      if (contentType === 'text') {
        updateDynamicElement(displayIndex, face, zoneId, {
          content_type: contentType,
          logo_uri: undefined,
          asset_criteria: undefined,
        });
      } else {
        updateDynamicElement(displayIndex, face, zoneId, {
          content_type: contentType,
          claim_path: undefined,
          static_value: undefined,
          label: undefined,
        });
      }
    }
  };

  const openAssetPicker = (face: 'front' | 'back', zoneId: string) => {
    setAssetPickerFace(face);
    setAssetPickerZoneId(zoneId);
    setAssetPickerOpen(true);
  };

  const handleAssetSelect = (uri: string) => {
    if (assetPickerZoneId) {
      handleElementChange(assetPickerFace, assetPickerZoneId, 'logo_uri', uri);
    }
    setAssetPickerOpen(false);
    setAssetPickerZoneId(null);
  };

  const renderZoneElement = (face: 'front' | 'back', zone: Zone, index: number) => {
    const element = getElementForZone(face, zone.id);
    const zoneColor = getZoneColor(index);
    const contentType = element?.content_type || 'text';
    const alignment = element?.alignment || 'center';
    const verticalAlignment = element?.verticalAlignment || 'middle';
    const scale = element?.scale || 1.0;
    const textWrap = element?.textWrap || false;
    const isSelected = selectedZoneId === zone.id;

    return (
      <div
        key={zone.id}
        ref={(el) => { zoneRefs.current[zone.id] = el; }}
        className={`border rounded p-3 space-y-2 transition-all duration-300 ${isSelected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
        style={{ borderLeftColor: zoneColor, borderLeftWidth: '4px' }}
      >
        <div className="flex justify-between items-start">
          <div>
            <span className="text-sm font-medium text-gray-700">Zone {index + 1}</span>
            {zone.subtitle && (
              <span className="ml-2 text-xs text-gray-500">{zone.subtitle}</span>
            )}
          </div>
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: zoneColor }}
            title={zone.name}
          />
        </div>

        {/* Content Type Selector */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Content Type</label>
          <div className="flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => handleContentTypeChange(face, zone.id, 'text')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-l-md border ${
                contentType === 'text'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Text
            </button>
            <button
              type="button"
              onClick={() => handleContentTypeChange(face, zone.id, 'image')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-r-md border-t border-r border-b -ml-px ${
                contentType === 'image'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Image
            </button>
          </div>
        </div>

        {contentType === 'text' && (
          <>
            {/* Source selection */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Source</label>
              <select
                value={element?.claim_path || (element?.static_value ? '__static__' : '')}
                onChange={(e) => {
                  if (e.target.value === '__static__') {
                    handleElementChange(face, zone.id, 'claim_path', undefined);
                    handleElementChange(face, zone.id, 'static_value', '');
                  } else {
                    handleElementChange(face, zone.id, 'claim_path', e.target.value || undefined);
                    handleElementChange(face, zone.id, 'static_value', undefined);
                  }
                }}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
              >
                <option value="">Select claim...</option>
                {claimPaths.map((cp) => (
                  <option key={cp.path} value={cp.path}>
                    {cp.label} ({cp.path})
                  </option>
                ))}
                <option value="__static__">Static value</option>
              </select>
            </div>

            {/* Static value input */}
            {!element?.claim_path && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Static Value</label>
                <input
                  type="text"
                  value={element?.static_value || ''}
                  onChange={(e) => handleElementChange(face, zone.id, 'static_value', e.target.value)}
                  placeholder="Enter static value..."
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                />
              </div>
            )}

            {/* Label for claim-based */}
            {element?.claim_path && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Display Label (optional)</label>
                <input
                  type="text"
                  value={element?.label || ''}
                  onChange={(e) => handleElementChange(face, zone.id, 'label', e.target.value)}
                  placeholder="e.g., Property Address"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                />
              </div>
            )}
          </>
        )}

        {contentType === 'image' && (
          <div className="space-y-3">
            {/* Image Source Type Toggle */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Image Source</label>
              <div className="flex rounded-md shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    // Switch to specific asset mode - clear criteria
                    handleElementChange(face, zone.id, 'asset_criteria', undefined);
                  }}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-l-md border ${
                    !element?.asset_criteria
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Specific Asset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Switch to criteria mode - clear logo_uri and set default criteria
                    handleElementChange(face, zone.id, 'logo_uri', undefined);
                    handleElementChange(face, zone.id, 'asset_criteria', {
                      entityRole: 'furnisher',
                      assetType: 'entity-logo',
                    });
                  }}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-r-md border-t border-r border-b -ml-px ${
                    element?.asset_criteria
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Dynamic Criteria
                </button>
              </div>
            </div>

            {/* Specific Asset Selection */}
            {!element?.asset_criteria && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Select Asset</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={element?.logo_uri || ''}
                    onChange={(e) => handleElementChange(face, zone.id, 'logo_uri', e.target.value || undefined)}
                    placeholder="https://example.com/image.png"
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded"
                  />
                  <button
                    type="button"
                    onClick={() => openAssetPicker(face, zone.id)}
                    className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                    title="Browse Asset Library"
                  >
                    Browse
                  </button>
                </div>
                {element?.logo_uri && (
                  <div className="mt-2 flex items-center gap-2">
                    <img
                      src={element.logo_uri}
                      alt="Preview"
                      className="w-10 h-10 object-contain border rounded bg-gray-50"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span className="text-xs text-gray-500 truncate flex-1">{element.logo_uri}</span>
                    <button
                      type="button"
                      onClick={() => handleElementChange(face, zone.id, 'logo_uri', undefined)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Dynamic Criteria Selection */}
            {element?.asset_criteria && (
              <div className="space-y-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-purple-700 font-medium">
                  Asset will be dynamically selected based on criteria:
                </p>

                {/* Entity Role */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Entity Role</label>
                  <select
                    value={element.asset_criteria.entityRole}
                    onChange={(e) => {
                      const newRole = e.target.value as AssetEntityRole;
                      handleElementChange(face, zone.id, 'asset_criteria', {
                        ...element.asset_criteria!,
                        entityRole: newRole,
                        // Clear data provider type if not furnisher
                        dataProviderType: newRole === 'furnisher' ? element.asset_criteria?.dataProviderType : undefined,
                      });
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white"
                  >
                    <option value="issuer">Issuer</option>
                    <option value="furnisher">Furnisher (Data Provider)</option>
                    <option value="verifier">Verifier</option>
                  </select>
                </div>

                {/* Data Provider Type - only for furnisher */}
                {element.asset_criteria.entityRole === 'furnisher' && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Data Provider Type</label>
                    <select
                      value={element.asset_criteria.dataProviderType || ''}
                      onChange={(e) => {
                        handleElementChange(face, zone.id, 'asset_criteria', {
                          ...element.asset_criteria!,
                          dataProviderType: e.target.value || undefined,
                        });
                      }}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white"
                    >
                      <option value="">Any data provider</option>
                      {(settings?.dataProviderTypes || []).map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      e.g., "Identity" will show logos from identity data providers
                    </p>
                  </div>
                )}

                {/* Asset Type */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Asset Type</label>
                  <select
                    value={element.asset_criteria.assetType}
                    onChange={(e) => {
                      handleElementChange(face, zone.id, 'asset_criteria', {
                        ...element.asset_criteria!,
                        assetType: e.target.value as AssetTypeOption,
                      });
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white"
                  >
                    <option value="entity-logo">Logo</option>
                    <option value="credential-background">Credential Background</option>
                    <option value="credential-icon">Credential Icon</option>
                  </select>
                </div>

                {/* Criteria Summary */}
                <div className="mt-2 pt-2 border-t border-purple-200">
                  <span className="text-xs text-purple-600 font-medium">
                    Rule: {getAssetCriteriaLabel(element.asset_criteria)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Alignment and Size Controls */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          {/* Horizontal & Vertical Alignment Row */}
          <div className="flex gap-3">
            {/* Horizontal Alignment */}
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Horizontal</label>
              <div className="flex rounded-md shadow-sm">
                <button
                  type="button"
                  onClick={() => handleElementChange(face, zone.id, 'alignment', 'left')}
                  className={`flex-1 px-2 py-1.5 rounded-l-md border ${
                    alignment === 'left'
                      ? 'bg-gray-700 text-white border-gray-700'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                  title="Align left"
                >
                  <svg className="w-4 h-4 mx-auto" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="2" y="3" width="10" height="2" />
                    <rect x="2" y="7" width="6" height="2" />
                    <rect x="2" y="11" width="8" height="2" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleElementChange(face, zone.id, 'alignment', 'center')}
                  className={`flex-1 px-2 py-1.5 border-t border-b -ml-px ${
                    alignment === 'center'
                      ? 'bg-gray-700 text-white border-gray-700'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                  title="Align center"
                >
                  <svg className="w-4 h-4 mx-auto" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="3" y="3" width="10" height="2" />
                    <rect x="5" y="7" width="6" height="2" />
                    <rect x="4" y="11" width="8" height="2" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleElementChange(face, zone.id, 'alignment', 'right')}
                  className={`flex-1 px-2 py-1.5 rounded-r-md border -ml-px ${
                    alignment === 'right'
                      ? 'bg-gray-700 text-white border-gray-700'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                  title="Align right"
                >
                  <svg className="w-4 h-4 mx-auto" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="4" y="3" width="10" height="2" />
                    <rect x="8" y="7" width="6" height="2" />
                    <rect x="6" y="11" width="8" height="2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Vertical Alignment */}
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Vertical</label>
              <div className="flex rounded-md shadow-sm">
                <button
                  type="button"
                  onClick={() => handleElementChange(face, zone.id, 'verticalAlignment', 'top')}
                  className={`flex-1 px-2 py-1.5 rounded-l-md border ${
                    verticalAlignment === 'top'
                      ? 'bg-gray-700 text-white border-gray-700'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                  title="Align top"
                >
                  <svg className="w-4 h-4 mx-auto" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="3" y="2" width="10" height="2" />
                    <rect x="6" y="6" width="4" height="8" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleElementChange(face, zone.id, 'verticalAlignment', 'middle')}
                  className={`flex-1 px-2 py-1.5 border-t border-b -ml-px ${
                    verticalAlignment === 'middle'
                      ? 'bg-gray-700 text-white border-gray-700'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                  title="Align middle"
                >
                  <svg className="w-4 h-4 mx-auto" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="3" y="7" width="10" height="2" />
                    <rect x="6" y="3" width="4" height="10" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleElementChange(face, zone.id, 'verticalAlignment', 'bottom')}
                  className={`flex-1 px-2 py-1.5 rounded-r-md border -ml-px ${
                    verticalAlignment === 'bottom'
                      ? 'bg-gray-700 text-white border-gray-700'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                  title="Align bottom"
                >
                  <svg className="w-4 h-4 mx-auto" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="6" y="2" width="4" height="8" />
                    <rect x="3" y="12" width="10" height="2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Size and Text Wrap Row */}
          <div className="flex gap-3">
            {/* Size */}
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Size</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleElementChange(face, zone.id, 'scale', Math.max(0.5, scale - 0.1))}
                  className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                  disabled={scale <= 0.5}
                >
                  -
                </button>
                <span className="text-xs text-gray-600 w-12 text-center">{scale.toFixed(1)}x</span>
                <button
                  type="button"
                  onClick={() => handleElementChange(face, zone.id, 'scale', Math.min(2.0, scale + 0.1))}
                  className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                  disabled={scale >= 2.0}
                >
                  +
                </button>
              </div>
            </div>

            {/* Text Wrap - only for text content */}
            {contentType === 'text' && (
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Text Wrap</label>
                <div className="flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleElementChange(face, zone.id, 'textWrap', false)}
                    className={`flex-1 px-2 py-1.5 rounded-l-md border text-xs ${
                      !textWrap
                        ? 'bg-gray-700 text-white border-gray-700'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                    title="Auto-shrink: text shrinks to fit on one line"
                  >
                    <svg className="w-4 h-4 mx-auto" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="2" y="7" width="12" height="2" />
                      <path d="M12 5l2 2-2 2V5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleElementChange(face, zone.id, 'textWrap', true)}
                    className={`flex-1 px-2 py-1.5 rounded-r-md border -ml-px text-xs ${
                      textWrap
                        ? 'bg-gray-700 text-white border-gray-700'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                    title="Wrap: text wraps to multiple lines"
                  >
                    <svg className="w-4 h-4 mx-auto" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="2" y="3" width="12" height="2" />
                      <rect x="2" y="7" width="8" height="2" />
                      <rect x="2" y="11" width="10" height="2" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Front of Card - Collapsible */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setFrontExpanded(!frontExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <span className="text-sm font-medium text-gray-700">
            Front of Card ({frontZones.length} zone{frontZones.length !== 1 ? 's' : ''})
          </span>
          <span className={`transform transition-transform ${frontExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        {frontExpanded && (
          <div className="p-4 space-y-3 bg-white">
            {frontZones.length > 0 ? (
              frontZones.map((zone, index) => renderZoneElement('front', zone, index))
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p className="text-sm">No zones defined for the front of this template.</p>
                <p className="text-xs mt-1">Use the Zone Template Library to add zones.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Back of Card - Collapsible (hidden for front-only templates) */}
      {!template.frontOnly && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setBackExpanded(!backExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">
              Back of Card ({backZones.length} zone{backZones.length !== 1 ? 's' : ''})
            </span>
            <span className={`transform transition-transform ${backExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          {backExpanded && (
            <div className="p-4 space-y-3 bg-white">
              {backZones.length > 0 ? (
                backZones.map((zone, index) => renderZoneElement('back', zone, index))
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-sm">No zones defined for the back of this template.</p>
                  <p className="text-xs mt-1">Use the Zone Template Library to add zones.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Asset Library Modal for Zone Images */}
      <AssetLibrary
        isOpen={assetPickerOpen}
        onClose={() => {
          setAssetPickerOpen(false);
          setAssetPickerZoneId(null);
        }}
        onSelect={handleAssetSelect}
        title="Select Zone Image"
      />
    </div>
  );
}

export default function CardElementsForm({ displayIndex }: CardElementsFormProps) {
  const currentVct = useVctStore((state) => state.currentVct);

  // Get claim paths for dropdown
  const claimPaths = currentVct.claims.map((claim) => {
    const path = '$.' + claim.path.filter((p) => p !== null && p !== undefined).join('.');
    const label = claim.display[0]?.label || path;
    return { path, label };
  });

  // Zone template state
  const selectedTemplateId = useZoneTemplateStore((state) => state.selectedTemplateId);
  const selectTemplate = useZoneTemplateStore((state) => state.selectTemplate);
  const getTemplate = useZoneTemplateStore((state) => state.getTemplate);
  const setDynamicCardElementsTemplate = useVctStore((state) => state.setDynamicCardElementsTemplate);
  const [showZoneLibrary, setShowZoneLibrary] = useState(false);

  // Handle template selection - update both zone template store and VCT
  const handleTemplateSelect = (templateId: string) => {
    selectTemplate(templateId);
    setDynamicCardElementsTemplate(displayIndex, templateId);
  };

  // Get the selected template for dynamic zone rendering
  const selectedTemplate = selectedTemplateId ? getTemplate(selectedTemplateId) : null;

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-6">
      {/* Zone Template Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Zone Template
        </label>
        <ZoneTemplateSelector
          selectedTemplateId={selectedTemplateId}
          onSelect={handleTemplateSelect}
          onManageClick={() => setShowZoneLibrary(true)}
        />
      </div>

      {/* Divider */}
      <hr className="border-gray-200" />

      <div>
        <h4 className="font-medium text-gray-800">Card Elements</h4>
        <p className="text-xs text-gray-500 mt-1">
          Configure the elements that appear on the front and back of the credential card.
        </p>
      </div>

      {/* Dynamic Zone Elements Form - when a template is selected */}
      {selectedTemplate ? (
        <DynamicZoneElementsForm
          template={selectedTemplate}
          displayIndex={displayIndex}
          claimPaths={claimPaths}
        />
      ) : (
        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          <p className="text-base font-medium text-gray-500">No template selected</p>
          <p className="text-sm mt-1">Select or create a zone template to configure card elements.</p>
          <button
            type="button"
            onClick={() => setShowZoneLibrary(true)}
            className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Open Template Library
          </button>
        </div>
      )}

      {/* Zone Template Library Modal */}
      <ZoneTemplateLibrary
        isOpen={showZoneLibrary}
        onClose={() => setShowZoneLibrary(false)}
        onSelectTemplate={selectTemplate}
      />
    </div>
  );
}
