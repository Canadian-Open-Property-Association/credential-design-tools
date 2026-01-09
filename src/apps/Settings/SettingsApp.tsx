import { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { useAppTracking } from '../../hooks/useAppTracking';
import { isOrbitApiSection, OrbitApiType } from '../../types/orbitApis';
import FilterPanel from './components/FilterPanel';
import LogsTable from './components/LogsTable';
import Pagination from './components/Pagination';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import SettingsSidebar from './components/SettingsSidebar';
import OrbitCredentialsPanel from './components/OrbitCredentialsPanel';
import ApiConfigPanel from './components/ApiConfigPanel';

export default function SettingsApp() {
  // Track app access
  useAppTracking('settings', 'Settings');

  const {
    logs,
    pagination,
    filters,
    isLogsLoading,
    isAnalyticsLoading,
    error,
    fetchLogs,
    fetchAnalytics,
    fetchOrbitConfig,
    setFilters,
    clearFilters,
    selectedSection,
  } = useAdminStore();

  // Fetch initial data on mount
  useEffect(() => {
    fetchLogs();
    fetchOrbitConfig();
  }, [fetchLogs, fetchOrbitConfig]);

  const handlePageChange = (page: number) => {
    fetchLogs(filters, page);
  };

  const handleRefresh = () => {
    if (selectedSection === 'analytics') {
      fetchAnalytics();
    } else if (selectedSection === 'logs') {
      fetchLogs(filters, pagination.page);
    } else {
      fetchOrbitConfig();
    }
  };

  const isRefreshing =
    selectedSection === 'analytics'
      ? isAnalyticsLoading
      : selectedSection === 'logs'
        ? isLogsLoading
        : false;

  // Render the appropriate content panel based on selected section
  const renderContent = () => {
    // Orbit Credentials panel
    if (selectedSection === 'credentials') {
      return <OrbitCredentialsPanel />;
    }

    // API config panels
    if (isOrbitApiSection(selectedSection)) {
      return <ApiConfigPanel apiType={selectedSection as OrbitApiType} />;
    }

    // Analytics dashboard
    if (selectedSection === 'analytics') {
      return <AnalyticsDashboard />;
    }

    // Access Logs (default)
    return (
      <div className="p-6">
        {/* Refresh Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Access Logs</h2>
            <p className="text-sm text-gray-500 mt-1">View platform access and login events</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="ml-3 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Stats summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Total Events</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {pagination.total.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Current Page</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {pagination.page} / {pagination.total_pages || 1}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Showing</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{logs.length} events</div>
          </div>
        </div>

        {/* Filter Panel */}
        <FilterPanel filters={filters} onApplyFilters={setFilters} onClearFilters={clearFilters} />

        {/* Logs Table */}
        <LogsTable logs={logs} isLoading={isLogsLoading} />

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="mt-4">
            <Pagination pagination={pagination} onPageChange={handlePageChange} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-full bg-gray-50 flex">
      {/* Left Sidebar */}
      <SettingsSidebar />

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">{renderContent()}</div>
    </div>
  );
}
