/**
 * Proof Template Builder App
 *
 * Single-page layout for creating and managing proof templates.
 * - Collapsible sidebar with template list on left
 * - Two-pane config view when a template is selected
 * - Toggleable JSON preview panel at bottom
 */

import { useState } from 'react';
import { useAppTracking } from '../../hooks/useAppTracking';
import { useProofTemplateStore } from '../../store/proofTemplateStore';
import { PROOF_TEMPLATE_CATEGORIES } from '../../types/proofTemplate';
import TemplateSidebar from './components/TemplateSidebar';
import TemplateConfigPanel from './components/TemplateConfigPanel';
import JsonPreviewPanel from './components/JsonPreviewPanel';

export default function ProofTemplatesApp() {
  useAppTracking('proofs-template-builder', 'Proof Template Builder');

  const {
    showSidebar,
    showJsonPreview,
    selectedTemplateId,
    toggleSidebar,
    toggleJsonPreview,
    createTemplate,
    setSelectedTemplateId,
  } = useProofTemplateStore();

  // Create template modal state
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [isCreating, setIsCreating] = useState(false);

  // Handle create template
  const handleCreate = async () => {
    if (!newName.trim()) return;

    setIsCreating(true);
    try {
      const template = await createTemplate(newName.trim(), newDescription.trim(), newCategory);
      setShowNewModal(false);
      setNewName('');
      setNewDescription('');
      setNewCategory('general');
      setSelectedTemplateId(template.id);
    } catch (err) {
      // Error handled in store
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header with toggles */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle */}
            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-lg transition-colors ${
                showSidebar
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              title={showSidebar ? 'Hide template list' : 'Show template list'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
            </button>

            <div className="h-6 w-px bg-gray-200" />

            <h1 className="text-lg font-semibold text-gray-900">Proof Template Builder</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* JSON Preview toggle */}
            <button
              onClick={toggleJsonPreview}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                showJsonPreview
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={showJsonPreview ? 'Hide JSON preview' : 'Show JSON preview'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              {showJsonPreview ? 'Hide JSON' : 'Show JSON'}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-72 flex-shrink-0 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
            <TemplateSidebar onCreateTemplate={() => setShowNewModal(true)} />
          </div>
        )}

        {/* Main panel */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          {selectedTemplateId ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <TemplateConfigPanel />
              {showJsonPreview && <JsonPreviewPanel />}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <p className="text-lg font-medium text-gray-700">Select a Template</p>
                <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                  Choose a template from the sidebar to configure its verification rules
                </p>
                {!showSidebar && (
                  <button
                    onClick={toggleSidebar}
                    className="mt-4 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Show template list
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Template Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Create New Proof Template</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Age Verification, Income Proof"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {PROOF_TEMPLATE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description of what this template verifies..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewModal(false);
                  setNewName('');
                  setNewDescription('');
                  setNewCategory('general');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || isCreating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreating && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                )}
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
