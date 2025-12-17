// VCT (Verifiable Credential Type) TypeScript Interfaces
// Based on SD-JWT-VC specification (draft-ietf-oauth-sd-jwt-vc)

// VCT Format - determines claim configuration behavior
export type VCTFormat = 'sd-jwt' | 'json-ld';

// ============================================
// SCHEMA PROPERTY PARSING (for claim configuration)
// ============================================

// Parsed schema property from JSON Schema
export interface ParsedSchemaProperty {
  name: string;                    // Property name (key)
  title?: string;                  // Human-readable title
  description?: string;            // Property description
  type: string;                    // JSON Schema type (string, integer, number, boolean, object, array)
  format?: string;                 // String format (email, uri, date, etc.)
  path: string[];                  // Full path from credentialSubject (e.g., ["address", "street"])
  required: boolean;               // Is this property required in schema?
  children?: ParsedSchemaProperty[]; // Nested properties for objects
}

// Parsed schema structure for VCT Builder
export interface ParsedSchema {
  $id: string;
  title: string;
  description?: string;
  properties: ParsedSchemaProperty[]; // credentialSubject properties
}

// Issuer reference (links to Entity Manager)
export interface VCTIssuer {
  id: string;          // Entity ID from Entity Manager
  name: string;        // Display name
  uri?: string;        // Resolved DID or canonical URL
  logoUri?: string;    // Logo URI from entity
}

export interface VCTLogo {
  uri: string;
  'uri#integrity'?: string;
  alt_text?: string;
}

export interface VCTBackgroundImage {
  uri: string;
  'uri#integrity'?: string;
}

export interface VCTSimpleRendering {
  background_color?: string;
  text_color?: string;
  font_family?: string;
  logo?: VCTLogo;
  background_image?: VCTBackgroundImage;
}

// Available font families for card rendering
export const FONT_FAMILY_OPTIONS = [
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
] as const;

export interface VCTSvgTemplateProperties {
  orientation?: 'portrait' | 'landscape';
  color_scheme?: 'light' | 'dark';
  contrast?: 'normal' | 'high';
}

export interface VCTSvgTemplate {
  uri: string;
  'uri#integrity'?: string;
  properties?: VCTSvgTemplateProperties;
}

// COPA Card Display Standard - Front/Back SVG Templates
export interface VCTSvgTemplates {
  front?: VCTSvgTemplate;
  back?: VCTSvgTemplate;
}

export interface VCTRendering {
  simple?: VCTSimpleRendering;
  svg_templates?: VCTSvgTemplate[] | VCTSvgTemplates; // Support both legacy array and COPA front/back
}

// COPA Card Display Standard - Card Element Positions
export type CardElementPosition =
  | 'top_left'
  | 'top_right'
  | 'center'
  | 'center_below'
  | 'bottom_left'
  | 'bottom_right'
  | 'top'
  | 'center_bottom';

// COPA Card Display Standard - Front Card Element
export interface VCTFrontCardElement {
  position: CardElementPosition;
  claim_path?: string; // JSONPath like "$.property_address"
  value?: string; // Static value for fixed elements
  label?: string; // Optional display label
  logo_uri?: string; // Logo/icon image URI (for portfolio_issuer, credential_issuer, network_mark)
}

// COPA Card Display Standard - Evidence Source Types
export type EvidenceSourceType =
  | 'linked_credential'
  | 'data_furnisher'
  | 'identity_verification'
  | 'regulatory_body';

// COPA Card Display Standard - Evidence Source
export interface VCTEvidenceSource {
  type: EvidenceSourceType;
  id: string;
  display: string;
  badge?: 'initials' | 'logo';
  logo_uri?: string;
  description: string;
}

// COPA Card Display Standard - Back Card Elements
export interface VCTBackCardElements {
  metadata?: {
    position: CardElementPosition;
    fields: string[]; // ['credential_type', 'issued_at', 'expires_at', 'status']
  };
  evidence?: {
    position: CardElementPosition;
    sources: VCTEvidenceSource[];
  };
}

// COPA Card Display Standard - Front Card Elements (6 standard positions)
export interface VCTFrontCardElements {
  portfolio_issuer?: VCTFrontCardElement;
  network_mark?: VCTFrontCardElement;
  primary_attribute?: VCTFrontCardElement;
  secondary_attribute?: VCTFrontCardElement;
  credential_name?: VCTFrontCardElement;
  credential_issuer?: VCTFrontCardElement;
}

