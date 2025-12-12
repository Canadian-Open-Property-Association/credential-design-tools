import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ManagedAsset,
  AssetProject,
  AssetManagerStore,
  EntityRef,
  createDefaultAsset,
} from '../types/asset';
import { useAuthStore } from './authStore';

const generateId = () => crypto.randomUUID();

// API base URL
const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5174';

// API functions for managed assets
const api = {
  async fetchProjects(): Promise<AssetProject[]> {
    try {
      const response = await fetch(`${API_BASE}/api/managed-assets`, {
        credentials: 'include',
      });
      if (!response.ok) {
        console.error('Failed to fetch asset projects:', response.statusText);
        return [];
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching asset projects:', error);
      return [];
    }
  },

  async saveProject(project: AssetProject): Promise<AssetProject | null> {
    try {
      const response = await fetch(`${API_BASE}/api/managed-assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(project),
      });
      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to save asset project:', error);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error saving asset project:', error);
      return null;
    }
  },

  async updateProject(id: string, project: AssetProject): Promise<AssetProject | null> {
    try {
      const response = await fetch(`${API_BASE}/api/managed-assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(project),
      });
      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to update asset project:', error);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating asset project:', error);
      return null;
    }
  },

  async deleteProject(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/api/managed-assets/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to delete asset project:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error deleting asset project:', error);
      return false;
    }
  },

  async uploadFile(file: File): Promise<{ filename: string; uri: string; hash: string } | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/api/assets`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to upload file:', error);
        return null;
      }
      const data = await response.json();
      return {
        filename: data.filename,
        uri: data.uri,
        hash: data.hash,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  },

  async fetchEntities(): Promise<EntityRef[]> {
    try {
      const response = await fetch(`${API_BASE}/api/github/entities`, {
        credentials: 'include',
      });
      if (!response.ok) {
        console.error('Failed to fetch entities:', response.statusText);
        return [];
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching entities:', error);
      return [];
    }
  },
};

// Create the asset manager store
export const useAssetManagerStore = create<AssetManagerStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentAsset: null,
      currentProjectId: null,
      currentProjectName: 'Untitled',
      isDirty: false,
      isEditing: false,
      savedProjects: [],
      entities: [],
      isLoadingEntities: false,

      // Create new asset
      newAsset: () =>
        set({
          currentAsset: createDefaultAsset(),
          currentProjectId: null,
          currentProjectName: 'Untitled',
          isDirty: false,
          isEditing: true,
        }),

      // Close project (return to welcome screen)
      closeProject: () =>
        set({
          currentAsset: null,
          currentProjectId: null,
          currentProjectName: 'Untitled',
          isDirty: false,
          isEditing: false,
        }),

      // Load a saved project
      loadProject: (id: string) => {
        const project = get().savedProjects.find((p) => p.id === id);
        if (project) {
          set({
            currentAsset: project.asset,
            currentProjectId: project.id,
            currentProjectName: project.name,
            isDirty: false,
            isEditing: true,
          });
        }
      },

      // Save current project
      saveProject: async (name: string) => {
        const state = get();
        if (!state.currentAsset) return;

        const now = new Date().toISOString();

        if (state.currentProjectId) {
          // Update existing project
          const updatedProject: AssetProject = {
            id: state.currentProjectId,
            name,
            asset: state.currentAsset,
            createdAt: state.savedProjects.find((p) => p.id === state.currentProjectId)?.createdAt || now,
            updatedAt: now,
          };

          // Optimistically update local state
          set((s) => ({
            savedProjects: s.savedProjects.map((p) =>
              p.id === state.currentProjectId ? updatedProject : p
            ),
            currentProjectName: name,
            isDirty: false,
          }));

          // Save to server
          const saved = await api.updateProject(state.currentProjectId, updatedProject);
          if (!saved) {
            // Reload on failure
            reloadAssetProjects();
          }
        } else {
          // Create new project
          const newProject: AssetProject = {
            id: generateId(),
            name,
            asset: state.currentAsset,
            createdAt: now,
            updatedAt: now,
          };

          // Optimistically update local state
          set((s) => ({
            savedProjects: [...s.savedProjects, newProject],
            currentProjectId: newProject.id,
            currentProjectName: name,
            isDirty: false,
          }));

          // Save to server
          const saved = await api.saveProject(newProject);
          if (saved) {
            // Update with server response
            set((s) => ({
              savedProjects: s.savedProjects.map((p) =>
                p.id === newProject.id ? saved : p
              ),
              currentProjectId: saved.id,
            }));
          } else {
            // Remove on failure
            set((s) => ({
              savedProjects: s.savedProjects.filter((p) => p.id !== newProject.id),
              currentProjectId: null,
            }));
          }
        }
      },

      // Delete a project
      deleteProject: async (id: string) => {
        // Optimistically remove
        set((s) => ({
          savedProjects: s.savedProjects.filter((p) => p.id !== id),
        }));

        // Delete from server
        const success = await api.deleteProject(id);
        if (!success) {
          // Reload on failure
          reloadAssetProjects();
        }
      },

      // Update current asset
      updateAsset: (updates: Partial<ManagedAsset>) => {
        set((s) => {
          if (!s.currentAsset) return s;
          return {
            currentAsset: { ...s.currentAsset, ...updates, updatedAt: new Date().toISOString() },
            isDirty: true,
          };
        });
      },

      // Upload image file
      uploadImage: async (file: File) => {
        const result = await api.uploadFile(file);
        if (result) {
          const user = useAuthStore.getState().user;
          set((s) => ({
            currentAsset: s.currentAsset
              ? {
                  ...s.currentAsset,
                  id: s.currentAsset.id || generateId(),
                  filename: result.filename,
                  originalName: file.name,
                  name: s.currentAsset.name || file.name.replace(/\.[^.]+$/, ''),
                  mimetype: file.type,
                  size: file.size,
                  hash: result.hash,
                  localUri: result.uri,
                  updatedAt: new Date().toISOString(),
                  uploader: user
                    ? { id: String(user.id), login: user.login, name: user.name || user.login }
                    : s.currentAsset.uploader,
                }
              : null,
            isDirty: true,
          }));
        }
      },

      // Load entities from VDR
      loadEntities: async () => {
        set({ isLoadingEntities: true });
        const entities = await api.fetchEntities();
        set({ entities, isLoadingEntities: false });
      },
    }),
    {
      name: 'asset-manager-storage',
      partialize: (state) => ({
        savedProjects: state.savedProjects,
      }),
    }
  )
);

// Reload projects from server (call on app mount)
export const reloadAssetProjects = async () => {
  const isAuthenticated = useAuthStore.getState().isAuthenticated;

  if (isAuthenticated) {
    // Fetch from server
    const projects = await api.fetchProjects();
    useAssetManagerStore.setState({ savedProjects: projects });
  } else {
    // Use localStorage (handled by persist middleware)
  }
};
