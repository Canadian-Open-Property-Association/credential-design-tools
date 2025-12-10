import { useDictionaryStore } from '../../../store/dictionaryStore';
import type { VocabType } from '../../../types/dictionary';

export default function VocabTypeList() {
  const {
    selectedVocabType,
    selectVocabType,
    deleteVocabType,
    searchResults,
    getVocabTypesByCategory,
  } = useDictionaryStore();

  // Use search results if available, otherwise group by category
  const categorizedTypes = searchResults ? null : getVocabTypesByCategory();

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this vocabulary type?')) {
      await deleteVocabType(id);
    }
  };

  const renderVocabTypeItem = (vt: VocabType) => {
    const isSelected = selectedVocabType?.id === vt.id;
    return (
      <div
        key={vt.id}
        onClick={() => selectVocabType(vt.id)}
        className={`group px-4 py-3 cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${
          isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium truncate ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
              {vt.name}
            </h3>
            {vt.description && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{vt.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-400">
                {(vt.properties || []).length} properties
              </span>
            </div>
          </div>
          <button
            onClick={(e) => handleDelete(e, vt.id)}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  // If we have search results, show flat list
  if (searchResults) {
    return (
      <div>
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <span className="text-xs text-gray-500">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
          </span>
        </div>
        {searchResults.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No vocabulary types found
          </div>
        ) : (
          searchResults.map(renderVocabTypeItem)
        )}
      </div>
    );
  }

  // Show categorized list
  if (!categorizedTypes || categorizedTypes.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <p className="text-sm">No vocabulary types yet</p>
        <p className="text-xs mt-1">Click "Add Vocab Type" to create one</p>
      </div>
    );
  }

  return (
    <div>
      {categorizedTypes.map(({ category, vocabTypes: types }) => (
        <div key={category.id}>
          {/* Category header */}
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 sticky top-0">
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              {category.name}
            </span>
            <span className="ml-2 text-xs text-gray-400">
              ({types.length})
            </span>
          </div>
          {/* Vocab types in this category */}
          {types.map(renderVocabTypeItem)}
        </div>
      ))}
    </div>
  );
}
