/**
 * Badge Types for the Badges Governance App
 *
 * These types define the structure for badge definitions, eligibility rules,
 * and related configuration. Badges are verifiable achievements that can be
 * earned when specific data proofs are presented.
 */

// Badge category (from settings, like data provider types in Entity Manager)
export interface BadgeCategory {
  id: string; // e.g., "equity", "property-count", "financial", "verification"
  label: string; // e.g., "Equity Badges"
  description?: string;
  color?: string; // For UI display (hex color)
}

// Operators for eligibility rules
export type RuleOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'contains'
  | 'exists'
  | 'count_gte'; // Count greater than or equal (for credential count checks)

// Eligibility rule - defines what claims/data are required
export interface EligibilityRule {
  id: string;
  vocabTypeId: string; // Reference to Data Dictionary vocab type
  vocabPropertyId: string; // Reference to specific property within vocab type
  operator: RuleOperator;
  value?: string | number | boolean; // Threshold value (optional for 'exists')
  description?: string; // Human-readable rule description (auto-generated or custom)
}

// Evidence source types
export type EvidenceType = 'credential_attestation' | 'data_furnisher' | 'self_attestation';

// Proof methods for privacy-preserving verification
export type ProofMethod = 'range_proof' | 'count_proof' | 'credential_proof' | 'direct_attestation';

// Evidence source configuration
export interface EvidenceConfig {
  id: string;
  type: EvidenceType;
  description: string;
  required: boolean;
  // For data_furnisher type, optionally specify which furnisher
  furnisherId?: string;
}

// Badge status in the governance workflow
export type BadgeStatus = 'draft' | 'published';

// Rule logic - how multiple rules are combined
export type RuleLogic = 'all' | 'any';

// Badge definition - the main artifact published to VDR
export interface BadgeDefinition {
  id: string; // Unique badge ID (e.g., "equity-1m")
  schemaId: string; // Parent schema reference (e.g., "equity-threshold")
  name: string; // Display name (e.g., "Equity > $1M")
  description: string; // What this badge represents
  categoryId: string; // Reference to BadgeCategory

  // Eligibility
  eligibilityRules: EligibilityRule[];
  ruleLogic: RuleLogic; // Must meet all rules or any rule

  // Evidence requirements
  evidenceConfig: EvidenceConfig[];
  proofMethod: ProofMethod;

  // Visual
  templateUri?: string; // URI to badge template image (external)
  templateAssetId?: string; // Local asset reference (from Asset Manager)

  // Metadata
  createdAt: string;
  updatedAt?: string;
  status: BadgeStatus;
  version?: string; // Version string (e.g., "1.0")
}

// Badge schema - groups related badges (e.g., all equity threshold badges)
export interface BadgeSchema {
  id: string; // e.g., "equity-threshold"
  name: string; // e.g., "Equity Threshold Badges"
  description: string;
  categoryId: string;
  badges: string[]; // Badge definition IDs in this schema
  createdAt: string;
  updatedAt?: string;
}

// Proof method configuration (for settings)
export interface ProofMethodConfig {
  id: ProofMethod;
  label: string;
  description: string;
}

// Settings for the Badges app
export interface BadgesSettings {
  categories: BadgeCategory[];
  proofMethods: ProofMethodConfig[];
}

// Default badge categories
export const DEFAULT_BADGE_CATEGORIES: BadgeCategory[] = [
  {
    id: 'equity',
    label: 'Equity Badges',
    description: 'Badges based on portfolio equity thresholds',
    color: '#10B981', // green
  },
  {
    id: 'property-count',
    label: 'Property Count Badges',
    description: 'Badges based on number of properties owned',
    color: '#6366F1', // indigo
  },
  {
    id: 'financial',
    label: 'Financial Status Badges',
    description: 'Badges related to mortgage, income, and credit status',
    color: '#F59E0B', // amber
  },
  {
    id: 'verification',
    label: 'Verification Badges',
    description: 'Badges for identity, title, and other verifications',
    color: '#3B82F6', // blue
  },
];

// Default proof methods
export const DEFAULT_PROOF_METHODS: ProofMethodConfig[] = [
  {
    id: 'range_proof',
    label: 'Range Proof',
    description: 'Proves a value falls within a range without revealing the exact value',
  },
  {
    id: 'count_proof',
    label: 'Count Proof',
    description: 'Proves a count meets or exceeds a threshold',
  },
  {
    id: 'credential_proof',
    label: 'Credential Proof',
    description: 'Proves possession of a valid credential',
  },
  {
    id: 'direct_attestation',
    label: 'Direct Attestation',
    description: 'Direct attestation from an authorized party',
  },
];

