import { useState } from 'react';
import type { FurnisherDataSource, FurnisherField } from '../../../types/entity';
import { useHarmonizationStore } from '../../../store/harmonizationStore';
import FurnisherFieldForm from './FurnisherFieldForm';

interface DataSourceCardProps {
  entityId: string;
  source: FurnisherDataSource;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateSource: (source: FurnisherDataSource) => void;
}

const DATA_TYPE_LABELS: Record<string, string> = {
  string: 'String',
  number: 'Number',
  integer: 'Integer',
  boolean: 'Boolean',
  date: 'Date',
  datetime: 'DateTime',
  array: 'Array',
  object: 'Object',
};

export default function DataSourceCard({ entityId, source, onEdit, onDelete, onUpdateSource }: DataSourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [editingField, setEditingField] = useState<FurnisherField | null>(null);

  const { isFieldFavourite, toggleFieldFavourite } = useHarmonizationStore();

  const fields = source.fields || [];

  const handleAddField = () => {
    setEditingField(null);
    setShowFieldForm(true);
  };

  const handleEditField = (field: FurnisherField) => {
    setEditingField(field);
    setShowFieldForm(true);
  };

  const handleDeleteField = (fieldId: string) => {
    if (!confirm('Are you sure you want to delete this field?')) return;
    const updatedFields = fields.filter(f => f.id !== fieldId);
    onUpdateSource({ ...source, fields: updatedFields });
  };

  const handleSaveField = (field: FurnisherField) => {
    let updatedFields: FurnisherField[];

    if (editingField) {
      updatedFields = fields.map(f => f.id === editingField.id ? field : f);
    } else {
      updatedFields = [...fields, { ...field, id: `field-${Date.now()}` }];
    }

    onUpdateSource({ ...source, fields: updatedFields });
    setShowFieldForm(false);
    setEditingField(null);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer bg-purple-50 border-l-4 border-purple-500"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🎫</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{source.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                Credential
              </span>
            </div>
            {source.description && (
              <p className="text-xs text-gray-500 mt-0.5">{source.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded">
            {fields.length} {fields.length === 1 ? 'claim' : 'claims'}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit source"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete source"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Credential Configuration Summary */}
          {source.credentialConfig && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <span className="text-xs text-gray-500">Credential Name:</span>
                  <p className="text-gray-700 text-xs">{source.credentialConfig.credentialName}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Issuer DID:</span>
                  <p className="text-gray-700 font-mono text-xs truncate">{source.credentialConfig.issuerDid}</p>
                </div>
                {source.credentialConfig.trustFramework && (
                  <div>
                    <span className="text-xs text-gray-500">Trust Framework:</span>
                    <p className="text-gray-700 text-xs">{source.credentialConfig.trustFramework}</p>
                  </div>
                )}
                {source.credentialConfig.schemaUrl && (
                  <div>
                    <span className="text-xs text-gray-500">Schema:</span>
                    <p>
                      <a
                        href={source.credentialConfig.schemaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Schema ↗
                      </a>
                    </p>
                  </div>
                )}
                {source.credentialConfig.vctUrl && (
                  <div>
                    <span className="text-xs text-gray-500">VCT:</span>
                    <p>
                      <a
                        href={source.credentialConfig.vctUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View VCT ↗
                      </a>
                    </p>
                  </div>
                )}
                {source.credentialConfig.brandingUrl && (
                  <div>
                    <span className="text-xs text-gray-500">Branding:</span>
                    <p>
                      <a
                        href={source.credentialConfig.brandingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Branding ↗
                      </a>
                    </p>
                  </div>
                )}
                {source.credentialConfig.governanceDocUrl && (
                  <div>
                    <span className="text-xs text-gray-500">Governance:</span>
                    <p>
                      <a
                        href={source.credentialConfig.governanceDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Governance ↗
                      </a>
                    </p>
                  </div>
                )}
                {source.credentialConfig.supportedWallets && source.credentialConfig.supportedWallets.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500">Supported Wallets:</span>
                    <div className="flex gap-1 mt-0.5">
                      {source.credentialConfig.supportedWallets.map((wallet) => (
                        <span key={wallet} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                          {wallet}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Claims Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-gray-500 uppercase">Claims</h4>
              <button
                onClick={handleAddField}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Claim
              </button>
            </div>

            {fields.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-sm text-gray-500">No claims defined yet</p>
                <button
                  onClick={handleAddField}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  Add your first claim
                </button>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-2 py-2 text-center font-medium w-8"></th>
                      <th className="px-3 py-2 text-left font-medium">Claim Name</th>
                      <th className="px-3 py-2 text-left font-medium">Display Name</th>
                      <th className="px-3 py-2 text-left font-medium">Type</th>
                      <th className="px-3 py-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fields.map((field) => {
                      const isFavourite = isFieldFavourite(entityId, source.id, field.id);
                      return (
                      <tr key={field.id} className="hover:bg-gray-50">
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => toggleFieldFavourite(entityId, source.id, field.id)}
                            className={`p-0.5 transition-colors ${isFavourite ? 'text-amber-400 hover:text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
                            title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                          >
                            <svg className="w-4 h-4" fill={isFavourite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{field.name}</code>
                          {field.required && (
                            <span className="ml-1 text-xs text-red-500">*</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-700 text-xs">{field.displayName || '-'}</td>
                        <td className="px-3 py-2">
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {DATA_TYPE_LABELS[field.dataType || 'string'] || field.dataType}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => handleEditField(field)}
                            className="text-gray-400 hover:text-blue-600 p-1"
                            title="Edit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteField(field.id)}
                            className="text-gray-400 hover:text-red-600 p-1"
                            title="Delete"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Notes */}
          {source.notes && (
            <div className="text-xs text-gray-500 italic">
              Note: {source.notes}
            </div>
          )}
        </div>
      )}

      {/* Field Form Modal */}
      {showFieldForm && (
        <FurnisherFieldForm
          field={editingField}
          onSave={handleSaveField}
          onClose={() => {
            setShowFieldForm(false);
            setEditingField(null);
          }}
        />
      )}
    </div>
  );
}
