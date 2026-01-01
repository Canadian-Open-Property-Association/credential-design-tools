/**
 * Forms Builder Types
 *
 * Type definitions for the Forms Builder app.
 * Based on the VC-Forms-app schema structure.
 */

// Form field types
export type FormFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'verified-credential';

// Form field definition
export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  name: string; // JSON key for this field
  description?: string;
  placeholder?: string;
  required: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  // For select/radio/checkbox fields
  options?: {
    label: string;
    value: string;
  }[];
  // For verified-credential fields
  credentialConfig?: {
    credentialLibraryId?: string;
    schemaId?: string;
    credDefId?: string;
    requiredAttributes?: string[];
  };
}

// Form section (groups of fields)
export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

// Form screen (info/success screens)
export interface FormScreen {
  title: string;
  content: string; // Markdown content
}

// Complete form schema (stored in JSONB)
export interface FormSchema {
  sections: FormSection[];
  infoScreen: FormScreen | null; // Shown before form
  successScreen: FormScreen; // Shown after submission
}

// Form status
export type FormStatus = 'draft' | 'published';

// Form mode
export type FormMode = 'simple' | 'advanced';

// Complete form object (matches database schema)
export interface Form {
  id: string;
  title: string;
  description: string;
  slug: string | null;
  schema: FormSchema;
  status: FormStatus;
  mode: FormMode;
  authorName: string | null;
  authorEmail: string | null;
  authorOrganization: string | null;
  githubUserId: string;
  githubUsername: string;
  clonedFrom: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// Form list item (subset for listing)
export interface FormListItem {
  id: string;
  title: string;
  description: string;
  status: FormStatus;
  mode: FormMode;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  slug: string | null;
}

// API request types
export interface CreateFormRequest {
  title: string;
  description?: string;
  schema?: FormSchema;
  mode?: FormMode;
}

export interface UpdateFormRequest {
  title?: string;
  description?: string;
  schema?: FormSchema;
  mode?: FormMode;
}

// API response types
export interface PublishFormResponse extends Form {
  publicUrl: string;
}

// Field type labels for UI
export const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  text: 'Text',
  email: 'Email',
  phone: 'Phone',
  number: 'Number',
  date: 'Date',
  textarea: 'Long Text',
  select: 'Dropdown',
  radio: 'Radio Buttons',
  checkbox: 'Checkboxes',
  'verified-credential': 'Verified Credential',
};

// Default form schema for new forms
export function createDefaultFormSchema(): FormSchema {
  return {
    sections: [
      {
        id: crypto.randomUUID(),
        title: 'Section 1',
        fields: [],
      },
    ],
    infoScreen: null,
    successScreen: {
      title: 'Thank you!',
      content: 'Your form has been submitted successfully.',
    },
  };
}

// Create a new empty field
export function createEmptyField(type: FormFieldType = 'text'): FormField {
  return {
    id: crypto.randomUUID(),
    type,
    label: '',
    name: '',
    required: false,
  };
}

// Create a new empty section
export function createEmptySection(): FormSection {
  return {
    id: crypto.randomUUID(),
    title: 'New Section',
    fields: [],
  };
}