// Default settings
export const DEFAULT_BADGES_SETTINGS: BadgesSettings = {
  categories: DEFAULT_BADGE_CATEGORIES,
  proofMethods: DEFAULT_PROOF_METHODS,
};

// Operator labels for UI display
export const OPERATOR_LABELS: Record<RuleOperator, string> = {
  equals: 'equals',
  not_equals: 'does not equal',
  greater_than: 'is greater than',
  less_than: 'is less than',
  greater_or_equal: 'is at least',
  less_or_equal: 'is at most',
  contains: 'contains',
  exists: 'exists',
  count_gte: 'count is at least',
};

// Evidence type labels for UI display
export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  credential_attestation: 'Credential Attestation',
  data_furnisher: 'Data Furnisher',
  self_attestation: 'Self Attestation',
};

// Helper to create a new empty badge definition
export function createEmptyBadge(): BadgeDefinition {
  return {
    id: '',
    schemaId: '',
    name: '',
    description: '',
    categoryId: '',
    eligibilityRules: [],
    ruleLogic: 'all',
    evidenceConfig: [],
    proofMethod: 'credential_proof',
    createdAt: new Date().toISOString(),
    status: 'draft',
  };
}

// Helper to create a new empty eligibility rule
export function createEmptyRule(): EligibilityRule {
  return {
    id: `rule-${Date.now()}`,
    vocabTypeId: '',
    vocabPropertyId: '',
    operator: 'exists',
    description: '',
  };
}

// Helper to create a new empty evidence config
export function createEmptyEvidenceConfig(): EvidenceConfig {
  return {
    id: `evidence-${Date.now()}`,
    type: 'credential_attestation',
    description: '',
    required: true,
  };
}

// Helper to generate a slug from a name
export function generateBadgeId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Helper to generate a human-readable rule description
export function generateRuleDescription(
  rule: EligibilityRule,
  vocabTypeName?: string,
  propertyName?: string
): string {
  const property = propertyName || rule.vocabPropertyId;
  const vocabType = vocabTypeName || rule.vocabTypeId;
  const operator = OPERATOR_LABELS[rule.operator];

  if (rule.operator === 'exists') {
    return `${property} must exist`;
  }

  const valueStr =
    typeof rule.value === 'number'
      ? rule.value.toLocaleString()
      : String(rule.value ?? '');

  return `${property} ${operator} ${valueStr}`;
}

// Badge definition for VDR export (published format)
export interface BadgeDefinitionExport {
  $schema: string;
  id: string;
  schemaId: string;
  name: string;
  description: string;
  category: string;
  eligibility: {
    rules: Array<{
      vocabType: string;
      property: string;
      operator: string;
      value?: string | number | boolean;
      description: string;
    }>;
    logic: RuleLogic;
  };
  evidence: {
    sources: Array<{
      type: EvidenceType;
      description: string;
      required: boolean;
    }>;
    proofMethod: ProofMethod;
  };
  visual: {
    templateUri?: string;
  };
  metadata: {
    createdAt: string;
    publishedAt?: string;
    version: string;
  };
}

// Helper to convert internal badge to export format
export function badgeToExportFormat(badge: BadgeDefinition): BadgeDefinitionExport {
  return {
    $schema: 'https://openpropertyassociation.ca/schemas/badge-definition/v1',
    id: badge.id,
    schemaId: badge.schemaId,
    name: badge.name,
    description: badge.description,
    category: badge.categoryId,
    eligibility: {
      rules: badge.eligibilityRules.map((rule) => ({
        vocabType: rule.vocabTypeId,
        property: rule.vocabPropertyId,
        operator: rule.operator,
        value: rule.value,
        description: rule.description || '',
      })),
      logic: badge.ruleLogic,
    },
    evidence: {
      sources: badge.evidenceConfig.map((config) => ({
        type: config.type,
        description: config.description,
        required: config.required,
      })),
      proofMethod: badge.proofMethod,
    },
    visual: {
      templateUri: badge.templateUri,
    },
    metadata: {
      createdAt: badge.createdAt,
      publishedAt: badge.status === 'published' ? new Date().toISOString() : undefined,
      version: badge.version || '1.0',
    },
  };
}
