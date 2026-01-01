import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { FurnisherDataSource, FurnisherField } from '../../../types/entity';
import FieldsTable from './FieldsTable';

interface ApiDataSourceFormProps {
  source: FurnisherDataSource | null;
  onSave: (source: FurnisherDataSource) => void;
  onClose: () => void;
}

export default function ApiDataSourceForm({ source, onSave, onClose }: ApiDataSourceFormProps) {
  const isEditing = !!source;

  // Form state
  const [name, setName] = useState(source?.name || '');
  const [description, setDescription] = useState(source?.description || '');
  const [notes, setNotes] = useState(source?.notes || '');
  const [fields, setFields] = useState<FurnisherField[]>(source?.fields || []);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Source name is required';
    }

    // Validate fields - at least need valid attribute names
    const invalidFields = fields.filter(f => !f.name || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(f.name));
    if (invalidFields.length > 0) {
      newErrors.fields = 'All fields must have valid attribute names (letters, numbers, underscores, starting with a letter)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    // Filter out empty fields (no name)
    const validFields = fields.filter(f => f.name && f.name.trim());

    const newSource: FurnisherDataSource = {
      id: source?.id || `source-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      sourceType: 'api',
      fields: validFields,
      notes: notes.trim() || undefined,
    };

    onSave(newSource);
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Edit API Data Source' : 'Add API Data Source'}
              </h3>
              <p className="text-xs text-gray-500">Define attributes available from this API endpoint</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Source Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Interac Bank Verification / IDV"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Bundle: SK-DA-01 (Identity Profile)"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Fields Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fields
                </label>
                <p className="text-xs text-gray-500">
                  Define the attributes available from this API. Tab through cells to navigate.
                </p>
              </div>
              <span className="text-xs text-gray-400">
                {fields.filter(f => f.name).length} field{fields.filter(f => f.name).length !== 1 ? 's' : ''}
              </span>
            </div>
            <FieldsTable fields={fields} onChange={setFields} />
            {errors.fields && (
              <p className="mt-2 text-sm text-red-500">{errors.fields}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Integration Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes about API integration, authentication, rate limits, etc."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {isEditing ? 'Save Changes' : 'Save Data Source'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
