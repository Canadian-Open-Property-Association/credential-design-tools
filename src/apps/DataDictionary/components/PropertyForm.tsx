import { useState, useEffect } from 'react';
import { useDictionaryStore } from '../../../store/dictionaryStore';
import type { VocabProperty, ValueType, PropertyConstraints } from '../../../types/dictionary';

interface PropertyFormProps {
  vocabTypeId: string;
  property: VocabProperty | null;
  onClose: () => void;
}

const VALUE_TYPE_OPTIONS: { value: ValueType; label: string }[] = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'integer', label: 'Integer' },
  { value: 'boolean', label: 'Yes/No' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'currency', label: 'Currency' },
  { value: 'url', label: 'URL' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'array', label: 'List' },
  { value: 'object', label: 'Object' },
];

export default function PropertyForm({ vocabTypeId, property, onClose }: PropertyFormProps) {
  const { addProperty, updateProperty } = useDictionaryStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    valueType: 'string' as ValueType,
    required: false,
    sampleValue: '',
    jsonLdTerm: '',
    constraints: {
      minLength: undefined as number | undefined,
      maxLength: undefined as number | undefined,
      minimum: undefined as number | undefined,
      maximum: undefined as number | undefined,
      precision: undefined as number | undefined,
      pattern: '',
      format: '',
      enum: [] as string[],
    },
  });

  const [newEnumValue, setNewEnumValue] = useState('');

  const isEditing = !!property;

  // Load existing property if editing
  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name,
        displayName: property.displayName,
        description: property.description || '',
        valueType: property.valueType,
        required: property.required,
        sampleValue: property.sampleValue || '',
        jsonLdTerm: property.jsonLdTerm || '',
        constraints: {
          minLength: property.constraints?.minLength,
          maxLength: property.constraints?.maxLength,
          minimum: property.constraints?.minimum,
          maximum: property.constraints?.maximum,
          precision: property.constraints?.precision,
          pattern: property.constraints?.pattern || '',
          format: property.constraints?.format || '',
          enum: property.constraints?.enum || [],
        },
      });
    }
  }, [property]);

  // Auto-generate name from display name
  const handleDisplayNameChange = (displayName: string) => {
    setFormData(prev => ({
      ...prev,
      displayName,
      name: isEditing ? prev.name : displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
    }));
  };

  const handleAddEnumValue = () => {
    if (newEnumValue.trim() && !formData.constraints.enum.includes(newEnumValue.trim())) {
      setFormData(prev => ({
        ...prev,
        constraints: {
          ...prev.constraints,
          enum: [...prev.constraints.enum, newEnumValue.trim()],
        },
      }));
      setNewEnumValue('');
    }
  };

  const handleRemoveEnumValue = (value: string) => {
    setFormData(prev => ({
      ...prev,
      constraints: {
        ...prev.constraints,
        enum: prev.constraints.enum.filter(v => v !== value),
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Build constraints object, only including non-empty values
      const constraints: PropertyConstraints = {};
      if (formData.constraints.minLength !== undefined) constraints.minLength = formData.constraints.minLength;
      if (formData.constraints.maxLength !== undefined) constraints.maxLength = formData.constraints.maxLength;
      if (formData.constraints.minimum !== undefined) constraints.minimum = formData.constraints.minimum;
      if (formData.constraints.maximum !== undefined) constraints.maximum = formData.constraints.maximum;
      if (formData.constraints.precision !== undefined) constraints.precision = formData.constraints.precision;
      if (formData.constraints.pattern) constraints.pattern = formData.constraints.pattern;
      if (formData.constraints.format) constraints.format = formData.constraints.format;
      if (formData.constraints.enum.length > 0) constraints.enum = formData.constraints.enum;

      const propertyData: Partial<VocabProperty> = {
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description || undefined,
        valueType: formData.valueType,
        required: formData.required,
        sampleValue: formData.sampleValue || undefined,
        jsonLdTerm: formData.jsonLdTerm || undefined,
        constraints: Object.keys(constraints).length > 0 ? constraints : undefined,
      };

      if (isEditing && property) {
        await updateProperty(vocabTypeId, property.id, propertyData);
      } else {
        await addProperty(vocabTypeId, {
          ...propertyData,
          id: `prop-${Date.now()}`,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save property');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEditing ? 'Edit Property' : 'Add Property'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => handleDisplayNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Assessed Value"
                required
              />
            </div>

            {/* Technical Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technical Name (Canonical)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="assessed_value"
              />
              <p className="text-xs text-gray-500 mt-1">The canonical vocabulary name used in JSON</p>
            </div>

            {/* Value Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.valueType}
                onChange={(e) => setFormData(prev => ({ ...prev, valueType: e.target.value as ValueType }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {VALUE_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Required */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="required"
                checked={formData.required}
                onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="required" className="text-sm text-gray-700">
                Required field
              </label>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Describe this property..."
              />
            </div>

            {/* Sample Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sample Value
              </label>
              <input
                type="text"
                value={formData.sampleValue}
                onChange={(e) => setFormData(prev => ({ ...prev, sampleValue: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="$450,000"
              />
            </div>

            {/* JSON-LD Term */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                JSON-LD Term
              </label>
              <input
                type="text"
                value={formData.jsonLdTerm}
                onChange={(e) => setFormData(prev => ({ ...prev, jsonLdTerm: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="schema:value"
              />
              <p className="text-xs text-gray-500 mt-1">@id for JSON-LD context (e.g., schema:value)</p>
            </div>

            {/* Constraints Section */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Constraints</h3>

              {/* String constraints */}
              {(formData.valueType === 'string' || formData.valueType === 'email' || formData.valueType === 'url' || formData.valueType === 'phone') && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Min Length</label>
                    <input
                      type="number"
                      value={formData.constraints.minLength ?? ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        constraints: { ...prev.constraints, minLength: e.target.value ? parseInt(e.target.value) : undefined },
                      }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Max Length</label>
                    <input
                      type="number"
                      value={formData.constraints.maxLength ?? ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        constraints: { ...prev.constraints, maxLength: e.target.value ? parseInt(e.target.value) : undefined },
                      }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Numeric constraints */}
              {(formData.valueType === 'number' || formData.valueType === 'integer' || formData.valueType === 'currency') && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                    <input
                      type="number"
                      value={formData.constraints.minimum ?? ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        constraints: { ...prev.constraints, minimum: e.target.value ? parseFloat(e.target.value) : undefined },
                      }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                    <input
                      type="number"
                      value={formData.constraints.maximum ?? ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        constraints: { ...prev.constraints, maximum: e.target.value ? parseFloat(e.target.value) : undefined },
                      }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Precision</label>
                    <input
                      type="number"
                      value={formData.constraints.precision ?? ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        constraints: { ...prev.constraints, precision: e.target.value ? parseInt(e.target.value) : undefined },
                      }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Decimal places"
                    />
                  </div>
                </div>
              )}

              {/* Format (for currency) */}
              {formData.valueType === 'currency' && (
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">Currency Format</label>
                  <input
                    type="text"
                    value={formData.constraints.format}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      constraints: { ...prev.constraints, format: e.target.value },
                    }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="CAD, USD, etc."
                  />
                </div>
              )}

              {/* Pattern */}
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">Regex Pattern</label>
                <input
                  type="text"
                  value={formData.constraints.pattern}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    constraints: { ...prev.constraints, pattern: e.target.value },
                  }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="^[A-Z]{2}$"
                />
              </div>

              {/* Enum Values */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Allowed Values (Enum)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newEnumValue}
                    onChange={(e) => setNewEnumValue(e.target.value)}
                    placeholder="Add allowed value"
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEnumValue();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddEnumValue}
                    className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Add
                  </button>
                </div>
                {formData.constraints.enum.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.constraints.enum.map((value) => (
                      <span
                        key={value}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                      >
                        {value}
                        <button
                          type="button"
                          onClick={() => handleRemoveEnumValue(value)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting || !formData.displayName}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
