import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import PageWrapper from '../components/layout/PageWrapper';
import StatCard from '../components/cards/StatCard';
import { getSavedResources } from '../api/saved';
import { getUserProjects, deleteProject } from '../api/projects';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projectsCount, setProjectsCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [projects, setProjects] = useState([]);
  const [showAllProjects, setShowAllProjects] = useState(false);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const fetchStats = async () => {
    if (!user) return;
    const userId = user.id || user._id;
    try {
      const [savedData, projectsData] = await Promise.all([
        getSavedResources(),
        getUserProjects(userId),
      ]);
      setSavedCount(savedData.length);
      setCompletedCount(savedData.filter((i) => i.isCompleted).length);
      setProjectsCount(projectsData.length);
      setProjects(projectsData);
    } catch (err) {
      console.error('Dashboard stats error:', err);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
      fetchStats();
    } catch (err) {
      console.error('Delete project error:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

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
          <StatCard label="Active Projects" value={projectsCount}  icon="📁" />
          <StatCard label="Saved Resources" value={savedCount}     icon="🔖" />
          <StatCard label="Completed"       value={completedCount} icon="✅" />
          <StatCard label="Learning Paths"  value={projectsCount}  icon="🗺️" />
        </div>

        {/* Section 3 — Recent Projects */}
        <div className="mt-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-umbc-black">Recent Projects</h2>
              <button
                onClick={fetchStats}
                className="border border-gray-200 text-gray-400 text-xs px-2 py-1 rounded hover:bg-gray-50"
              >
                ↻ Refresh
              </button>
            </div>
            <Link
              to="/new-project"
              className="bg-umbc-gold text-umbc-black text-sm font-semibold px-4 py-2 rounded hover:bg-yellow-400 transition-colors"
            >
              New Project
            </Link>
          </div>

          {projects.length === 0 ? (
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
          ) : (
            <>
              <div className="space-y-3 mt-4">
                {(showAllProjects ? projects : projects.slice(0, 5)).map((project) => (
                  <div
                    key={project._id}
                    className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition"
                  >
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{project.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {project.domain} · {project.language} · {project.skillLevel}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {project.status === 'active' && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                          Active
                        </span>
                      )}
                      {project.status === 'completed' && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                          Completed
                        </span>
                      )}
                      <button
                        onClick={() => navigate('/recommendations/' + project._id)}
                        className="border border-gray-300 text-gray-600 text-xs px-3 py-1 rounded-lg hover:bg-gray-50"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project._id)}
                        className="border border-red-300 text-red-400 text-xs px-3 py-1 rounded-lg hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {projects.length > 5 && (
                <div className="text-center mt-3">
                  <button
                    onClick={() => setShowAllProjects((prev) => !prev)}
                    className="text-yellow-600 text-sm hover:underline bg-transparent border-none cursor-pointer"
                  >
                    {showAllProjects ? 'Show less' : `View all ${projects.length} projects`}
                  </button>
                </div>
              )}
            </>
          )}
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
