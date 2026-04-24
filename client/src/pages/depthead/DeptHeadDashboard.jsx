/**
 * DeptHeadDashboard page
 * Dashboard for instructors with isDepartmentHead: true.
 * Shows department courses and handles pending enrollment requests
 * across all courses the department head manages.
 */
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getAllCourses } from '../../api/courses'
import {
  getCourseEnrollments,
  approveEnrollment,
  rejectEnrollment,
} from '../../api/enrollments'
import StatCard from '../../components/cards/StatCard'
import LoadingSpinner from '../../components/LoadingSpinner'

const DeptHeadDashboard = () => {
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [courses, setCourses]                     = useState([])
  const [pendingEnrollments, setPendingEnrollments] = useState([])
  const [loading, setLoading]                     = useState(true)
  const [stats, setStats]                         = useState({
    courseCount:      0,
    totalStudents:    0,
    pendingEnrollCount: 0,
    instructorCount:  0,
  })

  useEffect(() => {
    const load = async () => {
      try {
        const allCourses = await getAllCourses()
        const userId = user?._id || user?.id

        // Department head sees all courses where they appear in faculty
        const myCourses = allCourses.filter(course =>
          course.faculty?.some(f => {
            const fId = f._id?.toString() || f?.toString()
            return fId === userId?.toString()
          })
        )
        setCourses(myCourses)

        // Fetch enrollments for each course in parallel
        const enrollmentResults = await Promise.all(
          myCourses.map(c => getCourseEnrollments(c._id).catch(() => []))
        )
        const allEnrollments = enrollmentResults.flat()
        const pending        = allEnrollments.filter(e => e.status === 'pending')
        const approved       = allEnrollments.filter(e => e.status === 'approved')

        // Count unique instructors across all courses
        const instructorIds = new Set()
        myCourses.forEach(c => {
          c.faculty?.forEach(f => {
            const fId = f._id?.toString() || f?.toString()
            if (fId !== userId?.toString()) instructorIds.add(fId)
          })
        })

        setPendingEnrollments(pending)
        setStats({
          courseCount:       myCourses.length,
          totalStudents:     approved.length,
          pendingEnrollCount: pending.length,
          instructorCount:   instructorIds.size,
        })
      } catch (err) {
        console.error('DeptHeadDashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    if (user) load()
  }, [user])

  const handleApprove = async (enrollmentId) => {
    try {
      await approveEnrollment(enrollmentId)
      setPendingEnrollments(prev => prev.filter(e => e._id !== enrollmentId))
      setStats(prev => ({
        ...prev,
        pendingEnrollCount: prev.pendingEnrollCount - 1,
        totalStudents:      prev.totalStudents + 1,
      }))
    } catch (err) {
      console.error('Approve enrollment error:', err)
    }
  }

  const handleReject = async (enrollmentId) => {
    try {
      await rejectEnrollment(enrollmentId)
      setPendingEnrollments(prev => prev.filter(e => e._id !== enrollmentId))
      setStats(prev => ({
        ...prev,
        pendingEnrollCount: prev.pendingEnrollCount - 1,
      }))
    } catch (err) {
      console.error('Reject enrollment error:', err)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center text-black font-bold text-xl flex-shrink-0">
          DH
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Head Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {user?.fullName} · Department Head
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="My Courses"          value={stats.courseCount}       icon="📚" />
        <StatCard label="Total Students"      value={stats.totalStudents}     icon="👥" />
        <StatCard
          label="Pending Enrollments"
          value={stats.pendingEnrollCount}
          icon="⏳"
          change={stats.pendingEnrollCount > 0 ? 'Needs attention' : null}
        />
        <StatCard label="Instructors"         value={stats.instructorCount}   icon="👨‍🏫" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT — Department Courses (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-gray-800">Department Courses</h2>
            <Link to="/courses" className="text-yellow-600 text-sm hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {courses.length === 0 && (
              <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 text-sm">
                No courses assigned yet
              </div>
            )}
            {courses.map(course => (
              <div
                key={course._id}
                onClick={() => navigate(`/courses/${course._id}`)}
                className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:shadow-sm cursor-pointer transition-shadow"
              >
                <div>
                  <p className="font-semibold text-gray-900">{course.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {course.code} · {course.semester}
                  </p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs text-gray-400">
                      {course.faculty?.length || 0} instructor{course.faculty?.length !== 1 ? 's' : ''}
                    </span>
                    {course.maxStudents && (
                      <span className="text-xs text-gray-400">
                        · Max {course.maxStudents} students
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {course.isActive !== false ? (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
                      Inactive
                    </span>
                  )}
                  <span className="text-yellow-600 text-sm">Manage →</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Pending Enrollments (1/3 width) */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-gray-800">Pending Enrollments</h2>
            {stats.pendingEnrollCount > 0 && (
              <span className="bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full px-2 py-0.5">
                {stats.pendingEnrollCount}
              </span>
            )}
          </div>

          {pendingEnrollments.length === 0 ? (
            <p className="text-gray-400 text-sm">No pending enrollments 🎉</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {pendingEnrollments.slice(0, 10).map(enrollment => (
                <div key={enrollment._id} className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900">
                    {enrollment.userId?.fullName || 'Unknown Student'}
                  </p>
                  <p className="text-xs text-gray-400">{enrollment.userId?.email}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Course: {enrollment.courseId?.title || '—'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleApprove(enrollment._id)}
                      className="bg-green-500 text-white text-xs px-3 py-1 rounded hover:bg-green-600"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(enrollment._id)}
                      className="border border-red-300 text-red-500 text-xs px-3 py-1 rounded hover:bg-red-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DeptHeadDashboard
