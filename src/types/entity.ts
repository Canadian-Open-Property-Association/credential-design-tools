// Entity Management Types
// All entities are Data Furnishers - no entity type system needed

export type EntityStatus = 'active' | 'pending' | 'inactive';

// Data provider types - categories of data that a data furnisher can provide
export type DataProviderType =
  | 'identity'
  | 'title-ownership'
  | 'assessment'
  | 'market-value-estimate'
  | 'cost-of-ownership'
  | 'mortgage-home-equity'
  | 'municipal'
  | 'regulatory'
  | 'employment';

export interface UserRef {
  id: string;
  login: string;
  name?: string;
}

// ============================================
// Data Source Types
// For data-furnisher entities - supports multiple named credential sources
// ============================================

// Base interface for furnisher fields (credential claims)
export interface FurnisherField {
  id: string;
  name: string;                    // Field/claim name (e.g., "given_name")
  displayName?: string;            // Human readable (e.g., "Given Name")
  description?: string;
  dataType?: 'string' | 'number' | 'integer' | 'boolean' | 'date' | 'datetime' | 'array' | 'object';
  sampleValue?: string;
  required?: boolean;
  notes?: string;
}

// Configuration for Credential sources
export interface CredentialSourceConfig {
  credentialName: string;          // Human readable (e.g., "BC Person Credential")
  issuerDid: string;               // DID of the credential issuer
  schemaUrl?: string;              // URL to JSON Schema
  vctUrl?: string;                 // URL to VCT/Credential Type definition
  brandingUrl?: string;            // URL to branding/display file
  trustFramework?: string;         // e.g., "BC Digital Trust", "Pan-Canadian Trust Framework"
  governanceDocUrl?: string;       // Link to governance documentation
  supportedWallets?: string[];     // e.g., ["BC Wallet", "COPA Wallet"]
}

// Data source type discriminator
export type DataSourceType = 'api' | 'credential' | 'swagger';

// A named data source within an entity
export interface FurnisherDataSource {
  id: string;
  name: string;                    // e.g., "Person Credential" or "Interac Bank Verification"
  description?: string;

  // Source type: 'api' for manual API entry, 'credential' for VC, 'swagger' for OpenAPI import
  // Defaults to 'credential' for backwards compatibility
  sourceType?: DataSourceType;

  // Credential configuration (only relevant for sourceType='credential')
  credentialConfig?: CredentialSourceConfig;

  // Fields/claims this source provides
  fields: FurnisherField[];

  // Metadata
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// FurnisherDataSchema - supports multiple credential sources
export interface FurnisherDataSchema {
  sources: FurnisherDataSource[];  // Multiple named sources

  // Legacy fields (for backward compatibility - will be migrated to sources)
  fields?: FurnisherField[];       // @deprecated - use sources[].fields
  notes?: string;                  // Keep for general entity-level notes
}

// Migration helper to convert legacy schema to new format
export function migrateDataSchema(schema: FurnisherDataSchema | undefined): FurnisherDataSchema {
  if (!schema) {
    return { sources: [] };
  }

  // If already has sources array with items, return as-is
  if (schema.sources && schema.sources.length > 0) {
    return schema;
  }

  // Migrate legacy fields to a single credential source
  if (schema.fields && schema.fields.length > 0) {
    return {
      sources: [{
        id: `source-${Date.now()}`,
        name: 'Credential',
        fields: schema.fields,
      }],
      notes: schema.notes,
    };
  }

  return { sources: [], notes: schema.notes };
}

export interface Entity {
  id: string;                    // Unique identifier (slug format: copa-entity-name)
  name: string;                  // Display name
  description?: string;

  // Visual Identity
  logoUri?: string;              // Path to logo (from asset library)
  primaryColor?: string;         // Brand color (hex)

  // Contact & Web
  website?: string;
  contactEmail?: string;
  contactPhone?: string;         // Phone number
  contactName?: string;          // Primary contact person

  // Technical Identity
  did?: string;                  // Decentralized Identifier

  // Classification - supports multiple entity types
  entityTypes: string[];         // Array of entity type IDs (e.g., ['data-furnisher', 'portfolio-issuer'])

  // Data Furnisher fields
  regionsCovered?: string[];     // Regions/provinces this entity covers
  dataProviderTypes?: DataProviderType[];  // Types of data this furnisher provides (furnishers only)
  serviceProviderTypes?: string[];  // Types of services this provider offers (service providers only)
  dataSchema?: FurnisherDataSchema;  // Field definitions for this furnisher's data

  // Metadata
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserRef;
  updatedBy?: UserRef;
}

// Data provider type display configuration
export const DATA_PROVIDER_TYPE_CONFIG: Record<DataProviderType, { label: string; description: string }> = {
  'identity': {
    label: 'Identity',
    description: 'Identity verification and personal information',
  },
  'title-ownership': {
    label: 'Title/Ownership',
    description: 'Property title and ownership records',
  },
  'assessment': {
    label: 'Assessment',
    description: 'Property assessment and valuation data',
  },
  'market-value-estimate': {
    label: 'Market Value Estimate',
    description: 'Real estate market valuations',
  },
  'cost-of-ownership': {
    label: 'Cost of Ownership',
    description: 'Ongoing property ownership costs',
  },
  'mortgage-home-equity': {
    label: 'Mortgage & Home Equity',
    description: 'Mortgage and home equity information',
  },
  'municipal': {
    label: 'Municipal',
    description: 'Municipal government data',
  },
  'regulatory': {
    label: 'Regulatory',
    description: 'Regulatory compliance and licensing',
  },
  'employment': {
    label: 'Employment',
    description: 'Employment and income verification',
  },
};

// All available data provider types
export const ALL_DATA_PROVIDER_TYPES: DataProviderType[] = [
  'identity',
  'title-ownership',
  'assessment',
  'market-value-estimate',
  'cost-of-ownership',
  'mortgage-home-equity',
  'municipal',
  'regulatory',
  'employment',
];

// Status display configuration
export const ENTITY_STATUS_CONFIG: Record<EntityStatus, { label: string; color: string }> = {
  'active': {
    label: 'Active',
    color: 'green',
  },
  'pending': {
    label: 'Pending',
    color: 'yellow',
  },
  'inactive': {
    label: 'Inactive',
    color: 'gray',
  },
};

// Selection state for UI
export interface EntitySelection {
  entityId: string;
}

// ============================================
// Entity Asset Types
// For managing logos, backgrounds, and icons tied to entities
// ============================================

export type EntityAssetType = 'entity-logo' | 'credential-background' | 'credential-icon';

export interface EntityAsset {
  id: string;
  entityId?: string;             // The entity this asset belongs to
  name: string;
  filename: string;
  originalName: string;
  type: EntityAssetType;
  localUri: string;
  publishedUri?: string;
  isPublished: boolean;
  mimetype: string;
  size: number;
  hash?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const ENTITY_ASSET_TYPE_CONFIG: Record<EntityAssetType, { label: string; description: string }> = {
  'entity-logo': {
    label: 'Entity Logo',
    description: 'Logo for this entity',
  },
  'credential-background': {
    label: 'Credential Background',
    description: 'Background image for credential cards',
  },
  'credential-icon': {
    label: 'Credential Icon',
    description: 'Icon for credential types',
  },
}
