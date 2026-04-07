/**
 * CourseDetail page
 * Shows full course information, faculty details,
 * and the student's projects within this course.
 * Faculty and TAs see all enrolled student projects.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getCourse, getCourseStudents } from '../api/courses'
import { getMyEnrollments, requestEnrollment } from '../api/enrollments'
import LoadingSpinner from '../components/LoadingSpinner'

// Badge for enrollment status shown to students
const enrollmentBadge = (status) => {
  if (!status) return <span className="text-xs text-gray-400 px-3 py-1 rounded-full border border-gray-600">Not enrolled</span>
  const styles = {
    pending:  'bg-yellow-900 text-yellow-300 border-yellow-600',
    approved: 'bg-green-900 text-green-300 border-green-600',
    rejected: 'bg-red-900 text-red-300 border-red-600',
  }
  const labels = {
    pending:  'Enrollment pending',
    approved: 'Enrolled',
    rejected: 'Not approved',
  }
  return (
    <span className={`text-xs px-3 py-1 rounded-full border ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

const CourseDetail = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [myEnrollment, setMyEnrollment] = useState(null)
  const [students, setStudents] = useState([])
  const [enrolling, setEnrolling] = useState(false)

  // Instructors and TAs can see the student roster
  const isStaff = ['faculty', 'ta', 'admin'].includes(user?.role)

  useEffect(() => {
    const load = async () => {
      try {
        const [courseData, enrollmentData] = await Promise.all([
          getCourse(courseId),
          getMyEnrollments()
        ])
        setCourse(courseData)

        // Find this user's enrollment for this specific course
        const found = enrollmentData.find(
          (e) => (e.courseId?._id || e.courseId) === courseId
        )
        setMyEnrollment(found || null)

        // Staff can see all enrolled students
        if (isStaff) {
          const studentsData = await getCourseStudents(courseId)
          setStudents(studentsData)
        }
      } catch (err) {
        console.error('CourseDetail load error:', err)
        setError('Failed to load course. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnroll = async () => {
    setEnrolling(true)
    try {
      await requestEnrollment(courseId)
      setMyEnrollment({ status: 'pending' })
    } catch (err) {
      setError(err.response?.data?.message || 'Enrollment request failed.')
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => navigate('/courses')}
          className="text-yellow-600 hover:underline text-sm"
        >
          ← Back to Courses
        </button>
      </div>
    )
  }

  if (!course) {
    return <div className="text-center py-20 text-gray-500">Course not found</div>
  }

  return (
    <>
      {/* Hero section */}
      <div className="bg-black rounded-xl p-8 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">{course.title}</h1>
            <p className="text-gray-400 text-base mt-1">
              {course.code} · {course.semester}
            </p>
            {course.description && (
              <p className="text-gray-300 text-sm mt-3 max-w-2xl">{course.description}</p>
            )}
          </div>
          {/* Enrollment status badge for students */}
          {user?.role === 'student' && (
            <div className="flex-shrink-0">
              {enrollmentBadge(myEnrollment?.status || null)}
            </div>
          )}
        </div>
      </div>

      {/* Info cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Department */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Department</p>
          <p className="text-base font-semibold text-gray-900 mt-1">
            {course.department?.name || 'N/A'}
          </p>
        </div>

        {/* Faculty */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Instructor</p>
          {course.faculty?.length > 0 ? (
            course.faculty.map((f) => (
              <div key={f._id} className="mt-1">
                <p className="font-medium text-gray-900">{f.fullName}</p>
                <p className="text-gray-500 text-sm">{f.email}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400 mt-1">TBD</p>
          )}
        </div>

        {/* TAs */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Teaching Assistants
          </p>
          {course.tas?.length > 0 ? (
            course.tas.map((ta) => (
              <p key={ta._id} className="font-medium text-gray-900 mt-1">{ta.fullName}</p>
            ))
          ) : (
            <p className="text-gray-400 mt-1">None assigned</p>
          )}
        </div>
      </div>

      {/* Student: enrolled — show projects section */}
      {user?.role === 'student' && myEnrollment?.status === 'approved' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">My Projects in This Course</h2>
            <Link
              to="/new-project"
              state={{ courseId }}
              className="bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500"
            >
              + New Project
            </Link>
          </div>
          <p className="text-gray-500 text-sm">Your projects for this course</p>
          <div className="mt-4 text-center text-gray-400 py-8">
            No projects yet. Create your first project!
          </div>
        </div>
      )}

      {/* Student: not enrolled or rejected — show enroll CTA */}
      {user?.role === 'student' && (!myEnrollment || myEnrollment.status === 'rejected') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Enroll in This Course</h3>
          <p className="text-gray-600 text-sm mt-1">
            Request enrollment to access projects, materials, and personalized
            recommendations for this course.
          </p>
          <button
            onClick={handleEnroll}
            disabled={enrolling || !course.enrollmentOpen}
            className="mt-4 bg-yellow-400 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500 disabled:opacity-50"
          >
            {enrolling ? 'Requesting...' : 'Request Enrollment'}
          </button>
          {!course.enrollmentOpen && (
            <p className="text-gray-500 text-sm mt-2">Enrollment is currently closed.</p>
          )}
        </div>
      )}

      {/* Student: pending */}
      {user?.role === 'student' && myEnrollment?.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Enrollment Pending</h3>
          <p className="text-gray-600 text-sm mt-1">
            Your enrollment request is awaiting approval from the instructor.
          </p>
        </div>
      )}

      {/* Staff: enrolled students table */}
      {isStaff && students.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Enrolled Students ({students.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Skill Level</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Approved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((enrollment) => (
                  <tr key={enrollment._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {enrollment.userId?.fullName}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {enrollment.userId?.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs capitalize">
                        {enrollment.userId?.skillLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs capitalize">
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {enrollment.approvedAt
                        ? new Date(enrollment.approvedAt).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isStaff && students.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-400">
          No students enrolled yet.
        </div>
      )}
    </>
  )
}

export default CourseDetail
