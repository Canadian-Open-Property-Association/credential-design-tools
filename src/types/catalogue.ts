/**
 * Credential Catalogue Types
 *
 * Type definitions for imported external AnonCreds credentials
 * used in verification testing.
 */

/**
 * An imported credential from an external ecosystem
 */
export interface CatalogueCredential {
  /** Unique identifier (UUID) */
  id: string;

  /** Schema name */
  name: string;

  /** Schema version */
  version: string;

  // === AnonCreds Identifiers ===

  /** Ledger schema ID (e.g., "Th7MpTaRZVRYnPiabds81Y:2:Person:0.1") */
  schemaId: string;

  /** Ledger credential definition ID */
  credDefId: string;

  // === Issuer Information ===

  /** Issuer's DID */
  issuerDid: string;

  /** Optional display name for the issuer */
  issuerName?: string;

  // === Schema Details ===

  /** List of attribute names from the schema */
  attributes: string[];

  // === Orbit Integration ===

  /** ID returned from Orbit schema store (POST /schema/store) */
  orbitSchemaId?: string;

  /** ID returned from Orbit credential definition store */
  orbitCredDefId?: string;

  /** Error message if Orbit registration failed */
  orbitRegistrationError?: string;

  // === Metadata ===

  /** Ecosystem tag (e.g., "BC Digital Trust", "Sovrin") */
  ecosystemTag: string;

  /** Original IndyScan URL for the schema */
  schemaSourceUrl: string;

  /** Original IndyScan URL for the credential definition */
  credDefSourceUrl: string;

  /** Ledger identifier (e.g., "candy:dev", "sovrin:staging") */
  ledger: string;

  /** Usage restriction - imported credentials can only be used for verification */
  usageType: 'verification-only';

  // === Timestamps ===

  /** When the credential was imported */
  importedAt: string;

  /** Who imported the credential (user email or name) */
  importedBy: string;
}

/**
 * Ecosystem tag for categorizing imported credentials
 */
export interface EcosystemTag {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;
}

/**
 * Default ecosystem tags (can be deleted by user)
 */
export const DEFAULT_ECOSYSTEM_TAGS: EcosystemTag[] = [
  { id: 'bc-digital-trust', name: 'BC Digital Trust' },
  { id: 'sovrin', name: 'Sovrin' },
  { id: 'candy', name: 'CANdy' },
  { id: 'indicio', name: 'Indicio' },
  { id: 'other', name: 'Other' },
];

/**
 * Data parsed from an IndyScan schema page
 */
export interface ParsedSchemaData {
  /** Schema name */
  name: string;

  /** Schema version */
  version: string;

  /** Full schema ID */
  schemaId: string;

  /** Issuer DID */
  issuerDid: string;

  /** List of attribute names */
  attributes: string[];

  /** Ledger identifier (e.g., "candy:dev") */
  ledger: string;

  /** Sequence number on ledger */
  seqNo?: number;
}

/**
 * Data parsed from an IndyScan credential definition page
 */
export interface ParsedCredDefData {
  /** Full credential definition ID */
  credDefId: string;

  /** Schema ID this cred def references */
  schemaId: string;

  /** Issuer DID */
  issuerDid: string;

  /** Tag for the credential definition */
  tag: string;

  /** Signature type (usually "CL") */
  signatureType: string;

  /** Ledger identifier */
  ledger: string;

  /** Sequence number on ledger */
  seqNo?: number;
}

/**
 * Request to import a new credential
 */
export interface ImportCredentialRequest {
  /** Parsed schema data */
  schemaData: ParsedSchemaData;

  /** Parsed credential definition data */
  credDefData: ParsedCredDefData;

  /** Selected ecosystem tag ID */
  ecosystemTagId: string;

  /** Optional custom issuer name */
  issuerName?: string;

  /** Schema source URL */
  schemaSourceUrl: string;

  /** Credential definition source URL */
  credDefSourceUrl: string;

  /** Whether to register with Orbit */
  registerWithOrbit?: boolean;
}

/**
 * Detailed error information for debugging failed imports
 */
export interface ImportErrorDetails {
  /** Error message */
  message: string;

  /** HTTP status code if applicable */
  statusCode?: number;

  /** The URL that was called */
  requestUrl?: string;

  /** HTTP method used */
  requestMethod?: string;

  /** Request payload (sanitized - no secrets) */
  requestPayload?: Record<string, unknown>;

  /** Response body from the server */
  responseBody?: string;

  /** Timestamp of the error */
  timestamp: string;
}

/**
 * Response from parsing an IndyScan URL
 */
export interface ParseIndyScanResponse {
  success: boolean;
  type: 'schema' | 'creddef';
  data?: ParsedSchemaData | ParsedCredDefData;
  error?: string;
}

/**
 * Ledger configuration for IndyScan
 */
export interface LedgerConfig {
  /** Ledger identifier (e.g., "candy:dev") */
  id: string;

  /** Display name */
  name: string;

  /** IndyScan base URL */
  indyscanUrl: string;
}

/**
 * Known ledgers with IndyScan explorers
 */
export const KNOWN_LEDGERS: LedgerConfig[] = [
  {
    id: 'candy:dev',
    name: 'CANdy Dev',
    indyscanUrl: 'https://candyscan.idlab.org',
  },
  {
    id: 'candy:test',
    name: 'CANdy Test',
    indyscanUrl: 'https://candyscan.idlab.org',
  },
  {
    id: 'sovrin:staging',
    name: 'Sovrin Staging',
    indyscanUrl: 'https://indyscan.io',
  },
  {
    id: 'sovrin:builder',
    name: 'Sovrin Builder',
    indyscanUrl: 'https://indyscan.io',
  },
  {
    id: 'sovrin:main',
    name: 'Sovrin Main',
    indyscanUrl: 'https://indyscan.io',
  },
  {
    id: 'bcovrin:test',
    name: 'BCovrin Test',
    indyscanUrl: 'http://test.bcovrin.vonx.io',
  },
];
