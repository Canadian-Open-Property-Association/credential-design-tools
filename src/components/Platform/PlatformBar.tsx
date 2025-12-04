import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface PlatformBarProps {
  showBackButton?: boolean;
}

export default function PlatformBar({ showBackButton = true }: PlatformBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  // Hide back button on /apps (app selection page)
  const shouldShowBackButton = showBackButton && location.pathname !== '/apps';

  const handleBackToApps = () => {
    navigate('/apps');
  };

  return (
    <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between shadow-md">
      {/* Left: Logo and Platform Name */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="font-semibold text-lg">Credential Design Tools</span>
        </div>

        {/* Back to Apps Button */}
        {shouldShowBackButton && (
          <button
            onClick={handleBackToApps}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Apps
          </button>
        )}
      </div>

      {/* Right: User Info and Logout */}
      {isAuthenticated && user && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img
              src={user.avatar_url}
              alt={user.login}
              className="w-7 h-7 rounded-full border-2 border-slate-700"
            />
            <span className="text-sm text-slate-300">{user.name || user.login}</span>
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
