import { useState, useMemo } from 'react';
import type { BadgeDefinition, BadgeCategory } from '../../../types/badge';

interface BadgeListProps {
  badges: BadgeDefinition[];
  selectedBadgeId: string | null;
  onSelectBadge: (id: string | null) => void;
  categories: BadgeCategory[];
}

export default function BadgeList({
  badges,
  selectedBadgeId,
  onSelectBadge,
  categories,
}: BadgeListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Get category label
  const getCategoryLabel = (categoryId: string): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.label || categoryId || 'Uncategorized';
  };

  // Get category color
  const getCategoryColor = (categoryId: string): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.color || '#6B7280';
  };

  // Filter badges by search
  const filteredBadges = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return badges;
    const query = searchQuery.toLowerCase();
    return badges.filter(
      (badge) =>
        badge.name.toLowerCase().includes(query) ||
        badge.description?.toLowerCase().includes(query) ||
        badge.id.toLowerCase().includes(query)
    );
  }, [badges, searchQuery]);

  // Group badges by category
  const groupedBadges = useMemo(() => {
    const groups: Record<string, BadgeDefinition[]> = {};
    const orderedCategoryIds: string[] = [];

    // Initialize groups from categories
    categories.forEach((cat) => {
      groups[cat.id] = [];
      orderedCategoryIds.push(cat.id);
    });

    // Add uncategorized group
    groups[''] = [];

    // Group badges
    filteredBadges.forEach((badge) => {
      const catId = badge.categoryId || '';
      if (!groups[catId]) {
        groups[catId] = [];
        if (!orderedCategoryIds.includes(catId)) {
          orderedCategoryIds.push(catId);
        }
      }
      groups[catId].push(badge);
    });

    // Add uncategorized at the end if it has badges
    if (groups[''].length > 0 && !orderedCategoryIds.includes('')) {
      orderedCategoryIds.push('');
    }

    // Sort badges within each group by name
    Object.keys(groups).forEach((catId) => {
      groups[catId].sort((a, b) => a.name.localeCompare(b.name));
    });

    return { groups, orderedCategoryIds };
  }, [filteredBadges, categories]);

  // Toggle category collapse
  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700';
      case 'draft':
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with search */}
      <div className="px-3 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">
            {filteredBadges.length} {filteredBadges.length === 1 ? 'badge' : 'badges'}
            {searchQuery && badges.length !== filteredBadges.length && (
              <span className="text-gray-400"> of {badges.length}</span>
            )}
          </span>
        </div>
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
            placeholder="Search badges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Empty state */}
      {filteredBadges.length === 0 ? (
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
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            <p className="text-sm font-medium">No badges found</p>
            {searchQuery && <p className="text-xs mt-1">Try a different search term</p>}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Badge list grouped by category */}
          {groupedBadges.orderedCategoryIds.map((categoryId) => {
            const badgesInCategory = groupedBadges.groups[categoryId];
            if (badgesInCategory.length === 0) return null;

            const isCollapsed = collapsedCategories.has(categoryId);
            const categoryLabel = getCategoryLabel(categoryId);
            const categoryColor = getCategoryColor(categoryId);

            return (
              <div key={categoryId || 'uncategorized'}>
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(categoryId)}
                  className="w-full flex items-center gap-2 px-3 py-2 border-y border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  {/* Collapse/expand chevron */}
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
                  {/* Category color dot */}
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: categoryColor }}
                  />
                  <span className="text-xs font-medium uppercase tracking-wide flex-1 text-left text-gray-600">
                    {categoryLabel}
                  </span>
                  {/* Count badge */}
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-200 text-gray-700">
                    {badgesInCategory.length}
                  </span>
                </button>

                {/* Category content */}
                {!isCollapsed && (
                  <div>
                    {badgesInCategory.map((badge) => {
                      const isSelected = selectedBadgeId === badge.id;

                      return (
                        <div
                          key={badge.id}
                          onClick={() => onSelectBadge(isSelected ? null : badge.id)}
                          className={`group p-3 cursor-pointer transition-colors border-l-4 ${
                            isSelected
                              ? 'bg-amber-50 border-l-amber-500'
                              : 'hover:bg-gray-50 border-l-transparent'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Badge icon */}
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${categoryColor}20` }}
                            >
                              <svg
                                className="w-4 h-4"
                                style={{ color: categoryColor }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                                />
                              </svg>
                            </div>

                            {/* Badge info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 text-sm truncate">
                                  {badge.name}
                                </span>
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(
                                    badge.status
                                  )}`}
                                >
                                  {badge.status}
                                </span>
                              </div>
                              {badge.description && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                  {badge.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-400">
                                  {badge.eligibilityRules.length}{' '}
                                  {badge.eligibilityRules.length === 1 ? 'rule' : 'rules'}
                                </span>
                                {badge.evidenceConfig.length > 0 && (
                                  <>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-xs text-gray-400">
                                      {badge.evidenceConfig.length} evidence
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
