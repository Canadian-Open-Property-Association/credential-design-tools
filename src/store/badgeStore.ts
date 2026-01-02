import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  BadgeDefinition,
  BadgeSchema,
  EligibilityRule,
  EvidenceConfig,
} from '../types/badge';
import {
  createEmptyBadge,
  createEmptyRule,
  createEmptyEvidenceConfig,
  badgeToExportFormat,
} from '../types/badge';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001';

interface BadgeStore {
  // Data
  badges: BadgeDefinition[];
  schemas: BadgeSchema[];
  selectedBadgeId: string | null;

  // Current badge being edited (draft state)
  currentBadge: BadgeDefinition | null;
  isDirty: boolean;

  // UI State
  isLoading: boolean;
  error: string | null;
  searchQuery: string;

  // CRUD operations
  fetchBadges: () => Promise<void>;
  createBadge: (badge: Partial<BadgeDefinition>) => Promise<BadgeDefinition>;
  updateBadge: (id: string, updates: Partial<BadgeDefinition>) => Promise<void>;
  deleteBadge: (id: string) => Promise<void>;
  selectBadge: (id: string | null) => void;

  // Current badge editing
  newBadge: () => void;
  loadBadgeForEditing: (id: string) => void;
  updateCurrentBadge: <K extends keyof BadgeDefinition>(
    field: K,
    value: BadgeDefinition[K]
  ) => void;
  saveCurrentBadge: () => Promise<BadgeDefinition>;
  saveBadge: () => Promise<BadgeDefinition>;
  discardChanges: () => void;
  closeEditor: () => void;

  // Eligibility rules
  addEligibilityRule: () => void;
  updateEligibilityRule: (index: number, updates: Partial<EligibilityRule>) => void;
  removeEligibilityRule: (index: number) => void;
  reorderEligibilityRules: (fromIndex: number, toIndex: number) => void;

  // Evidence config
  addEvidenceConfig: () => void;
  updateEvidenceConfig: (index: number, updates: Partial<EvidenceConfig>) => void;
  removeEvidenceConfig: (index: number) => void;

  // Search
  setSearchQuery: (query: string) => void;

  // Publishing
  publishToGitHub: (badgeId: string) => Promise<{ prUrl: string; branch: string }>;

  // Helpers
  getBadgeById: (id: string) => BadgeDefinition | undefined;
  getBadgesByCategory: (categoryId: string) => BadgeDefinition[];
  getExportJson: (badgeId: string) => string | null;
}

