import { create } from 'zustand';
import {
  ZoneTemplate,
  ZoneTemplateStore,
  CARD_WIDTH,
  CARD_HEIGHT,
} from '../types/vct';

const generateId = () => crypto.randomUUID();

// API base URL
const API_BASE = '/api/zone-templates';

// API functions for zone templates
const api = {
  async fetchAll(): Promise<ZoneTemplate[]> {
    try {
      const response = await fetch(API_BASE, { credentials: 'include' });
      if (!response.ok) {
        console.error('Failed to fetch zone templates:', response.statusText);
        return [];
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching zone templates:', error);
      return [];
    }
  },

  async create(template: ZoneTemplate): Promise<ZoneTemplate | null> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(template),
      });
      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to create zone template:', error);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating zone template:', error);
      return null;
    }
  },

  async update(id: string, template: Partial<ZoneTemplate>): Promise<ZoneTemplate | null> {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(template),
      });
      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to update zone template:', error);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating zone template:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to delete zone template:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error deleting zone template:', error);
      return false;
    }
  },
};

// Create the zone template store
export const useZoneTemplateStore = create<ZoneTemplateStore & {
  isLoading: boolean;
  error: string | null;
  loadTemplates: () => Promise<void>;
}>()((set, get) => ({
  // Initial state - empty until loaded from server
  templates: [],
  selectedTemplateId: null,
  editingTemplate: null,
  isLoading: false,
  error: null,

  // Load templates from server
  loadTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const serverTemplates = await api.fetchAll();
      set({
        templates: serverTemplates,
        isLoading: false,
      });
    } catch (error) {
      set({ error: 'Failed to load templates', isLoading: false });
    }
  },

  // Add a new template
  addTemplate: (template) => {
    const templateWithId = template as ZoneTemplate;
    const id = templateWithId.id || generateId();
    const now = new Date().toISOString();
    const newTemplate: ZoneTemplate = {
      ...template,
      id,
      createdAt: templateWithId.createdAt || now,
      updatedAt: now,
    };

    // Optimistically add to local state
    set((state) => ({
      templates: [...state.templates, newTemplate],
    }));

    // Save to server
    api.create(newTemplate).then((saved) => {
      if (saved) {
        // Update with server response (includes author info)
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? saved : t
          ),
        }));
      } else {
        // Remove on failure
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }));
      }
    });

    return id;
  },

  // Update an existing template
  updateTemplate: (id, updates) => {
    const template = get().templates.find((t) => t.id === id);
    if (!template) return;

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Optimistically update local state
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id ? updatedTemplate : t
      ),
    }));

    // Save to server
    api.update(id, updatedTemplate).then((saved) => {
      if (saved) {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? saved : t
          ),
        }));
      }
    });
  },

  // Delete a template
  deleteTemplate: (id) => {
    // Optimistically remove from local state
    set((state) => {
      const remainingTemplates = state.templates.filter((t) => t.id !== id);
      return {
        templates: remainingTemplates,
        // If deleting the selected template, select the first remaining or null
        selectedTemplateId:
          state.selectedTemplateId === id
            ? (remainingTemplates[0]?.id ?? null)
            : state.selectedTemplateId,
      };
    });

    // Delete from server
    api.delete(id).then((success) => {
      if (!success) {
        // Restore on failure - reload from server
        get().loadTemplates();
      }
    });
  },

  // Duplicate a template with a new name
  duplicateTemplate: (id, newName) => {
    const template = get().templates.find((t) => t.id === id);
    if (!template) return '';

    const newId = generateId();
    const now = new Date().toISOString();

    // Deep clone the template
    const duplicated: ZoneTemplate = {
      ...JSON.parse(JSON.stringify(template)),
      id: newId,
      name: newName,
      createdAt: now,
      updatedAt: now,
      author: undefined, // Will be set by server
    };

    // Generate new IDs for all zones
    duplicated.front.zones = duplicated.front.zones.map((z) => ({
      ...z,
      id: generateId(),
    }));
    duplicated.back.zones = duplicated.back.zones.map((z) => ({
      ...z,
      id: generateId(),
    }));

    // Add to local state
    set((state) => ({
      templates: [...state.templates, duplicated],
    }));

    // Save to server
    api.create(duplicated).then((saved) => {
      if (saved) {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === newId ? saved : t
          ),
        }));
      } else {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== newId),
        }));
      }
    });

    return newId;
  },

  // Select a template for use
  selectTemplate: (id) => set({ selectedTemplateId: id }),

  // Set the template being edited (creates a working copy)
  setEditingTemplate: (template) => {
    if (template) {
      // Create a deep copy for editing
      set({ editingTemplate: JSON.parse(JSON.stringify(template)) });
    } else {
      set({ editingTemplate: null });
    }
  },

  // Add a zone to the editing template
  addZone: (face, zone) => {
    set((state) => {
      if (!state.editingTemplate) {
        return state;
      }
      return {
        editingTemplate: {
          ...state.editingTemplate,
          [face]: {
            zones: [
              ...state.editingTemplate[face].zones,
              { ...zone, id: generateId() },
            ],
          },
        },
      };
    });
  },

  // Update a zone in the editing template
  updateZone: (face, zoneId, updates) => {
    set((state) => {
      if (!state.editingTemplate) {
        return state;
      }
      return {
        editingTemplate: {
          ...state.editingTemplate,
          [face]: {
            zones: state.editingTemplate[face].zones.map((z) =>
              z.id === zoneId ? { ...z, ...updates } : z
            ),
          },
        },
      };
    });
  },

  // Delete a zone from the editing template
  deleteZone: (face, zoneId) => {
    set((state) => {
      if (!state.editingTemplate) {
        return state;
      }
      return {
        editingTemplate: {
          ...state.editingTemplate,
          [face]: {
            zones: state.editingTemplate[face].zones.filter(
              (z) => z.id !== zoneId
            ),
          },
        },
      };
    });
  },

  // Copy front zones to back
  copyFrontToBack: () => {
    set((state) => {
      if (!state.editingTemplate) {
        return state;
      }
      return {
        editingTemplate: {
          ...state.editingTemplate,
          back: {
            zones: state.editingTemplate.front.zones.map((z) => ({
              ...z,
              id: generateId(),
            })),
          },
        },
      };
    });
  },

  // Copy back zones to front
  copyBackToFront: () => {
    set((state) => {
      if (!state.editingTemplate) {
        return state;
      }
      return {
        editingTemplate: {
          ...state.editingTemplate,
          front: {
            zones: state.editingTemplate.back.zones.map((z) => ({
              ...z,
              id: generateId(),
            })),
          },
        },
      };
    });
  },

  // Save the editing template back to the templates list
  saveEditingTemplate: async () => {
    const { editingTemplate, templates } = get();
    if (!editingTemplate) return;

    const now = new Date().toISOString();
    const existingIndex = templates.findIndex(
      (t) => t.id === editingTemplate.id
    );

    if (existingIndex >= 0) {
      // Update existing template
      const updatedTemplate = { ...editingTemplate, updatedAt: now };

      // Optimistically update local state
      set((state) => ({
        templates: state.templates.map((t) =>
          t.id === editingTemplate.id ? updatedTemplate : t
        ),
        editingTemplate: null,
      }));

      // Save to server and handle response
      const saved = await api.update(editingTemplate.id, updatedTemplate);
      if (saved) {
        // Update with server response
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === editingTemplate.id ? saved : t
          ),
        }));
      } else {
        // Rollback on failure - reload from server
        console.error('Failed to save zone template, reloading from server');
        get().loadTemplates();
      }
    } else {
      // Add as new template
      const newTemplate = { ...editingTemplate, createdAt: now, updatedAt: now };

      // Optimistically update local state
      set((state) => ({
        templates: [...state.templates, newTemplate],
        editingTemplate: null,
      }));

      // Save to server and handle response
      const saved = await api.create(newTemplate);
      if (saved) {
        // Update with server response (includes author info)
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === editingTemplate.id ? saved : t
          ),
        }));
      } else {
        // Remove on failure
        console.error('Failed to create zone template, removing from local state');
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== editingTemplate.id),
        }));
      }
    }
  },

  // Get a template by ID
  getTemplate: (id) => get().templates.find((t) => t.id === id),
}));

// Helper to create a new blank template
export const createBlankTemplate = (name: string): Omit<ZoneTemplate, 'id' | 'createdAt' | 'updatedAt'> => ({
  name,
  description: '',
  front: { zones: [] },
  back: { zones: [] },
  card_width: CARD_WIDTH,
  card_height: CARD_HEIGHT,
});

// Load templates from server (call on app initialization)
export const loadZoneTemplates = () => {
  useZoneTemplateStore.getState().loadTemplates();
};

// Reload templates when user changes (call this when auth state changes)
export const reloadUserTemplates = () => {
  useZoneTemplateStore.getState().loadTemplates();
};
