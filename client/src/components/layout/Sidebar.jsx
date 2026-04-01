import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center px-4 py-3 text-sm transition-colors border-l-4 ${
      isActive
        ? 'border-umbc-gold bg-gray-900 text-umbc-gold'
        : 'border-transparent text-gray-300 hover:text-white hover:bg-gray-900'
    }`;

  return (
    <div>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 left-0 h-full w-56 bg-black z-30 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top section */}
        <div className="flex items-center justify-between px-4 pt-5 pb-4">
          <div>
            <p className="text-yellow-400 font-bold text-lg">UMBC Learn</p>
            <p className="text-gray-500 text-xs mt-0.5">
              {user?.role === 'admin' ? 'Faculty Portal' : 'Student Portal'}
            </p>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {user?.role === 'admin' ? (
            <>
              <NavLink to="/admin/dashboard" className={linkClass}>Dashboard</NavLink>
              <NavLink to="/admin/dashboard" className={linkClass}>Analytics</NavLink>
              <NavLink to="/admin/resources" className={linkClass}>Manage Resources</NavLink>
              <NavLink to="/admin/insights" className={linkClass}>Student Insights</NavLink>
              <NavLink to="/profile" className={linkClass}>Profile</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
              <NavLink to="/new-project" className={linkClass}>New Project</NavLink>
              <NavLink to="/saved" className={linkClass}>Saved Resources</NavLink>
              <NavLink to="/learning-paths" className={linkClass}>Learning Paths</NavLink>
              <NavLink to="/profile" className={linkClass}>Profile</NavLink>
            </>
          )}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-6">
          <button
            onClick={handleLogout}
            className="text-umbc-gold text-sm hover:underline"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
