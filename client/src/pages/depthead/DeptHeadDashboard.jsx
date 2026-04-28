/**
 * DeptHeadDashboard page
 * Dashboard for instructors with isDepartmentHead: true.
 * Shows department courses and handles pending enrollment requests
 * across all courses the department head manages.
 */
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getAllCourses, createCourse, deleteCourse } from '../../api/courses'
import {
  approveEnrollment,
  rejectEnrollment,
} from '../../api/enrollments'
import axiosInstance from '../../api/axios'
import StatCard from '../../components/cards/StatCard'
import LoadingSpinner from '../../components/LoadingSpinner'

const EMPTY_COURSE_FORM = {
  title: '',
  code: '',
  description: '',
  department: '',
  semester: 'Spring 2026',
  maxStudents: 30,
  enrollmentOpen: true
}

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

  // Course creation state
  const [showCourseForm, setShowCourseForm]   = useState(false)
  const [courseForm, setCourseForm]           = useState(EMPTY_COURSE_FORM)
  const [savingCourse, setSavingCourse]       = useState(false)
  const [deletingCourseId, setDeletingCourseId] = useState(null)
  const [notification, setNotification]       = useState({ message: '', type: '' })
  const [departments, setDepartments]         = useState([])
  const [coursesByDept, setCoursesByDept]     = useState({})

  useEffect(() => {
    const load = async () => {
      try {
        const [allCourses, deptsData] = await Promise.all([
          getAllCourses(),
          axiosInstance.get('/departments').then(r => r.data).catch(() => [])
        ])
        const userId = user?._id || user?.id

        setDepartments(deptsData)

        // Robust filter — handles both populated objects and plain ObjectId strings
        const myCourses = allCourses.filter(course =>
          course.faculty?.some(f => {
            const fId = typeof f === 'object'
              ? (f._id?.toString() || f.toString())
              : f.toString()
            return fId === user._id?.toString() || fId === user.id?.toString()
          })
        )
        setCourses(myCourses)

        // Group courses by department name
        const grouped = myCourses.reduce((acc, course) => {
          const deptName = course.department?.name || 'No Department'
          if (!acc[deptName]) acc[deptName] = []
          acc[deptName].push(course)
          return acc
        }, {})
        setCoursesByDept(grouped)

        // Fetch pending enrollments per course using ?status=pending
        const allPending = []
        for (const course of myCourses) {
          try {
            const res = await axiosInstance.get(
              `/enrollments/course/${course._id}?status=pending`
            )
            if (Array.isArray(res.data)) {
              allPending.push(...res.data.map(e => ({
                ...e,
                courseName: course.title
              })))
            }
          } catch (err) {
            console.error('Enrollment fetch error for', course.title, err.message)
          }
        }

        // Count unique instructors across all courses
        const instructorIds = new Set()
        myCourses.forEach(c => {
          c.faculty?.forEach(f => {
            const fId = (typeof f === 'object' ? f._id : f)?.toString()
            if (fId !== user._id?.toString() && fId !== user.id?.toString()) {
              instructorIds.add(fId)
            }
          })
        })

        setPendingEnrollments(allPending)
        setStats({
          courseCount:        myCourses.length,
          totalStudents:      0,
          pendingEnrollCount: allPending.length,
          instructorCount:    instructorIds.size,
        })
      } catch (err) {
        console.error('DeptHeadDashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    if (user) load()
  }, [user])

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification({ message: '', type: '' }), 3000)
  }

  const handleCreateCourse = async () => {
    if (!courseForm.title.trim() || !courseForm.code.trim()) {
      showNotification('Title and code are required', 'error')
      return
    }
    if (!courseForm.department) {
      showNotification('Please select a department', 'error')
      return
    }
    setSavingCourse(true)
    try {
      const result = await createCourse(courseForm)
      const newCourse = result.course || result
      setCourses(prev => {
        const updated = [newCourse, ...prev]
        const grouped = updated.reduce((acc, c) => {
          const deptName = c.department?.name || 'Unassigned'
          if (!acc[deptName]) acc[deptName] = []
          acc[deptName].push(c)
          return acc
        }, {})
        setCoursesByDept(grouped)
        return updated
      })
      setStats(prev => ({ ...prev, courseCount: prev.courseCount + 1 }))
      setCourseForm(EMPTY_COURSE_FORM)
      setShowCourseForm(false)
      showNotification('Course created successfully')
    } catch (err) {
      showNotification(
        err.response?.data?.message || 'Failed to create course',
        'error'
      )
    } finally {
      setSavingCourse(false)
    }
  }

  const handleDeleteCourse = async (e, courseId) => {
    e.stopPropagation()
    if (!window.confirm('Deactivate this course? Students will lose access.')) return
    setDeletingCourseId(courseId)
    try {
      await deleteCourse(courseId)
      setCourses(prev => {
        const updated = prev.filter(c => c._id !== courseId)
        const grouped = updated.reduce((acc, c) => {
          const deptName = c.department?.name || 'Unassigned'
          if (!acc[deptName]) acc[deptName] = []
          acc[deptName].push(c)
          return acc
        }, {})
        setCoursesByDept(grouped)
        return updated
      })
      setStats(prev => ({ ...prev, courseCount: prev.courseCount - 1 }))
      showNotification('Course deactivated')
    } catch (err) {
      showNotification(
        err.response?.data?.message || 'Failed to deactivate course',
        'error'
      )
    } finally {
      setDeletingCourseId(null)
    }
  }

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
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center text-black font-bold text-xl flex-shrink-0">
          DH
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Head Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Department-wide overview across all your courses
          </p>
        </div>
      </div>

      {/* Info note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-blue-700 text-sm">
        You are viewing the Department Head view, which shows all courses across all departments
        where you are faculty. For your personal pending actions go to{' '}
        <Link to="/instructor/dashboard" className="text-blue-600 underline font-medium">
          Instructor Dashboard →
        </Link>
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCourseForm(prev => !prev)}
                className="bg-yellow-400 text-black text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-yellow-500"
              >
                {showCourseForm ? 'Cancel' : '+ New Course'}
              </button>
              <Link to="/courses" className="text-yellow-600 text-sm hover:underline">
                View All
              </Link>
            </div>
          </div>

          {/* Notification */}
          {notification.message && (
            <div className={`rounded-lg p-3 mb-3 text-sm flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <span>{notification.type === 'success' ? '✓' : '✕'}</span>
              <span>{notification.message}</span>
            </div>
          )}

          {/* Create course inline form */}
          {showCourseForm && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">Create New Course</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={courseForm.title}
                    onChange={e => setCourseForm({ ...courseForm, title: e.target.value })}
                    placeholder="e.g. Software Engineering"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Code</label>
                  <input
                    type="text"
                    value={courseForm.code}
                    onChange={e => setCourseForm({ ...courseForm, code: e.target.value })}
                    placeholder="e.g. SENG 601"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={courseForm.description}
                  onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
                  rows={2}
                  placeholder="Brief course description"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={courseForm.department}
                    onChange={e => setCourseForm({ ...courseForm, department: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="">Select...</option>
                    {departments.map(d => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Semester</label>
                  <input
                    type="text"
                    value={courseForm.semester}
                    onChange={e => setCourseForm({ ...courseForm, semester: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Students</label>
                  <input
                    type="number"
                    value={courseForm.maxStudents}
                    onChange={e => setCourseForm({ ...courseForm, maxStudents: parseInt(e.target.value) || 30 })}
                    min={1}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <input
                  type="checkbox"
                  id="deptEnrollOpen"
                  checked={courseForm.enrollmentOpen}
                  onChange={() => setCourseForm({ ...courseForm, enrollmentOpen: !courseForm.enrollmentOpen })}
                  className="w-4 h-4 accent-yellow-400"
                />
                <label htmlFor="deptEnrollOpen" className="text-sm text-gray-700 cursor-pointer">
                  Enrollment open for students
                </label>
              </div>

              <div className="flex gap-2 justify-end mt-4">
                <button
                  onClick={() => { setShowCourseForm(false); setCourseForm(EMPTY_COURSE_FORM) }}
                  className="border border-gray-300 text-gray-600 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCourse}
                  disabled={savingCourse}
                  className="bg-yellow-400 text-black text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-yellow-500 disabled:opacity-50"
                >
                  {savingCourse ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {courses.length === 0 && (
              <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 text-sm">
                No courses assigned yet
              </div>
            )}
            {Object.entries(coursesByDept).map(([deptName, deptCourses]) => (
              <div key={deptName}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">{deptName}</h3>
                  <span className="bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full px-2 py-0.5">
                    {deptCourses.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {deptCourses.map(course => (
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
                        <button
                          onClick={(e) => handleDeleteCourse(e, course._id)}
                          disabled={deletingCourseId === course._id}
                          className="text-red-500 text-xs hover:underline disabled:opacity-50"
                        >
                          {deletingCourseId === course._id ? 'Deactivating...' : 'Deactivate'}
                        </button>
                      </div>
                    </div>
                  ))}
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
