import { useEffect, useState } from 'react';
import { useDictionaryStore } from '../../store/dictionaryStore';
import VocabTypeList from './components/VocabTypeList';
import VocabTypeDetail from './components/VocabTypeDetail';
import VocabTypeForm from './components/VocabTypeForm';
import DictionaryToolbar from './components/DictionaryToolbar';

export default function DataDictionaryApp() {
  const {
    fetchVocabTypes,
    fetchCategories,
    selectedVocabType,
    isLoading,
    error,
  } = useDictionaryStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVocabType, setEditingVocabType] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    fetchVocabTypes();
    fetchCategories();
  }, [fetchVocabTypes, fetchCategories]);

  const handleAddVocabType = () => {
    setEditingVocabType(null);
    setShowAddForm(true);
  };

  const handleEditVocabType = () => {
    if (selectedVocabType) {
      setEditingVocabType(selectedVocabType.id);
      setShowAddForm(true);
    }
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingVocabType(null);
  };

  const handleExport = async () => {
    try {
      const data = await useDictionaryStore.getState().exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-dictionary-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <DictionaryToolbar
        onAddVocabType={handleAddVocabType}
        onExport={handleExport}
      />

      {/* Error display */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Main content - 2 panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Vocab Type List */}
        <div className="w-80 border-r border-gray-200 bg-white overflow-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : (
            <VocabTypeList />
          )}
        </div>

        {/* Right panel - Detail View */}
        <div className="flex-1 overflow-auto">
          {selectedVocabType ? (
            <VocabTypeDetail onEdit={handleEditVocabType} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="text-lg font-medium">Select a vocabulary type</p>
                <p className="text-sm mt-1">Choose from the list or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <VocabTypeForm
          vocabTypeId={editingVocabType}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
