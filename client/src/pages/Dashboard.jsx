import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import PageWrapper from '../components/layout/PageWrapper';
import StatCard from '../components/cards/StatCard';

const Dashboard = () => {
  const { user } = useAuth();

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex min-h-screen bg-umbc-surface">
      <Sidebar />
      <PageWrapper>

        {/* Section 1 — Welcome header */}
        <div>
          <h1 className="text-2xl font-bold text-umbc-black">
            Welcome back, {user?.fullName}
          </h1>
          <p className="text-sm text-umbc-gray mt-1">{today}</p>
        </div>

        {/* Section 2 — Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <StatCard label="Active Projects" value="0" icon="📁" />
          <StatCard label="Saved Resources" value="0" icon="🔖" />
          <StatCard label="Completed"       value="0" icon="✅" />
          <StatCard label="Learning Paths"  value="0" icon="🗺️" />
        </div>

        {/* Section 3 — Recent Projects */}
        <div className="mt-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-umbc-black">Recent Projects</h2>
            <Link
              to="/new-project"
              className="bg-umbc-gold text-umbc-black text-sm font-semibold px-4 py-2 rounded hover:bg-yellow-400 transition-colors"
            >
              New Project
            </Link>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center flex flex-col items-center mt-4">
            <span className="text-6xl">📂</span>
            <p className="text-lg font-medium text-gray-600 mt-4">No projects yet</p>
            <p className="text-sm text-gray-400 mt-2 max-w-sm">
              Create your first project to get personalized resource recommendations
            </p>
            <Link
              to="/new-project"
              className="bg-umbc-gold text-umbc-black font-semibold px-6 py-3 rounded mt-6 hover:bg-yellow-400 transition-colors"
            >
              Create Your First Project
            </Link>
          </div>
        </div>

        {/* Section 4 — Quick Tips */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-umbc-black mb-4">Quick Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-yellow-400">
              <p className="text-sm font-semibold text-gray-800">Be Specific</p>
              <p className="text-sm text-gray-500 mt-1">
                Describe your project goals and features in detail for better recommendations
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-yellow-400">
              <p className="text-sm font-semibold text-gray-800">Set Your Level</p>
              <p className="text-sm text-gray-500 mt-1">
                Select the skill level that matches your current abilities for relevant resources
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-yellow-400">
              <p className="text-sm font-semibold text-gray-800">Track Progress</p>
              <p className="text-sm text-gray-500 mt-1">
                Mark resources as complete to keep your learning path up to date
              </p>
            </div>
          </div>
        </div>

      </PageWrapper>
    </div>
  );
};

export default Dashboard;
