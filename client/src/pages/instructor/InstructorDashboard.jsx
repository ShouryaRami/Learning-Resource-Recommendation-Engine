/**
 * InstructorDashboard page
 * Main landing page for instructors.
 * Shows assigned courses, pending enrollments,
 * and pending project pitches in one view.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getAllCourses } from '../../api/courses'
import {
  getCourseEnrollments,
  approveEnrollment,
  rejectEnrollment
} from '../../api/enrollments'
import {
  getCourseProjects,
  approveProject,
  rejectProject
} from '../../api/projects'
import StatCard from '../../components/cards/StatCard'
import CourseCard from '../../components/cards/CourseCard'
import LoadingSpinner from '../../components/LoadingSpinner'

const InstructorDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [courses, setCourses]                   = useState([])
  const [pendingEnrollments, setPendingEnrollments] = useState([])
  const [pendingProjects, setPendingProjects]   = useState([])
  const [loading, setLoading]                   = useState(true)
  const [stats, setStats]                       = useState({
    courseCount: 0,
    pendingEnrollCount: 0,
    pendingProjectCount: 0,
    totalStudents: 0
  })
  const [rejectingId, setRejectingId]   = useState(null)
  const [feedbackText, setFeedbackText] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const allCourses = await getAllCourses()

        // Filter only courses where this instructor is in the faculty array
        const userId = user?._id || user?.id
        const instructorCourses = allCourses.filter(course =>
          course.faculty?.some(f => {
            const fId = f._id?.toString() || f?.toString()
            return fId === userId?.toString()
          })
        )
        setCourses(instructorCourses)

        // Load enrollments and projects for each course in parallel
        const enrollmentResults = await Promise.all(
          instructorCourses.map(c => getCourseEnrollments(c._id).catch(() => []))
        )
        const projectResults = await Promise.all(
          instructorCourses.map(c => getCourseProjects(c._id).catch(() => []))
        )

        const allEnrollments   = enrollmentResults.flat()
        const allProjects      = projectResults.flat()
        const pending          = allEnrollments.filter(e => e.status === 'pending')
        const approved         = allEnrollments.filter(e => e.status === 'approved')
        const pendingPitches   = allProjects.filter(p => p.status === 'pitch_pending')

        setPendingEnrollments(pending)
        setPendingProjects(pendingPitches)
        setStats({
          courseCount:          instructorCourses.length,
          pendingEnrollCount:   pending.length,
          pendingProjectCount:  pendingPitches.length,
          totalStudents:        approved.length
        })
      } catch (err) {
        console.error('InstructorDashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    if (user) load()
  }, [user])

  const handleApproveEnrollment = async (enrollmentId) => {
    try {
      await approveEnrollment(enrollmentId)
      setPendingEnrollments(prev => prev.filter(e => e._id !== enrollmentId))
      setStats(prev => ({
        ...prev,
        pendingEnrollCount: prev.pendingEnrollCount - 1,
        totalStudents:      prev.totalStudents + 1
      }))
    } catch (err) {
      console.error('Approve enrollment error:', err)
    }
  }

  const handleRejectEnrollment = async (enrollmentId) => {
    try {
      await rejectEnrollment(enrollmentId)
      setPendingEnrollments(prev => prev.filter(e => e._id !== enrollmentId))
      setStats(prev => ({
        ...prev,
        pendingEnrollCount: prev.pendingEnrollCount - 1
      }))
    } catch (err) {
      console.error('Reject enrollment error:', err)
    }
  }

  const handleApproveProject = async (projectId) => {
    try {
      await approveProject(projectId)
      setPendingProjects(prev => prev.filter(p => p._id !== projectId))
      setStats(prev => ({
        ...prev,
        pendingProjectCount: prev.pendingProjectCount - 1
      }))
    } catch (err) {
      console.error('Approve project error:', err)
    }
  }

  const handleRejectProject = async (projectId, feedback) => {
    try {
      await rejectProject(projectId, feedback)
      setPendingProjects(prev => prev.filter(p => p._id !== projectId))
      setStats(prev => ({
        ...prev,
        pendingProjectCount: prev.pendingProjectCount - 1
      }))
      setRejectingId(null)
      setFeedbackText('')
    } catch (err) {
      console.error('Reject project error:', err)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.fullName}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="My Courses"           value={stats.courseCount}         icon="📚" />
        <StatCard
          label="Pending Enrollments"
          value={stats.pendingEnrollCount}
          icon="⏳"
          change={stats.pendingEnrollCount > 0 ? 'Needs attention' : null}
        />
        <StatCard
          label="Pending Projects"
          value={stats.pendingProjectCount}
          icon="📋"
          change={stats.pendingProjectCount > 0 ? 'Needs attention' : null}
        />
        <StatCard label="Total Students"       value={stats.totalStudents}       icon="🎓" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT — My Courses */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-semibold text-gray-800">My Courses</h2>
            <button
              onClick={() => navigate('/courses')}
              className="text-yellow-600 text-sm hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {courses.slice(0, 4).map(course => (
              <div
                key={course._id}
                onClick={() => navigate(`/courses/${course._id}`)}
              >
                <CourseCard course={course} enrollmentStatus={null} />
              </div>
            ))}
            {courses.length === 0 && (
              <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500 text-sm">
                No courses assigned yet
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Pending actions */}
        <div>

          {/* Pending Enrollments */}
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-base font-semibold text-gray-800">Pending Enrollments</h2>
            {stats.pendingEnrollCount > 0 && (
              <span className="bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full px-2 py-0.5">
                {stats.pendingEnrollCount}
              </span>
            )}
          </div>

          {pendingEnrollments.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto mb-6">
              {pendingEnrollments.map(enrollment => (
                <div key={enrollment._id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {enrollment.userId?.fullName || 'Unknown Student'}
                      </p>
                      <p className="text-xs text-gray-400">{enrollment.userId?.email}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Course: {enrollment.courseId?.title || enrollment.courseId}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveEnrollment(enrollment._id)}
                        className="bg-green-500 text-white text-xs px-3 py-1 rounded hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectEnrollment(enrollment._id)}
                        className="border border-red-300 text-red-500 text-xs px-3 py-1 rounded hover:bg-red-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm mb-6">No pending enrollments 🎉</p>
          )}

          {/* Pending Project Pitches */}
          <div className="flex items-center gap-2 mb-3 mt-6">
            <h2 className="text-base font-semibold text-gray-800">Pending Project Pitches</h2>
            {stats.pendingProjectCount > 0 && (
              <span className="bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full px-2 py-0.5">
                {stats.pendingProjectCount}
              </span>
            )}
          </div>

          {pendingProjects.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {pendingProjects.map(project => (
                <div key={project._id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{project.title}</p>
                      <p className="text-xs text-gray-400">
                        By: {project.userId?.fullName || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {project.description?.slice(0, 80)}{project.description?.length > 80 ? '...' : ''}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 ml-3">
                      <button
                        onClick={() => handleApproveProject(project._id)}
                        className="bg-green-500 text-white text-xs px-3 py-1 rounded hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectingId(project._id)}
                        className="border border-red-300 text-red-500 text-xs px-3 py-1 rounded hover:bg-red-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  {/* Inline rejection feedback form */}
                  {rejectingId === project._id && (
                    <div className="mt-3 bg-red-50 rounded p-3">
                      <textarea
                        value={feedbackText}
                        onChange={e => setFeedbackText(e.target.value)}
                        placeholder="Feedback for student (optional)"
                        className="w-full text-sm border border-red-200 rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-red-400"
                        rows={2}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleRejectProject(project._id, feedbackText)}
                          className="bg-red-500 text-white text-xs px-3 py-1 rounded hover:bg-red-600"
                        >
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => { setRejectingId(null); setFeedbackText('') }}
                          className="text-gray-500 text-xs hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No pending pitches 🎉</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default InstructorDashboard
