// Asset Manager TypeScript Interfaces
// For managing assets (logos, backgrounds, icons) with GitHub VDR publishing

// Asset type determines GitHub path and naming convention
export type AssetType = 'entity-logo' | 'credential-background' | 'credential-icon';

// Asset type metadata for UI and publishing
export const ASSET_TYPE_CONFIG: Record<AssetType, {
  label: string;
  description: string;
  githubPath: string;
  filenamePattern: string; // Pattern description
}> = {
  'entity-logo': {
    label: 'Entity Logo',
    description: 'Logo for an entity (issuer, furnisher, verifier)',
    githubPath: 'credentials/entities/logos',
    filenamePattern: '{entity-id}.{ext}',
  },
  'credential-background': {
    label: 'Credential Background',
    description: 'Background image for credential cards',
    githubPath: 'credentials/vct/backgrounds',
    filenamePattern: '{name}.{ext}',
  },
  'credential-icon': {
    label: 'Credential Icon',
    description: 'Icon for credential types',
    githubPath: 'credentials/vct/icons',
    filenamePattern: '{name}.{ext}',
  },
};

// User info for tracking uploads
export interface AssetUploader {
  id: string;
  login: string;
  name: string;
}

// Main asset interface
export interface ManagedAsset {
  id: string;
  filename: string;           // Local filename (uuid.ext)
  originalName: string;       // Original upload name
  name: string;               // Display name
  type: AssetType;
  entityId: string;           // Linked entity ID (required)
  mimetype: string;
  size: number;
  hash: string;               // SHA-256 for integrity
  localUri: string;           // Local server URI (/assets/{filename})
  publishedUri?: string;      // GitHub VDR URL after publishing
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  uploader: AssetUploader;
}

// Asset project for local storage (matches VCT/Schema pattern)
export interface AssetProject {
  id: string;
  name: string;
  asset: ManagedAsset;
  createdAt: string;
  updatedAt: string;
}

// Store interface
export interface AssetManagerStore {
  // Current asset being edited
  currentAsset: ManagedAsset | null;
  currentProjectId: string | null;
  currentProjectName: string;
  isDirty: boolean;
  isEditing: boolean;

  // Saved projects
  savedProjects: AssetProject[];

  // Available entities for linking
  entities: EntityRef[];
  isLoadingEntities: boolean;

  // Actions
  newAsset: () => void;
  closeProject: () => void;
  loadProject: (id: string) => void;
  saveProject: (name: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Asset editing
  updateAsset: (updates: Partial<ManagedAsset>) => void;
  uploadImage: (file: File) => Promise<void>;

  // Entity management
  loadEntities: () => Promise<void>;
}

// Entity reference (from VDR)
export interface EntityRef {
  id: string;
  name: string;
  types: string[];
  logoUri?: string;
}

// Generate published URI based on asset type
export function getPublishedUri(asset: ManagedAsset, baseUrl: string): string {
  const ext = asset.filename.split('.').pop() || 'png';
  const config = ASSET_TYPE_CONFIG[asset.type];

  if (asset.type === 'entity-logo') {
    return `${baseUrl}/${config.githubPath}/${asset.entityId}.${ext}`;
  }

  // For backgrounds and icons, use sanitized name
  const safeName = asset.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${baseUrl}/${config.githubPath}/${safeName}.${ext}`;
}

// Generate GitHub file path for publishing
export function getGitHubFilePath(asset: ManagedAsset): string {
  const ext = asset.filename.split('.').pop() || 'png';
  const config = ASSET_TYPE_CONFIG[asset.type];

  if (asset.type === 'entity-logo') {
    return `${config.githubPath}/${asset.entityId}.${ext}`;
  }

  const safeName = asset.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${config.githubPath}/${safeName}.${ext}`;
}

// Create default empty asset
export function createDefaultAsset(): ManagedAsset {
  return {
    id: '',
    filename: '',
    originalName: '',
    name: '',
    type: 'entity-logo',
    entityId: '',
    mimetype: '',
    size: 0,
    hash: '',
    localUri: '',
    isPublished: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    uploader: { id: '', login: '', name: '' },
  };
}
