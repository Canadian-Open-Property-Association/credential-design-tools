import { useState, useRef, useEffect } from 'react';
import type { Entity, FurnisherDataSchema, FurnisherDataSource } from '../../../types/entity';
import { migrateDataSchema } from '../../../types/entity';
import DataSourceCard from './DataSourceCard';
import DataSourceForm from './DataSourceForm';
import SwaggerImportWizard from './SwaggerImportWizard';

interface DataSourcesSectionProps {
  entity: Entity;
  onUpdateSchema: (schema: FurnisherDataSchema) => void;
}

export default function DataSourcesSection({ entity, onUpdateSchema }: DataSourcesSectionProps) {
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [editingSource, setEditingSource] = useState<FurnisherDataSource | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSwaggerWizard, setShowSwaggerWizard] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
    };

    if (showAddMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAddMenu]);

  // Migrate legacy schema if needed (converts old fields to a sources array)
  const schema = migrateDataSchema(entity.dataSchema);
  const sources = schema.sources || [];

  const handleAddSourceManual = () => {
    setShowAddMenu(false);
    setEditingSource(null);
    setShowSourceForm(true);
  };

  const handleAddSourceSwagger = () => {
    setShowAddMenu(false);
    setShowSwaggerWizard(true);
  };

  const handleSwaggerImport = (source: FurnisherDataSource) => {
    // Add the imported source with a new ID and timestamp
    const newSource = { ...source, id: `source-${Date.now()}`, createdAt: new Date().toISOString() };
    const updatedSources = [...sources, newSource];
    onUpdateSchema({ ...schema, sources: updatedSources });
  };

  const handleEditSource = (source: FurnisherDataSource) => {
    setEditingSource(source);
    setShowSourceForm(true);
  };

  const handleDeleteSource = (sourceId: string) => {
    if (!confirm('Are you sure you want to delete this credential source? All fields within it will also be deleted.')) return;

    const updatedSources = sources.filter(s => s.id !== sourceId);
    onUpdateSchema({ ...schema, sources: updatedSources });
  };

  const handleSaveSource = (source: FurnisherDataSource) => {
    let updatedSources: FurnisherDataSource[];

    if (editingSource) {
      // Update existing source
      updatedSources = sources.map(s => s.id === editingSource.id ? source : s);
    } else {
      // Add new source
      updatedSources = [...sources, { ...source, id: `source-${Date.now()}`, createdAt: new Date().toISOString() }];
    }

    onUpdateSchema({ ...schema, sources: updatedSources });
    setShowSourceForm(false);
    setEditingSource(null);
  };

  const handleUpdateSource = (updatedSource: FurnisherDataSource) => {
    const updatedSources = sources.map(s => s.id === updatedSource.id ? { ...updatedSource, updatedAt: new Date().toISOString() } : s);
    onUpdateSchema({ ...schema, sources: updatedSources });
  };

  // Calculate totals
  const totalFields = sources.reduce((acc, source) => acc + (source.fields?.length || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-700">Credential Sources</h3>
          <div className="flex items-center gap-2">
            {sources.length > 0 && (
              <>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {sources.length} {sources.length === 1 ? 'source' : 'sources'}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {totalFields} {totalFields === 1 ? 'field' : 'fields'}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="relative" ref={addMenuRef}>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Data Source
            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showAddMenu && (
            <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={handleAddSourceSwagger}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
              >
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <div>
                  <div className="font-medium">From Swagger/OpenAPI</div>
                  <div className="text-xs text-gray-500">Import from API specification</div>
                </div>
              </button>
              <button
                onClick={handleAddSourceManual}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
              >
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <div>
                  <div className="font-medium">Verifiable Credential</div>
                  <div className="text-xs text-gray-500">Define credential claims manually</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {sources.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 px-6 py-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎫</span>
          </div>
          <p className="text-sm text-gray-600 mb-2">No data sources defined yet</p>
          <p className="text-xs text-gray-400 mb-4 max-w-sm mx-auto">
            Add data sources to describe the verifiable credentials this furnisher issues to holder wallets
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleAddSourceSwagger}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              From Swagger
            </button>
            <span className="text-gray-400">or</span>
            <button
              onClick={handleAddSourceManual}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Verifiable Credential
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((source) => (
            <DataSourceCard
              key={source.id}
              entityId={entity.id}
              source={source}
              onEdit={() => handleEditSource(source)}
              onDelete={() => handleDeleteSource(source.id)}
              onUpdateSource={handleUpdateSource}
            />
          ))}
        </div>
      )}

      {/* Entity-level notes */}
      {sources.length > 0 && (
        <div className="pt-2">
          <label className="block text-xs text-gray-500 mb-1">General Notes</label>
          <textarea
            value={schema.notes || ''}
            onChange={(e) => onUpdateSchema({ ...schema, notes: e.target.value || undefined })}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            rows={2}
            placeholder="General notes about this furnisher's data integration..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white resize-none"
          />
        </div>
      )}

      {/* Add/Edit Source Modal */}
      {showSourceForm && (
        <DataSourceForm
          source={editingSource}
          onSave={handleSaveSource}
          onClose={() => {
            setShowSourceForm(false);
            setEditingSource(null);
          }}
        />
      )}

      {/* Swagger Import Wizard */}
      {showSwaggerWizard && (
        <SwaggerImportWizard
          onImport={handleSwaggerImport}
          onClose={() => setShowSwaggerWizard(false)}
        />
      )}
    </div>
  );
}
