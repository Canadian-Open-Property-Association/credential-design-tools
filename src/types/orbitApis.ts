/**
 * Orbit API Type Definitions
 *
 * Defines the available Orbit APIs and their configurations.
 * All APIs share the same LOB ID and API Key, but each has its own Base URL.
 */

export const ORBIT_APIS = {
  lob: {
    key: 'lob',
    label: 'LOB API',
    description: 'Line of Business API',
  },
  registerSocket: {
    key: 'registerSocket',
    label: 'RegisterSocket API',
    description: 'WebSocket registration service',
  },
  connection: {
    key: 'connection',
    label: 'Connection API',
    description: 'Connection management service',
  },
  holder: {
    key: 'holder',
    label: 'Holder API',
    description: 'Wallet holder service',
  },
  verifier: {
    key: 'verifier',
    label: 'Verifier API',
    description: 'Credential verification service',
  },
  issuer: {
    key: 'issuer',
    label: 'Issuer API',
    description: 'Credential issuance service',
  },
  chat: {
    key: 'chat',
    label: 'Chat API',
    description: 'Chat messaging service',
  },
} as const;

export type OrbitApiType = keyof typeof ORBIT_APIS;

export const ORBIT_API_KEYS: OrbitApiType[] = Object.keys(ORBIT_APIS) as OrbitApiType[];

/**
 * Configuration for a single API endpoint
 */
export interface ApiConfig {
  baseUrl: string;
}

/**
 * Map of all API configurations
 */
export type ApisConfig = Record<OrbitApiType, ApiConfig>;

/**
 * Full Orbit configuration status (returned from API, without API key)
 */
export interface OrbitConfigStatus {
  configured: boolean;
  lobId: string;
  hasApiKey: boolean;
  source: 'file' | 'environment' | null;
  configuredAt: string | null;
  configuredBy: string | null;
  apis: ApisConfig;
}

/**
 * Input for updating shared credentials
 */
export interface OrbitCredentialsInput {
  lobId: string;
  apiKey?: string; // Optional - if empty, keeps existing key
}

/**
 * Input for updating a single API's Base URL
 */
export interface ApiConfigInput {
  apiType: OrbitApiType;
  baseUrl: string;
}

/**
 * Result of testing an API connection
 */
export interface OrbitTestResult {
  success: boolean;
  message: string;
}

/**
 * Settings section types for sidebar navigation
 */
export type SettingsSection = 'credentials' | OrbitApiType | 'logs' | 'analytics';

/**
 * Check if a section is an Orbit API section
 */
export function isOrbitApiSection(section: SettingsSection): section is OrbitApiType {
  return section in ORBIT_APIS;
}

/**
 * Get default empty APIs config
 */
export function getEmptyApisConfig(): ApisConfig {
  return {
    lob: { baseUrl: '' },
    registerSocket: { baseUrl: '' },
    connection: { baseUrl: '' },
    holder: { baseUrl: '' },
    verifier: { baseUrl: '' },
    issuer: { baseUrl: '' },
    chat: { baseUrl: '' },
  };
}
