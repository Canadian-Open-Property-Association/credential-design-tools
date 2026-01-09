import { useState, useEffect } from 'react';
import { useAdminStore } from '../../../store/adminStore';

export default function OrbitCredentialsPanel() {
  const {
    orbitConfig,
    isOrbitConfigLoading,
    orbitConfigError,
    fetchOrbitConfig,
    updateOrbitCredentials,
    resetOrbitConfig,
  } = useAdminStore();

  const [lobId, setLobId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load config on mount
  useEffect(() => {
    fetchOrbitConfig();
  }, [fetchOrbitConfig]);

  // Update form when config loads
  useEffect(() => {
    if (orbitConfig) {
      setLobId(orbitConfig.lobId || '');
      setApiKey(''); // Never populate API key from stored config
      setHasChanges(false);
    }
  }, [orbitConfig]);

  const handleLobIdChange = (value: string) => {
    setLobId(value);
    setHasChanges(true);
    setSuccessMessage(null);
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    setHasChanges(true);
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    setSuccessMessage(null);

    const success = await updateOrbitCredentials({
      lobId,
      apiKey: apiKey || undefined, // Only send if not empty
    });

    if (success) {
      setSuccessMessage('Credentials saved successfully');
      setApiKey(''); // Clear API key field after save
      setHasChanges(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Reset all Orbit configuration to environment variables? This will delete all saved settings.')) {
      await resetOrbitConfig();
      setSuccessMessage('Configuration reset to environment variables');
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Orbit Credentials</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure shared credentials used by all Orbit APIs
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              orbitConfig?.configured ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {orbitConfig?.configured ? 'Credentials Configured' : 'Not Configured'}
            </p>
            {orbitConfig?.source && (
              <p className="text-xs text-gray-500">
                Source: {orbitConfig.source === 'file' ? 'Saved configuration' : 'Environment variables'}
              </p>
            )}
          </div>
        </div>

        {orbitConfig?.configuredAt && (
          <p className="text-xs text-gray-400 mt-2">
            Last updated: {new Date(orbitConfig.configuredAt).toLocaleString()}
            {orbitConfig.configuredBy && ` by ${orbitConfig.configuredBy}`}
          </p>
        )}
      </div>

      {/* Error Message */}
      {orbitConfigError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-700">{orbitConfigError}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Form */}
      <div className="space-y-4">
        {/* LOB ID */}
        <div>
          <label htmlFor="lobId" className="block text-sm font-medium text-gray-700 mb-1">
            LOB ID
          </label>
          <input
            type="text"
            id="lobId"
            value={lobId}
            onChange={(e) => handleLobIdChange(e.target.value)}
            placeholder="Enter your LOB ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Your Line of Business identifier from Orbit
          </p>
        </div>

        {/* API Key */}
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              id="apiKey"
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder={orbitConfig?.hasApiKey ? '••••••••••••••••' : 'Enter your API key'}
              className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {orbitConfig?.hasApiKey
              ? 'API key is saved. Enter a new value to update it.'
              : 'Your API key for authenticating with Orbit APIs'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={isOrbitConfigLoading || !lobId}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isOrbitConfigLoading ? 'Saving...' : 'Save Credentials'}
        </button>

        {orbitConfig?.source === 'file' && (
          <button
            onClick={handleReset}
            disabled={isOrbitConfigLoading}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Reset to Env Vars
          </button>
        )}

        {hasChanges && (
          <span className="text-sm text-amber-600">Unsaved changes</span>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">About Orbit Credentials</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• LOB ID and API Key are shared across all Orbit APIs</li>
          <li>• Each API (Issuer, Verifier, etc.) has its own Base URL</li>
          <li>• API keys are encrypted at rest for security</li>
          <li>• Environment variables can be used as fallback</li>
        </ul>
      </div>
    </div>
  );
}
