import { useState } from 'react';
import { useBadgeStore } from '../../../store/badgeStore';
import { useBadgesSettingsStore } from '../../../store/badgesSettingsStore';
import { generateBadgeId } from '../../../types/badge';
import RuleBuilder from './RuleBuilder';
import EvidenceBuilder from './EvidenceBuilder';
import BadgePreview from './BadgePreview';
import PublishBadgeModal from './PublishBadgeModal';

type Tab = 'basic' | 'rules' | 'evidence' | 'visual';

export default function BadgeForm() {
  const {
    currentBadge,
    updateCurrentBadge,
    saveCurrentBadge,
    discardChanges,
    isDirty,
    deleteBadge,
  } = useBadgeStore();

  const { settings } = useBadgesSettingsStore();

  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  if (!currentBadge) return null;

  const categories = settings?.categories || [];
  const proofMethods = settings?.proofMethods || [];

  const handleSave = async () => {
    if (!currentBadge.id || !currentBadge.name) {
      alert('Badge ID and name are required');
      return;
    }

    setIsSaving(true);
    try {
      await saveCurrentBadge();
    } catch (error) {
      console.error('Failed to save badge:', error);
      alert('Failed to save badge. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentBadge.id) return;

    if (!confirm(`Are you sure you want to delete "${currentBadge.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteBadge(currentBadge.id);
    } catch (error) {
      console.error('Failed to delete badge:', error);
      alert('Failed to delete badge. Please try again.');
    }
  };

  const handleNameChange = (name: string) => {
    updateCurrentBadge('name', name);
    // Auto-generate ID from name if ID is empty or was auto-generated
    if (!currentBadge.id || currentBadge.id.startsWith('badge-')) {
      updateCurrentBadge('id', generateBadgeId(name));
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'basic',
      label: 'Basic Info',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: 'rules',
      label: 'Eligibility Rules',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: 'evidence',
      label: 'Evidence',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      id: 'visual',
      label: 'Visual',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentBadge.name || 'New Badge'}
            </h2>
            {isDirty && (
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                Unsaved changes
              </span>
            )}
            {currentBadge.status === 'published' && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                Published
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentBadge.id && currentBadge.status !== 'published' && (
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                Delete
              </button>
            )}
            {isDirty && (
              <button
                onClick={discardChanges}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Discard
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="px-4 py-1.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>
            {currentBadge.id && currentBadge.status === 'draft' && (
              <button
                onClick={() => setShowPublishModal(true)}
                className="px-4 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Publish to VDR
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 -mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-50 text-amber-600 border-b-2 border-amber-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto bg-gray-50 p-6">
        {activeTab === 'basic' && (
          <div className="max-w-2xl space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Badge Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={currentBadge.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Equity > $1M"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Badge ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={currentBadge.id}
                onChange={(e) => updateCurrentBadge('id', e.target.value)}
                placeholder="e.g., equity-1m"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Unique identifier used in URLs and exports
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={currentBadge.description}
                onChange={(e) => updateCurrentBadge('description', e.target.value)}
                placeholder="Describe what this badge represents..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={currentBadge.categoryId}
                onChange={(e) => updateCurrentBadge('categoryId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Schema ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schema ID
              </label>
              <input
                type="text"
                value={currentBadge.schemaId}
                onChange={(e) => updateCurrentBadge('schemaId', e.target.value)}
                placeholder="e.g., equity-threshold"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Groups related badges together (e.g., all equity threshold badges)
              </p>
            </div>

            {/* Proof Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proof Method
              </label>
              <select
                value={currentBadge.proofMethod}
                onChange={(e) =>
                  updateCurrentBadge('proofMethod', e.target.value as typeof currentBadge.proofMethod)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {proofMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {proofMethods.find((m) => m.id === currentBadge.proofMethod)?.description}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'rules' && <RuleBuilder />}

        {activeTab === 'evidence' && <EvidenceBuilder />}

        {activeTab === 'visual' && <BadgePreview />}
      </div>

      {/* Publish Modal */}
      {showPublishModal && currentBadge.id && (
        <PublishBadgeModal
          badgeId={currentBadge.id}
          onClose={() => setShowPublishModal(false)}
        />
      )}
    </div>
  );
}
