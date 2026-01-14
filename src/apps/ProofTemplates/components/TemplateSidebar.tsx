/**
 * Template Sidebar Component
 *
 * Left sidebar showing a searchable list of proof templates.
 * Similar pattern to CredentialList in Credential Catalogue.
 */

import { useEffect, useState, useMemo } from 'react';
import { useProofTemplateStore } from '../../../store/proofTemplateStore';
import { PROOF_TEMPLATE_CATEGORIES, ProofTemplateListItem } from '../../../types/proofTemplate';

interface TemplateSidebarProps {
  onCreateTemplate: () => void;
}

export default function TemplateSidebar({ onCreateTemplate }: TemplateSidebarProps) {
  const {
    templates,
    selectedTemplateId,
    setSelectedTemplateId,
    searchQuery,
    setSearchQuery,
    fetchTemplates,
    deleteTemplate,
    cloneTemplate,
    isLoading,
    error,
    databaseAvailable,
  } = useProofTemplateStore();

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Toggle section collapse
  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // Get category label
  const getCategoryLabel = (value: string): string => {
    const category = PROOF_TEMPLATE_CATEGORIES.find((c) => c.value === value);
    return category?.label || value;
  };

  // Filter templates by search query
  const filteredTemplates = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return templates;
    const query = searchQuery.toLowerCase();
    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        getCategoryLabel(template.category).toLowerCase().includes(query)
    );
  }, [templates, searchQuery]);

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, ProofTemplateListItem[]> = {};
    const orderedCategories: string[] = [];

    // Collect categories
    filteredTemplates.forEach((template) => {
      const category = template.category || 'general';
      if (!orderedCategories.includes(category)) {
        orderedCategories.push(category);
      }
    });

    // Sort by category label
    orderedCategories.sort((a, b) => getCategoryLabel(a).localeCompare(getCategoryLabel(b)));

    // Group templates
    orderedCategories.forEach((category) => {
      groups[category] = filteredTemplates
        .filter((t) => (t.category || 'general') === category)
        .sort((a, b) => a.name.localeCompare(b.name));
    });

    return { groups, orderedCategories };
  }, [filteredTemplates]);

  // Handle delete
  const handleDelete = async (templateId: string) => {
    try {
      await deleteTemplate(templateId);
      setConfirmDelete(null);
      if (selectedTemplateId === templateId) {
        setSelectedTemplateId(null);
      }
    } catch (err) {
      // Error handled in store
    }
  };

  // Handle clone
  const handleClone = async (templateId: string) => {
    try {
      const cloned = await cloneTemplate(templateId);
      setSelectedTemplateId(cloned.id);
    } catch (err) {
      // Error handled in store
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (!databaseAvailable) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Proof Templates</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-sm font-medium text-gray-700">Database Unavailable</p>
            <p className="text-xs text-gray-500 mt-1">PostgreSQL required</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">
            {filteredTemplates.length}{' '}
            {filteredTemplates.length === 1 ? 'template' : 'templates'}
            {searchQuery && templates.length !== filteredTemplates.length && (
              <span className="text-gray-400"> of {templates.length}</span>
            )}
          </span>
          <button
            onClick={onCreateTemplate}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
            title="Create new template"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-sm">Loading templates...</p>
          </div>
        </div>
      ) : error ? (
        /* Error state */
        <div className="flex-1 flex items-center justify-center text-gray-400 p-4">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-red-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-sm font-medium text-red-600">Error loading templates</p>
            <p className="text-xs mt-1 text-gray-500">{error}</p>
            <button
              onClick={() => fetchTemplates()}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        /* Empty state */
        <div className="flex-1 flex items-center justify-center text-gray-400 p-4">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-300"
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
            <p className="text-sm font-medium">No templates found</p>
            {searchQuery ? (
              <p className="text-xs mt-1">Try a different search term</p>
            ) : (
              <button
                onClick={onCreateTemplate}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700"
              >
                Create your first template
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Template list grouped by category */}
          <div>
            {groupedTemplates.orderedCategories.map((category) => {
              const templatesInGroup = groupedTemplates.groups[category];
              const isCollapsed = collapsedSections.has(category);
              const sectionLabel = getCategoryLabel(category);

              return (
                <div key={category}>
                  {/* Section header */}
                  <button
                    onClick={() => toggleSection(category)}
                    className="w-full flex items-center gap-2 px-3 py-2 border-y border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${
                        isCollapsed ? '' : 'rotate-90'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span className="text-xs font-medium uppercase tracking-wide flex-1 text-left text-gray-600">
                      {sectionLabel}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-200 text-gray-700">
                      {templatesInGroup.length}
                    </span>
                  </button>

                  {/* Section content */}
                  {!isCollapsed && (
                    <div>
                      {templatesInGroup.map((template) => {
                        const isSelected = selectedTemplateId === template.id;
                        const isDeleting = confirmDelete === template.id;

                        return (
                          <div
                            key={template.id}
                            onClick={() => setSelectedTemplateId(template.id)}
                            className={`group p-3 cursor-pointer transition-colors border-l-4 ${
                              isSelected
                                ? 'bg-blue-50 border-l-blue-500'
                                : 'hover:bg-gray-50 border-l-transparent'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Template icon */}
                              <div
                                className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                                  isSelected
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
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
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                  />
                                </svg>
                              </div>

                              {/* Template info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 text-sm truncate">
                                    {template.name}
                                  </span>
                                  {template.status === 'published' && (
                                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500" title="Published" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                  <span>
                                    {template.claimCount} claim{template.claimCount !== 1 ? 's' : ''}
                                  </span>
                                  <span>&middot;</span>
                                  <span>{formatDate(template.updatedAt)}</span>
                                </div>
                              </div>

                              {/* Action buttons (show on hover) */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClone(template.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                                  title="Clone"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDelete(template.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                                  title="Delete"
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
                              </div>
                            </div>

                            {/* Delete confirmation */}
                            {isDeleting && (
                              <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                                <p className="text-xs text-red-700 mb-2">Delete this template?</p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(template.id);
                                    }}
                                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDelete(null);
                                    }}
                                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
