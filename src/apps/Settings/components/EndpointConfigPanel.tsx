/**
 * Endpoint Configuration Panel
 *
 * Allows configuring individual endpoint settings:
 * - Enable/disable the endpoint
 * - Default parameters
 * - Feature toggles
 */

import { useState, useEffect } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import {
  OrbitApiType,
  SwaggerEndpoint,
  EndpointConfig,
  getEndpointKey,
} from '../../../types/orbitApis';

interface EndpointConfigPanelProps {
  apiType: OrbitApiType;
  endpoint: SwaggerEndpoint;
  version: string;
}

export default function EndpointConfigPanel({
  apiType,
  endpoint,
  version,
}: EndpointConfigPanelProps) {
  const { orbitConfig, saveEndpointConfig } = useAdminStore();

  const endpointKey = getEndpointKey(endpoint);

  // Get existing config for this endpoint
  const existingConfig = orbitConfig?.apis?.[apiType]?.versionConfigs?.[version]?.endpoints?.[
    endpointKey
  ] as EndpointConfig | undefined;

  const [enabled, setEnabled] = useState(existingConfig?.enabled ?? true);
  const [defaultParams, setDefaultParams] = useState<Record<string, string>>(
    (existingConfig?.defaultParams as Record<string, string>) || {}
  );
  const [featureToggles, setFeatureToggles] = useState<Record<string, boolean>>(
    existingConfig?.featureToggles || {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset state when config changes
  useEffect(() => {
    setEnabled(existingConfig?.enabled ?? true);
    setDefaultParams((existingConfig?.defaultParams as Record<string, string>) || {});
    setFeatureToggles(existingConfig?.featureToggles || {});
    setHasChanges(false);
    setSuccessMessage(null);
  }, [existingConfig]);

  const handleEnabledChange = (value: boolean) => {
    setEnabled(value);
    setHasChanges(true);
    setSuccessMessage(null);
  };

  const handleParamChange = (paramName: string, value: string) => {
    setDefaultParams((prev) => ({ ...prev, [paramName]: value }));
    setHasChanges(true);
    setSuccessMessage(null);
  };

  const handleToggleChange = (toggleName: string, value: boolean) => {
    setFeatureToggles((prev) => ({ ...prev, [toggleName]: value }));
    setHasChanges(true);
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage(null);

    const config: EndpointConfig = {
      enabled,
      defaultParams: Object.keys(defaultParams).length > 0 ? defaultParams : undefined,
      featureToggles: Object.keys(featureToggles).length > 0 ? featureToggles : undefined,
    };

    const success = await saveEndpointConfig(apiType, version, endpointKey, config);

    if (success) {
      setSuccessMessage('Configuration saved');
      setHasChanges(false);
    }

    setIsSaving(false);
  };

  // Check if endpoint has configurable parameters
  const configurableParams = endpoint.parameters?.filter(
    (p) => p.in === 'query' || p.in === 'header'
  ) || [];

  return (
    <div className="bg-gray-50 border-t border-gray-100 px-4 py-4">
      {/* Endpoint Details */}
      <div className="mb-4">
        {endpoint.summary && (
          <p className="text-sm text-gray-700 mb-1">{endpoint.summary}</p>
        )}
        {endpoint.description && (
          <p className="text-xs text-gray-500">{endpoint.description}</p>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Enable/Disable Toggle */}
      <div className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleEnabledChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Endpoint Enabled</span>
        </label>
        <p className="text-xs text-gray-500 mt-1 ml-6">
          When disabled, this endpoint will not be used by the platform.
        </p>
      </div>

      {/* Default Parameters */}
      {configurableParams.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Default Parameters</h4>
          <p className="text-xs text-gray-500 mb-3">
            Set default values for parameters that will be used when calling this endpoint.
          </p>
          <div className="space-y-3 bg-white rounded-lg border border-gray-200 p-3">
            {configurableParams.map((param) => (
              <div key={param.name}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {param.name}
                  {param.required && <span className="text-red-500 ml-0.5">*</span>}
                  <span className="font-normal text-gray-400 ml-1">({param.in})</span>
                </label>
                <input
                  type={param.type === 'number' || param.type === 'integer' ? 'number' : 'text'}
                  value={defaultParams[param.name] || ''}
                  onChange={(e) => handleParamChange(param.name, e.target.value)}
                  placeholder={param.default?.toString() || `Enter ${param.name}`}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {param.description && (
                  <p className="text-xs text-gray-400 mt-0.5">{param.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature Toggles */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Feature Toggles</h4>
        <p className="text-xs text-gray-500 mb-3">
          Enable or disable specific behaviors for this endpoint.
        </p>
        <div className="space-y-2 bg-white rounded-lg border border-gray-200 p-3">
          {/* Common toggles that could apply to any endpoint */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={featureToggles['logRequests'] ?? false}
              onChange={(e) => handleToggleChange('logRequests', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm text-gray-700">Log Requests</span>
              <p className="text-xs text-gray-400">Log all requests to this endpoint for debugging</p>
            </div>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={featureToggles['cacheResponses'] ?? false}
              onChange={(e) => handleToggleChange('cacheResponses', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm text-gray-700">Cache Responses</span>
              <p className="text-xs text-gray-400">Cache responses for improved performance</p>
            </div>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={featureToggles['retryOnFailure'] ?? true}
              onChange={(e) => handleToggleChange('retryOnFailure', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm text-gray-700">Retry on Failure</span>
              <p className="text-xs text-gray-400">Automatically retry failed requests</p>
            </div>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </button>

        {hasChanges && !successMessage && (
          <span className="text-sm text-amber-600">Unsaved changes</span>
        )}
      </div>

      {/* Technical Info */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          Operation ID: <code className="bg-gray-100 px-1 py-0.5 rounded">{endpoint.operationId || 'N/A'}</code>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Config Key: <code className="bg-gray-100 px-1 py-0.5 rounded">{endpointKey}</code>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Version: <code className="bg-gray-100 px-1 py-0.5 rounded">{version}</code>
        </p>
      </div>
    </div>
  );
}
