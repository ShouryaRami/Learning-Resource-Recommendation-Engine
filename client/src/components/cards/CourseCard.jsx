/**
 * CourseCard component
 * Displays a course summary with enrollment status
 * and enroll button for students.
 * @param {Object} course - Course document from API
 * @param {string|null} enrollmentStatus - pending/approved/rejected/null
 * @param {Function} onEnroll - Called with courseId when Enroll clicked
 * @param {boolean} loading - True while enrollment request is in flight
 */
import { useNavigate } from 'react-router-dom'

const statusBadge = (status) => {
  if (!status) return null
  const styles = {
    pending:  'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }
  const labels = { pending: 'Pending', approved: 'Enrolled', rejected: 'Rejected' }
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${styles[status] || ''}`}>
      {labels[status]}
    </span>
  )
}

const CourseCard = ({ course, enrollmentStatus, onEnroll, loading }) => {
  const navigate = useNavigate()

  const handleCardClick = () => {
    if (enrollmentStatus === 'approved') {
      navigate(`/courses/${course._id}`)
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Title row */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-gray-900 truncate max-w-xs">
            {course.title}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">{course.code}</p>
        </div>
        {statusBadge(enrollmentStatus)}
      </div>

      {/* Department */}
      <p className="text-xs text-gray-400 mt-2">
        {course.department?.name || 'No department'}
      </p>

      {/* Semester */}
      <p className="text-sm text-gray-600 mt-1">
        {course.semester || 'Current semester'}
      </p>

      {/* Instructor */}
      <p className="text-sm text-gray-500 mt-3">
        <span className="font-medium">Instructor: </span>
        {course.faculty?.[0]?.fullName || 'TBD'}
      </p>

      {/* Domain tags */}
      {course.domains?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {course.domains.map((domain) => (
            <span
              key={domain}
              className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full"
            >
              {domain}
            </span>
          ))}
        </div>
      )}

      {/* Footer row */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-xs text-gray-400">Max students: {course.maxStudents}</p>

        {/* Action button based on enrollment status */}
        {!enrollmentStatus && course.enrollmentOpen && (
          <button
            onClick={(e) => { e.stopPropagation(); onEnroll(course._id) }}
            disabled={loading}
            className="bg-yellow-400 text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-yellow-500 disabled:opacity-50"
          >
            {loading ? 'Enrolling...' : 'Enroll'}
          </button>
        )}
        {!enrollmentStatus && !course.enrollmentOpen && (
          <span className="text-gray-400 text-sm">Enrollment Closed</span>
        )}
        {enrollmentStatus === 'pending' && (
          <span className="text-yellow-600 text-sm">Awaiting approval</span>
        )}
        {enrollmentStatus === 'approved' && (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/courses/${course._id}`) }}
            className="border border-gray-300 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            View Course
          </button>
        )}
        {enrollmentStatus === 'rejected' && (
          <span className="text-red-500 text-sm">Not enrolled</span>
        )}
      </div>
    </div>
  )
}

export default CourseCard