// COPA Card Display Standard - Card Elements Container
export interface VCTCardElements {
  front?: VCTFrontCardElements;
  back?: VCTBackCardElements;
}

// ============================================
// DYNAMIC ZONE-BASED ELEMENTS (Forward declarations)
// ============================================

// Content type for zone elements
export type ZoneContentType = 'text' | 'image';

// Entity type for asset criteria (which entity type provides the asset)
// Uses entity type IDs from settings (e.g., 'data-furnisher', 'service-provider', 'portfolio-issuer')
// Legacy values: 'issuer', 'furnisher', 'verifier' are still supported for backwards compatibility
export type AssetEntityRole = string;

// Asset type options
export type AssetTypeOption = 'entity-logo' | 'credential-background' | 'credential-icon';

// Criteria for rule-based asset selection (instead of hardcoded URLs)
// When using criteria, the actual asset is resolved at render/issuance time
export interface AssetCriteria {
  entityRole: AssetEntityRole;           // Which entity provides the asset
  dataProviderType?: string;             // Required if entityRole is 'furnisher' - e.g., 'identity', 'title-ownership'
  assetType: AssetTypeOption;            // Type of asset to select
}

// Horizontal alignment options for zone content
export type ZoneAlignment = 'left' | 'center' | 'right';

// Vertical alignment options for zone content
export type ZoneVerticalAlignment = 'top' | 'middle' | 'bottom';

// Dynamic element bound to a zone
export interface DynamicCardElement {
  zone_id: string; // Reference to zone in template
  content_type: ZoneContentType; // text or image
  claim_path?: string; // JSONPath for dynamic data
  static_value?: string; // Static text/value

  // Image content options (use logo_uri OR asset_criteria, not both)
  logo_uri?: string; // Direct image URL (legacy, specific asset)
  asset_criteria?: AssetCriteria; // Rule-based asset selection (new, dynamic resolution)

  label?: string; // Optional display label
  alignment?: ZoneAlignment; // Horizontal alignment within zone (default: center)
  verticalAlignment?: ZoneVerticalAlignment; // Vertical alignment within zone (default: middle)
  scale?: number; // Content scale factor (0.5 to 2.0, default: 1.0)
  textWrap?: boolean; // If true, text wraps to multiple lines; if false, text shrinks to fit (default: false)
}

// Dynamic card elements using zone references
export interface DynamicCardElements {
  template_id: string; // Reference to zone template
  front: DynamicCardElement[]; // Elements for front of card
  back: DynamicCardElement[]; // Elements for back of card
}

export interface VCTClaimDisplay {
  locale: string;
  label: string;
  description?: string;
}

export interface VCTClaim {
  path: (string | null | number)[];
  display: VCTClaimDisplay[];
  mandatory?: boolean;
  sd?: 'always' | 'allowed' | 'never';
  svg_id?: string;
}

export interface VCTDisplay {
  locale: string;
  name: string;
  description?: string;
  rendering?: VCTRendering;
  card_elements?: VCTCardElements; // COPA Card Display Standard (legacy)
  dynamic_card_elements?: DynamicCardElements; // New dynamic zone-based elements
}

export interface VCT {
  // Format selection (determines claim behavior)
  format: VCTFormat;

  // Basic metadata
  vct: string;
  name: string;
  description?: string;

  // Extension (for VCT inheritance)
  extends?: string;
  'extends#integrity'?: string;

  // Schema reference (required - must be selected before claims)
  schema_uri: string;
  'schema_uri#integrity'?: string;

  // Issuer reference (links to Entity Manager)
  issuer?: VCTIssuer;

  // Display and claims configuration
  display: VCTDisplay[];
  claims: VCTClaim[];
}

// Sample data for preview
export interface SampleData {
  [claimPath: string]: string;
}

// Saved project structure
export interface SavedProject {
  id: string;
  name: string;
  vct: VCT;
  sampleData: SampleData;
  createdAt: string;
  updatedAt: string;
}

