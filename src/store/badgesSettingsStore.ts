import { create } from 'zustand';
import type { BadgesSettings, BadgeCategory } from '../types/badge';
import { DEFAULT_BADGES_SETTINGS } from '../types/badge';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001';

interface BadgesSettingsStore {
  settings: BadgesSettings | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<BadgesSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;

  // Category management
  addCategory: (category: BadgeCategory) => Promise<void>;
  updateCategory: (id: string, updates: Partial<BadgeCategory>) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;

  // Helpers
  getCategoryLabel: (id: string) => string;
  getCategoryColor: (id: string) => string;
  getCategoryById: (id: string) => BadgeCategory | undefined;
}

export const useBadgesSettingsStore = create<BadgesSettingsStore>((set, get) => ({
  settings: null,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/badges/settings`, {
        credentials: 'include',
      });

      if (!response.ok) {
        // If settings don't exist yet, use defaults
        if (response.status === 404) {
          set({ settings: DEFAULT_BADGES_SETTINGS, isLoading: false });
          return;
        }
        throw new Error('Failed to fetch badge settings');
      }

      const settings = await response.json();
      set({ settings, isLoading: false });
    } catch (error) {
      console.error('Error fetching badge settings:', error);
      // Fall back to defaults on error
      set({
        settings: DEFAULT_BADGES_SETTINGS,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch settings',
      });
    }
  },

  updateSettings: async (updates) => {
    const currentSettings = get().settings || DEFAULT_BADGES_SETTINGS;
    const newSettings = { ...currentSettings, ...updates };

    // Optimistic update
    set({ settings: newSettings, error: null });

    try {
      const response = await fetch(`${API_BASE}/api/badges/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to update badge settings');
      }

      const savedSettings = await response.json();
      set({ settings: savedSettings });
    } catch (error) {
      // Revert on error
      set({
        settings: currentSettings,
        error: error instanceof Error ? error.message : 'Failed to update settings',
      });
      throw error;
    }
  },

  resetSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/badges/settings/reset`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to reset badge settings');
      }

      set({ settings: DEFAULT_BADGES_SETTINGS, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to reset settings',
        isLoading: false,
      });
      throw error;
    }
  },

  addCategory: async (category) => {
    const currentSettings = get().settings || DEFAULT_BADGES_SETTINGS;
    const newCategories = [...currentSettings.categories, category];
    await get().updateSettings({ categories: newCategories });
  },

  updateCategory: async (id, updates) => {
    const currentSettings = get().settings || DEFAULT_BADGES_SETTINGS;
    const newCategories = currentSettings.categories.map((cat) =>
      cat.id === id ? { ...cat, ...updates } : cat
    );
    await get().updateSettings({ categories: newCategories });
  },

  removeCategory: async (id) => {
    const currentSettings = get().settings || DEFAULT_BADGES_SETTINGS;
    const newCategories = currentSettings.categories.filter((cat) => cat.id !== id);
    await get().updateSettings({ categories: newCategories });
  },

  getCategoryLabel: (id) => {
    const settings = get().settings || DEFAULT_BADGES_SETTINGS;
    const category = settings.categories.find((cat) => cat.id === id);
    return category?.label || id;
  },

  getCategoryColor: (id) => {
    const settings = get().settings || DEFAULT_BADGES_SETTINGS;
    const category = settings.categories.find((cat) => cat.id === id);
    return category?.color || '#6B7280'; // default gray
  },

  getCategoryById: (id) => {
    const settings = get().settings || DEFAULT_BADGES_SETTINGS;
    return settings.categories.find((cat) => cat.id === id);
  },
}));
