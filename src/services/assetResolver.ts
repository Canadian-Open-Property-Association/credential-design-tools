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
      // For 'furnisher' role, check if entity has data-furnisher type and matching data provider type
      if (criteria.entityRole === 'furnisher') {
        const isDataFurnisher = entity.entityTypes?.includes('data-furnisher');
        if (!isDataFurnisher) return false;

        // If a specific data provider type is required, check for it
        if (criteria.dataProviderType) {
          // Cast to string array since dataProviderType values match but types differ
          return (entity.dataProviderTypes as string[] | undefined)?.includes(criteria.dataProviderType);
        }
        return true;
      }

      // For 'issuer' role - TODO: implement issuer matching logic
      // For now, we return entities that have the portfolio-issuer type
      if (criteria.entityRole === 'issuer') {
        return entity.entityTypes?.includes('portfolio-issuer');
      }

      // For 'verifier' role - TODO: implement verifier matching logic
      if (criteria.entityRole === 'verifier') {
        // For now, we don't have a verifier type, so return false
        return false;
      }

      return false;
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

  // Role
  const roleLabels: Record<string, string> = {
    issuer: 'Issuer',
    furnisher: 'Furnisher',
    verifier: 'Verifier',
  };
  parts.push(roleLabels[criteria.entityRole] || criteria.entityRole);

  // Data provider type (if furnisher)
  if (criteria.entityRole === 'furnisher' && criteria.dataProviderType) {
    // Format the type nicely (e.g., 'title-ownership' -> 'Title/Ownership')
    const formatted = criteria.dataProviderType
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('/');
    parts.push(formatted);
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
 * Clear the asset cache (call when entities or assets are updated)
 */
export function clearAssetCache(): void {
  assetCache.clear();
}
