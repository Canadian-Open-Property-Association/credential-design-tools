import { useState, useEffect } from 'react';
import { ORBIT_APIS, OrbitApiType } from '../../../types/orbitApis';
import { useAdminStore } from '../../../store/adminStore';

interface ApiConfigPanelProps {
  apiType: OrbitApiType;
}

export default function ApiConfigPanel({ apiType }: ApiConfigPanelProps) {
  const {
    orbitConfig,
    isOrbitConfigLoading,
    orbitConfigError,
    apiTestResults,
    apiTestLoading,
    updateApiConfig,
    testApiConnection,
    clearApiTestResult,
  } = useAdminStore();

  const [baseUrl, setBaseUrl] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const apiInfo = ORBIT_APIS[apiType];
  const testResult = apiTestResults[apiType];
  const isTesting = apiTestLoading[apiType] || false;

  // Update form when config loads or apiType changes
  useEffect(() => {
    if (orbitConfig?.apis?.[apiType]) {
      setBaseUrl(orbitConfig.apis[apiType].baseUrl || '');
      setHasChanges(false);
    } else {
      setBaseUrl('');
      setHasChanges(false);
    }
    setSuccessMessage(null);
    clearApiTestResult(apiType);
  }, [orbitConfig, apiType, clearApiTestResult]);

  const handleBaseUrlChange = (value: string) => {
    setBaseUrl(value);
    setHasChanges(true);
    setSuccessMessage(null);
    clearApiTestResult(apiType);
  };

  const handleSave = async () => {
    setSuccessMessage(null);

    const success = await updateApiConfig(apiType, baseUrl);

    if (success) {
      setSuccessMessage('Configuration saved successfully');
      setHasChanges(false);
    }
  };

  const handleTest = async () => {
    clearApiTestResult(apiType);
    await testApiConnection(apiType, baseUrl || undefined);
  };

  const handleClear = async () => {
    setBaseUrl('');
    setHasChanges(true);
    setSuccessMessage(null);
    clearApiTestResult(apiType);
  };

  const isConfigured = !!baseUrl;
  const hasCredentials = !!orbitConfig?.configured;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{apiInfo.label} Configuration</h2>
        <p className="text-sm text-gray-500 mt-1">{apiInfo.description}</p>
      </div>

      {/* Status Card */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isConfigured ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {isConfigured ? 'Configured' : 'Not Configured'}
            </p>
            {isConfigured && (
              <p className="text-xs text-gray-500 truncate max-w-md">{baseUrl}</p>
            )}
          </div>
        </div>
      </div>

      {/* Credentials Warning */}
      {!hasCredentials && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">Credentials Required</p>
              <p className="text-sm text-amber-700">
                Configure your LOB ID and API Key in the "Orbit Credentials" section before
                using this API.
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* Test Result */}
      {testResult && (
        <div
          className={`rounded-lg p-4 mb-6 ${
            testResult.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
              {testResult.message}
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="space-y-4">
        {/* Base URL */}
        <div>
          <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Base URL
          </label>
          <input
            type="url"
            id="baseUrl"
            value={baseUrl}
            onChange={(e) => handleBaseUrlChange(e.target.value)}
            placeholder={`https://${apiType}.eapi.nborbit.ca/`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            The base URL for the {apiInfo.label} endpoint
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={isOrbitConfigLoading || !hasChanges}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isOrbitConfigLoading ? 'Saving...' : 'Save'}
        </button>

        <button
          onClick={handleTest}
          disabled={isTesting || !baseUrl || !hasCredentials}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTesting ? 'Testing...' : 'Test Connection'}
        </button>

        {baseUrl && (
          <button
            onClick={handleClear}
            disabled={isOrbitConfigLoading}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Clear
          </button>
        )}

        {hasChanges && (
          <span className="text-sm text-amber-600">Unsaved changes</span>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">About {apiInfo.label}</h3>
        <p className="text-sm text-blue-700">{apiInfo.description}</p>
        <p className="text-sm text-blue-600 mt-2">
          This API uses the shared LOB ID and API Key configured in the "Orbit Credentials" section.
        </p>
      </div>
    </div>
  );
}
