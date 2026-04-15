/**
 * TADashboard page
 * Shows TA overview: assigned courses and per-course permissions
 * granted by the instructor. Only actions the TA has permission
 * for are highlighted; everything else shows as read-only access.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import axiosInstance from '../../api/axios'
import StatCard from '../../components/cards/StatCard'
import LoadingSpinner from '../../components/LoadingSpinner'

/** All grantable permission fields with display labels */
const PERM_LABELS = {
  canApproveEnrollments: 'Can approve enrollments',
  canApproveProjects:    'Can approve projects',
  canAddResources:       'Can upload materials',
  canDeleteResources:    'Can delete materials',
  canViewStudentReports: 'Can view reports',
  canGradeStudents:      'Can grade students',
  canRemoveStudents:     'Can remove students',
}

const TADashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [courses, setCourses]         = useState([])
  const [permissions, setPermissions] = useState({})
  const [loading, setLoading]         = useState(true)
  const [stats, setStats]             = useState({ courseCount: 0, totalStudents: 0 })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosInstance.get('/ta/courses')
        const coursesData = res.data
        setCourses(coursesData)
        setStats({ courseCount: coursesData.length, totalStudents: 0 })

        // Fetch permission record for each assigned course
        const permResults = await Promise.all(
          coursesData.map(async (course) => {
            try {
              const p = await axiosInstance.get(`/ta/permissions/check/${course._id}`)
              return { courseId: course._id, perms: p.data }
            } catch {
              return { courseId: course._id, perms: {} }
            }
          })
        )
        const permMap = {}
        permResults.forEach(({ courseId, perms }) => { permMap[courseId] = perms })
        setPermissions(permMap)
      } catch (err) {
        console.error('TADashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    if (user) load()
  }, [user])

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">TA Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome, {user?.fullName}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Assigned Courses"  value={stats.courseCount}    icon="📚" />
        <StatCard label="Total Students"    value={stats.totalStudents}  icon="👥" />
        <StatCard label="My Permissions"    value="Per course"           icon="🔑" />
      </div>

      {/* No courses state */}
      {courses.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">📚</div>
          <p className="font-semibold text-gray-800">No courses assigned yet</p>
          <p className="text-gray-500 text-sm mt-1">
            Contact your instructor or admin to be assigned to a course
          </p>
        </div>
      )}

      {/* Course permission cards */}
      <div className="space-y-4">
        {courses.map(course => {
          const perm = permissions[course._id] || {}
          const grantedLabels = Object.entries(PERM_LABELS)
            .filter(([field]) => perm[field])
            .map(([, label]) => label)

          return (
            <div key={course._id} className="bg-white border border-gray-200 rounded-xl p-5">

              {/* Course header row */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">{course.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {course.code} · {course.semester}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/courses/${course._id}`)}
                  className="bg-yellow-400 text-black text-sm px-4 py-2 rounded-lg font-medium hover:bg-yellow-500"
                >
                  View Course
                </button>
              </div>

              {/* Permissions row */}
              <div className="mt-4">
                <p className="text-xs text-gray-400 uppercase font-medium mb-2">
                  Your permissions for this course
                </p>
                <div className="flex flex-wrap gap-2">
                  {grantedLabels.length > 0 ? (
                    grantedLabels.map(label => (
                      <span
                        key={label}
                        className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full"
                      >
                        {label}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-xs">Read-only access</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TADashboard
