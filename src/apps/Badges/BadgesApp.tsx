import { useEffect, useState } from 'react';
import { useBadgeStore } from '../../store/badgeStore';
import { useBadgesSettingsStore } from '../../store/badgesSettingsStore';
import BadgeList from './components/BadgeList';
import BadgeForm from './components/BadgeForm';
import BadgeSettings from './components/BadgeSettings';

export default function BadgesApp() {
  const {
    fetchBadges,
    badges,
    selectedBadgeId,
    selectBadge,
    currentBadge,
    newBadge,
    isDirty,
    isLoading,
    error,
  } = useBadgeStore();

  const { fetchSettings, settings } = useBadgesSettingsStore();

  const [showSettings, setShowSettings] = useState(false);

  // Load data on mount
  useEffect(() => {
    fetchBadges();
    fetchSettings();
  }, [fetchBadges, fetchSettings]);

  const handleAddBadge = () => {
    newBadge();
  };

  const handleSelectBadge = (id: string | null) => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Discard them?')) {
        return;
      }
    }
    selectBadge(id);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="h-14 px-4 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-amber-600"
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
            <h1 className="text-lg font-semibold text-gray-800">Badge Definitions</h1>
          </div>
          <span className="text-sm text-gray-500">
            {badges.length} {badges.length === 1 ? 'badge' : 'badges'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Badge Settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </button>
          <button
            onClick={handleAddBadge}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Badge
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Badge List */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
          {isLoading && badges.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Loading badges...</div>
          ) : (
            <BadgeList
              badges={badges}
              selectedBadgeId={selectedBadgeId}
              onSelectBadge={handleSelectBadge}
              categories={settings?.categories || []}
            />
          )}
        </div>

        {/* Right panel - Badge Editor */}
        <div className="flex-1 overflow-auto">
          {currentBadge ? (
            <BadgeForm />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
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
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                <p className="text-lg font-medium">Select or create a badge</p>
                <p className="text-sm mt-1">
                  Choose from the list or click "New Badge" to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && <BadgeSettings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
