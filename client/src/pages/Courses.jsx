/**
 * Courses page
 * Browse all available courses with department filter.
 * Students can request enrollment from this page.
 * Shows enrollment status for each course.
 */
import { useState, useEffect } from 'react'
import { getAllCourses } from '../api/courses'
import { getMyEnrollments, requestEnrollment } from '../api/enrollments'
import CourseCard from '../components/cards/CourseCard'
import LoadingSpinner from '../components/LoadingSpinner'

const Courses = () => {
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState({}) // courseId -> status
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterDept, setFilterDept] = useState('all')
  const [departments, setDepartments] = useState([])
  const [enrollingId, setEnrollingId] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [coursesData, enrollmentsData] = await Promise.all([
          getAllCourses(),
          getMyEnrollments()
        ])

        // Build courseId -> status lookup map
        const map = {}
        enrollmentsData.forEach((e) => {
          const id = e.courseId?._id || e.courseId
          map[id] = e.status
        })

        setCourses(coursesData)
        setEnrollments(map)

        // Extract unique departments from courses for the filter dropdown
        const depts = [...new Map(
          coursesData
            .filter((c) => c.department)
            .map((c) => [c.department._id, c.department])
        ).values()]
        setDepartments(depts)
      } catch (err) {
        console.error('Courses load error:', err)
        setError('Failed to load courses. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleEnroll = async (courseId) => {
    setEnrollingId(courseId)
    try {
      await requestEnrollment(courseId)
      // Optimistically update enrollment status to pending
      setEnrollments((prev) => ({ ...prev, [courseId]: 'pending' }))
      setSuccessMsg('Enrollment request submitted! Awaiting approval.')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setError(err.response?.data?.message || 'Enrollment failed. Please try again.')
      setTimeout(() => setError(''), 4000)
    } finally {
      setEnrollingId(null)
    }
  }

  const filtered = filterDept === 'all'
    ? courses
    : courses.filter((c) => (c.department?._id || c.department) === filterDept)

  return (
    <>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Available Courses</h1>
        <p className="text-sm text-gray-500 mt-1">
          Browse and enroll in courses to get started
        </p>
      </div>

      {/* Filter row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Department:</label>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>{dept.name}</option>
            ))}
          </select>
        </div>
        <p className="text-sm text-gray-500">{filtered.length} courses found</p>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-green-700 text-sm text-center">
          {successMsg}
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm text-center">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No courses found</p>
          <p className="text-gray-400 text-sm mt-1">
            Try changing the department filter
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              enrollmentStatus={enrollments[course._id] || null}
              onEnroll={handleEnroll}
              loading={enrollingId === course._id}
            />
          ))}
        </div>
      )}
    </>
  )
}

export default Courses
