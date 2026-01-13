/**
 * Credential Catalogue Store
 *
 * Zustand store for managing imported external credentials.
 */

import { create } from 'zustand';
import type {
  CatalogueCredential,
  EcosystemTag,
  ImportCredentialRequest,
  ImportErrorDetails,
  ParsedSchemaData,
  ParsedCredDefData,
  CloneForIssuanceResponse,
} from '../types/catalogue';
import { DEFAULT_ECOSYSTEM_TAGS } from '../types/catalogue';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5174';

interface OrbitStatus {
  configured: boolean;
  hasCredentials: boolean;
}

interface CatalogueState {
  // Data
  credentials: CatalogueCredential[];
  ecosystemTags: EcosystemTag[];

  // UI state
  isLoading: boolean;
  error: string | null;
  errorDetails: ImportErrorDetails | null;
  selectedCredential: CatalogueCredential | null;
  searchQuery: string;

  // Import wizard state
  parsedSchema: ParsedSchemaData | null;
  parsedCredDef: ParsedCredDefData | null;

  // Orbit status
  orbitStatus: OrbitStatus | null;

  // Actions - Credentials
  fetchCredentials: () => Promise<void>;
  importCredential: (request: ImportCredentialRequest) => Promise<CatalogueCredential>;
  updateCredential: (
    id: string,
    updates: { ecosystemTag?: string; issuerName?: string }
  ) => Promise<CatalogueCredential>;
  deleteCredential: (id: string) => Promise<void>;
  getCredentialById: (id: string) => CatalogueCredential | undefined;
  selectCredential: (id: string) => void;
  clearSelection: () => void;
  setSearchQuery: (query: string) => void;

  // Actions - Parsing
  parseSchemaUrl: (url: string) => Promise<ParsedSchemaData>;
  parseCredDefUrl: (url: string) => Promise<ParsedCredDefData>;
  clearParsedData: () => void;

  // Actions - Tags
  fetchTags: () => Promise<void>;
  addCustomTag: (name: string) => Promise<EcosystemTag>;
  deleteTag: (id: string) => Promise<void>;

  // Actions - Orbit
  fetchOrbitStatus: () => Promise<void>;

  // Actions - Clone for Issuance
  cloneForIssuance: (credentialId: string, credDefTag?: string) => Promise<CloneForIssuanceResponse>;
  deleteClone: (credentialId: string) => Promise<void>;

  // Utility
  clearError: () => void;
}

