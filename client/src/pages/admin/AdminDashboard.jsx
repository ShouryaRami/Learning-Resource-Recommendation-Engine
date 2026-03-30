import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import StatCard from '../../components/cards/StatCard';
import { getAnalytics } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const languageData = {
  labels: ['JavaScript', 'Python', 'Java', 'TypeScript', 'Any'],
  datasets: [
    {
      label: 'Projects',
      data: [18, 14, 8, 6, 4],
      backgroundColor: '#FFD700',
      borderColor: '#FFD700',
      borderRadius: 4,
    },
  ],
};

const domainData = {
  labels: ['Web Dev', 'ML', 'Mobile', 'Data', 'Security'],
  datasets: [
    {
      label: 'Projects',
      data: [22, 12, 8, 6, 4],
      backgroundColor: '#000000',
      borderColor: '#000000',
      borderRadius: 4,
    },
  ],
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    y: { beginAtZero: true, grid: { display: false } },
    x: { grid: { display: false } },
  },
};

const TOP_RESOURCES = [
  { name: 'The Odin Project', count: '234 uses' },
  { name: 'MDN Web Docs', count: '198 uses' },
  { name: 'React Documentation', count: '167 uses' },
  { name: 'Kaggle Learn', count: '143 uses' },
  { name: 'OWASP Top 10', count: '98 uses' },
];

const SKILL_LEVELS = [
  { label: 'Beginner', pct: '45%' },
  { label: 'Intermediate', pct: '35%' },
  { label: 'Advanced', pct: '20%' },
];

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAnalytics()
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load analytics');
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-yellow-400 text-black font-semibold px-4 py-2 rounded-lg hover:bg-yellow-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Faculty Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Analytics and insights on student learning patterns
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Students"   value={analytics?.totalStudents ?? 0}  icon="👥" />
          <StatCard label="Active Projects"  value={analytics?.totalProjects ?? 0}  icon="📁" />
          <StatCard label="Resources Saved"  value={analytics?.totalSaved ?? 0}     icon="🔖" />
          <StatCard label="Completed"        value={analytics?.totalCompleted ?? 0} icon="✅" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Most Selected Languages
            </h2>
            <div style={{ height: '250px' }}>
              <Bar data={languageData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Popular Project Domains
            </h2>
            <div style={{ height: '250px' }}>
              <Bar data={domainData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most used resources */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Most Used Resources</h2>
            <div className="space-y-3">
              {TOP_RESOURCES.map((item, i) => (
                <div
                  key={i}
                  className={`flex justify-between items-center py-2 ${
                    i < TOP_RESOURCES.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Skill level distribution */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Skill Level Distribution
            </h2>
            <div className="space-y-4">
              {SKILL_LEVELS.map((level) => (
                <div key={level.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">{level.label}</span>
                    <span className="text-sm font-medium text-gray-800">{level.pct}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-yellow-400 rounded-full h-3"
                      style={{ width: level.pct }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
    </>
  );
};

export default AdminDashboard;
