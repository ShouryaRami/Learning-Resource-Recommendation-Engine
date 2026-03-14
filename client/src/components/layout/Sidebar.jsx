import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
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
    <div
      className="fixed top-0 left-0 h-full bg-umbc-black flex flex-col"
      style={{ width: '220px' }}
    >
      <div className="px-4 py-6">
        <p className="text-umbc-gold font-bold text-lg">UMBC Learn</p>
        <p className="text-gray-500 text-xs mt-1">
          {user?.role === 'admin' ? 'Faculty Portal' : 'Student Portal'}
        </p>
      </div>

      <nav className="flex-1">
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

      <div className="px-4 py-6">
        <button
          onClick={handleLogout}
          className="text-umbc-gold text-sm hover:underline"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
