/**
 * Forms Builder Store
 *
 * Zustand store for managing forms in the Forms Builder app.
 * All data is stored in PostgreSQL via the API.
 */

import { create } from 'zustand';
import {
  Form,
  FormListItem,
  FormSchema,
  FormMode,
  CreateFormRequest,
  UpdateFormRequest,
  PublishFormResponse,
  createDefaultFormSchema,
} from '../types/forms';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5174';

// API client for forms
const formsApi = {
  async list(): Promise<FormListItem[]> {
    const response = await fetch(`${API_BASE}/api/forms`, {
      credentials: 'include',
    });
    if (!response.ok) {
      if (response.status === 401) return [];
      if (response.status === 503) {
        console.warn('Forms Builder: Database unavailable');
        return [];
      }
      throw new Error('Failed to fetch forms');
    }
    return response.json();
  },

  async get(id: string): Promise<Form> {
    const response = await fetch(`${API_BASE}/api/forms/${id}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch form');
    }
    return response.json();
  },

  async getBySlug(slug: string): Promise<Form> {
    const response = await fetch(`${API_BASE}/api/forms/slug/${slug}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch form');
    }
    return response.json();
  },

  async create(data: CreateFormRequest): Promise<Form> {
    const response = await fetch(`${API_BASE}/api/forms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create form');
    }
    return response.json();
  },

  async update(id: string, data: UpdateFormRequest): Promise<Form> {
    const response = await fetch(`${API_BASE}/api/forms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update form');
    }
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/forms/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to delete form');
    }
  },

  async publish(id: string): Promise<PublishFormResponse> {
    const response = await fetch(`${API_BASE}/api/forms/${id}/publish`, {
      method: 'PUT',
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to publish form');
    }
    return response.json();
  },

  async unpublish(id: string): Promise<Form> {
    const response = await fetch(`${API_BASE}/api/forms/${id}/unpublish`, {
      method: 'PUT',
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to unpublish form');
    }
    return response.json();
  },

  async clone(id: string): Promise<Form> {
    const response = await fetch(`${API_BASE}/api/forms/${id}/clone`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to clone form');
    }
    return response.json();
  },
};

// Store state interface
interface FormsState {
  // Data
  forms: FormListItem[];
  currentForm: Form | null;
  databaseAvailable: boolean;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchForms: () => Promise<void>;
  fetchForm: (id: string) => Promise<void>;
  fetchFormBySlug: (slug: string) => Promise<void>;
  createForm: (title: string, description?: string, mode?: FormMode) => Promise<Form>;
  updateForm: (id: string, data: UpdateFormRequest) => Promise<void>;
  deleteForm: (id: string) => Promise<void>;
  publishForm: (id: string) => Promise<PublishFormResponse>;
  unpublishForm: (id: string) => Promise<void>;
  cloneForm: (id: string) => Promise<Form>;
  clearCurrentForm: () => void;
  clearError: () => void;

  // Local form editing (before save)
  updateCurrentFormSchema: (schema: FormSchema) => void;
  updateCurrentFormTitle: (title: string) => void;
  updateCurrentFormDescription: (description: string) => void;
}

export const useFormsStore = create<FormsState>((set) => ({
  // Initial state
  forms: [],
  currentForm: null,
  databaseAvailable: true,
  isLoading: false,
  error: null,

  // Fetch all forms for current user
  fetchForms: async () => {
    set({ isLoading: true, error: null });
    try {
      const forms = await formsApi.list();
      set({ forms, databaseAvailable: true, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch forms';
      set({ error: message, isLoading: false, databaseAvailable: false });
    }
  },

  // Fetch a single form by ID
  fetchForm: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const form = await formsApi.get(id);
      set({ currentForm: form, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch form';
      set({ error: message, isLoading: false });
    }
  },

  // Fetch a published form by slug (public)
  fetchFormBySlug: async (slug: string) => {
    set({ isLoading: true, error: null });
    try {
      const form = await formsApi.getBySlug(slug);
      set({ currentForm: form, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch form';
      set({ error: message, isLoading: false });
    }
  },

  // Create a new form
  createForm: async (title: string, description?: string, mode: FormMode = 'simple') => {
    set({ isLoading: true, error: null });
    try {
      const form = await formsApi.create({
        title,
        description,
        schema: createDefaultFormSchema(),
        mode,
      });
      // Add to list
      set((state) => ({
        forms: [form as FormListItem, ...state.forms],
        currentForm: form,
        isLoading: false,
      }));
      return form;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create form';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Update a form
  updateForm: async (id: string, data: UpdateFormRequest) => {
    set({ isLoading: true, error: null });
    try {
      const updatedForm = await formsApi.update(id, data);
      set((state) => ({
        forms: state.forms.map((f) =>
          f.id === id ? { ...f, ...updatedForm } : f
        ),
        currentForm: state.currentForm?.id === id ? updatedForm : state.currentForm,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update form';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Delete a form
  deleteForm: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await formsApi.delete(id);
      set((state) => ({
        forms: state.forms.filter((f) => f.id !== id),
        currentForm: state.currentForm?.id === id ? null : state.currentForm,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete form';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Publish a form
  publishForm: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await formsApi.publish(id);
      set((state) => ({
        forms: state.forms.map((f) =>
          f.id === id ? { ...f, status: 'published' as const, slug: result.slug, publishedAt: result.publishedAt } : f
        ),
        currentForm: state.currentForm?.id === id ? result : state.currentForm,
        isLoading: false,
      }));
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to publish form';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Unpublish a form
  unpublishForm: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const form = await formsApi.unpublish(id);
      set((state) => ({
        forms: state.forms.map((f) =>
          f.id === id ? { ...f, status: 'draft' as const } : f
        ),
        currentForm: state.currentForm?.id === id ? form : state.currentForm,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unpublish form';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Clone a form
  cloneForm: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const clonedForm = await formsApi.clone(id);
      set((state) => ({
        forms: [clonedForm as FormListItem, ...state.forms],
        isLoading: false,
      }));
      return clonedForm;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clone form';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Clear current form
  clearCurrentForm: () => {
    set({ currentForm: null });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Update current form schema locally (for editing)
  updateCurrentFormSchema: (schema: FormSchema) => {
    set((state) => ({
      currentForm: state.currentForm
        ? { ...state.currentForm, schema }
        : null,
    }));
  },

  // Update current form title locally
  updateCurrentFormTitle: (title: string) => {
    set((state) => ({
      currentForm: state.currentForm
        ? { ...state.currentForm, title }
        : null,
    }));
  },

  // Update current form description locally
  updateCurrentFormDescription: (description: string) => {
    set((state) => ({
      currentForm: state.currentForm
        ? { ...state.currentForm, description }
        : null,
    }));
  },
}));