export const useBadgeStore = create<BadgeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      badges: [],
      schemas: [],
      selectedBadgeId: null,
      currentBadge: null,
      isDirty: false,
      isLoading: false,
      error: null,
      searchQuery: '',

      // Fetch all badges from server
      fetchBadges: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/api/badges`, {
            credentials: 'include',
          });

          if (!response.ok) {
            if (response.status === 404) {
              // No badges yet, start with empty array
              set({ badges: [], isLoading: false });
              return;
            }
            throw new Error('Failed to fetch badges');
          }

          const badges = await response.json();
          set({ badges, isLoading: false });
        } catch (error) {
          console.error('Error fetching badges:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch badges',
            isLoading: false,
          });
        }
      },

      // Create a new badge
      createBadge: async (badgeData) => {
        const newBadge: BadgeDefinition = {
          ...createEmptyBadge(),
          ...badgeData,
          id: badgeData.id || `badge-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };

        try {
          const response = await fetch(`${API_BASE}/api/badges`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(newBadge),
          });

          if (!response.ok) {
            throw new Error('Failed to create badge');
          }

          const savedBadge = await response.json();
          set((state) => ({
            badges: [...state.badges, savedBadge],
            selectedBadgeId: savedBadge.id,
          }));

          return savedBadge;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create badge',
          });
          throw error;
        }
      },

      // Update an existing badge
      updateBadge: async (id, updates) => {
        const currentBadges = get().badges;
        const badgeIndex = currentBadges.findIndex((b) => b.id === id);

        if (badgeIndex === -1) {
          throw new Error('Badge not found');
        }

        const updatedBadge = {
          ...currentBadges[badgeIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        // Optimistic update
        const newBadges = [...currentBadges];
        newBadges[badgeIndex] = updatedBadge;
        set({ badges: newBadges });

        try {
          const response = await fetch(`${API_BASE}/api/badges/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updatedBadge),
          });

          if (!response.ok) {
            throw new Error('Failed to update badge');
          }

          const savedBadge = await response.json();
          set((state) => ({
            badges: state.badges.map((b) => (b.id === id ? savedBadge : b)),
          }));
        } catch (error) {
          // Revert on error
          set({ badges: currentBadges });
          set({
            error: error instanceof Error ? error.message : 'Failed to update badge',
          });
          throw error;
        }
      },

      // Delete a badge
      deleteBadge: async (id) => {
        const currentBadges = get().badges;

        // Optimistic update
        set((state) => ({
          badges: state.badges.filter((b) => b.id !== id),
          selectedBadgeId: state.selectedBadgeId === id ? null : state.selectedBadgeId,
          currentBadge: state.currentBadge?.id === id ? null : state.currentBadge,
        }));

        try {
          const response = await fetch(`${API_BASE}/api/badges/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error('Failed to delete badge');
          }
        } catch (error) {
          // Revert on error
          set({ badges: currentBadges });
          set({
            error: error instanceof Error ? error.message : 'Failed to delete badge',
          });
          throw error;
        }
      },

      // Select a badge
      selectBadge: (id) => {
        set({ selectedBadgeId: id });
        if (id) {
          get().loadBadgeForEditing(id);
        } else {
          set({ currentBadge: null, isDirty: false });
        }
      },

      // Create a new badge for editing
      newBadge: () => {
        set({
          currentBadge: createEmptyBadge(),
          isDirty: false,
          selectedBadgeId: null,
        });
      },

      // Load an existing badge for editing
      loadBadgeForEditing: (id) => {
        const badge = get().badges.find((b) => b.id === id);
        if (badge) {
          set({
            currentBadge: { ...badge },
            isDirty: false,
            selectedBadgeId: id,
          });
        }
      },

      // Update a field on the current badge
      updateCurrentBadge: (field, value) => {
        const current = get().currentBadge;
        if (!current) return;

        set({
          currentBadge: { ...current, [field]: value },
          isDirty: true,
        });
      },

      // Save the current badge (create or update)
      saveCurrentBadge: async () => {
        const current = get().currentBadge;
        if (!current) {
          throw new Error('No badge to save');
        }

        const existingBadge = get().badges.find((b) => b.id === current.id);

        if (existingBadge) {
          await get().updateBadge(current.id, current);
          set({ isDirty: false });
          return current;
        } else {
          const saved = await get().createBadge(current);
          set({ currentBadge: saved, isDirty: false });
          return saved;
        }
      },

      // Discard changes to current badge
      discardChanges: () => {
        const selectedId = get().selectedBadgeId;
        if (selectedId) {
          get().loadBadgeForEditing(selectedId);
        } else {
          set({ currentBadge: null, isDirty: false });
        }
      },

      // Close the editor (go back to welcome screen)
      closeEditor: () => {
        set({ currentBadge: null, selectedBadgeId: null, isDirty: false });
      },

      // Alias for saveCurrentBadge (used by toolbar)
      saveBadge: async () => {
        return get().saveCurrentBadge();
      },

      // Add a new eligibility rule
      addEligibilityRule: () => {
        const current = get().currentBadge;
        if (!current) return;

        set({
          currentBadge: {
            ...current,
            eligibilityRules: [...current.eligibilityRules, createEmptyRule()],
          },
          isDirty: true,
        });
      },

      // Update an eligibility rule
      updateEligibilityRule: (index, updates) => {
        const current = get().currentBadge;
        if (!current) return;

        const newRules = [...current.eligibilityRules];
        newRules[index] = { ...newRules[index], ...updates };

        set({
          currentBadge: { ...current, eligibilityRules: newRules },
          isDirty: true,
        });
      },

      // Remove an eligibility rule
      removeEligibilityRule: (index) => {
        const current = get().currentBadge;
        if (!current) return;

        const newRules = current.eligibilityRules.filter((_, i) => i !== index);

        set({
          currentBadge: { ...current, eligibilityRules: newRules },
          isDirty: true,
        });
      },

      // Reorder eligibility rules
      reorderEligibilityRules: (fromIndex, toIndex) => {
        const current = get().currentBadge;
        if (!current) return;

        const newRules = [...current.eligibilityRules];
        const [removed] = newRules.splice(fromIndex, 1);
        newRules.splice(toIndex, 0, removed);

        set({
          currentBadge: { ...current, eligibilityRules: newRules },
          isDirty: true,
        });
      },

      // Add a new evidence config
      addEvidenceConfig: () => {
        const current = get().currentBadge;
        if (!current) return;

        set({
          currentBadge: {
            ...current,
            evidenceConfig: [...current.evidenceConfig, createEmptyEvidenceConfig()],
          },
          isDirty: true,
        });
      },

      // Update an evidence config
      updateEvidenceConfig: (index, updates) => {
        const current = get().currentBadge;
        if (!current) return;

        const newConfigs = [...current.evidenceConfig];
        newConfigs[index] = { ...newConfigs[index], ...updates };

        set({
          currentBadge: { ...current, evidenceConfig: newConfigs },
          isDirty: true,
        });
      },

      // Remove an evidence config
      removeEvidenceConfig: (index) => {
        const current = get().currentBadge;
        if (!current) return;

        const newConfigs = current.evidenceConfig.filter((_, i) => i !== index);

        set({
          currentBadge: { ...current, evidenceConfig: newConfigs },
          isDirty: true,
        });
      },

      // Set search query
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      // Publish badge to GitHub VDR
      publishToGitHub: async (badgeId) => {
        const badge = get().badges.find((b) => b.id === badgeId);
        if (!badge) {
          throw new Error('Badge not found');
        }

        const exportData = badgeToExportFormat(badge);

        try {
          const response = await fetch(`${API_BASE}/api/github/badge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              badge: exportData,
              filename: `${badge.id}.json`,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to publish badge to GitHub');
          }

          const result = await response.json();

          // Update badge status to published
          await get().updateBadge(badgeId, { status: 'published' });

          return {
            prUrl: result.pr?.url || result.prUrl,
            branch: result.branch,
          };
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to publish badge',
          });
          throw error;
        }
      },

      // Get badge by ID
      getBadgeById: (id) => {
        return get().badges.find((b) => b.id === id);
      },

      // Get badges by category
      getBadgesByCategory: (categoryId) => {
        return get().badges.filter((b) => b.categoryId === categoryId);
      },

      // Get export JSON for a badge
      getExportJson: (badgeId) => {
        const badge = get().badges.find((b) => b.id === badgeId);
        if (!badge) return null;

        const exportData = badgeToExportFormat(badge);
        return JSON.stringify(exportData, null, 2);
      },
    }),
    {
      name: 'badge-store',
      partialize: (state) => ({
        // Only persist draft badges locally
        currentBadge: state.currentBadge,
        isDirty: state.isDirty,
      }),
    }
  )
);
