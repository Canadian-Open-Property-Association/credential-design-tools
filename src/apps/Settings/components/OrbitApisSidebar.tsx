/**
 * Orbit APIs Secondary Sidebar
 *
 * Secondary navigation that appears when 'Orbit APIs' is selected in Settings.
 * Shows credentials section and list of all API endpoints with configuration status.
 */

import { useAdminStore } from '../../../store/adminStore';
import { ORBIT_APIS, OrbitApiType, ORBIT_API_KEYS } from '../../../types/orbitApis';

export default function OrbitApisSidebar() {
  const {
    selectedOrbitApi,
    setSelectedOrbitApi,
    orbitConfig,
  } = useAdminStore();

  // Check if an API is configured (has a base URL)
  const isApiConfigured = (apiType: OrbitApiType): boolean => {
    return !!orbitConfig?.apis?.[apiType]?.baseUrl;
  };

  // Check if credentials are configured
  const areCredentialsConfigured = (): boolean => {
    return !!orbitConfig?.lobId && orbitConfig?.hasApiKey;
  };

  return (
    <div className="w-56 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Orbit APIs</h3>
        <p className="text-xs text-gray-500 mt-0.5">Configure API connections</p>
      </div>

      {/* Credentials Section */}
      <div className="px-2 py-2 border-b border-gray-200">
        <button
          onClick={() => setSelectedOrbitApi('credentials')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
            selectedOrbitApi === 'credentials'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          <span className="flex-1 text-left">Credentials</span>
          {areCredentialsConfigured() ? (
            <span className="w-2 h-2 rounded-full bg-green-500" title="Configured" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-gray-300" title="Not configured" />
          )}
        </button>
      </div>

      {/* API Endpoints List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            API Endpoints
          </h4>
        </div>
        <div className="px-2 space-y-0.5">
          {ORBIT_API_KEYS.map((apiType) => {
            const api = ORBIT_APIS[apiType];
            const isConfigured = isApiConfigured(apiType);
            const isSelected = selectedOrbitApi === apiType;

            return (
              <button
                key={apiType}
                onClick={() => setSelectedOrbitApi(apiType)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ApiIcon apiType={apiType} />
                <span className="flex-1 text-left truncate">{api.label}</span>
                {isConfigured ? (
                  <span className="w-2 h-2 rounded-full bg-green-500" title="Configured" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-gray-300" title="Not configured" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer with config source */}
      {orbitConfig?.source && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500">
            Source:{' '}
            <span className="font-medium">
              {orbitConfig.source === 'file' ? 'Saved config' : 'Environment'}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * API-specific icons
 */
function ApiIcon({ apiType }: { apiType: OrbitApiType }) {
  switch (apiType) {
    case 'lob':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      );
    case 'registerSocket':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
          />
        </svg>
      );
    case 'connection':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      );
    case 'holder':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      );
    case 'verifier':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      );
    case 'issuer':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      );
    case 'chat':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      );
  }
}
