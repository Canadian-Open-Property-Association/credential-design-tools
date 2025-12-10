import { useState } from 'react';
import { useDictionaryStore } from '../../../store/dictionaryStore';

interface MovePropertiesModalProps {
  sourceVocabTypeId: string;
  sourceVocabTypeName: string;
  propertyIds: string[];
  onClose: () => void;
  onComplete: () => void;
}

export default function MovePropertiesModal({
  sourceVocabTypeId,
  sourceVocabTypeName,
  propertyIds,
  onClose,
  onComplete,
}: MovePropertiesModalProps) {
  const { vocabTypes, categories, moveProperties, createVocabType, createCategory } = useDictionaryStore();
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [selectedVocabTypeId, setSelectedVocabTypeId] = useState<string>('');
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New vocab type form
  const [newVocabTypeName, setNewVocabTypeName] = useState('');
  const [newVocabTypeId, setNewVocabTypeId] = useState('');
  const [newVocabTypeCategory, setNewVocabTypeCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Filter out the source vocab type from the list
  const availableVocabTypes = vocabTypes.filter(vt => vt.id !== sourceVocabTypeId);

  const handleMove = async () => {
    setError(null);
    setIsMoving(true);

    try {
      let targetVocabTypeId = selectedVocabTypeId;

      if (mode === 'new') {
        if (!newVocabTypeName.trim()) {
          setError('Please enter a name for the new vocab type');
          setIsMoving(false);
          return;
        }

        let categoryId = newVocabTypeCategory;

        // Create new category if needed
        if (showNewCategoryInput && newCategoryName.trim()) {
          const newCategory = await createCategory({
            name: newCategoryName.trim(),
            id: newCategoryName.trim().toLowerCase().replace(/\s+/g, '-'),
            order: categories.length,
          });
          categoryId = newCategory.id;
        }

        // Create new vocab type
        const newVocabType = await createVocabType({
          name: newVocabTypeName.trim(),
          id: newVocabTypeId.trim() || newVocabTypeName.trim().toLowerCase().replace(/\s+/g, '-'),
          category: categoryId || 'other',
          properties: [],
        });
        targetVocabTypeId = newVocabType.id;
      }

      if (!targetVocabTypeId) {
        setError('Please select a destination vocab type');
        setIsMoving(false);
        return;
      }

      await moveProperties(sourceVocabTypeId, propertyIds, targetVocabTypeId);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move properties');
      setIsMoving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Move Properties</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Moving {propertyIds.length} propert{propertyIds.length === 1 ? 'y' : 'ies'} from{' '}
              <span className="font-medium">{sourceVocabTypeName}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Mode Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('existing')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border ${
                mode === 'existing'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Existing Vocab Type
            </button>
            <button
              onClick={() => setMode('new')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border ${
                mode === 'new'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Create New Vocab Type
            </button>
          </div>

          {mode === 'existing' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select destination vocab type
              </label>
              <select
                value={selectedVocabTypeId}
                onChange={(e) => setSelectedVocabTypeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a vocab type...</option>
                {availableVocabTypes.map((vt) => (
                  <option key={vt.id} value={vt.id}>
                    {vt.name} ({vt.category || 'Uncategorized'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vocab Type Name *
                </label>
                <input
                  type="text"
                  value={newVocabTypeName}
                  onChange={(e) => {
                    setNewVocabTypeName(e.target.value);
                    // Auto-generate ID from name
                    if (!newVocabTypeId || newVocabTypeId === newVocabTypeName.toLowerCase().replace(/\s+/g, '-').slice(0, -1)) {
                      setNewVocabTypeId(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }
                  }}
                  placeholder="e.g., Property Financial Data"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vocab Type ID
                </label>
                <input
                  type="text"
                  value={newVocabTypeId}
                  onChange={(e) => setNewVocabTypeId(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="e.g., property-financial-data"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Unique identifier (auto-generated from name)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                {!showNewCategoryInput ? (
                  <div className="flex gap-2">
                    <select
                      value={newVocabTypeCategory}
                      onChange={(e) => setNewVocabTypeCategory(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryInput(true)}
                      className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      + New
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="New category name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewCategoryInput(false);
                        setNewCategoryName('');
                      }}
                      className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isMoving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={isMoving || (mode === 'existing' && !selectedVocabTypeId) || (mode === 'new' && !newVocabTypeName.trim())}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isMoving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Moving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Move Properties
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
