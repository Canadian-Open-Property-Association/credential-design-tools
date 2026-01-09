import { ORBIT_APIS, OrbitApiType, SettingsSection, isOrbitApiSection } from '../../../types/orbitApis';
import { useAdminStore } from '../../../store/adminStore';

interface MenuItem {
  id: SettingsSection;
  label: string;
  icon: React.ReactNode;
  dividerBefore?: boolean;
  dividerAfter?: boolean;
}

// Key icon for credentials
const KeyIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
    />
  </svg>
);

// API/Server icon
const ApiIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
    />
  </svg>
);

// Logs icon
const LogIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    />
  </svg>
);

// Analytics icon
const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

// Build menu items from ORBIT_APIS
const menuItems: MenuItem[] = [
  { id: 'credentials', label: 'Orbit Credentials', icon: <KeyIcon />, dividerAfter: true },
  ...Object.entries(ORBIT_APIS).map(([key, api]) => ({
    id: key as OrbitApiType,
    label: api.label,
    icon: <ApiIcon />,
  })),
  { id: 'logs' as SettingsSection, label: 'Access Logs', icon: <LogIcon />, dividerBefore: true },
  { id: 'analytics' as SettingsSection, label: 'Analytics', icon: <ChartIcon /> },
];

export default function SettingsSidebar() {
  const { selectedSection, setSelectedSection, orbitConfig } = useAdminStore();

  // Check if an API has a configured baseUrl
  const isApiConfigured = (apiType: OrbitApiType): boolean => {
    return !!(orbitConfig?.apis?.[apiType]?.baseUrl);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Settings</h2>
        <p className="text-sm text-gray-500">Platform configuration</p>
      </div>

      <nav className="px-2 pb-4">
        {menuItems.map((item, index) => {
          const isSelected = selectedSection === item.id;
          const isApiItem = isOrbitApiSection(item.id);
          const hasConfig = isApiItem ? isApiConfigured(item.id as OrbitApiType) : true;

          return (
            <div key={item.id}>
              {item.dividerBefore && index > 0 && (
                <div className="my-2 border-t border-gray-200" />
              )}

              <button
                onClick={() => setSelectedSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span
                  className={`flex-shrink-0 ${
                    isSelected ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="flex-1 text-sm font-medium truncate">{item.label}</span>

                {/* Status indicator for API items */}
                {isApiItem && (
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      hasConfig ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    title={hasConfig ? 'Configured' : 'Not configured'}
                  />
                )}
              </button>

              {item.dividerAfter && (
                <div className="my-2 border-t border-gray-200" />
              )}
            </div>
          );
        })}
      </nav>

      {/* Credentials status footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              orbitConfig?.configured ? 'bg-green-500' : 'bg-amber-500'
            }`}
          />
          <span className="text-gray-600">
            {orbitConfig?.configured
              ? `LOB ID: ${orbitConfig.lobId.substring(0, 12)}...`
              : 'Credentials not configured'}
          </span>
        </div>
        {orbitConfig?.source && (
          <p className="text-xs text-gray-400 mt-1">
            Source: {orbitConfig.source === 'file' ? 'Saved config' : 'Environment'}
          </p>
        )}
      </div>
    </div>
  );
}
