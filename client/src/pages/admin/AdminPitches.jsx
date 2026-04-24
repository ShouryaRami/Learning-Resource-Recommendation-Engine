/**
 * AdminPitches page
 * Shows all project pitches across all courses with status filter.
 */
import { useState, useEffect } from 'react'
import axiosInstance from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'

const STATUS_STYLES = {
  pitch_pending: 'bg-yellow-100 text-yellow-700',
  active:        'bg-green-100 text-green-700',
  rejected:      'bg-red-100 text-red-700',
  completed:     'bg-blue-100 text-blue-700',
  paused:        'bg-gray-100 text-gray-600',
}

const AdminPitches = () => {
  const [projects, setProjects]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    axiosInstance.get('/admin/projects')
      .then(res => { setProjects(res.data); setLoading(false) })
      .catch(err => {
        console.error('AdminPitches load error:', err)
        setLoading(false)
      })
  }, [])

  const filtered = filterStatus === 'all'
    ? projects
    : projects.filter(p => p.status === filterStatus)

  if (loading) return <LoadingSpinner />

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Project Pitches</h1>
        <p className="text-sm text-gray-500 mt-1">
          {projects.length} projects across all courses
        </p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'pitch_pending', 'active', 'rejected', 'completed'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filterStatus === s
                ? 'bg-gray-900 text-white border-gray-900'
                : 'border-gray-300 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {s === 'all' ? 'All' : s === 'pitch_pending' ? 'Pending' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <p>No projects found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-white border border-gray-200 rounded-xl">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Student</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Project Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Course</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(project => (
                <tr key={project._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{project.userId?.fullName || '—'}</p>
                    <p className="text-xs text-gray-400">{project.userId?.email || ''}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{project.title}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {project.courseId?.title || '—'}
                    {project.courseId?.code && (
                      <span className="text-gray-400 text-xs ml-1">({project.courseId.code})</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      STATUS_STYLES[project.status] || 'bg-gray-100 text-gray-600'
                    }`}>
                      {project.status === 'pitch_pending' ? 'Pending' : project.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(project.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export default AdminPitches
