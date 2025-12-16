import { useState, useMemo, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import type { Entity, DataProviderType } from '../../../types/entity';
import { DATA_PROVIDER_TYPE_CONFIG, ALL_DATA_PROVIDER_TYPES } from '../../../types/entity';
import { CANADIAN_REGIONS, getRegionName, normalizeRegions } from '../../../constants/regions';
import { useFurnisherSettingsStore } from '../../../store/furnisherSettingsStore';

// Canada TopoJSON - using a more reliable source
const CANADA_TOPO_URL = 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/canada.geojson';

// Map province names from GeoJSON to codes
const PROVINCE_NAME_TO_CODE: Record<string, string> = {
  'Alberta': 'AB',
  'British Columbia': 'BC',
  'Manitoba': 'MB',
  'New Brunswick': 'NB',
  'Newfoundland and Labrador': 'NL',
  'Nova Scotia': 'NS',
  'Northwest Territories': 'NT',
  'Nunavut': 'NU',
  'Ontario': 'ON',
  'Prince Edward Island': 'PE',
  'Quebec': 'QC',
  'Saskatchewan': 'SK',
  'Yukon Territory': 'YT',
  'Yukon': 'YT',
};

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5174';

interface MapViewProps {
  entities: Entity[];
  onSelectEntity: (entityId: string) => void;
}

export default function MapView({ entities, onSelectEntity }: MapViewProps) {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedDataTypes, setSelectedDataTypes] = useState<DataProviderType[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [logoAssets, setLogoAssets] = useState<Record<string, string>>({});
  const { settings } = useFurnisherSettingsStore();

  // Get selected entity
  const selectedEntity = useMemo(() => {
    if (!selectedEntityId) return null;
    return entities.find(e => e.id === selectedEntityId) || null;
  }, [entities, selectedEntityId]);

  // Get provinces covered by selected entity
  const selectedEntityProvinces = useMemo(() => {
    if (!selectedEntity) return new Set<string>();
    return new Set(normalizeRegions(selectedEntity.regionsCovered));
  }, [selectedEntity]);

  // Fetch entity-logo assets for all entities
  useEffect(() => {
    const fetchLogoAssets = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/assets?type=entity-logo`, { credentials: 'include' });
        if (res.ok) {
          const assets = await res.json();
          const logoMap: Record<string, string> = {};
          for (const asset of assets) {
            if (asset.entityId && asset.localUri) {
              logoMap[asset.entityId] = asset.localUri;
            }
          }
          setLogoAssets(logoMap);
        }
      } catch (err) {
        console.error('Failed to fetch logo assets:', err);
      }
    };
    fetchLogoAssets();
  }, []);

  // Get logo URL for an entity
  const getLogoUrl = (entity: Entity): string | null => {
    // First check asset library
    if (logoAssets[entity.id]) {
      return logoAssets[entity.id];
    }
    // Fall back to entity.logoUri
    if (entity.logoUri) {
      if (entity.logoUri.startsWith('http')) return entity.logoUri;
      if (entity.logoUri.startsWith('/')) return entity.logoUri;
      return `/assets/${entity.logoUri}`;
    }
    return null;
  };

  // Get data provider types from settings or fallback
  const dataProviderTypes = useMemo(() => {
    if (settings?.dataProviderTypes) {
      return settings.dataProviderTypes;
    }
    return ALL_DATA_PROVIDER_TYPES.map(id => ({
      id,
      label: DATA_PROVIDER_TYPE_CONFIG[id]?.label || id,
    }));
  }, [settings]);

  // Filter entities by selected data provider types
  const filteredEntities = useMemo(() => {
    if (selectedDataTypes.length === 0) return entities;
    return entities.filter(e =>
      e.dataProviderTypes?.some(t => selectedDataTypes.includes(t))
    );
  }, [entities, selectedDataTypes]);

  // Count furnishers per province
  const provinceCount = useMemo(() => {
    const counts: Record<string, number> = {};
    CANADIAN_REGIONS.forEach(r => counts[r.code] = 0);

    filteredEntities.forEach(entity => {
      const regions = normalizeRegions(entity.regionsCovered);
      regions.forEach(region => {
        counts[region] = (counts[region] || 0) + 1;
      });
    });

    return counts;
  }, [filteredEntities]);

  // Get furnishers for selected province
  const provinceFurnishers = useMemo(() => {
    if (!selectedProvince) return filteredEntities;
    return filteredEntities.filter(e =>
      normalizeRegions(e.regionsCovered).includes(selectedProvince)
    );
  }, [filteredEntities, selectedProvince]);

  // Get max count for color scaling
  const maxCount = useMemo(() => {
    return Math.max(1, ...Object.values(provinceCount));
  }, [provinceCount]);

  // 8-color scale from gray to green
  const COLOR_SCALE = [
    '#e5e7eb', // gray-200 (0 furnishers)
    '#d1fae5', // emerald-100
    '#a7f3d0', // emerald-200
    '#6ee7b7', // emerald-300
    '#34d399', // emerald-400
    '#10b981', // emerald-500
    '#059669', // emerald-600
    '#047857', // emerald-700
  ];

  // Get color based on count using 8-step scale
  const getProvinceColor = (code: string) => {
    const count = provinceCount[code] || 0;
    if (count === 0) return COLOR_SCALE[0];

    // Calculate which color bucket this count falls into (1-7)
    const bucketSize = maxCount / 7;
    const bucket = Math.min(Math.ceil(count / bucketSize), 7);
    return COLOR_SCALE[bucket];
  };

  // Toggle data type filter
  const toggleDataType = (type: DataProviderType) => {
    setSelectedDataTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Get label for data provider type
  const getDataTypeLabel = (typeId: string) => {
    if (settings?.dataProviderTypes) {
      const found = settings.dataProviderTypes.find(t => t.id === typeId);
      if (found) return found.label;
    }
    return DATA_PROVIDER_TYPE_CONFIG[typeId as DataProviderType]?.label || typeId;
  };

  return (
    <div className="h-full flex gap-4 p-4">
      {/* Left Panel - Furnisher List */}
      <div className="w-80 flex-shrink-0 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">
            {selectedProvince
              ? `Entities in ${getRegionName(selectedProvince)}`
              : 'All Entities'
            }
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {provinceFurnishers.length} entit{provinceFurnishers.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>

        {/* Entity List */}
        <div className="flex-1 overflow-y-auto">
          {provinceFurnishers.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No entities found
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {provinceFurnishers.map(entity => {
                const logoUrl = getLogoUrl(entity);
                const isSelected = selectedEntityId === entity.id;
                return (
                  <button
                    key={entity.id}
                    onClick={() => setSelectedEntityId(isSelected ? null : entity.id)}
                    className={`w-full p-3 text-left transition-colors border-l-4 ${
                      isSelected
                        ? 'bg-blue-50 border-l-blue-500'
                        : 'hover:bg-gray-50 border-l-transparent'
                    }`}
                    style={isSelected && entity.primaryColor ? { borderLeftColor: entity.primaryColor } : undefined}
                  >
                    <div className="flex items-center gap-3">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt=""
                          className="w-8 h-8 object-contain rounded bg-gray-50"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-medium ${logoUrl ? 'hidden' : ''}`}>
                        {entity.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">{entity.name}</div>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {entity.dataProviderTypes?.slice(0, 2).map(type => (
                            <span
                              key={type}
                              className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded"
                            >
                              {getDataTypeLabel(type)}
                            </span>
                          ))}
                          {(entity.dataProviderTypes?.length || 0) > 2 && (
                            <span className="text-xs text-gray-400">
                              +{(entity.dataProviderTypes?.length || 0) - 2}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected ? (
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Map */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        {/* Map Header with Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium text-gray-900">Coverage Map</h3>
              <p className="text-sm text-gray-500">Click a province to filter entities</p>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">Coverage:</span>
              <div className="flex items-center gap-0.5">
                {COLOR_SCALE.map((color, i) => (
                  <div key={i} className="w-3 h-4 first:rounded-l last:rounded-r" style={{ background: color }} />
                ))}
              </div>
              <span className="text-xs text-gray-500">None → High</span>
            </div>
          </div>
          {/* Data Type Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 mr-1">Filter by type:</span>
            {dataProviderTypes.map(type => (
              <button
                key={type.id}
                onClick={() => toggleDataType(type.id as DataProviderType)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  selectedDataTypes.includes(type.id as DataProviderType)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
              >
                {type.label}
              </button>
            ))}
            {(selectedDataTypes.length > 0 || selectedProvince || selectedEntityId) && (
              <button
                onClick={() => {
                  setSelectedDataTypes([]);
                  setSelectedProvince(null);
                  setSelectedEntityId(null);
                }}
                className="ml-2 text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Map */}
        <div
          className="flex-1 bg-gradient-to-b from-blue-50 to-blue-100 relative min-h-0"
          onClick={(e) => {
            // Only deselect if clicking directly on the map container (not on a province)
            if (e.target === e.currentTarget) {
              setSelectedProvince(null);
              setSelectedEntityId(null);
            }
          }}
        >
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              center: [-95, 60],
              scale: 400,
            }}
            style={{ width: '100%', height: '100%' }}
          >
            <ZoomableGroup center={[-95, 60]} zoom={1} minZoom={0.8} maxZoom={4}>
              {/* Background rect to capture clicks outside provinces */}
              <rect
                x="-1000"
                y="-1000"
                width="3000"
                height="3000"
                fill="transparent"
                onClick={() => {
                  setSelectedProvince(null);
                  setSelectedEntityId(null);
                }}
              />
              <Geographies geography={CANADA_TOPO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const provinceName = (geo.properties.name || geo.properties.NAME || '') as string;
                    const code = PROVINCE_NAME_TO_CODE[provinceName];
                    const isProvinceSelected = selectedProvince === code;
                    const isEntityCovered = selectedEntityProvinces.has(code);
                    const entityColor = selectedEntity?.primaryColor || '#f59e0b';

                    // Determine fill color based on selection state
                    const getFillColor = () => {
                      if (isEntityCovered) return entityColor;
                      if (isProvinceSelected) return '#3b82f6';
                      return getProvinceColor(code);
                    };

                    const getHoverColor = () => {
                      if (isEntityCovered) return entityColor;
                      if (isProvinceSelected) return '#2563eb';
                      return '#93c5fd';
                    };

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => {
                          if (selectedEntityId) {
                            // If entity is selected, clicking a province deselects the entity
                            setSelectedEntityId(null);
                          } else {
                            setSelectedProvince(isProvinceSelected ? null : code);
                          }
                        }}
                        style={{
                          default: {
                            fill: getFillColor(),
                            stroke: isEntityCovered ? '#ffffff' : '#ffffff',
                            strokeWidth: isEntityCovered ? 1.5 : 0.75,
                            outline: 'none',
                            cursor: 'pointer',
                          },
                          hover: {
                            fill: getHoverColor(),
                            stroke: '#ffffff',
                            strokeWidth: isEntityCovered ? 1.5 : 0.75,
                            outline: 'none',
                            cursor: 'pointer',
                          },
                          pressed: {
                            fill: isEntityCovered ? entityColor : '#3b82f6',
                            stroke: '#ffffff',
                            strokeWidth: isEntityCovered ? 1.5 : 0.75,
                            outline: 'none',
                          },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>

          {/* Province Info Tooltip - only show when no entity is selected */}
          {selectedProvince && !selectedEntityId && (
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-3 z-10">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium text-gray-900">{getRegionName(selectedProvince)}</div>
                  <div className="text-sm text-gray-500">
                    {provinceCount[selectedProvince] || 0} entit{(provinceCount[selectedProvince] || 0) !== 1 ? 'ies' : 'y'}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProvince(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Selected Entity Bubble - compact floating card */}
          {selectedEntity && (
            <div className="absolute bottom-4 right-4 bg-white rounded-xl shadow-lg border border-gray-200 z-10 max-w-[280px]">
              <div className="p-3">
                <div className="flex items-center gap-2.5">
                  {/* Logo */}
                  {getLogoUrl(selectedEntity) ? (
                    <img
                      src={getLogoUrl(selectedEntity)!}
                      alt=""
                      className="w-9 h-9 object-contain rounded-lg bg-gray-50 flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                      style={{ backgroundColor: selectedEntity.primaryColor || '#6b7280' }}
                    >
                      {selectedEntity.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate">{selectedEntity.name}</h4>
                    <p className="text-xs text-gray-500">
                      {selectedEntityProvinces.size} province{selectedEntityProvinces.size !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onSelectEntity(selectedEntity.id)}
                      className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedEntityId(null)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Close"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
