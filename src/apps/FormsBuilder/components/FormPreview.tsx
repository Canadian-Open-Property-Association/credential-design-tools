/**
 * FormPreview Component
 *
 * Renders a preview of a form as it would appear to respondents.
 * Supports all field types defined in the Forms Builder.
 */

import { useState } from 'react';
import { FormSchema, FormField, FormSection } from '../../../types/forms';

interface FormPreviewProps {
  schema: FormSchema;
  title: string;
  description?: string;
  onClose?: () => void;
}

interface FieldPreviewProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
}

function FieldPreview({ field, value, onChange }: FieldPreviewProps) {
  const baseInputClasses =
    'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
      return (
        <input
          type={field.type === 'phone' ? 'tel' : field.type}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseInputClasses}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={(value as number) ?? ''}
          onChange={(e) => onChange(e.target.valueAsNumber || '')}
          placeholder={field.placeholder}
          className={baseInputClasses}
        />
      );

    case 'date':
      return (
        <input
          type="date"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClasses}
        />
      );

    case 'textarea':
      return (
        <textarea
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className={`${baseInputClasses} resize-none`}
        />
      );

    case 'select':
      return (
        <select
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClasses}
        >
          <option value="">{field.placeholder || 'Select an option...'}</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );

    case 'radio':
      return (
        <div className="space-y-2">
          {field.options?.map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={field.id}
                value={option.value}
                checked={(value as string) === option.value}
                onChange={(e) => onChange(e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      );

    case 'checkbox':
      const checkedValues = (value as string[]) || [];
      return (
        <div className="space-y-2">
          {field.options?.map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value={option.value}
                checked={checkedValues.includes(option.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...checkedValues, option.value]);
                  } else {
                    onChange(checkedValues.filter((v) => v !== option.value));
                  }
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      );

    case 'verified-credential':
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          <svg
            className="w-8 h-8 mx-auto text-gray-400 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <p className="text-sm text-gray-500">Verified Credential Field</p>
          <p className="text-xs text-gray-400 mt-1">Scan QR code to verify</p>
        </div>
      );

    default:
      return (
        <div className="text-sm text-gray-500">
          Unsupported field type: {field.type}
        </div>
      );
  }
}

function SectionPreview({
  section,
  values,
  onChange,
}: {
  section: FormSection;
  values: Record<string, unknown>;
  onChange: (fieldName: string, value: unknown) => void;
}) {
  return (
    <div className="mb-8">
      {section.title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{section.title}</h3>
      )}
      {section.description && (
        <p className="text-gray-600 mb-4">{section.description}</p>
      )}
      <div className="space-y-6">
        {section.fields.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label || 'Untitled Field'}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.description && (
              <p className="text-sm text-gray-500 mb-2">{field.description}</p>
            )}
            <FieldPreview
              field={field}
              value={values[field.name] ?? ''}
              onChange={(value) => onChange(field.name, value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FormPreview({ schema, title, description, onClose }: FormPreviewProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [currentPage, setCurrentPage] = useState<'info' | 'form' | 'success'>('form');

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage('success');
  };

  // Show info screen if it exists
  if (currentPage === 'info' && schema.infoScreen) {
    return (
      <div className="min-h-full bg-white">
        <div className="max-w-2xl mx-auto p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{schema.infoScreen.title}</h2>
          <div className="prose prose-sm text-gray-700 mb-6">
            {schema.infoScreen.content}
          </div>
          <button
            onClick={() => setCurrentPage('form')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Show success screen
  if (currentPage === 'success') {
    return (
      <div className="min-h-full bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {schema.successScreen.title}
          </h2>
          <p className="text-gray-600 mb-6">{schema.successScreen.content}</p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close Preview
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show form
  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Form content */}
      <div className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSubmit}>
          {schema.sections.map((section) => (
            <SectionPreview
              key={section.id}
              section={section}
              values={values}
              onChange={handleFieldChange}
            />
          ))}

          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Submit
            </button>
          </div>
        </form>
      </div>

      {/* Preview badge */}
      <div className="fixed bottom-4 left-4 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
        Preview Mode
      </div>
    </div>
  );
}
