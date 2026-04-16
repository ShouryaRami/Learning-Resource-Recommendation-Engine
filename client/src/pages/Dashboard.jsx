import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/cards/StatCard';
import ProjectCard from '../components/cards/ProjectCard';
import { getSavedResources } from '../api/saved';
import { getMyProjects, deleteProject } from '../api/projects';
import { getMyEnrollments } from '../api/enrollments';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedCount, setSavedCount]           = useState(0);
  const [completedCount, setCompletedCount]   = useState(0);
  const [projects, setProjects]               = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const fetchStats = async () => {
    if (!user) return;
    try {
      const [savedData, projectsData, enrollmentData] = await Promise.all([
        getSavedResources(),
        getMyProjects(),
        getMyEnrollments(),
      ]);
      setSavedCount(savedData.length);
      setCompletedCount(savedData.filter(i => i.isCompleted).length);
      setProjects(projectsData);
      setEnrolledCourses(enrollmentData.filter(e => e.status === 'approved'));
    } catch (err) {
      console.error('Dashboard stats error:', err);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteProject(projectId);
      setProjects(prev => prev.filter(p => p._id !== projectId));
    } catch (err) {
      console.error('Delete project error:', err);
    }
  };

  // Redirect non-student roles to their own dashboards.
  // Depends on user so it runs once user loads from auth context.
  useEffect(() => {
    if (!user) return
    if (user.role === 'instructor' && user.isDepartmentHead) {
      navigate('/depthead/dashboard', { replace: true })
    } else if (user.role === 'instructor') {
      navigate('/instructor/dashboard', { replace: true })
    } else if (user.role === 'ta') {
      navigate('/ta/dashboard', { replace: true })
    } else if (user.role === 'admin') {
      navigate('/admin/dashboard', { replace: true })
    }
    // students stay on /dashboard
  }, [user, navigate]);

  useEffect(() => {
    fetchStats();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeProjects    = projects.filter(p => p.status === 'active').length;
  const pendingProjects   = projects.filter(p => p.status === 'pitch_pending').length;

  return (
    <>
      {/* Section 1 — Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-umbc-black">
          Welcome back, {user?.fullName}
        </h1>
        <p className="text-sm text-umbc-gray mt-1">{today}</p>
      </div>

      {/* Section 2 — Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard label="Active Projects"  value={activeProjects}              icon="📁" />
        <StatCard label="Pending Approval" value={pendingProjects}             icon="⏳" />
        <StatCard label="Saved Resources"  value={savedCount}                  icon="🔖" />
        <StatCard label="Completed"        value={completedCount}              icon="✅" />
      </div>

      {/* Section 3 — My Courses (students only) */}
      {user?.role === 'student' && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">My Courses</h2>
            <Link to="/courses" className="text-yellow-600 text-sm hover:underline">
              Browse All Courses →
            </Link>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <p className="text-gray-500">Not enrolled in any courses yet</p>
              <Link
                to="/courses"
                className="mt-3 inline-block bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500"
              >
                Browse Courses
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrolledCourses.slice(0, 3).map(enrollment => (
                  <div
                    key={enrollment._id}
                    onClick={() => navigate(`/courses/${enrollment.courseId?._id || enrollment.courseId}`)}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm cursor-pointer"
                  >
                    <p className="font-semibold text-gray-900">{enrollment.courseId?.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {enrollment.courseId?.code} · {enrollment.courseId?.semester}
                    </p>
                    <span className="mt-2 inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                      Enrolled
                    </span>
                  </div>
                ))}
              </div>
              {enrolledCourses.length > 3 && (
                <p className="text-sm text-gray-500 mt-3 text-center">
                  +{enrolledCourses.length - 3} more courses{' '}
                  <Link to="/courses" className="text-yellow-600 ml-1 hover:underline">View all</Link>
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Section 4 — My Projects (students only) */}
      {user?.role === 'student' && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">My Projects</h2>
              <button
                onClick={fetchStats}
                className="border border-gray-200 text-gray-400 text-xs px-2 py-1 rounded hover:bg-gray-50"
              >
                ↻ Refresh
              </button>
            </div>
            <button
              onClick={() => navigate('/new-project')}
              className="bg-yellow-400 text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-yellow-500"
            >
              + Pitch Project
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center">
              <span className="text-5xl">📂</span>
              <p className="text-lg font-medium text-gray-600 mt-4">No projects yet</p>
              <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
                Pitch your first project to get personalized resource recommendations
              </p>
              <button
                onClick={() => navigate('/new-project')}
                className="bg-yellow-400 text-black font-semibold px-6 py-3 rounded mt-6 hover:bg-yellow-500"
              >
                Pitch Your First Project
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map(project => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onDelete={handleDeleteProject}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section 5 — Quick Tips */}
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
    </>
  );
};

export default Dashboard;
