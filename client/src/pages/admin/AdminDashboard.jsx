import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import StatCard from '../../components/cards/StatCard'
import { getAnalytics } from '../../api/admin'
import LoadingSpinner from '../../components/LoadingSpinner'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const languageData = {
  labels: ['JavaScript', 'Python', 'Java', 'TypeScript', 'Any'],
  datasets: [{
    label: 'Projects',
    data: [18, 14, 8, 6, 4],
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
    borderRadius: 4,
  }],
}

const domainData = {
  labels: ['Web Dev', 'ML', 'Mobile', 'Data', 'Security'],
  datasets: [{
    label: 'Projects',
    data: [22, 12, 8, 6, 4],
    backgroundColor: '#000000',
    borderColor: '#000000',
    borderRadius: 4,
  }],
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { display: false } },
    x: { grid: { display: false } },
  },
}

const SKILL_LEVELS = [
  { label: 'Beginner',     pct: '45%' },
  { label: 'Intermediate', pct: '35%' },
  { label: 'Advanced',     pct: '20%' },
]

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    getAnalytics()
      .then(data => { setAnalytics(data); setLoading(false) })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load analytics')
        setLoading(false)
      })
  }, [])

  const tabBtnClass = (tab) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      activeTab === tab
        ? 'bg-yellow-400 text-black'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`

  if (loading) return <LoadingSpinner />

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
    )
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          System overview and analytics
        </p>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-3 mb-8">
        <button className={tabBtnClass('overview')}  onClick={() => setActiveTab('overview')}>
          Overview
        </button>
        <button className={tabBtnClass('analytics')} onClick={() => setActiveTab('analytics')}>
          Analytics
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          {/* Clickable stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div onClick={() => navigate('/admin/users')} className="cursor-pointer">
              <StatCard label="Total Students"  value={analytics?.totalStudents ?? 0}  icon="👥" />
            </div>
            <div onClick={() => navigate('/courses')} className="cursor-pointer">
              <StatCard label="Total Courses"   value={analytics?.totalCourses ?? 0}   icon="📚" />
            </div>
            <StatCard label="Total Materials"   value={analytics?.totalMaterials ?? 0} icon="📁" />
            <StatCard label="Pending Pitches"   value={analytics?.pendingPitches ?? 0} icon="⏳"
              change={analytics?.pendingPitches > 0 ? 'Needs attention' : null}
            />
          </div>

          {/* Top resources list */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">System Summary</h2>
            <div className="space-y-3">
              {[
                { label: 'Active Projects',     value: analytics?.activeProjects ?? 0 },
                { label: 'All Projects',        value: analytics?.totalProjects ?? 0 },
                { label: 'Resources Saved',     value: analytics?.totalSaved ?? 0 },
                { label: 'Resources Completed', value: analytics?.totalCompleted ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">{label}</span>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <>
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

          {/* Skill level distribution */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-lg">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Skill Level Distribution
            </h2>
            <div className="space-y-4">
              {SKILL_LEVELS.map(level => (
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
        </>
      )}
    </>
  )
}

export default AdminDashboard
