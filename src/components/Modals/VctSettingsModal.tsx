import { useState, useEffect } from 'react';
import { useZoneTemplateStore } from '../../store/zoneTemplateStore';
import { useAuthStore } from '../../store/authStore';
import ZoneEditor from '../ZoneEditor/ZoneEditor';
import type { ZoneTemplate } from '../../types/vct';

interface VctSettingsModalProps {
  onClose: () => void;
}

type SettingsCategory = 'zone-templates';

const CATEGORIES = [
  {
    id: 'zone-templates' as const,
    label: 'Zone Templates',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
        />
      </svg>
    ),
  },
];

export default function VctSettingsModal({ onClose }: VctSettingsModalProps) {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('zone-templates');
  const [showZoneEditor, setShowZoneEditor] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateFrontOnly, setNewTemplateFrontOnly] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Zone template store
  const templates = useZoneTemplateStore((state) => state.templates);
  const loadTemplates = useZoneTemplateStore((state) => state.loadTemplates);
  const addTemplate = useZoneTemplateStore((state) => state.addTemplate);
  const deleteTemplate = useZoneTemplateStore((state) => state.deleteTemplate);
  const setEditingTemplate = useZoneTemplateStore((state) => state.setEditingTemplate);
  const isLoading = useZoneTemplateStore((state) => state.isLoading);

  // Get current user for author tracking
  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleCreateNew = () => {
    setNewTemplateName('');
    setNewTemplateFrontOnly(false);
    setShowCreateDialog(true);
  };

  const handleConfirmCreate = () => {
    const newTemplate: ZoneTemplate = {
      id: crypto.randomUUID(),
      name: newTemplateName || 'New Template',
      description: '',
      front: { zones: [] },
      back: { zones: [] },
      card_width: 340,
      card_height: 214,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      frontOnly: newTemplateFrontOnly,
      author: currentUser
        ? {
            id: currentUser.id.toString(),
            login: currentUser.login,
            name: currentUser.name || undefined,
          }
        : undefined,
    };
    addTemplate(newTemplate);
    setEditingTemplate(newTemplate);
    setShowCreateDialog(false);
    setShowZoneEditor(true);
  };

  const handleEditTemplate = (template: ZoneTemplate) => {
    setEditingTemplate({ ...template });
    setShowZoneEditor(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    await deleteTemplate(id);
    setDeleteConfirm(null);
  };

  const handleCloseEditor = () => {
    setShowZoneEditor(false);
    setEditingTemplate(null);
  };

  // If editing, show the zone editor
  if (showZoneEditor) {
    return <ZoneEditor onClose={handleCloseEditor} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-[800px] h-[600px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">VCT Builder Settings</h2>
              <p className="text-sm text-gray-500">Configure zone templates and display options</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Content - Split Layout */}
        <div className="flex-1 flex min-h-0">
          {/* Left Sidebar - Categories */}
          <div className="w-56 border-r border-gray-200 bg-gray-50 flex-shrink-0">
            <nav className="p-3 space-y-1">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeCategory === category.id
                      ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  <span className={activeCategory === category.id ? 'text-blue-600' : 'text-gray-400'}>
                    {category.icon}
                  </span>
                  {category.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Zone Templates */}
              {activeCategory === 'zone-templates' && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-medium text-gray-900">Zone Templates</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Manage zone templates that define the layout of credential cards. Each template defines zones for
                        the front and optionally the back of the card.
                      </p>
                    </div>
                    <button
                      onClick={handleCreateNew}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Template
                    </button>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <svg
                        className="w-12 h-12 mx-auto mb-4 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                        />
                      </svg>
                      <p className="mb-2">No zone templates yet</p>
                      <p className="text-sm">Create a template to define credential card layouts.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                        >
                          {/* Template preview thumbnail */}
                          <div className="w-16 h-10 bg-white rounded border border-gray-300 flex-shrink-0 relative overflow-hidden">
                            {/* Mini zone visualization */}
                            {template.front.zones.slice(0, 3).map((zone, i) => (
                              <div
                                key={zone.id}
                                className="absolute bg-blue-200 border border-blue-300"
                                style={{
                                  left: `${zone.position.x}%`,
                                  top: `${zone.position.y}%`,
                                  width: `${zone.position.width}%`,
                                  height: `${zone.position.height}%`,
                                  opacity: 0.6 - i * 0.15,
                                }}
                              />
                            ))}
                          </div>

                          {/* Template info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{template.name}</span>
                              {template.frontOnly && (
                                <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">
                                  Front only
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {template.front.zones.length} front zone{template.front.zones.length !== 1 ? 's' : ''}
                              {!template.frontOnly &&
                                ` • ${template.back.zones.length} back zone${template.back.zones.length !== 1 ? 's' : ''}`}
                            </p>
                            {template.description && (
                              <p className="text-xs text-gray-400 mt-1 truncate">{template.description}</p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditTemplate(template)}
                              className="p-2 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                              title="Edit template"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            {deleteConfirm === template.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteTemplate(template.id)}
                                  className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(template.id)}
                                className="p-2 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                                title="Delete template"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>

      {/* Create Template Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Template</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="My Template"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="frontOnly"
                  checked={newTemplateFrontOnly}
                  onChange={(e) => setNewTemplateFrontOnly(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="frontOnly" className="text-sm text-gray-700">
                  Front only (no back)
                </label>
              </div>
              <p className="text-xs text-gray-500 -mt-2 ml-6">
                When enabled, the card will not be flippable in preview
              </p>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCreate}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
