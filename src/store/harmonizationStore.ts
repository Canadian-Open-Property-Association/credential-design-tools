import { create } from 'zustand';
import type { FieldMapping, MappingWithDetails, HarmonizationStats } from '../types/harmonization';
import type { Entity, FurnisherField } from '../types/entity';
import type { VocabType } from '../types/dictionary';
import { migrateDataSchema } from '../types/entity';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5174';

// ============================================
// Data Harmonization API
// Maps furnisher fields to COPA vocabulary
// ============================================

const harmonizationApi = {
  // Fetch all mappings
  async listMappings(): Promise<FieldMapping[]> {
    const response = await fetch(`${API_BASE}/api/harmonization/mappings`, {
      credentials: 'include',
    });
    if (!response.ok) {
      // Return empty array if endpoint doesn't exist yet
      if (response.status === 404) return [];
      throw new Error('Failed to fetch mappings');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  // Create a new mapping
  async createMapping(mapping: Partial<FieldMapping>): Promise<FieldMapping> {
    const response = await fetch(`${API_BASE}/api/harmonization/mappings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(mapping),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create mapping');
    }
    return response.json();
  },

  // Update a mapping
  async updateMapping(id: string, updates: Partial<FieldMapping>): Promise<FieldMapping> {
    const response = await fetch(`${API_BASE}/api/harmonization/mappings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update mapping');
    return response.json();
  },

  // Delete a mapping
  async deleteMapping(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/harmonization/mappings/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete mapping');
  },

  // Get mappings with full entity and vocab details
  async getMappingsWithDetails(): Promise<MappingWithDetails[]> {
    const response = await fetch(`${API_BASE}/api/harmonization/mappings/details`, {
      credentials: 'include',
    });
    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error('Failed to fetch mapping details');
    }
    return response.json();
  },

  // Get stats
  async getStats(): Promise<HarmonizationStats> {
    const response = await fetch(`${API_BASE}/api/harmonization/stats`, {
      credentials: 'include',
    });
    if (!response.ok) {
      // Return default stats if endpoint doesn't exist
      return {
        totalMappings: 0,
        mappedEntities: 0,
        mappedVocabTypes: 0,
        unmappedFurnisherFields: 0,
      };
    }
    return response.json();
  },
};

// ============================================
// View Mode Types
// ============================================

export type HarmonizationViewMode = 'furnisher-detail' | 'all-mappings';

// Field info for the mapping modal
export interface MappingFieldContext {
  entityId: string;
  entityName: string;
  sourceId: string;
  sourceName: string;
  sourceType: 'direct-feed' | 'credential';
  field: FurnisherField;
}

// ============================================
// Store Interface
// ============================================

interface HarmonizationState {
  // Data
  mappings: FieldMapping[];
  mappingsWithDetails: MappingWithDetails[];

  // Related data (loaded from other stores/APIs)
  entities: Entity[];
  vocabTypes: VocabType[];

  // Selection state
  selectedEntityId: string | null;
  selectedVocabTypeId: string | null;
  selectedMappingId: string | null;

  // NEW: View mode and mapping modal state
  viewMode: HarmonizationViewMode;
  mappingFieldContext: MappingFieldContext | null;  // Field currently being mapped (for modal)

  // Loading states
  isLoading: boolean;
  isEntitiesLoading: boolean;
  isVocabTypesLoading: boolean;
  error: string | null;

  // Actions
  fetchMappings: () => Promise<void>;
  fetchMappingsWithDetails: () => Promise<void>;
  fetchEntities: () => Promise<void>;
  fetchVocabTypes: () => Promise<void>;

  // Selection
  selectEntity: (id: string | null) => void;
  selectVocabType: (id: string | null) => void;
  selectMapping: (id: string | null) => void;

  // NEW: View mode actions
  setViewMode: (mode: HarmonizationViewMode) => void;
  openMappingModal: (context: MappingFieldContext) => void;
  closeMappingModal: () => void;

  // Mapping CRUD
  createMapping: (mapping: Partial<FieldMapping>) => Promise<FieldMapping>;
  updateMapping: (id: string, updates: Partial<FieldMapping>) => Promise<void>;
  deleteMapping: (id: string) => Promise<void>;

  // Helpers
  getDataFurnishers: () => Entity[];
  getSelectedEntity: () => Entity | null;
  getMappingsForEntity: (entityId: string) => FieldMapping[];
  getMappingsForSource: (entityId: string, sourceId: string) => FieldMapping[];
  getMappingForField: (entityId: string, sourceId: string, fieldId: string) => FieldMapping | null;
  getMappingsForVocabType: (vocabTypeId: string) => FieldMapping[];
  getMappingsForSelection: () => FieldMapping[];
  getUnmappedFieldsCount: (entityId: string) => number;
}

// ============================================
// Store Implementation
// ============================================

export const useHarmonizationStore = create<HarmonizationState>((set, get) => ({
  // Initial state
  mappings: [],
  mappingsWithDetails: [],
  entities: [],
  vocabTypes: [],
  selectedEntityId: null,
  selectedVocabTypeId: null,
  selectedMappingId: null,
  viewMode: 'furnisher-detail',
  mappingFieldContext: null,
  isLoading: false,
  isEntitiesLoading: false,
  isVocabTypesLoading: false,
  error: null,

  // Fetch mappings
  fetchMappings: async () => {
    set({ isLoading: true, error: null });
    try {
      const mappings = await harmonizationApi.listMappings();
      set({ mappings, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch mappings',
        isLoading: false,
      });
    }
  },

  // Fetch mappings with full details
  fetchMappingsWithDetails: async () => {
    set({ isLoading: true, error: null });
    try {
      const mappingsWithDetails = await harmonizationApi.getMappingsWithDetails();
      set({ mappingsWithDetails, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch mapping details',
        isLoading: false,
      });
    }
  },

  // Fetch entities (data furnishers)
  fetchEntities: async () => {
    set({ isEntitiesLoading: true });
    try {
      const response = await fetch(`${API_BASE}/api/entities`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch entities');
      const data = await response.json();
      set({ entities: Array.isArray(data) ? data : [], isEntitiesLoading: false });
    } catch (error) {
      console.error('Error fetching entities:', error);
      set({ isEntitiesLoading: false });
    }
  },

  // Fetch vocab types
  fetchVocabTypes: async () => {
    set({ isVocabTypesLoading: true });
    try {
      const response = await fetch(`${API_BASE}/api/dictionary/vocab-types`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch vocab types');
      const data = await response.json();
      set({ vocabTypes: Array.isArray(data) ? data : [], isVocabTypesLoading: false });
    } catch (error) {
      console.error('Error fetching vocab types:', error);
      set({ isVocabTypesLoading: false });
    }
  },

  // Selection actions
  selectEntity: (id) => set({ selectedEntityId: id }),
  selectVocabType: (id) => set({ selectedVocabTypeId: id }),
  selectMapping: (id) => set({ selectedMappingId: id }),

  // View mode actions
  setViewMode: (mode) => set({ viewMode: mode }),
  openMappingModal: (context) => set({ mappingFieldContext: context }),
  closeMappingModal: () => set({ mappingFieldContext: null }),

  // Create mapping
  createMapping: async (mapping) => {
    const result = await harmonizationApi.createMapping(mapping);
    await get().fetchMappings();
    return result;
  },

  // Update mapping
  updateMapping: async (id, updates) => {
    await harmonizationApi.updateMapping(id, updates);
    await get().fetchMappings();
  },

  // Delete mapping
  deleteMapping: async (id) => {
    await harmonizationApi.deleteMapping(id);
    if (get().selectedMappingId === id) {
      set({ selectedMappingId: null });
    }
    await get().fetchMappings();
  },

  // Helper: Get only data furnisher entities
  getDataFurnishers: () => {
    const { entities } = get();
    return entities.filter(e => e.types?.includes('data-furnisher'));
  },

  // Helper: Get selected entity
  getSelectedEntity: () => {
    const { entities, selectedEntityId } = get();
    if (!selectedEntityId) return null;
    return entities.find(e => e.id === selectedEntityId) || null;
  },

  // Helper: Get mappings for a specific entity
  getMappingsForEntity: (entityId) => {
    const { mappings } = get();
    return mappings.filter(m => m.entityId === entityId);
  },

  // Helper: Get mappings for a specific source within an entity
  getMappingsForSource: (entityId: string, sourceId: string) => {
    const { mappings } = get();
    return mappings.filter(m => m.entityId === entityId && m.sourceId === sourceId);
  },

  // Helper: Get mapping for a specific field
  getMappingForField: (entityId: string, sourceId: string, fieldId: string) => {
    const { mappings } = get();
    return mappings.find(m =>
      m.entityId === entityId &&
      m.sourceId === sourceId &&
      m.furnisherFieldId === fieldId
    ) || null;
  },

  // Helper: Get mappings for a specific vocab type
  getMappingsForVocabType: (vocabTypeId) => {
    const { mappings } = get();
    return mappings.filter(m => m.vocabTypeId === vocabTypeId);
  },

  // Helper: Get mappings for current selection (entity + vocabType)
  getMappingsForSelection: () => {
    const { mappings, selectedEntityId, selectedVocabTypeId } = get();
    if (!selectedEntityId && !selectedVocabTypeId) return [];
    return mappings.filter(m => {
      const matchesEntity = !selectedEntityId || m.entityId === selectedEntityId;
      const matchesVocabType = !selectedVocabTypeId || m.vocabTypeId === selectedVocabTypeId;
      return matchesEntity && matchesVocabType;
    });
  },

  // Helper: Get count of unmapped fields for an entity
  getUnmappedFieldsCount: (entityId: string) => {
    const { entities, mappings } = get();
    const entity = entities.find(e => e.id === entityId);
    if (!entity) return 0;

    const schema = migrateDataSchema(entity.dataSchema);
    let totalFields = 0;
    let mappedFields = 0;

    for (const source of schema.sources || []) {
      for (const field of source.fields || []) {
        totalFields++;
        const hasMapping = mappings.some(m =>
          m.entityId === entityId &&
          m.sourceId === source.id &&
          m.furnisherFieldId === field.id
        );
        if (hasMapping) mappedFields++;
      }
    }

    return totalFields - mappedFields;
  },
}));
