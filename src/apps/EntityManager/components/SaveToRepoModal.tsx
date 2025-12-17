import { useState, useEffect } from 'react';
import { useEntityStore } from '../../../store/entityStore';
import { useFurnisherSettingsStore } from '../../../store/furnisherSettingsStore';

interface SaveToRepoModalProps {
  selectedEntityId?: string;
  onClose: () => void;
}

interface EntityDiff {
  added: Array<{ id: string; name: string; types: string[] }>;
  modified: Array<{ id: string; name: string; types: string[]; changes: string[] }>;
  unchanged: Array<{ id: string; name: string; types: string[] }>;
  deleted: Array<{ id: string; name: string; types: string[] }>;
  summary: {
    addedCount: number;
    modifiedCount: number;
    unchangedCount: number;
    deletedCount: number;
    totalLocal: number;
    totalRemote: number;
  };
}

interface EntityStatementStatus {
  exists: boolean;
  sha?: string;
  uri?: string;
}

type ModalStep = 'choose' | 'diff' | 'form' | 'success' | 'entity-preview';
type SaveMode = 'current' | 'all';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5174';

export default function SaveToRepoModal({ selectedEntityId, onClose }: SaveToRepoModalProps) {
  const { entities, saveToGitHub } = useEntityStore();
  const { getEntityTypeLabel, getDataProviderTypeLabel } = useFurnisherSettingsStore();
  const [step, setStep] = useState<ModalStep>(selectedEntityId ? 'choose' : 'diff');
  const [saveMode, setSaveMode] = useState<SaveMode>('all');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [isCheckingStatement, setIsCheckingStatement] = useState(false);
  const [diff, setDiff] = useState<EntityDiff | null>(null);
  const [diffError, setDiffError] = useState<string | null>(null);
  const [entityStatementStatus, setEntityStatementStatus] = useState<EntityStatementStatus | null>(null);
  const [result, setResult] = useState<{ success: boolean; prUrl?: string; error?: string; isUpdate?: boolean } | null>(null);

  const selectedEntity = entities.find(e => e.id === selectedEntityId);

  // Fetch diff when entering diff step
  useEffect(() => {
    if (step === 'diff') {
      fetchDiff();
    }
  }, [step]);

  // Check entity statement status when entering entity-preview step
  useEffect(() => {
    if (step === 'entity-preview' && selectedEntityId) {
      checkEntityStatementStatus();
    }
  }, [step, selectedEntityId]);

  const checkEntityStatementStatus = async () => {
    if (!selectedEntityId) return;
    setIsCheckingStatement(true);
    try {
      const res = await fetch(`${API_BASE}/api/github/entity-statement/${selectedEntityId}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to check entity statement status');
      }
      const data = await res.json();
      setEntityStatementStatus(data);
    } catch (err) {
      console.error('Failed to check entity statement:', err);
      setEntityStatementStatus({ exists: false });
    } finally {
      setIsCheckingStatement(false);
    }
  };

  const publishEntityStatement = async () => {
    if (!selectedEntity || !selectedEntityId) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/github/entity-statement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          entityId: selectedEntityId,
          entity: selectedEntity,
          title: title || undefined,
          description: description || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to publish entity statement');
      }

      const data = await res.json();
      setResult({
        success: true,
        prUrl: data.pr.url,
        isUpdate: data.isUpdate,
      });
      setStep('success');
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to publish entity statement',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchDiff = async () => {
    setIsLoadingDiff(true);
    setDiffError(null);
    try {
      const res = await fetch(`${API_BASE}/api/github/entity-diff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ localEntities: entities }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch diff');
      }
      const data = await res.json();
      setDiff(data);
    } catch (err) {
      setDiffError(err instanceof Error ? err.message : 'Failed to fetch diff');
    } finally {
      setIsLoadingDiff(false);
    }
  };

  const handleModeSelect = (mode: SaveMode) => {
    setSaveMode(mode);
    if (mode === 'current') {
      setTitle(`Publish entity: ${selectedEntity?.name || selectedEntityId}`);
      setStep('entity-preview');
    } else {
      setStep('diff');
    }
  };

  const handleContinueFromDiff = () => {
    // Generate title based on diff
    if (diff) {
      const parts = [];
      if (diff.summary.addedCount > 0) parts.push(`add ${diff.summary.addedCount}`);
      if (diff.summary.modifiedCount > 0) parts.push(`update ${diff.summary.modifiedCount}`);
      if (diff.summary.deletedCount > 0) parts.push(`remove ${diff.summary.deletedCount}`);
      setTitle(parts.length > 0 ? `Entity registry: ${parts.join(', ')}` : 'Update entity registry');
    } else {
      setTitle(`Update entity registry - ${new Date().toISOString().split('T')[0]}`);
    }
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      // If saving current entity only, we need to merge with remote entities
      // For now, saveToGitHub saves all local entities
      // TODO: Implement single-entity save if needed
      const response = await saveToGitHub(title, description || undefined);
      setResult({ success: true, prUrl: response.pr.url });
      setStep('success');
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to save to GitHub',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges = diff && (diff.summary.addedCount > 0 || diff.summary.modifiedCount > 0 || diff.summary.deletedCount > 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create Pull Request</h2>
              <p className="text-sm text-gray-500">
                {step === 'choose' && 'Choose what to save'}
                {step === 'diff' && 'Review changes'}
                {step === 'entity-preview' && 'Review entity statement'}
                {step === 'form' && 'Configure PR details'}
                {step === 'success' && 'PR created successfully'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step: Choose */}
          {step === 'choose' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">What would you like to save to the repository?</p>

              {/* Option: Current Entity */}
              {selectedEntity && (
                <button
                  onClick={() => handleModeSelect('current')}
                  className="w-full p-4 border border-gray-200 rounded-lg text-left hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 mt-0.5 border-2 border-gray-300 rounded-full group-hover:border-blue-500 flex items-center justify-center">
                      {saveMode === 'current' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Current Entity Only</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Save only <span className="font-medium">{selectedEntity.name}</span>
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* Option: All Changes */}
              <button
                onClick={() => handleModeSelect('all')}
                className="w-full p-4 border border-gray-200 rounded-lg text-left hover:border-blue-300 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 mt-0.5 border-2 border-gray-300 rounded-full group-hover:border-blue-500 flex items-center justify-center">
                    {saveMode === 'all' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">All Changes</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Review and save all local changes to the repository
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Step: Diff */}
          {step === 'diff' && (
            <div className="space-y-4">
              {isLoadingDiff ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Comparing with repository...</span>
                </div>
              ) : diffError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <p className="font-medium">Failed to fetch changes</p>
                  <p className="text-sm mt-1">{diffError}</p>
                  <button
                    onClick={fetchDiff}
                    className="mt-3 px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded"
                  >
                    Retry
                  </button>
                </div>
              ) : diff ? (
                <>
                  {/* Summary */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    {diff.summary.addedCount > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-sm text-gray-700">{diff.summary.addedCount} added</span>
                      </div>
                    )}
                    {diff.summary.modifiedCount > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                        <span className="text-sm text-gray-700">{diff.summary.modifiedCount} modified</span>
                      </div>
                    )}
                    {diff.summary.deletedCount > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        <span className="text-sm text-gray-700">{diff.summary.deletedCount} deleted</span>
                      </div>
                    )}
                    {diff.summary.unchangedCount > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                        <span className="text-sm text-gray-500">{diff.summary.unchangedCount} unchanged</span>
                      </div>
                    )}
                  </div>

                  {!hasChanges ? (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="font-medium">Everything is up to date</p>
                      <p className="text-sm mt-1">No changes to push to the repository</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Added */}
                      {diff.added.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-green-700 uppercase mb-2">Added ({diff.added.length})</h4>
                          <div className="space-y-1">
                            {diff.added.map(entity => (
                              <div key={entity.id} className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                                <span className="text-green-600">+</span>
                                <span className="font-medium text-gray-900">{entity.name}</span>
                                <span className="text-gray-400 text-xs">({entity.id})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Modified */}
                      {diff.modified.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-yellow-700 uppercase mb-2">Modified ({diff.modified.length})</h4>
                          <div className="space-y-1">
                            {diff.modified.map(entity => (
                              <div key={entity.id} className="p-2 bg-yellow-50 rounded text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-yellow-600">~</span>
                                  <span className="font-medium text-gray-900">{entity.name}</span>
                                  <span className="text-gray-400 text-xs">({entity.id})</span>
                                </div>
                                {entity.changes && entity.changes.length > 0 && (
                                  <p className="text-xs text-gray-500 ml-5 mt-1">
                                    {entity.changes.join(', ')}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Deleted */}
                      {diff.deleted.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-red-700 uppercase mb-2">Deleted ({diff.deleted.length})</h4>
                          <div className="space-y-1">
                            {diff.deleted.map(entity => (
                              <div key={entity.id} className="flex items-center gap-2 p-2 bg-red-50 rounded text-sm">
                                <span className="text-red-600">-</span>
                                <span className="font-medium text-gray-900">{entity.name}</span>
                                <span className="text-gray-400 text-xs">({entity.id})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}

          {/* Step: Entity Preview */}
          {step === 'entity-preview' && selectedEntity && (
            <div className="space-y-4">
              {isCheckingStatement ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Checking publication status...</span>
                </div>
              ) : (
                <>
                  {/* Status banner */}
                  {entityStatementStatus?.exists ? (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm text-yellow-700">
                          This entity already has a published statement. Creating a PR will update it.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-blue-700">
                          This will create a new entity statement file at <code className="text-xs bg-blue-100 px-1 py-0.5 rounded">{selectedEntity.id}.json</code>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Entity preview */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <h4 className="font-medium text-gray-900">Entity Statement Preview</h4>
                    </div>
                    <div className="p-4 space-y-3">
                      {/* Name and ID */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-lg text-gray-900">{selectedEntity.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{selectedEntity.id}</p>
                        </div>
                        {selectedEntity.logoUri && (
                          <img
                            src={selectedEntity.logoUri}
                            alt=""
                            className="w-12 h-12 object-contain rounded bg-gray-50"
                          />
                        )}
                      </div>

                      {/* Description */}
                      {selectedEntity.description && (
                        <p className="text-sm text-gray-600">{selectedEntity.description}</p>
                      )}

                      {/* Entity Types */}
                      {selectedEntity.entityTypes && selectedEntity.entityTypes.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Entity Types</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedEntity.entityTypes.map(typeId => (
                              <span key={typeId} className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                {getEntityTypeLabel(typeId)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Data Provider Types */}
                      {selectedEntity.dataProviderTypes && selectedEntity.dataProviderTypes.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Data Provider Types</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedEntity.dataProviderTypes.map(typeId => (
                              <span key={typeId} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                {getDataProviderTypeLabel(typeId)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Regions */}
                      {selectedEntity.regionsCovered && selectedEntity.regionsCovered.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Regions Covered</p>
                          <p className="text-sm text-gray-700">{selectedEntity.regionsCovered.join(', ')}</p>
                        </div>
                      )}

                      {/* Contact info */}
                      {(selectedEntity.website || selectedEntity.contactEmail) && (
                        <div className="pt-2 border-t border-gray-100">
                          {selectedEntity.website && (
                            <p className="text-xs text-gray-500">
                              <span className="font-medium">Website:</span> {selectedEntity.website}
                            </p>
                          )}
                          {selectedEntity.contactEmail && (
                            <p className="text-xs text-gray-500">
                              <span className="font-medium">Email:</span> {selectedEntity.contactEmail}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PR details inline */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        PR Title (optional)
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder={entityStatementStatus?.exists ? `Update entity: ${selectedEntity.name}` : `Add entity: ${selectedEntity.name}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (optional)
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-sm"
                        placeholder="Additional details about this entity..."
                      />
                    </div>
                  </div>

                  {/* Error display */}
                  {result?.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {result.error}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step: Form */}
          {step === 'form' && (
            <form onSubmit={handleSubmit}>
              {result?.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {result.error}
                </div>
              )}

              {/* PR Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PR Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Update entity registry"
                  required
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  placeholder="Describe the changes being made..."
                />
              </div>

              {/* Summary */}
              {diff && hasChanges && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <p className="font-medium text-gray-700 mb-1">Changes to be saved:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {diff.summary.addedCount > 0 && <li>{diff.summary.addedCount} new entities</li>}
                    {diff.summary.modifiedCount > 0 && <li>{diff.summary.modifiedCount} updated entities</li>}
                    {diff.summary.deletedCount > 0 && <li>{diff.summary.deletedCount} removed entities</li>}
                  </ul>
                </div>
              )}
            </form>
          )}

          {/* Step: Success */}
          {step === 'success' && result?.success && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pull Request Created!</h3>
              <p className="text-sm text-gray-600 mb-4">
                Your changes have been submitted for review.
              </p>
              <a
                href={result.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                </svg>
                View Pull Request
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'success' && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between flex-shrink-0">
            <div>
              {step !== 'choose' && (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 'diff' && selectedEntityId) setStep('choose');
                    else if (step === 'entity-preview') setStep('choose');
                    else if (step === 'form') setStep(saveMode === 'current' ? 'choose' : 'diff');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              {step === 'diff' && hasChanges && (
                <button
                  type="button"
                  onClick={handleContinueFromDiff}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Continue
                </button>
              )}
              {step === 'entity-preview' && !isCheckingStatement && (
                <button
                  type="button"
                  onClick={publishEntityStatement}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating PR...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      {entityStatementStatus?.exists ? 'Update Entity Statement' : 'Publish Entity Statement'}
                    </>
                  )}
                </button>
              )}
              {step === 'form' && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !title.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating PR...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Create Pull Request
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
