import { useState } from 'react';
import { useBadgesSettingsStore } from '../../../store/badgesSettingsStore';
import type { BadgeCategory } from '../../../types/badge';

interface BadgeSettingsProps {
  onClose: () => void;
}

export default function BadgeSettings({ onClose }: BadgeSettingsProps) {
  const { settings, updateSettings, resetSettings } = useBadgesSettingsStore();

  const [categories, setCategories] = useState<BadgeCategory[]>(settings?.categories || []);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<Partial<BadgeCategory>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({ categories });
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all badge settings to defaults? This cannot be undone.')) {
      return;
    }

    setIsSaving(true);
    try {
      await resetSettings();
      setCategories(settings?.categories || []);
      onClose();
    } catch (error) {
      console.error('Failed to reset settings:', error);
      alert('Failed to reset settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.id || !newCategory.label) {
      alert('Category ID and label are required');
      return;
    }

    if (categories.some((c) => c.id === newCategory.id)) {
      alert('A category with this ID already exists');
      return;
    }

    setCategories([
      ...categories,
      {
        id: newCategory.id,
        label: newCategory.label,
        description: newCategory.description || '',
        color: newCategory.color || '#6B7280',
      },
    ]);
    setNewCategory({});
  };

  const handleUpdateCategory = (id: string, updates: Partial<BadgeCategory>) => {
    setCategories(categories.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleRemoveCategory = (id: string) => {
    if (!confirm(`Remove category "${categories.find((c) => c.id === id)?.label}"?`)) {
      return;
    }
    setCategories(categories.filter((c) => c.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Badge Settings</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Badge Categories</h3>
            <p className="text-xs text-gray-500 mb-4">
              Categories help organize badges into logical groups. Each badge must belong to a
              category.
            </p>

            {/* Existing categories */}
            <div className="space-y-2 mb-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="bg-gray-50 rounded-lg border border-gray-200 p-3"
                >
                  {editingCategory === category.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Label
                          </label>
                          <input
                            type="text"
                            value={category.label}
                            onChange={(e) =>
                              handleUpdateCategory(category.id, { label: e.target.value })
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Color
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={category.color || '#6B7280'}
                              onChange={(e) =>
                                handleUpdateCategory(category.id, { color: e.target.value })
                              }
                              className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={category.color || '#6B7280'}
                              onChange={(e) =>
                                handleUpdateCategory(category.id, { color: e.target.value })
                              }
                              className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={category.description || ''}
                          onChange={(e) =>
                            handleUpdateCategory(category.id, { description: e.target.value })
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => setEditingCategory(null)}
                          className="px-3 py-1 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color || '#6B7280' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900">{category.label}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {category.id} • {category.description || 'No description'}
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingCategory(category.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRemoveCategory(category.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add new category */}
            <div className="bg-white rounded-lg border border-dashed border-gray-300 p-4">
              <h4 className="text-xs font-medium text-gray-600 mb-3">Add New Category</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">ID</label>
                  <input
                    type="text"
                    value={newCategory.id || ''}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                      })
                    }
                    placeholder="e.g., professional"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                  <input
                    type="text"
                    value={newCategory.label || ''}
                    onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })}
                    placeholder="e.g., Professional Badges"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newCategory.description || ''}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, description: e.target.value })
                    }
                    placeholder="Brief description..."
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                  <div className="flex gap-1">
                    <input
                      type="color"
                      value={newCategory.color || '#6B7280'}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newCategory.color || '#6B7280'}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={handleAddCategory}
                disabled={!newCategory.id || !newCategory.label}
                className="w-full py-2 text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Reset to Defaults
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
