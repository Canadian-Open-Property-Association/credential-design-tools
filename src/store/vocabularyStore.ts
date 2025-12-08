/**
 * Vocabulary Store
 *
 * Manages vocabulary loading and selection for JSON-LD Context mode.
 * Similar pattern to zoneTemplateStore for zone templates.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Vocabulary,
  VocabTerm,
  VocabComplexType,
  DEFAULT_VOCAB_URL,
} from '../types/vocabulary';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5174';

interface VocabularyStore {
  // Loaded vocabularies
  vocabularies: Vocabulary[];
  selectedVocabId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadVocabulary: (url: string) => Promise<Vocabulary | null>;
  selectVocabulary: (id: string | null) => void;
  removeVocabulary: (id: string) => void;
  clearError: () => void;

  // Getters (as functions since Zustand doesn't have computed properties)
  getSelectedVocab: () => Vocabulary | null;
  getTermById: (termId: string) => VocabTerm | null;
  getComplexTypeById: (typeId: string) => VocabComplexType | null;
  getAllTerms: () => VocabTerm[];
  getAllComplexTypes: () => VocabComplexType[];
}

export const useVocabularyStore = create<VocabularyStore>()(
  persist(
    (set, get) => ({
      vocabularies: [],
      selectedVocabId: null,
      isLoading: false,
      error: null,

      loadVocabulary: async (url: string): Promise<Vocabulary | null> => {
        set({ isLoading: true, error: null });

        try {
          // Fetch vocabulary from URL via our proxy (to handle CORS)
          const response = await fetch(
            `${API_BASE}/api/vocabulary/fetch?url=${encodeURIComponent(url)}`,
            { credentials: 'include' }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.error || `Failed to fetch vocabulary: ${response.statusText}`
            );
          }

          const vocab: Vocabulary = await response.json();

          set((state) => {
            // Check if vocab already exists, update if so
            const existingIndex = state.vocabularies.findIndex(
              (v) => v.id === vocab.id || v.url === url
            );

            if (existingIndex >= 0) {
              const updatedVocabs = [...state.vocabularies];
              updatedVocabs[existingIndex] = vocab;
              return {
                vocabularies: updatedVocabs,
                selectedVocabId: vocab.id,
                isLoading: false,
              };
            }

            return {
              vocabularies: [...state.vocabularies, vocab],
              selectedVocabId: vocab.id,
              isLoading: false,
            };
          });

          return vocab;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error loading vocabulary';
          set({
            error: errorMessage,
            isLoading: false,
          });
          return null;
        }
      },

      selectVocabulary: (id: string | null) => {
        set({ selectedVocabId: id });
      },

      removeVocabulary: (id: string) => {
        set((state) => {
          const newVocabs = state.vocabularies.filter((v) => v.id !== id);
          return {
            vocabularies: newVocabs,
            // Clear selection if we removed the selected vocab
            selectedVocabId:
              state.selectedVocabId === id
                ? newVocabs.length > 0
                  ? newVocabs[0].id
                  : null
                : state.selectedVocabId,
          };
        });
      },

      clearError: () => {
        set({ error: null });
      },

      getSelectedVocab: (): Vocabulary | null => {
        const { vocabularies, selectedVocabId } = get();
        return vocabularies.find((v) => v.id === selectedVocabId) || null;
      },

      getTermById: (termId: string): VocabTerm | null => {
        const vocab = get().getSelectedVocab();
        if (!vocab) return null;
        return vocab.terms.find((t) => t.id === termId) || null;
      },

      getComplexTypeById: (typeId: string): VocabComplexType | null => {
        const vocab = get().getSelectedVocab();
        if (!vocab) return null;
        return vocab.complexTypes.find((t) => t.id === typeId) || null;
      },

      getAllTerms: (): VocabTerm[] => {
        const vocab = get().getSelectedVocab();
        return vocab?.terms || [];
      },

      getAllComplexTypes: (): VocabComplexType[] => {
        const vocab = get().getSelectedVocab();
        return vocab?.complexTypes || [];
      },
    }),
    {
      name: 'vocabulary-storage',
      partialize: (state) => ({
        // Only persist vocabularies and selection, not loading state
        vocabularies: state.vocabularies,
        selectedVocabId: state.selectedVocabId,
      }),
    }
  )
);

/**
 * Built-in COPA vocabulary as fallback when the remote vocabulary can't be fetched
 * This ensures the app works even if the vocab.jsonld is not yet deployed
 */
