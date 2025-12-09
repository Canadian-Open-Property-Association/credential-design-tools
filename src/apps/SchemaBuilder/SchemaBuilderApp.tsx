import { useEffect, useState } from 'react';
import { useSchemaStore } from '../../store/schemaStore';
import { useAppTracking } from '../../hooks/useAppTracking';
import SchemaToolbar from './components/SchemaToolbar';
import SchemaInfoTab from './components/SchemaInfoTab';
import PropertiesTab from './components/PropertiesTab';
import SchemaJsonPreview from './components/SchemaJsonPreview';

type SchemaTab = 'info' | 'properties';

export default function SchemaBuilderApp() {
  // Track app access
  useAppTracking('schema-builder', 'Schema Builder');

  const [activeTab, setActiveTab] = useState<SchemaTab>('info');

  const fetchGovernanceDocs = useSchemaStore((state) => state.fetchGovernanceDocs);
  const mode = useSchemaStore((state) => state.metadata.mode);

  // Fetch governance docs on mount
  useEffect(() => {
    fetchGovernanceDocs();
  }, [fetchGovernanceDocs]);

  const isJsonLdMode = mode === 'jsonld-context'; // mode defaults to 'json-schema'

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Toolbar */}
      <SchemaToolbar />

      {/* Main Content - Two Panel Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Tabbed Config */}
        <div className="w-1/2 border-r border-gray-300 bg-white flex flex-col overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 bg-white shrink-0">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'info'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Schema Info
              </span>
            </button>
            <button
              onClick={() => setActiveTab('properties')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'properties'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Credential Properties
              </span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'info' && <SchemaInfoTab />}
            {activeTab === 'properties' && <PropertiesTab />}
          </div>
        </div>

        {/* Right Panel - JSON Preview */}
        <div className="w-1/2 bg-gray-900 flex flex-col overflow-hidden">
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
            <h2 className="text-white font-medium text-sm">
              {isJsonLdMode ? 'JSON-LD Context' : 'JSON Schema'}
            </h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <SchemaJsonPreview />
          </div>
        </div>
      </main>
    </div>
  );
}
