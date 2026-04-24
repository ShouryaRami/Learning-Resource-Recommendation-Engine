/**
 * ProjectApprovals page
 * Full page for reviewing and acting on pending project pitches
 * across all courses the instructor manages.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getAllCourses } from '../../api/courses'
import {
  getCourseProjects,
  approveProject,
  rejectProject
} from '../../api/projects'
import LoadingSpinner from '../../components/LoadingSpinner'

/**
 * @desc Format an ISO date string to a short readable date
 * @param {string} dateStr - ISO date string
 * @returns {string} e.g. "Apr 12, 2026"
 */
function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

const statusConfig = {
  pitch_pending: { label: 'Pending',   cls: 'bg-yellow-100 text-yellow-700' },
  active:        { label: 'Active',    cls: 'bg-green-100 text-green-700'   },
  rejected:      { label: 'Rejected',  cls: 'bg-red-100 text-red-700'       },
  completed:     { label: 'Completed', cls: 'bg-blue-100 text-blue-700'     },
  paused:        { label: 'Paused',    cls: 'bg-gray-100 text-gray-600'     }
}

const typeConfig = {
  pitched:  { label: 'Pitched',  cls: 'bg-purple-100 text-purple-700' },
  assigned: { label: 'Assigned', cls: 'bg-blue-100 text-blue-700'     }
}

const ProjectApprovals = () => {
  const { user } = useAuth()

  const [projects, setProjects]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [filter, setFilter]             = useState('all')
  const [rejectingId, setRejectingId]   = useState(null)
  const [feedbackText, setFeedbackText] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const allCourses = await getAllCourses()
        const userId = user?._id || user?.id

        // Filter to courses where this user is in the faculty array
        const instructorCourses = allCourses.filter(course =>
          course.faculty?.some(f => {
            const fId = f._id?.toString() || f?.toString()
            return fId === userId?.toString()
          })
        )

        // Fetch projects for all instructor courses and merge with course info
        const results = await Promise.all(
          instructorCourses.map(async (course) => {
            const courseProjects = await getCourseProjects(course._id).catch(() => [])
            // Attach course info to each project for display
            return courseProjects.map(p => ({ ...p, courseInfo: course }))
          })
        )
        setProjects(results.flat())
      } catch (err) {
        console.error('ProjectApprovals load error:', err)
      } finally {
        setLoading(false)
      }
    }
    if (user) load()
  }, [user])

  const handleApproveProject = async (projectId) => {
    try {
      await approveProject(projectId)
      setProjects(prev =>
        prev.map(p => p._id === projectId ? { ...p, status: 'active' } : p)
      )
    } catch (err) {
      console.error('Approve project error:', err)
    }
  }

  const handleRejectProject = async (projectId, feedback) => {
    try {
      await rejectProject(projectId, feedback)
      setProjects(prev =>
        prev.map(p => p._id === projectId ? { ...p, status: 'rejected' } : p)
      )
      setRejectingId(null)
      setFeedbackText('')
    } catch (err) {
      console.error('Reject project error:', err)
    }
  }

  const filtered = filter === 'all'
    ? projects
    : projects.filter(p => p.status === filter)

  const pendingCount = projects.filter(p => p.status === 'pitch_pending').length

  const filterBtnClass = (f) =>
    `text-xs px-3 py-1 rounded-full border transition-colors ${
      filter === f
        ? 'bg-gray-900 text-white border-gray-900'
        : 'border-gray-300 text-gray-500 hover:bg-gray-50'
    }`

  if (loading) return <LoadingSpinner />

  return (
    <>
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Project Approvals</h1>
          {pendingCount > 0 && (
            <span className="bg-yellow-400 text-black text-xs font-bold px-2.5 py-1 rounded-full">
              {pendingCount} pending
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Review and act on student project pitches across your courses
        </p>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'all',          label: 'All' },
          { key: 'pitch_pending', label: 'Pending' },
          { key: 'active',       label: 'Active' },
          { key: 'rejected',     label: 'Rejected' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={filterBtnClass(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-medium">No projects found</p>
          <p className="text-sm mt-1">
            {filter === 'all'
              ? 'No projects have been submitted to your courses yet'
              : `No ${filter.replace('_', ' ')} projects`}
          </p>
        </div>
      )}

      {/* Project cards */}
      <div className="space-y-4">
        {filtered.map(project => {
          const status = statusConfig[project.status] || { label: project.status, cls: 'bg-gray-100 text-gray-600' }
          const type   = typeConfig[project.projectType] || { label: project.projectType, cls: 'bg-gray-100 text-gray-600' }

          return (
            <div key={project._id} className="bg-white border border-gray-200 rounded-xl p-5">

              {/* Top row — title + badges + action buttons */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900">{project.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.cls}`}>
                      {status.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${type.cls}`}>
                      {type.label}
                    </span>
                  </div>

                  {/* Student + course + date info */}
                  <p className="text-sm text-gray-500 mt-2">
                    Student: <span className="font-medium text-gray-700">
                      {project.userId?.fullName || 'Unknown'}
                    </span>
                    {' · '}
                    Course: <span className="font-medium text-gray-700">
                      {project.courseId?.title || project.courseInfo?.title || 'Unknown'}
                    </span>
                    {' · '}
                    Submitted: {formatDate(project.createdAt)}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                {project.description}
              </p>

              {/* Proposal document link */}
              {project.proposalFileName && (
                <div className="mt-2">
                  <span className="text-xs text-blue-600 cursor-pointer hover:underline">
                    📎 {project.proposalFileName} (proposal document)
                  </span>
                </div>
              )}

              {/* Action buttons — only for pending pitches */}
              {project.status === 'pitch_pending' && rejectingId !== project._id && (
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => handleApproveProject(project._id)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600"
                  >
                    ✓ Approve Project
                  </button>
                  <button
                    onClick={() => setRejectingId(project._id)}
                    className="border border-red-300 text-red-500 px-4 py-2 rounded-lg text-sm hover:bg-red-50"
                  >
                    ✕ Reject with Feedback
                  </button>
                </div>
              )}

              {/* Rejection feedback form */}
              {rejectingId === project._id && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    Rejection feedback (shown to student):
                  </p>
                  <textarea
                    value={feedbackText}
                    onChange={e => setFeedbackText(e.target.value)}
                    className="w-full border border-red-200 rounded p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-red-400"
                    rows={3}
                    placeholder="Explain why the pitch needs revision..."
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleRejectProject(project._id, feedbackText)}
                      className="bg-red-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-600"
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => { setRejectingId(null); setFeedbackText('') }}
                      className="text-gray-500 text-sm px-4 py-2 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

export default ProjectApprovals
