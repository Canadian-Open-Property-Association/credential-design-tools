import { create } from 'zustand';
import type {
  VocabType,
  VocabCategory,
  VocabProperty,
  CategoryWithTypes,
  DictionaryStats,
  DictionaryExport,
} from '../types/dictionary';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5174';

// ============================================
// Data Dictionary API
// Focused on vocabulary management only
// Provider mappings moved to harmonization app
// ============================================

const dictionaryApi = {
  // Vocab Types (vocabulary)
  async listVocabTypes(): Promise<VocabType[]> {
    const response = await fetch(`${API_BASE}/api/dictionary/vocab-types`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch vocab types');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  async getVocabType(id: string): Promise<VocabType> {
    const response = await fetch(`${API_BASE}/api/dictionary/vocab-types/${id}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch vocab type');
    return response.json();
  },

  async createVocabType(vocabType: Partial<VocabType>): Promise<VocabType> {
    const response = await fetch(`${API_BASE}/api/dictionary/vocab-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(vocabType),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create vocab type');
    }
    return response.json();
  },

  async updateVocabType(id: string, updates: Partial<VocabType>): Promise<VocabType> {
    const response = await fetch(`${API_BASE}/api/dictionary/vocab-types/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update vocab type');
    return response.json();
  },

  async deleteVocabType(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/dictionary/vocab-types/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete vocab type');
  },

  // Properties (attributes of a vocab type)
  async addProperty(vocabTypeId: string, property: Partial<VocabProperty>): Promise<VocabType> {
    const response = await fetch(`${API_BASE}/api/dictionary/vocab-types/${vocabTypeId}/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(property),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add property');
    }
    return response.json();
  },

  async updateProperty(vocabTypeId: string, propertyId: string, updates: Partial<VocabProperty>): Promise<VocabType> {
    const response = await fetch(`${API_BASE}/api/dictionary/vocab-types/${vocabTypeId}/properties/${propertyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update property');
    return response.json();
  },

  async deleteProperty(vocabTypeId: string, propertyId: string): Promise<VocabType> {
    const response = await fetch(`${API_BASE}/api/dictionary/vocab-types/${vocabTypeId}/properties/${propertyId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete property');
    return response.json();
  },

  // Categories
  async listCategories(): Promise<VocabCategory[]> {
    const response = await fetch(`${API_BASE}/api/dictionary/categories`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch categories');
    const data = await response.json();
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.categories)) return data.categories;
    return [];
  },

  async createCategory(category: Partial<VocabCategory>): Promise<VocabCategory> {
    const response = await fetch(`${API_BASE}/api/dictionary/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(category),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create category');
    }
    return response.json();
  },

  // Search
  async search(query: string): Promise<{ vocabTypes: VocabType[] }> {
    const response = await fetch(`${API_BASE}/api/dictionary/search?q=${encodeURIComponent(query)}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to search');
    return response.json();
  },

  // Export
  async exportAll(): Promise<DictionaryExport> {
    const response = await fetch(`${API_BASE}/api/dictionary/export`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to export');
    return response.json();
  },

  // Stats
  async getStats(): Promise<DictionaryStats> {
    const response = await fetch(`${API_BASE}/api/dictionary/stats`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },
};

// ============================================
// Store Interface
// ============================================

interface DictionaryState {
  // Data
  vocabTypes: VocabType[];
  categories: VocabCategory[];
  selectedVocabType: VocabType | null;

  // Loading states
  isLoading: boolean;
  isVocabTypeLoading: boolean;
  error: string | null;

  // Search
  searchQuery: string;
  searchResults: VocabType[] | null;

  // Actions
  fetchVocabTypes: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  selectVocabType: (id: string) => Promise<void>;
  clearSelection: () => void;

  // VocabType CRUD
  createVocabType: (vocabType: Partial<VocabType>) => Promise<VocabType>;
  updateVocabType: (id: string, updates: Partial<VocabType>) => Promise<void>;
  deleteVocabType: (id: string) => Promise<void>;

  // Property CRUD
  addProperty: (vocabTypeId: string, property: Partial<VocabProperty>) => Promise<void>;
  updateProperty: (vocabTypeId: string, propertyId: string, updates: Partial<VocabProperty>) => Promise<void>;
  deleteProperty: (vocabTypeId: string, propertyId: string) => Promise<void>;
  moveProperties: (sourceVocabTypeId: string, propertyIds: string[], targetVocabTypeId: string) => Promise<void>;

  // Category CRUD
  createCategory: (category: Partial<VocabCategory>) => Promise<VocabCategory>;

  // Search & Export
  setSearchQuery: (query: string) => void;
  search: (query: string) => Promise<void>;
  clearSearch: () => void;
  exportAll: () => Promise<DictionaryExport>;

  // Helper: Get vocab types grouped by category
  getVocabTypesByCategory: () => CategoryWithTypes[];
}

// ============================================
// Store Implementation
// ============================================

export const useDictionaryStore = create<DictionaryState>((set, get) => ({
  // Initial state
  vocabTypes: [],
  categories: [],
  selectedVocabType: null,
  isLoading: false,
  isVocabTypeLoading: false,
  error: null,
  searchQuery: '',
  searchResults: null,

  // Fetch all vocab types
  fetchVocabTypes: async () => {
    set({ isLoading: true, error: null });
    try {
      const vocabTypes = await dictionaryApi.listVocabTypes();
      set({ vocabTypes, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch vocab types',
        isLoading: false,
      });
    }
  },

  // Fetch categories
  fetchCategories: async () => {
    try {
      const categories = await dictionaryApi.listCategories();
      set({ categories });
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  },

  // Select a vocab type
  selectVocabType: async (id: string) => {
    set({ isVocabTypeLoading: true, error: null });
    try {
      const vocabType = await dictionaryApi.getVocabType(id);
      set({
        selectedVocabType: vocabType,
        isVocabTypeLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch vocab type',
        isVocabTypeLoading: false,
      });
    }
  },

  // Clear selection
  clearSelection: () => {
    set({ selectedVocabType: null });
  },

  // Create vocab type
  createVocabType: async (vocabType) => {
    const result = await dictionaryApi.createVocabType(vocabType);
    await get().fetchVocabTypes();
    return result;
  },

  // Update vocab type
  updateVocabType: async (id, updates) => {
    await dictionaryApi.updateVocabType(id, updates);
    await get().fetchVocabTypes();
    if (get().selectedVocabType?.id === id) {
      await get().selectVocabType(id);
    }
  },

  // Delete vocab type
  deleteVocabType: async (id) => {
    await dictionaryApi.deleteVocabType(id);
    if (get().selectedVocabType?.id === id) {
      set({ selectedVocabType: null });
    }
    await get().fetchVocabTypes();
  },

  // Add property
  addProperty: async (vocabTypeId, property) => {
    const updated = await dictionaryApi.addProperty(vocabTypeId, property);
    set({ selectedVocabType: updated });
    await get().fetchVocabTypes();
  },

  // Update property
  updateProperty: async (vocabTypeId, propertyId, updates) => {
    const updated = await dictionaryApi.updateProperty(vocabTypeId, propertyId, updates);
    set({ selectedVocabType: updated });
    await get().fetchVocabTypes();
  },

  // Delete property
  deleteProperty: async (vocabTypeId, propertyId) => {
    const updated = await dictionaryApi.deleteProperty(vocabTypeId, propertyId);
    set({ selectedVocabType: updated });
    await get().fetchVocabTypes();
  },

  // Move properties from one vocab type to another
  moveProperties: async (sourceVocabTypeId, propertyIds, targetVocabTypeId) => {
    // Get the source vocab type to find the properties
    const sourceVocabType = get().vocabTypes.find(vt => vt.id === sourceVocabTypeId);
    if (!sourceVocabType) throw new Error('Source vocab type not found');

    // Get properties to move
    const propertiesToMove = sourceVocabType.properties.filter(p => propertyIds.includes(p.id));
    if (propertiesToMove.length === 0) throw new Error('No properties to move');

    // Add properties to target (without id so new IDs are generated)
    for (const prop of propertiesToMove) {
      const { id, createdAt, updatedAt, ...propData } = prop;
      await dictionaryApi.addProperty(targetVocabTypeId, propData);
    }

    // Remove properties from source
    for (const propId of propertyIds) {
      await dictionaryApi.deleteProperty(sourceVocabTypeId, propId);
    }

    // Refresh data
    await get().fetchVocabTypes();
    // Update selected vocab type if it was the source
    if (get().selectedVocabType?.id === sourceVocabTypeId) {
      await get().selectVocabType(sourceVocabTypeId);
    }
  },

  // Create category
  createCategory: async (category) => {
    const result = await dictionaryApi.createCategory(category);
    await get().fetchCategories();
    return result;
  },

  // Search
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  search: async (query) => {
    if (query.length < 2) {
      set({ searchResults: null });
      return;
    }
    try {
      const results = await dictionaryApi.search(query);
      set({ searchResults: results.vocabTypes });
    } catch (error) {
      console.error('Search error:', error);
    }
  },

  clearSearch: () => {
    set({ searchQuery: '', searchResults: null });
  },

  // Export
  exportAll: async () => {
    return dictionaryApi.exportAll();
  },

  // Helper: Get vocab types grouped by category
  getVocabTypesByCategory: () => {
    const { vocabTypes, categories } = get();
    const result: CategoryWithTypes[] = [];

    if (!Array.isArray(vocabTypes)) {
      return result;
    }

    // Group vocab types by category
    const grouped = new Map<string, VocabType[]>();
    for (const vt of vocabTypes) {
      const catId = vt.category || 'other';
      if (!grouped.has(catId)) {
        grouped.set(catId, []);
      }
      grouped.get(catId)!.push(vt);
    }

    // Sort categories and create result
    const sortedCategories = Array.isArray(categories)
      ? [...categories].sort((a, b) => a.order - b.order)
      : [];
    for (const cat of sortedCategories) {
      const types = grouped.get(cat.id) || [];
      if (types.length > 0) {
        result.push({ category: cat, vocabTypes: types });
      }
    }

    // Add "Other" category for uncategorized types
    const otherTypes = grouped.get('other') || [];
    if (otherTypes.length > 0) {
      result.push({
        category: { id: 'other', name: 'Other', order: 999 },
        vocabTypes: otherTypes,
      });
    }

    return result;
  },
}));
