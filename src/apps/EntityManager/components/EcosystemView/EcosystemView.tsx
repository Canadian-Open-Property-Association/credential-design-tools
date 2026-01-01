import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Entity, DataProviderType } from '../../../../types/entity';
import { ALL_DATA_PROVIDER_TYPES, DATA_PROVIDER_TYPE_CONFIG } from '../../../../types/entity';
import { useLogoStore } from '../../../../store/logoStore';
import { useFurnisherSettingsStore } from '../../../../store/furnisherSettingsStore';
import CenterNode from './CenterNode';
import OrbitalSegment from './OrbitalSegment';
import ContextMenu from './ContextMenu';

interface EcosystemViewProps {
  entities: Entity[];
  onSelectEntity: (entityId: string) => void;
  onNavigateToMap: (filter?: { entityId?: string; dataType?: string }) => void;
  onNavigateToList: (filter?: { entityId?: string; dataType?: string }) => void;
  externalSelectedEntityId?: string | null;
}

interface ContextMenuState {
  position: { x: number; y: number };
  type: 'entity' | 'dataType';
  entityId?: string;
  dataType?: DataProviderType;
}

export default function EcosystemView({
  entities,
  onSelectEntity,
  onNavigateToMap,
  onNavigateToList,
  externalSelectedEntityId,
}: EcosystemViewProps) {
  const { fetchLogos, getLogoUrl } = useLogoStore();
  const { settings } = useFurnisherSettingsStore();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const [expandedSegment, setExpandedSegment] = useState<DataProviderType | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Use external selection if provided, otherwise use internal
  const selectedEntityId = externalSelectedEntityId ?? internalSelectedId;

  // Fetch logos on mount
  useEffect(() => {
    fetchLogos();
  }, [fetchLogos]);

  // Update dimensions using ResizeObserver for reliable tracking
  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      if (clientWidth > 0 && clientHeight > 0) {
        setDimensions((prev) => {
          // Only update if dimensions actually changed
          if (prev?.width === clientWidth && prev?.height === clientHeight) {
            return prev;
          }
          return { width: clientWidth, height: clientHeight };
        });
      }
    }
  }, []);

  useEffect(() => {
    // Initial dimension calculation
    updateDimensions();

    // Set up ResizeObserver for container size changes
    if (containerRef.current) {
      resizeObserverRef.current = new ResizeObserver(() => {
        updateDimensions();
      });
      resizeObserverRef.current.observe(containerRef.current);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [updateDimensions]);

  // Find network operator (center entity)
  const networkOperator = useMemo(() => {
    return entities.find((e) => e.entityTypes?.includes('network-operator')) || null;
  }, [entities]);

  // Get data furnishers (orbital entities)
  const dataFurnishers = useMemo(() => {
    return entities.filter((e) => e.entityTypes?.includes('data-furnisher'));
  }, [entities]);

  // Group entities by data provider type
  const groupedByType = useMemo(() => {
    const groups: Record<DataProviderType, Entity[]> = {} as Record<DataProviderType, Entity[]>;

    // Initialize all types with empty arrays
    ALL_DATA_PROVIDER_TYPES.forEach((type) => {
      groups[type] = [];
    });

    // Group entities by their data provider types
    dataFurnishers.forEach((entity) => {
      entity.dataProviderTypes?.forEach((type) => {
        if (groups[type]) {
          groups[type].push(entity);
        }
      });
    });

    return groups;
  }, [dataFurnishers]);

  // Get label for data provider type
  const getDataTypeLabel = (typeId: DataProviderType): string => {
    if (settings?.dataProviderTypes) {
      const found = settings.dataProviderTypes.find((t) => t.id === typeId);
      if (found) return found.label;
    }
    return DATA_PROVIDER_TYPE_CONFIG[typeId]?.label || typeId;
  };

  // Get logo URL for entity
  const getEntityLogoUrl = (entity: Entity): string | null => {
    return getLogoUrl(entity.id, entity.logoUri);
  };

  // Handle entity click
  const handleEntityClick = (entity: Entity, event: React.MouseEvent) => {
    event.stopPropagation();
    setInternalSelectedId(entity.id);
    setContextMenu({
      position: { x: event.clientX, y: event.clientY },
      type: 'entity',
      entityId: entity.id,
    });
  };

  // Handle segment click - toggle expansion
  const handleSegmentClick = (dataType: DataProviderType, event: React.MouseEvent) => {
    event.stopPropagation();
    // Toggle expansion - if clicking the same segment, collapse it; otherwise expand new one
    setExpandedSegment((prev) => (prev === dataType ? null : dataType));
    // Clear context menu when expanding
    setContextMenu(null);
  };

  // Handle center node click
  const handleCenterClick = (event: React.MouseEvent) => {
    if (networkOperator) {
      event.stopPropagation();
      setInternalSelectedId(networkOperator.id);
      setContextMenu({
        position: { x: event.clientX, y: event.clientY },
        type: 'entity',
        entityId: networkOperator.id,
      });
    }
  };

  // Close context menu and collapse expanded segment
  const handleCloseContextMenu = () => {
    setContextMenu(null);
    setInternalSelectedId(null);
    setExpandedSegment(null);
  };

  // Build context menu options
  const getContextMenuOptions = () => {
    if (!contextMenu) return [];

    if (contextMenu.type === 'entity' && contextMenu.entityId) {
      return [
        {
          label: 'View Details',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ),
          action: () => {
            onSelectEntity(contextMenu.entityId!);
          },
        },
        {
          label: 'Show on Map',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          ),
          action: () => {
            onNavigateToMap({ entityId: contextMenu.entityId });
          },
        },
        {
          label: 'Show in List',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          ),
          action: () => {
            onNavigateToList({ entityId: contextMenu.entityId });
          },
        },
      ];
    }

    if (contextMenu.type === 'dataType' && contextMenu.dataType) {
      const label = getDataTypeLabel(contextMenu.dataType);
      return [
        {
          label: `Show "${label}" on Map`,
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          ),
          action: () => {
            onNavigateToMap({ dataType: contextMenu.dataType });
          },
        },
        {
          label: `Show "${label}" in List`,
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          ),
          action: () => {
            onNavigateToList({ dataType: contextMenu.dataType });
          },
        },
      ];
    }

    return [];
  };

  // Calculate layout dimensions (only when dimensions are available)
  const centerX = dimensions ? dimensions.width / 2 : 0;
  const centerY = dimensions ? dimensions.height / 2 : 0;
  const minDimension = dimensions ? Math.min(dimensions.width, dimensions.height) : 0;
  const innerRadius = minDimension * 0.18;
  const outerRadius = minDimension * 0.42;

  // Stats - filter by expanded segment if one is selected
  const displayedEntities = expandedSegment
    ? groupedByType[expandedSegment]
    : dataFurnishers;
  const displayedFurnishers = displayedEntities.length;
  const displayedFields = displayedEntities.reduce((acc, e) => {
    const sources = e.dataSchema?.sources || [];
    return acc + sources.reduce((sum, s) => sum + (s.fields?.length || 0), 0);
  }, 0);
  const displayedDataTypes = expandedSegment ? 1 : ALL_DATA_PROVIDER_TYPES.length;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden"
      onClick={handleCloseContextMenu}
    >
      {/* CSS Animations */}
      <style>{`
        @keyframes entity-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        .entity-node-inner {
          animation: entity-float 3s ease-in-out infinite;
        }
        @keyframes glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.3)); }
          50% { filter: drop-shadow(0 0 25px rgba(59, 130, 246, 0.5)); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Stats overlay */}
      <div className="absolute top-4 left-4 text-slate-400 text-sm">
        {expandedSegment && (
          <div className="mb-2 text-slate-300 font-medium">
            {getDataTypeLabel(expandedSegment)}
          </div>
        )}
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            {displayedFurnishers} Data Furnisher{displayedFurnishers !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            {displayedDataTypes} Data Type{displayedDataTypes !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            {displayedFields} Field{displayedFields !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 text-slate-500 text-xs">
        <div className="flex items-center gap-3">
          <span>Click segment to expand</span>
          <span className="text-slate-600">|</span>
          <span>Click entity for options</span>
          {expandedSegment && (
            <>
              <span className="text-slate-600">|</span>
              <span className="text-blue-400">Click background to collapse</span>
            </>
          )}
        </div>
      </div>

      {/* SVG Visualization - only render when dimensions are available */}
      {dimensions && (
        <svg
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0"
        >
          {/* Orbital segments */}
          {ALL_DATA_PROVIDER_TYPES.map((type, index) => (
            <OrbitalSegment
              key={type}
              dataType={type}
              label={getDataTypeLabel(type)}
              entities={groupedByType[type]}
              segmentIndex={index}
              totalSegments={ALL_DATA_PROVIDER_TYPES.length}
              centerX={centerX}
              centerY={centerY}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              viewportWidth={dimensions.width}
              viewportHeight={dimensions.height}
              getLogoUrl={getEntityLogoUrl}
              onEntityClick={handleEntityClick}
              onSegmentClick={handleSegmentClick}
              selectedEntityId={selectedEntityId}
              isExpanded={expandedSegment === type}
              isFaded={expandedSegment !== null && expandedSegment !== type}
            />
          ))}

          {/* Center node (network operator) - fade when segment is expanded */}
          <g
            transform={`translate(${centerX}, ${centerY})`}
            style={{
              opacity: expandedSegment ? 0.3 : 1,
              transition: 'opacity 0.3s ease-in-out',
            }}
          >
            <CenterNode
              entity={networkOperator}
              logoUrl={networkOperator ? getEntityLogoUrl(networkOperator) : null}
              onClick={handleCenterClick}
            />
          </g>
        </svg>
      )}

      {/* Loading state */}
      {!dimensions && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-slate-400">Loading visualization...</div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          position={contextMenu.position}
          options={getContextMenuOptions()}
          onClose={handleCloseContextMenu}
        />
      )}
    </div>
  );
}
