/**
 * Credential Catalogue App
 *
 * An application for managing imported external credentials (AnonCreds).
 * Uses a split-pane layout similar to Entity Manager:
 * - Left panel: List of credentials with search and import button
 * - Right panel: Detail view of selected credential
 *
 * Features:
 * - Import credentials from IndyScan URLs
 * - Tag credentials by ecosystem
 * - Browse and manage imported credentials
 * - Register credentials with Orbit
 */

import { useEffect, useState } from 'react';
import { useCatalogueStore } from '../../store/catalogueStore';
import { useAppTracking } from '../../hooks/useAppTracking';
import CredentialList from './components/CredentialList';
import CredentialDetail from './components/CredentialDetail';
import ImportWizard from './components/ImportWizard';

export default function CredentialCatalogueApp() {
  useAppTracking('credential-catalogue', 'Credential Catalogue');

  const {
    fetchCredentials,
    selectedCredential,
    clearSelection,
    isLoading,
    error,
    selectCredential,
  } = useCatalogueStore();

  const [showImportWizard, setShowImportWizard] = useState(false);

  // Reset to initial state when entering the app
  useEffect(() => {
    clearSelection();
    fetchCredentials();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddCredential = () => {
    setShowImportWizard(true);
  };

  const handleImportComplete = (credentialId: string) => {
    setShowImportWizard(false);
    selectCredential(credentialId);
  };

  const renderDetailPanel = () => {
    if (!selectedCredential) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-400">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg font-medium">Select a credential</p>
            <p className="text-sm mt-1">Choose a credential to view details</p>
          </div>
        </div>
      );
    }

    return <CredentialDetail credential={selectedCredential} />;
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading credentials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium">Error loading credentials</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => fetchCredentials()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Main Content - Split Pane Layout */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left Panel - Credential List */}
        <div className="w-80 flex-shrink-0 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
          <CredentialList onAddCredential={handleAddCredential} />
        </div>

        {/* Right Panel - Detail View */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-y-auto">
          {renderDetailPanel()}
        </div>
      </div>

      {/* Import Wizard Modal */}
      {showImportWizard && (
        <ImportWizard
          onClose={() => setShowImportWizard(false)}
          onComplete={handleImportComplete}
        />
      )}
    </div>
  );
}
