/**
 * Asset Resolver Service
 *
 * Resolves asset criteria to actual asset URLs by querying entities
 * that match the specified criteria.
 */

import type { AssetCriteria } from '../types/vct';
import type { Entity, EntityAsset } from '../types/entity';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5174';

// Cache for resolved assets (criteria string -> asset URL)
const assetCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Convert criteria to a cache key
function getCacheKey(criteria: AssetCriteria): string {
  return JSON.stringify({
    entityRole: criteria.entityRole,
    dataProviderType: criteria.dataProviderType || null,
    assetType: criteria.assetType,
  });
}

/**
 * Resolve asset criteria to an actual asset URL
 * Returns a random matching entity's asset URL for preview purposes
 */
export async function resolveAssetCriteria(criteria: AssetCriteria): Promise<string | null> {
  // Check cache first
  const cacheKey = getCacheKey(criteria);
  const cached = assetCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.url;
  }

  try {
    // Fetch all entities
    const entitiesRes = await fetch(`${API_BASE}/api/entities`, { credentials: 'include' });
    if (!entitiesRes.ok) {
      console.error('Failed to fetch entities for asset resolution');
      return null;
    }
    const entities: Entity[] = await entitiesRes.json();

    // Filter entities based on criteria
    const matchingEntities = entities.filter((entity) => {
      // Map legacy role values to entity type IDs
      const legacyRoleMap: Record<string, string> = {
        furnisher: 'data-furnisher',
        issuer: 'portfolio-issuer',
        verifier: 'verifier', // placeholder - may not exist
      };
      const entityTypeId = legacyRoleMap[criteria.entityRole] || criteria.entityRole;

      // Check if entity has the required entity type
      const hasEntityType = entity.entityTypes?.includes(entityTypeId);
      if (!hasEntityType) return false;

      // For data-furnisher, check data provider type if specified
      if (entityTypeId === 'data-furnisher' && criteria.dataProviderType) {
        return (entity.dataProviderTypes as string[] | undefined)?.includes(criteria.dataProviderType);
      }

      // For service-provider, check service provider type if specified
      if (entityTypeId === 'service-provider' && criteria.dataProviderType) {
        return (entity.serviceProviderTypes as string[] | undefined)?.includes(criteria.dataProviderType);
      }

      return true;
    });

    if (matchingEntities.length === 0) {
      return null;
    }

    // Pick a random matching entity
    const randomEntity = matchingEntities[Math.floor(Math.random() * matchingEntities.length)];

    // Map criteria asset type to the API asset type
    const assetTypeMap: Record<string, string> = {
      'entity-logo': 'entity-logo',
      'credential-background': 'credential-background',
      'credential-icon': 'credential-icon',
    };
    const apiAssetType = assetTypeMap[criteria.assetType] || criteria.assetType;

    // Fetch assets for this entity
    const assetsRes = await fetch(`${API_BASE}/api/assets?entityId=${randomEntity.id}&type=${apiAssetType}`, {
      credentials: 'include',
    });

    if (!assetsRes.ok) {
      // Fall back to entity's logoUri if available
      if (criteria.assetType === 'entity-logo' && randomEntity.logoUri) {
        const url = randomEntity.logoUri.startsWith('http')
          ? randomEntity.logoUri
          : randomEntity.logoUri.startsWith('/')
          ? randomEntity.logoUri
          : `/assets/${randomEntity.logoUri}`;
        assetCache.set(cacheKey, { url, timestamp: Date.now() });
        return url;
      }
      return null;
    }

    const assets: EntityAsset[] = await assetsRes.json();

    if (assets.length === 0) {
      // Fall back to entity's logoUri for logo type
      if (criteria.assetType === 'entity-logo' && randomEntity.logoUri) {
        const url = randomEntity.logoUri.startsWith('http')
          ? randomEntity.logoUri
          : randomEntity.logoUri.startsWith('/')
          ? randomEntity.logoUri
          : `/assets/${randomEntity.logoUri}`;
        assetCache.set(cacheKey, { url, timestamp: Date.now() });
        return url;
      }
      return null;
    }

    // Pick a random asset from the matching assets
    const randomAsset = assets[Math.floor(Math.random() * assets.length)];
    const url = randomAsset.localUri;

    // Cache the result
    assetCache.set(cacheKey, { url, timestamp: Date.now() });

    return url;
  } catch (error) {
    console.error('Error resolving asset criteria:', error);
    return null;
  }
}

/**
 * Get a descriptive label for asset criteria (for display purposes)
 */
export function getAssetCriteriaLabel(criteria: AssetCriteria): string {
  const parts: string[] = [];

  // Entity type - map IDs to human-readable labels
  const entityTypeLabels: Record<string, string> = {
    // Legacy values
    issuer: 'Issuer',
    furnisher: 'Furnisher',
    verifier: 'Verifier',
    // New entity type IDs
    'data-furnisher': 'Data Furnisher',
    'service-provider': 'Service Provider',
    'portfolio-issuer': 'Portfolio Issuer',
  };
  parts.push(entityTypeLabels[criteria.entityRole] || formatLabel(criteria.entityRole));

  // Data provider type (if data-furnisher or legacy furnisher)
  if ((criteria.entityRole === 'data-furnisher' || criteria.entityRole === 'furnisher') && criteria.dataProviderType) {
    parts.push(formatLabel(criteria.dataProviderType));
  }

  // Service provider type (if service-provider)
  if (criteria.entityRole === 'service-provider' && criteria.dataProviderType) {
    parts.push(formatLabel(criteria.dataProviderType));
  }

  // Asset type
  const assetTypeLabels: Record<string, string> = {
    'entity-logo': 'Logo',
    'credential-background': 'Background',
    'credential-icon': 'Icon',
  };
  parts.push(assetTypeLabels[criteria.assetType] || criteria.assetType);

  return parts.join(' > ');
}

/**
 * Format a kebab-case ID to a human-readable label
 */
function formatLabel(id: string): string {
  return id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Clear the asset cache (call when entities or assets are updated)
 */
export function clearAssetCache(): void {
  assetCache.clear();
}
