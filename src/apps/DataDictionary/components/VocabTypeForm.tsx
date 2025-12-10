import { useState, useEffect } from 'react';
import { useDictionaryStore } from '../../../store/dictionaryStore';

interface VocabTypeFormProps {
  vocabTypeId: string | null;
  onClose: () => void;
}

const CATEGORY_OPTIONS = [
  { value: 'property', label: 'Property Data' },
  { value: 'financial', label: 'Financial Data' },
  { value: 'identity', label: 'Identity Data' },
  { value: 'employment', label: 'Employment Data' },
  { value: 'other', label: 'Other' },
];

export default function VocabTypeForm({ vocabTypeId, onClose }: VocabTypeFormProps) {
  const { vocabTypes, createVocabType, updateVocabType } = useDictionaryStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    category: 'other',
  });

  const isEditing = !!vocabTypeId;

  // Load existing vocab type if editing
  useEffect(() => {
    if (vocabTypeId) {
      const existing = vocabTypes.find(vt => vt.id === vocabTypeId);
      if (existing) {
        setFormData({
          id: existing.id,
          name: existing.name,
          description: existing.description || '',
          category: existing.category || 'other',
        });
      }
    }
  }, [vocabTypeId, vocabTypes]);

  // Auto-generate ID from name
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      id: isEditing ? prev.id : name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isEditing) {
        await updateVocabType(vocabTypeId, {
          name: formData.name,
          description: formData.description,
          category: formData.category,
        });
      } else {
        await createVocabType({
          id: formData.id,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          properties: [],
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vocabulary type');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEditing ? 'Edit Vocabulary Type' : 'Add Vocabulary Type'}
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

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Property Valuation"
                required
              />
            </div>

            {/* ID (auto-generated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-gray-50"
                placeholder="property-valuation"
                disabled={isEditing}
              />
              <p className="text-xs text-gray-500 mt-1">Auto-generated from name</p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
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
                rows={3}
                placeholder="Describe what this vocabulary type represents..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
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
              disabled={isSubmitting || !formData.name}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
