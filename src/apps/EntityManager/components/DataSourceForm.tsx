import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { FurnisherDataSource, CredentialSourceConfig, FurnisherField } from '../../../types/entity';
import SwaggerImportWizard from './SwaggerImportWizard';

interface DataSourceFormProps {
  source: FurnisherDataSource | null;
  onSave: (source: FurnisherDataSource) => void;
  onClose: () => void;
}

const TRUST_FRAMEWORKS = [
  'BC Digital Trust',
  'Pan-Canadian Trust Framework',
  'DIACC Trust Framework',
  'Other',
];

const WALLET_OPTIONS = [
  'BC Wallet',
  'COPA Wallet',
  'Microsoft Entra Verified ID',
  'Other',
];

export default function DataSourceForm({ source, onSave, onClose }: DataSourceFormProps) {
  const isEditing = !!source;

  // Common fields
  const [name, setName] = useState(source?.name || '');
  const [description, setDescription] = useState(source?.description || '');
  const [notes, setNotes] = useState(source?.notes || '');
  const [fields, setFields] = useState<FurnisherField[]>(source?.fields || []);

  // Credential fields
  const [credentialName, setCredentialName] = useState(source?.credentialConfig?.credentialName || '');
  const [issuerDid, setIssuerDid] = useState(source?.credentialConfig?.issuerDid || '');
  const [schemaUrl, setSchemaUrl] = useState(source?.credentialConfig?.schemaUrl || '');
  const [vctUrl, setVctUrl] = useState(source?.credentialConfig?.vctUrl || '');
  const [brandingUrl, setBrandingUrl] = useState(source?.credentialConfig?.brandingUrl || '');
  const [trustFramework, setTrustFramework] = useState(source?.credentialConfig?.trustFramework || '');
  const [governanceDocUrl, setGovernanceDocUrl] = useState(source?.credentialConfig?.governanceDocUrl || '');
  const [supportedWallets, setSupportedWallets] = useState<string[]>(source?.credentialConfig?.supportedWallets || []);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSwaggerWizard, setShowSwaggerWizard] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Source name is required';
    }

    if (!credentialName.trim()) {
      newErrors.credentialName = 'Credential name is required';
    }
    if (!issuerDid.trim()) {
      newErrors.issuerDid = 'Issuer DID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const credentialConfig: CredentialSourceConfig = {
      credentialName: credentialName.trim(),
      issuerDid: issuerDid.trim(),
      schemaUrl: schemaUrl.trim() || undefined,
      vctUrl: vctUrl.trim() || undefined,
      brandingUrl: brandingUrl.trim() || undefined,
      trustFramework: trustFramework || undefined,
      governanceDocUrl: governanceDocUrl.trim() || undefined,
      supportedWallets: supportedWallets.length > 0 ? supportedWallets : undefined,
    };

    const newSource: FurnisherDataSource = {
      id: source?.id || `source-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      sourceType: 'credential',
      credentialConfig,
      fields,
      notes: notes.trim() || undefined,
    };

    onSave(newSource);
  };

  const toggleWallet = (wallet: string) => {
    setSupportedWallets(prev =>
      prev.includes(wallet)
        ? prev.filter(w => w !== wallet)
        : [...prev, wallet]
    );
  };

  const handleSwaggerImport = (importedSource: FurnisherDataSource) => {
    // Merge imported fields with existing
    setFields(prev => [...prev, ...importedSource.fields]);
    // Auto-fill name if empty
    if (!name && importedSource.name) {
      setName(importedSource.name);
    }
    setShowSwaggerWizard(false);
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <span className="text-lg">🎫</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Edit Credential Source' : 'Add Credential Source'}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Common Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Person Credential"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this credential source..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[80px]"
              />
            </div>
          </div>

          {/* Credential Configuration */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <span className="text-purple-600">🎫</span> Credential Information
            </h4>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Credential Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={credentialName}
                onChange={(e) => setCredentialName(e.target.value)}
                placeholder="e.g., BC Person Credential"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.credentialName ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.credentialName && <p className="mt-1 text-xs text-red-500">{errors.credentialName}</p>}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Issuer DID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={issuerDid}
                onChange={(e) => setIssuerDid(e.target.value)}
                placeholder="e.g., did:web:id.gov.bc.ca"
                className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.issuerDid ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.issuerDid && <p className="mt-1 text-xs text-red-500">{errors.issuerDid}</p>}
            </div>

            <div className="pt-2 border-t border-gray-100">
              <h5 className="text-xs font-medium text-gray-500 mb-3">References (URLs)</h5>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Schema Location</label>
                  <input
                    type="url"
                    value={schemaUrl}
                    onChange={(e) => setSchemaUrl(e.target.value)}
                    placeholder="https://id.gov.bc.ca/schemas/person.json"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">VCT / Credential Type</label>
                  <input
                    type="url"
                    value={vctUrl}
                    onChange={(e) => setVctUrl(e.target.value)}
                    placeholder="https://id.gov.bc.ca/vct/person.json"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Branding File</label>
                  <input
                    type="url"
                    value={brandingUrl}
                    onChange={(e) => setBrandingUrl(e.target.value)}
                    placeholder="https://example.com/credentials/vct/branding.json"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Governance Documentation</label>
                  <input
                    type="url"
                    value={governanceDocUrl}
                    onChange={(e) => setGovernanceDocUrl(e.target.value)}
                    placeholder="https://digital.gov.bc.ca/governance/..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <h5 className="text-xs font-medium text-gray-500 mb-3">Trust Context</h5>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Trust Framework</label>
                  <select
                    value={trustFramework}
                    onChange={(e) => setTrustFramework(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select framework...</option>
                    {TRUST_FRAMEWORKS.map(framework => (
                      <option key={framework} value={framework}>{framework}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-2">Supported Wallets</label>
                  <div className="flex flex-wrap gap-2">
                    {WALLET_OPTIONS.map(wallet => (
                      <button
                        key={wallet}
                        type="button"
                        onClick={() => toggleWallet(wallet)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                          supportedWallets.includes(wallet)
                            ? 'bg-purple-100 border-purple-300 text-purple-700'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {supportedWallets.includes(wallet) && (
                          <span className="mr-1">✓</span>
                        )}
                        {wallet}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fields Section */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-xs font-medium text-gray-500">
                Fields ({fields.length})
              </h5>
              <button
                type="button"
                onClick={() => setShowSwaggerWizard(true)}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import from Swagger/OpenAPI
              </button>
            </div>
            {fields.length > 0 ? (
              <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                <div className="flex flex-wrap gap-1.5">
                  {fields.map(field => (
                    <span
                      key={field.id}
                      className="px-2 py-1 text-xs bg-white border border-gray-200 rounded text-gray-700"
                    >
                      {field.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-500">
                No fields defined. Use "Import from Swagger/OpenAPI" to add fields.
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-xs text-gray-500 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Integration notes..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isEditing ? 'Update Source' : 'Add Source'}
          </button>
        </div>
      </div>

      {/* Swagger Import Wizard */}
      {showSwaggerWizard && (
        <SwaggerImportWizard
          onImport={handleSwaggerImport}
          onClose={() => setShowSwaggerWizard(false)}
        />
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}