export const useCatalogueStore = create<CatalogueState>((set, get) => ({
  // Initial state
  credentials: [],
  ecosystemTags: DEFAULT_ECOSYSTEM_TAGS,
  isLoading: false,
  error: null,
  errorDetails: null,
  selectedCredential: null,
  searchQuery: '',
  parsedSchema: null,
  parsedCredDef: null,
  orbitStatus: null,

  // Fetch all credentials
  fetchCredentials: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/credential-catalogue`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch credentials');
      }

      const data = await response.json();
      set({ credentials: data, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch credentials',
        isLoading: false,
      });
    }
  },

  // Import a new credential
  importCredential: async (request: ImportCredentialRequest) => {
    set({ isLoading: true, error: null, errorDetails: null });
    const requestUrl = `${API_BASE}/api/credential-catalogue`;
    const requestPayload = {
      schemaData: {
        name: request.schemaData.name,
        version: request.schemaData.version,
        schemaId: request.schemaData.schemaId,
        ledger: request.schemaData.ledger,
        attributeCount: request.schemaData.attributes.length,
      },
      credDefData: {
        credDefId: request.credDefData.credDefId,
        schemaId: request.credDefData.schemaId,
        tag: request.credDefData.tag,
      },
      ecosystemTagId: request.ecosystemTagId,
      issuerName: request.issuerName,
      registerWithOrbit: request.registerWithOrbit,
    };

    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = 'Failed to import credential';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Use raw response text if not JSON
        }

        const errorDetails: ImportErrorDetails = {
          message: errorMessage,
          statusCode: response.status,
          requestUrl,
          requestMethod: 'POST',
          requestPayload,
          responseBody: responseText,
          timestamp: new Date().toISOString(),
        };

        set({
          error: errorMessage,
          errorDetails,
          isLoading: false,
        });
        throw new Error(errorMessage);
      }

      const credential = await response.json();
      set((state) => ({
        credentials: [credential, ...state.credentials],
        isLoading: false,
        parsedSchema: null,
        parsedCredDef: null,
        errorDetails: null,
      }));
      return credential;
    } catch (err) {
      // Only set error if not already set (for non-HTTP errors)
      const currentState = get();
      if (!currentState.errorDetails) {
        set({
          error: err instanceof Error ? err.message : 'Failed to import credential',
          isLoading: false,
        });
      }
      throw err;
    }
  },

  // Update a credential
  updateCredential: async (
    id: string,
    updates: { ecosystemTag?: string; issuerName?: string }
  ) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/credential-catalogue/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update credential');
      }

      const credential = await response.json();
      set((state) => ({
        credentials: state.credentials.map((c) => (c.id === id ? credential : c)),
        selectedCredential:
          state.selectedCredential?.id === id ? credential : state.selectedCredential,
        isLoading: false,
      }));
      return credential;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to update credential',
        isLoading: false,
      });
      throw err;
    }
  },

  // Delete a credential
  deleteCredential: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/credential-catalogue/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete credential');
      }

      set((state) => ({
        credentials: state.credentials.filter((c) => c.id !== id),
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to delete credential',
        isLoading: false,
      });
      throw err;
    }
  },

  // Get credential by ID
  getCredentialById: (id: string) => {
    return get().credentials.find((c) => c.id === id);
  },

  // Select a credential
  selectCredential: (id: string) => {
    const credential = get().credentials.find((c) => c.id === id);
    set({ selectedCredential: credential || null });
  },

  // Clear selection
  clearSelection: () => {
    set({ selectedCredential: null });
  },

  // Set search query
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  // Parse an IndyScan schema URL
  parseSchemaUrl: async (url: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/credential-catalogue/import/schema`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to parse schema URL');
      }

      const data = await response.json();
      set({ parsedSchema: data, isLoading: false });
      return data;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to parse schema URL',
        isLoading: false,
      });
      throw err;
    }
  },

  // Parse an IndyScan credential definition URL
  parseCredDefUrl: async (url: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/credential-catalogue/import/creddef`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to parse credential definition URL');
      }

      const data = await response.json();
      set({ parsedCredDef: data, isLoading: false });
      return data;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to parse credential definition URL',
        isLoading: false,
      });
      throw err;
    }
  },

  // Clear parsed data
  clearParsedData: () => {
    set({ parsedSchema: null, parsedCredDef: null });
  },

  // Fetch ecosystem tags
  fetchTags: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/credential-catalogue/tags`, {
        credentials: 'include',
      });

      if (!response.ok) {
        // If tags endpoint fails, use defaults as fallback
        set({ ecosystemTags: DEFAULT_ECOSYSTEM_TAGS });
        return;
      }

      const tags = await response.json();
      set({ ecosystemTags: tags });
    } catch {
      // Fall back to default tags
      set({ ecosystemTags: DEFAULT_ECOSYSTEM_TAGS });
    }
  },

  // Add a custom tag
  addCustomTag: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/credential-catalogue/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add tag');
      }

      const tag = await response.json();
      set((state) => ({
        ecosystemTags: [...state.ecosystemTags, tag],
        isLoading: false,
      }));
      return tag;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to add tag',
        isLoading: false,
      });
      throw err;
    }
  },

  // Delete a custom tag
  deleteTag: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/credential-catalogue/tags/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete tag');
      }

      set((state) => ({
        ecosystemTags: state.ecosystemTags.filter((t) => t.id !== id),
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to delete tag',
        isLoading: false,
      });
      throw err;
    }
  },

  // Fetch Orbit status
  fetchOrbitStatus: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/credential-catalogue/orbit-status`, {
        credentials: 'include',
      });

      if (!response.ok) {
        set({ orbitStatus: { configured: false, hasCredentials: false } });
        return;
      }

      const status = await response.json();
      set({ orbitStatus: status });
    } catch {
      set({ orbitStatus: { configured: false, hasCredentials: false } });
    }
  },

  // Clone a credential for issuance
  cloneForIssuance: async (credentialId: string, credDefTag?: string) => {
    set({ isLoading: true, error: null, errorDetails: null });
    const requestUrl = `${API_BASE}/api/credential-catalogue/${credentialId}/clone-for-issuance`;

    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credDefTag: credDefTag || 'default' }),
      });

      const responseText = await response.text();
      let result: CloneForIssuanceResponse;

      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        const errorMessage = result.error || 'Failed to clone credential for issuance';

        const errorDetails: ImportErrorDetails = {
          message: errorMessage,
          statusCode: response.status,
          requestUrl,
          requestMethod: 'POST',
          requestPayload: { credDefTag: credDefTag || 'default' },
          responseBody: responseText,
          timestamp: new Date().toISOString(),
        };

        set({
          error: errorMessage,
          errorDetails,
          isLoading: false,
        });
        throw new Error(errorMessage);
      }

      // Update the credential in the store with clone data
      set((state) => {
        const updatedCredentials = state.credentials.map((c) => {
          if (c.id === credentialId) {
            return {
              ...c,
              clonedAt: new Date().toISOString(),
              clonedLedger: result.clonedLedger,
              clonedSchemaId: result.clonedSchemaId,
              clonedCredDefId: result.clonedCredDefId,
              clonedOrbitSchemaId: result.clonedOrbitSchemaId,
              clonedOrbitCredDefId: result.clonedOrbitCredDefId,
              clonedOrbitSchemaLog: result.schemaLog,
              clonedOrbitCredDefLog: result.credDefLog,
            };
          }
          return c;
        });

        const updatedSelected =
          state.selectedCredential?.id === credentialId
            ? updatedCredentials.find((c) => c.id === credentialId) || null
            : state.selectedCredential;

        return {
          credentials: updatedCredentials,
          selectedCredential: updatedSelected,
          isLoading: false,
          errorDetails: null,
        };
      });

      return result;
    } catch (err) {
      const currentState = get();
      if (!currentState.errorDetails) {
        set({
          error: err instanceof Error ? err.message : 'Failed to clone credential for issuance',
          isLoading: false,
        });
      }
      throw err;
    }
  },

  // Delete a clone
  deleteClone: async (credentialId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(
        `${API_BASE}/api/credential-catalogue/${credentialId}/clone`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete clone');
      }

      // Update the credential in the store to remove clone data
      set((state) => {
        const updatedCredentials = state.credentials.map((c) => {
          if (c.id === credentialId) {
            const {
              clonedAt,
              clonedBy,
              clonedLedger,
              clonedSchemaId,
              clonedCredDefId,
              clonedOrbitSchemaId,
              clonedOrbitCredDefId,
              clonedOrbitSchemaLog,
              clonedOrbitCredDefLog,
              ...rest
            } = c;
            return rest as CatalogueCredential;
          }
          return c;
        });

        const updatedSelected =
          state.selectedCredential?.id === credentialId
            ? updatedCredentials.find((c) => c.id === credentialId) || null
            : state.selectedCredential;

        return {
          credentials: updatedCredentials,
          selectedCredential: updatedSelected,
          isLoading: false,
        };
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to delete clone',
        isLoading: false,
      });
      throw err;
    }
  },

  // Clear error
  clearError: () => set({ error: null, errorDetails: null }),
}));