const BUILTIN_COPA_VOCABULARY: Vocabulary = {
  id: 'copa-builtin',
  name: 'COPA Vocabulary (Built-in)',
  description: 'Canadian Open Property Association vocabulary for verifiable credentials',
  url: DEFAULT_VOCAB_URL,
  contextUrl: 'https://openpropertyassociation.ca/context.jsonld',
  version: '1.0.0',
  terms: [
    { id: 'name', label: 'Name', description: 'A name or title', '@id': 'vocab:name', allowedTypes: ['string'] },
    { id: 'description', label: 'Description', description: 'A textual description', '@id': 'vocab:description', allowedTypes: ['string'] },
    { id: 'id', label: 'Identifier', description: 'A unique identifier', '@id': 'vocab:id', allowedTypes: ['string', 'uri'] },
    { id: 'url', label: 'URL', description: 'A web address', '@id': 'vocab:url', allowedTypes: ['uri'] },
    { id: 'dateOfBirth', label: 'Date of Birth', description: 'Date of birth', '@id': 'vocab:dateOfBirth', allowedTypes: ['date'] },
    { id: 'dateIssued', label: 'Date Issued', description: 'The date something was issued', '@id': 'vocab:dateIssued', allowedTypes: ['date', 'dateTime'] },
    { id: 'dateExpires', label: 'Date Expires', description: 'The expiration date', '@id': 'vocab:dateExpires', allowedTypes: ['date', 'dateTime'] },
    { id: 'registrationNumber', label: 'Registration Number', description: 'A registration or license number', '@id': 'vocab:registrationNumber', allowedTypes: ['string'] },
    { id: 'legalName', label: 'Legal Name', description: 'Official legal name', '@id': 'vocab:legalName', allowedTypes: ['string'] },
    { id: 'familyName', label: 'Family Name', description: 'Family/surname/last name', '@id': 'vocab:familyName', allowedTypes: ['string'] },
    { id: 'givenName', label: 'Given Name', description: 'Given/first name', '@id': 'vocab:givenName', allowedTypes: ['string'] },
    { id: 'email', label: 'Email', description: 'Email address', '@id': 'vocab:email', allowedTypes: ['string'] },
    { id: 'telephone', label: 'Telephone', description: 'Phone number', '@id': 'vocab:telephone', allowedTypes: ['string'] },
    { id: 'addressCountry', label: 'Country', description: 'Country code or name', '@id': 'vocab:addressCountry', allowedTypes: ['string'] },
    { id: 'addressRegion', label: 'Region/Province', description: 'State, province, or region', '@id': 'vocab:addressRegion', allowedTypes: ['string'] },
    { id: 'addressLocality', label: 'City', description: 'City or locality', '@id': 'vocab:addressLocality', allowedTypes: ['string'] },
    { id: 'postalCode', label: 'Postal Code', description: 'Postal or zip code', '@id': 'vocab:postalCode', allowedTypes: ['string'] },
    { id: 'streetAddress', label: 'Street Address', description: 'Street address', '@id': 'vocab:streetAddress', allowedTypes: ['string'] },
    { id: 'issuedToParty', label: 'Issued To Party', description: 'The party the credential is issued to', '@id': 'vocab:issuedToParty', allowedTypes: ['object'], isComplexType: true },
    { id: 'issuedByParty', label: 'Issued By Party', description: 'The party that issued the credential', '@id': 'vocab:issuedByParty', allowedTypes: ['object'], isComplexType: true },
    { id: 'conformityAttestation', label: 'Conformity Attestation', description: 'An attestation of conformity', '@id': 'vocab:conformityAttestation', allowedTypes: ['object'], isComplexType: true },
    { id: 'identifierScheme', label: 'Identifier Scheme', description: 'The scheme for an identifier', '@id': 'vocab:identifierScheme', allowedTypes: ['object'], isComplexType: true },
    { id: 'logo', label: 'Logo', description: 'A logo image file', '@id': 'vocab:logo', allowedTypes: ['object'], isComplexType: true },
  ],
  complexTypes: [
    { id: 'Party', label: 'Party', description: 'A person or organization', '@id': 'vocab:Party', allowedProperties: ['name', 'legalName', 'familyName', 'givenName', 'email', 'telephone', 'url', 'id'] },
    { id: 'ConformityAttestation', label: 'Conformity Attestation', description: 'An attestation that something conforms to requirements', '@id': 'vocab:ConformityAttestation', allowedProperties: ['name', 'description', 'id', 'dateIssued', 'dateExpires'] },
    { id: 'IdentifierScheme', label: 'Identifier Scheme', description: 'A scheme for identifying things', '@id': 'vocab:IdentifierScheme', allowedProperties: ['name', 'id', 'url'] },
    { id: 'BinaryFile', label: 'Binary File', description: 'A binary file like an image', '@id': 'vocab:BinaryFile', allowedProperties: ['name', 'url', 'description'] },
  ],
  updatedAt: new Date().toISOString(),
};

/**
 * Load default COPA vocabulary on initialization
 */
export const loadDefaultVocabulary = async (): Promise<void> => {
  const store = useVocabularyStore.getState();

  // Only load if we don't have any vocabularies yet
  if (store.vocabularies.length === 0) {
    const result = await store.loadVocabulary(DEFAULT_VOCAB_URL);

    // If remote vocabulary fetch failed, use built-in fallback
    if (!result) {
      console.log('Using built-in COPA vocabulary as fallback');
      useVocabularyStore.setState((state) => ({
        vocabularies: [BUILTIN_COPA_VOCABULARY],
        selectedVocabId: BUILTIN_COPA_VOCABULARY.id,
        error: null, // Clear the error since we have a fallback
      }));
    }
  }
};

/**
 * Track if we've already attempted to load the default vocabulary
 * This prevents infinite loops when the API fails
 */
let hasAttemptedDefaultLoad = false;

/**
 * Hook to ensure default vocabulary is loaded
 * Call this in components that need vocabulary
 */
export const useEnsureVocabulary = (): void => {
  const vocabularies = useVocabularyStore((state) => state.vocabularies);
  const isLoading = useVocabularyStore((state) => state.isLoading);
  const error = useVocabularyStore((state) => state.error);

  // Only attempt to load if:
  // 1. No vocabularies loaded
  // 2. Not currently loading
  // 3. No error from previous attempt
  // 4. Haven't already attempted (prevents infinite retries on 404)
  if (vocabularies.length === 0 && !isLoading && !error && !hasAttemptedDefaultLoad) {
    hasAttemptedDefaultLoad = true;
    loadDefaultVocabulary();
  }
};

/**
 * Reset the load attempt flag (useful for manual retry)
 */
export const resetVocabularyLoadAttempt = (): void => {
  hasAttemptedDefaultLoad = false;
  useVocabularyStore.getState().clearError();
};