// Available locales for the app
export const AVAILABLE_LOCALES = [
  { code: 'en-CA', name: 'English (Canada)' },
  { code: 'fr-CA', name: 'Français (Canada)' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
] as const;

// Store state
export interface VCTStore {
  // Current VCT being edited
  currentVct: VCT;
  sampleData: SampleData;
  currentProjectId: string | null;
  currentProjectName: string;
  isDirty: boolean;
  isEditing: boolean;

  // Saved projects
  savedProjects: SavedProject[];

  // Schema properties (loaded when schema is selected)
  schemaProperties: ParsedSchema | null;
  isLoadingSchema: boolean;
  schemaError: string | null;

  // Actions
  setVct: (vct: VCT) => void;
  updateVctField: <K extends keyof VCT>(field: K, value: VCT[K]) => void;
  setSampleData: (data: SampleData) => void;
  updateSampleDataField: (path: string, value: string) => void;
  updateProjectName: (name: string) => void;

  // Format and Issuer actions
  setFormat: (format: VCTFormat) => void;
  setIssuer: (issuer: VCTIssuer | undefined) => void;

  // Schema property actions
  loadSchemaProperties: (schemaUri: string) => Promise<void>;
  clearSchemaProperties: () => void;

  // Display actions
  addDisplay: (locale: string) => void;
  updateDisplay: (index: number, display: Partial<VCTDisplay>) => void;
  removeDisplay: (index: number) => void;

  // Claim actions
  addClaim: () => void;
  updateClaim: (index: number, claim: Partial<VCTClaim>) => void;
  removeClaim: (index: number) => void;
  syncClaimLocales: () => void;

  // Project actions
  newProject: () => void;
  closeProject: () => void;
  saveProject: (name: string) => Promise<void>;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => Promise<void>;

  // Import/Export
  exportVct: () => string;
  importVct: (json: string) => void;

  // COPA Card Display Standard actions
  updateCardElements: (displayIndex: number, cardElements: Partial<VCTCardElements>) => void;
  updateFrontElement: (
    displayIndex: number,
    elementKey: keyof VCTFrontCardElements,
    element: Partial<VCTFrontCardElement>
  ) => void;
  addEvidenceSource: (displayIndex: number, source: VCTEvidenceSource) => void;
  updateEvidenceSource: (
    displayIndex: number,
    sourceId: string,
    source: Partial<VCTEvidenceSource>
  ) => void;
  removeEvidenceSource: (displayIndex: number, sourceId: string) => void;
  updateSvgTemplateByFace: (
    displayIndex: number,
    face: 'front' | 'back',
    template: VCTSvgTemplate | null
  ) => void;

  // Dynamic zone element actions
  updateDynamicElement: (
    displayIndex: number,
    face: 'front' | 'back',
    zoneId: string,
    element: Partial<DynamicCardElement>
  ) => void;
  setDynamicCardElementsTemplate: (displayIndex: number, templateId: string) => void;
}

// Default empty VCT - starts with only en-CA
export const createDefaultVct = (format: VCTFormat = 'json-ld'): VCT => ({
  format,
  vct: '',
  name: '',
  description: '',
  schema_uri: '',
  display: [
    {
      locale: 'en-CA',
      name: '',
      description: '',
      rendering: {
        simple: {
          background_color: '#1E3A5F',
          text_color: '#FFFFFF',
        },
      },
    },
  ],
  claims: [],
});

// Helper to get locale display name
export const getLocaleName = (code: string): string => {
  const locale = AVAILABLE_LOCALES.find((l) => l.code === code);
  return locale?.name || code;
};

// COPA Card Display Standard - Helper Functions

// Check if svg_templates is in COPA front/back format
export const isFrontBackFormat = (
  templates: VCTSvgTemplate[] | VCTSvgTemplates | undefined
): templates is VCTSvgTemplates => {
  if (!templates) return false;
  if (Array.isArray(templates)) return false;
  return 'front' in templates || 'back' in templates;
};

// Check if svg_templates is in legacy array format
export const isLegacyFormat = (
  templates: VCTSvgTemplate[] | VCTSvgTemplates | undefined
): templates is VCTSvgTemplate[] => {
  return Array.isArray(templates);
};

// Convert legacy array format to COPA front/back format (for backward compatibility when importing)
export const migrateToFrontBack = (templates: VCTSvgTemplate[]): VCTSvgTemplates => {
  return {
    front: templates[0] || undefined,
    back: templates[1] || undefined,
  };
};

// Evidence source type labels
export const EVIDENCE_SOURCE_TYPE_LABELS: Record<EvidenceSourceType, string> = {
  linked_credential: 'Linked Credential',
  data_furnisher: 'Data Furnisher',
  identity_verification: 'Identity Verification',
  regulatory_body: 'Regulatory Body',
};

// Metadata field options for back of card
export const METADATA_FIELD_OPTIONS = [
  { id: 'credential_type', label: 'Credential Type' },
  { id: 'issued_at', label: 'Issued Date' },
  { id: 'expires_at', label: 'Expiry Date' },
  { id: 'status', label: 'Status' },
] as const;

// ============================================
// CUSTOMIZABLE ZONE TEMPLATE SYSTEM
// ============================================

// Zone positioning (percentages for responsive scaling)
export interface ZonePosition {
  x: number; // 0-100% of card width
  y: number; // 0-100% of card height
  width: number; // 0-100% of card width
  height: number; // 0-100% of card height
}

// A single zone in a template (layout only - content type is set when designing the card)
export interface Zone {
  id: string; // Unique zone identifier (UUID)
  name: string; // Human-readable name (e.g., "Header Logo")
  subtitle?: string; // User-friendly description shown in card elements form
  position: ZonePosition; // Positioning data
}

// Zone template for front or back of card
export interface ZoneFaceTemplate {
  zones: Zone[];
}

// Author information for zone templates
export interface ZoneTemplateAuthor {
  id: string; // GitHub user ID
  login: string; // GitHub username
  name?: string; // Display name
}

// Complete zone template (front and back)
export interface ZoneTemplate {
  id: string;
  name: string;
  description?: string;
  front: ZoneFaceTemplate;
  back: ZoneFaceTemplate;
  card_width: number; // Reference width (default 340px)
  card_height: number; // Reference height (default 214px)
  createdAt: string;
  updatedAt: string;
  frontOnly?: boolean; // If true, template only has front face (no back)
  author?: ZoneTemplateAuthor; // Who created this template
}

// Card dimensions (credit card ratio)
export const CARD_WIDTH = 340;
export const CARD_HEIGHT = 214;

// Zone template store state interface
export interface ZoneTemplateStore {
  templates: ZoneTemplate[];
  selectedTemplateId: string | null;
  editingTemplate: ZoneTemplate | null;

  // Template CRUD
  addTemplate: (
    template: ZoneTemplate | Omit<ZoneTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ) => string;
  updateTemplate: (id: string, updates: Partial<ZoneTemplate>) => void;
  deleteTemplate: (id: string) => void;
  duplicateTemplate: (id: string, newName: string) => string;

  // Template selection
  selectTemplate: (id: string | null) => void;
  setEditingTemplate: (template: ZoneTemplate | null) => void;

  // Zone management within editing template
  addZone: (face: 'front' | 'back', zone: Omit<Zone, 'id'>) => void;
  updateZone: (
    face: 'front' | 'back',
    zoneId: string,
    updates: Partial<Zone>
  ) => void;
  deleteZone: (face: 'front' | 'back', zoneId: string) => void;

  // Copy operations
  copyFrontToBack: () => void;
  copyBackToFront: () => void;

  // Save editing template
  saveEditingTemplate: () => Promise<void>;

  // Getters
  getTemplate: (id: string) => ZoneTemplate | undefined;
}

// Helper to check for zone overlaps
export const zonesOverlap = (zone1: ZonePosition, zone2: ZonePosition): boolean => {
  // Check if zones don't overlap (one is completely to the left, right, above, or below the other)
  const noOverlap =
    zone1.x + zone1.width <= zone2.x || // zone1 is to the left of zone2
    zone2.x + zone2.width <= zone1.x || // zone2 is to the left of zone1
    zone1.y + zone1.height <= zone2.y || // zone1 is above zone2
    zone2.y + zone2.height <= zone1.y; // zone2 is above zone1

  return !noOverlap;
};

// Helper to check if a zone array has any overlaps
export const hasOverlappingZones = (zones: Zone[]): { hasOverlap: boolean; overlappingIds: string[] } => {
  const overlappingIds: Set<string> = new Set();

  for (let i = 0; i < zones.length; i++) {
    for (let j = i + 1; j < zones.length; j++) {
      if (zonesOverlap(zones[i].position, zones[j].position)) {
        overlappingIds.add(zones[i].id);
        overlappingIds.add(zones[j].id);
      }
    }
  }

  return {
    hasOverlap: overlappingIds.size > 0,
    overlappingIds: Array.from(overlappingIds),
  };
};

// Generate a unique zone color for visual distinction
export const getZoneColor = (index: number): string => {
  const colors = [
    'rgba(59, 130, 246, 0.3)', // blue
    'rgba(168, 85, 247, 0.3)', // purple
    'rgba(34, 197, 94, 0.3)', // green
    'rgba(251, 191, 36, 0.3)', // yellow
    'rgba(239, 68, 68, 0.3)', // red
    'rgba(236, 72, 153, 0.3)', // pink
    'rgba(20, 184, 166, 0.3)', // teal
    'rgba(249, 115, 22, 0.3)', // orange
  ];
  return colors[index % colors.length];
};

// ============================================
// SCHEMA PARSING HELPERS
// ============================================

/**
 * Parse a JSON Schema property into our internal ParsedSchemaProperty format
 * Recursively handles nested objects
 */
const parseSchemaProperty = (
  name: string,
  propSchema: Record<string, unknown>,
  parentPath: string[],
  requiredFields: string[]
): ParsedSchemaProperty => {
  const path = [...parentPath, name];
  const type = propSchema.type as string || 'string';
  const required = requiredFields.includes(name);

  const parsed: ParsedSchemaProperty = {
    name,
    title: propSchema.title as string | undefined,
    description: propSchema.description as string | undefined,
    type,
    format: propSchema.format as string | undefined,
    path,
    required,
  };

  // Handle nested object properties
  if (type === 'object' && propSchema.properties) {
    const nestedProps = propSchema.properties as Record<string, Record<string, unknown>>;
    const nestedRequired = (propSchema.required as string[]) || [];
    parsed.children = Object.entries(nestedProps).map(([nestedName, nestedSchema]) =>
      parseSchemaProperty(nestedName, nestedSchema, path, nestedRequired)
    );
  }

  // Handle array items (if items is an object with properties)
  if (type === 'array' && propSchema.items) {
    const itemsSchema = propSchema.items as Record<string, unknown>;
    if (itemsSchema.type === 'object' && itemsSchema.properties) {
      const nestedProps = itemsSchema.properties as Record<string, Record<string, unknown>>;
      const nestedRequired = (itemsSchema.required as string[]) || [];
      parsed.children = Object.entries(nestedProps).map(([nestedName, nestedSchema]) =>
        parseSchemaProperty(nestedName, nestedSchema, [...path, '[]'], nestedRequired)
      );
    }
  }

  return parsed;
};

/**
 * Parse a full JSON Schema (from URL fetch) into ParsedSchema format
 * Extracts credentialSubject properties for claim configuration
 */
export const parseJsonSchema = (schema: Record<string, unknown>): ParsedSchema => {
  const credentialSubject = (schema.properties as Record<string, unknown>)?.credentialSubject as Record<string, unknown>;

  if (!credentialSubject || !credentialSubject.properties) {
    return {
      $id: schema.$id as string || '',
      title: schema.title as string || '',
      description: schema.description as string | undefined,
      properties: [],
    };
  }

  const properties = credentialSubject.properties as Record<string, Record<string, unknown>>;
  const required = (credentialSubject.required as string[]) || [];

  const parsedProperties = Object.entries(properties).map(([name, propSchema]) =>
    parseSchemaProperty(name, propSchema, ['credentialSubject'], required)
  );

  return {
    $id: schema.$id as string || '',
    title: schema.title as string || '',
    description: schema.description as string | undefined,
    properties: parsedProperties,
  };
};

/**
 * Flatten parsed schema properties into a flat list with full paths
 * Useful for displaying all possible claim paths
 */
export const flattenSchemaProperties = (properties: ParsedSchemaProperty[]): ParsedSchemaProperty[] => {
  const result: ParsedSchemaProperty[] = [];

  const flatten = (props: ParsedSchemaProperty[]) => {
    for (const prop of props) {
      result.push(prop);
      if (prop.children) {
        flatten(prop.children);
      }
    }
  };

  flatten(properties);
  return result;
};

/**
 * Convert a property path to the VCT claim path format
 * VCT uses array format: ["credentialSubject", "address", "street"]
 */
export const propertyPathToClaimPath = (path: string[]): (string | number | null)[] => {
  return path.map(segment => {
    if (segment === '[]') return 0; // Array index placeholder
    return segment;
  });
};

/**
 * Get a human-readable display of a property path
 * e.g., ["credentialSubject", "address", "street"] -> "address.street"
 */
export const formatPropertyPath = (path: string[]): string => {
  // Skip "credentialSubject" prefix for display
  const displayPath = path.filter(p => p !== 'credentialSubject' && p !== '[]');
  return displayPath.join('.');
};
