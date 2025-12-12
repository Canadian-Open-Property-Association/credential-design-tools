import { useEffect } from 'react';
import { useHarmonizationStore } from '../../store/harmonizationStore';
import HarmonizationToolbar from './components/HarmonizationToolbar';
import EntityList from './components/EntityList';
import FurnisherDetailPanel from './components/FurnisherDetailPanel';
import PropertyPickerModal from './components/PropertyPickerModal';
import AllMappingsView from './components/AllMappingsView';

export default function DataHarmonizationApp() {
  const {
    fetchMappings,
    fetchEntities,
    fetchVocabTypes,
    viewMode,
    setViewMode,
    mappingFieldContext,
    closeMappingModal,
    getSelectedEntity,
    isLoading,
    isEntitiesLoading,
    error,
  } = useHarmonizationStore();

  // Load data on mount
  useEffect(() => {
    fetchMappings();
    fetchEntities();
    fetchVocabTypes();
  }, [fetchMappings, fetchEntities, fetchVocabTypes]);

  const selectedEntity = getSelectedEntity();

  // Show All Mappings view if in that mode
  if (viewMode === 'all-mappings') {
    return (
      <>
        <AllMappingsView onBack={() => setViewMode('furnisher-detail')} />
        {/* Property Picker Modal */}
        {mappingFieldContext && (
          <PropertyPickerModal
            context={mappingFieldContext}
            onClose={closeMappingModal}
          />
        )}
      </>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <HarmonizationToolbar />

      {/* Error display */}
      {error && (
        <div className="mx-4 mt-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Main content - 2 panel layout */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left panel - Data Furnishers */}
        <div className="w-72 flex-shrink-0 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700">Data Furnishers</h2>
            <p className="text-xs text-gray-500 mt-0.5">Select to view fields</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isEntitiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full" />
              </div>
            ) : (
              <EntityList />
            )}
          </div>
        </div>

        {/* Right panel - Furnisher Detail or Empty State */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full" />
            </div>
          ) : selectedEntity ? (
            <div className="flex-1 overflow-y-auto">
              <FurnisherDetailPanel entity={selectedEntity} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-lg font-medium">Select a data furnisher</p>
                <p className="text-sm mt-1">Choose from the list to view and map their fields</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Property Picker Modal */}
      {mappingFieldContext && (
        <PropertyPickerModal
          context={mappingFieldContext}
          onClose={closeMappingModal}
        />
      )}
    </div>
  );
}
