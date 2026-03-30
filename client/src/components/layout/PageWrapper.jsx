import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PAGE_NAMES = {
  '/dashboard': 'Dashboard',
  '/new-project': 'New Project',
  '/saved': 'Saved Resources',
  '/learning-paths': 'Learning Paths',
  '/profile': 'Profile',
  '/admin/dashboard': 'Faculty Dashboard',
  '/admin/resources': 'Manage Resources',
  '/admin/insights': 'Student Insights',
};

const PageWrapper = ({ children, isSidebarOpen, onToggleSidebar }) => {
  const { user } = useAuth();
  const location = useLocation();
  const pageName = PAGE_NAMES[location.pathname] || 'UMBC Learn';
  const initial = user?.fullName ? user.fullName[0].toUpperCase() : 'U';

  return (
    <div className="lg:ml-56 min-h-screen bg-gray-50 transition-all duration-300">
      {/* Top navbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="text-gray-600 hover:text-black p-1 rounded hover:bg-gray-100 text-xl"
          >
            {isSidebarOpen ? '✕' : '☰'}
          </button>
          <span className="text-sm font-medium text-gray-700">{pageName}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
            <span className="text-black text-xs font-bold">{initial}</span>
          </div>
          <span className="text-sm text-gray-600 hidden sm:block">{user?.fullName}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="p-4 lg:p-6">
        {children}
      </div>
    </div>
  );
};

export default PageWrapper;
