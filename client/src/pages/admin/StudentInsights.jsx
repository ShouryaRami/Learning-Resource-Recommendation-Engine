/**
 * StudentInsights page
 * Admin view of all students with click-to-expand rows
 * showing each student's project history.
 */
import { useState, useEffect } from 'react'
import axiosInstance from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'

/**
 * @desc Format ISO date to short readable date
 * @param {string} d
 * @returns {string}
 */
function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

const STATUS_COLOURS = {
  active:        'bg-green-100 text-green-700',
  pitch_pending: 'bg-yellow-100 text-yellow-700',
  rejected:      'bg-red-100 text-red-700',
  completed:     'bg-blue-100 text-blue-700',
  paused:        'bg-gray-100 text-gray-600',
}

const StudentInsights = () => {
  const [students, setStudents]           = useState([])
  const [projects, setProjects]           = useState({})
  const [expandedId, setExpandedId]       = useState(null)
  const [loadingProjects, setLoadingProjects] = useState(null)
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')

  useEffect(() => {
    axiosInstance.get('/admin/users?role=student')
      .then(res => { setStudents(res.data); setLoading(false) })
      .catch(err => {
        console.error('StudentInsights load error:', err)
        setLoading(false)
      })
  }, [])

  const handleExpand = async (studentId) => {
    // Collapse if already open
    if (expandedId === studentId) { setExpandedId(null); return }
    setExpandedId(studentId)

    // Fetch projects if not already cached
    if (!projects[studentId]) {
      setLoadingProjects(studentId)
      try {
        const res = await axiosInstance.get(`/admin/student/${studentId}/projects`)
        setProjects(prev => ({ ...prev, [studentId]: res.data }))
      } catch (err) {
        console.error('Fetch student projects error:', err)
        setProjects(prev => ({ ...prev, [studentId]: [] }))
      } finally {
        setLoadingProjects(null)
      }
    }
  }

  const filtered = students.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.fullName?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
  })

  if (loading) return <LoadingSpinner />

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Insights</h1>
        <p className="text-sm text-gray-500 mt-1">
          {students.length} registered students — click a row to view their projects
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📊</div>
          <p>No students found</p>
        </div>
      )}

      {/* Student rows */}
      <div className="space-y-2">
        {filtered.map(student => (
          <div key={student._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">

            {/* Student summary row — click to expand */}
            <div
              onClick={() => handleExpand(student._id)}
              className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-sm flex-shrink-0">
                  {student.fullName?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{student.fullName}</p>
                  <p className="text-xs text-gray-400">{student.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-400 capitalize">
                  {student.skillLevel || 'beginner'}
                </span>
                <span className="text-xs text-gray-400">
                  Joined {fmt(student.createdAt)}
                </span>
                {student.isVerified ? (
                  <span className="text-green-600 text-xs">✓ Verified</span>
                ) : (
                  <span className="text-gray-400 text-xs">Unverified</span>
                )}
                <span className="text-gray-400 text-xs">
                  {expandedId === student._id ? '▲' : '▼'}
                </span>
              </div>
            </div>

            {/* Expanded projects panel */}
            {expandedId === student._id && (
              <div className="border-t border-gray-100 bg-gray-50 p-4">
                {loadingProjects === student._id ? (
                  <p className="text-sm text-gray-400">Loading projects...</p>
                ) : (projects[student._id] || []).length === 0 ? (
                  <p className="text-sm text-gray-400">No projects submitted yet</p>
                ) : (
                  <div className="space-y-2">
                    {(projects[student._id] || []).map(project => (
                      <div key={project._id} className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{project.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {project.courseId?.title || 'Unknown course'} · {project.courseId?.code}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Submitted {fmt(project.createdAt)}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-3 ${
                          STATUS_COLOURS[project.status] || 'bg-gray-100 text-gray-600'
                        }`}>
                          {project.status === 'pitch_pending' ? 'Pending' : project.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

export default StudentInsights
