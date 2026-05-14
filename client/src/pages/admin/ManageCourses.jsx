/**
 * ManageCourses page
 * Admin can view all courses and create new ones
 * with faculty and TA assignment.
 */
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getAllCourses, createCourse, deleteCourse } from '../../api/courses'
import { getUsers } from '../../api/admin'
import axiosInstance from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useUI } from '../../context/UIContext'

const EMPTY_FORM = {
  title: '',
  code: '',
  description: '',
  department: '',
  semester: 'Spring 2026',
  maxStudents: 30,
  enrollmentOpen: true,
  faculty: [],
  tas: []
}

const ManageCourses = () => {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { showToast } = useUI()

  const [courses, setCourses]         = useState([])
  const [departments, setDepartments] = useState([])
  const [users, setUsers]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState({
    ...EMPTY_FORM,
    department: location.state?.defaultDept || ''
  })
  const [saving, setSaving]           = useState(false)
  const [deletingCourseId, setDeletingCourseId] = useState(null)

  useEffect(() => {
    if (location.state?.defaultDept) setShowForm(true)
  }, [location.state?.defaultDept])

  useEffect(() => {
    const load = async () => {
      try {
        const [coursesData, deptsData, usersData] = await Promise.all([
          getAllCourses(),
          axiosInstance.get('/departments').then(r => r.data),
          getUsers()
        ])
        setCourses(coursesData)
        setDepartments(deptsData)
        setUsers(usersData)
      } catch (err) {
        console.error('ManageCourses load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const toggleInArray = (arr, value) =>
    arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]

  const handleCreate = async () => {
    if (!form.title.trim() || !form.code.trim() || !form.department) {
      showToast('Title, code, and department are required', 'error')
      return
    }
    setSaving(true)
    try {
      const result = await createCourse(form)
      setCourses(prev => [result.course || result, ...prev])
      setForm(EMPTY_FORM)
      setShowForm(false)
      showToast('Course created successfully')
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Failed to create course',
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Deactivate this course? Students will lose access.')) return
    setDeletingCourseId(courseId)
    try {
      await deleteCourse(courseId)
      setCourses(prev => prev.filter(c => c._id !== courseId))
      showToast('Course deactivated')
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Failed to deactivate course',
        'error'
      )
    } finally {
      setDeletingCourseId(null)
    }
  }

  const instructors = users.filter(u => u.role === 'instructor')
  const tas         = users.filter(u => u.role === 'ta')

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Courses</h1>
          <p className="text-gray-500 text-sm mt-1">
            {courses.length} course{courses.length !== 1 ? 's' : ''} in system
          </p>
        </div>
        <button
          onClick={() => setShowForm(prev => !prev)}
          className="bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500"
        >
          {showForm ? 'Cancel' : '+ New Course'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Create New Course</h3>

          {/* Row 1 — Title + Code */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Software Engineering Capstone"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
              <input
                type="text"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. SENG 601"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>

          {/* Row 2 — Department + Semester + Max Students */}
          <div className="grid grid-cols-3 gap-4 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="">Select department</option>
                {departments.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <input
                type="text"
                value={form.semester}
                onChange={e => setForm({ ...form, semester: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
              <input
                type="number"
                value={form.maxStudents}
                onChange={e => setForm({ ...form, maxStudents: parseInt(e.target.value) || 30 })}
                min={1}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Brief course description"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
            />
          </div>

          {/* Faculty assignment */}
          {instructors.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Faculty (select one or more)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {instructors.map(inst => (
                  <div
                    key={inst._id}
                    onClick={() => setForm({ ...form, faculty: toggleInArray(form.faculty, inst._id) })}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-100"
                  >
                    <input
                      type="checkbox"
                      readOnly
                      checked={form.faculty.includes(inst._id)}
                      className="accent-yellow-400"
                    />
                    <div>
                      <span className="text-sm text-gray-800">{inst.fullName}</span>
                      <span className="text-xs text-gray-400 ml-1">{inst.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TA assignment */}
          {tas.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Teaching Assistants (optional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {tas.map(ta => (
                  <div
                    key={ta._id}
                    onClick={() => setForm({ ...form, tas: toggleInArray(form.tas, ta._id) })}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-100"
                  >
                    <input
                      type="checkbox"
                      readOnly
                      checked={form.tas.includes(ta._id)}
                      className="accent-yellow-400"
                    />
                    <div>
                      <span className="text-sm text-gray-800">{ta.fullName}</span>
                      <span className="text-xs text-gray-400 ml-1">{ta.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enrollment toggle */}
          <div className="flex items-center gap-3 mt-4">
            <input
              type="checkbox"
              id="enrollmentOpen"
              checked={form.enrollmentOpen}
              onChange={() => setForm({ ...form, enrollmentOpen: !form.enrollmentOpen })}
              className="w-4 h-4 accent-yellow-400"
            />
            <label htmlFor="enrollmentOpen" className="text-sm text-gray-700 cursor-pointer">
              Enrollment open for students
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-5">
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
              className="border border-gray-300 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="bg-yellow-400 text-black text-sm px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </div>
      )}

      {/* Courses list */}
      {loading ? (
        <LoadingSpinner />
      ) : courses.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">📚</div>
          <p className="font-semibold text-gray-700">No courses yet</p>
          <p className="text-sm mt-1">Create your first course above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map(course => (
            <div key={course._id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{course.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {course.code} · {course.semester} · {course.department?.name || '—'}
                  </p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                      {course.faculty?.length || 0} instructor(s)
                    </span>
                    <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                      {course.tas?.length || 0} TA(s)
                    </span>
                  </div>
                  {course.faculty?.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Faculty: {course.faculty.map(f => f.fullName || 'Instructor').join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs rounded-full px-2 py-1 ${
                    course.enrollmentOpen
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {course.enrollmentOpen ? 'Enrollment Open' : 'Enrollment Closed'}
                  </span>
                  <span className={`text-xs rounded-full px-2 py-1 ${
                    course.isActive !== false
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {course.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => navigate(`/courses/${course._id}`)}
                    className="text-yellow-600 text-sm hover:underline"
                  >
                    View →
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course._id)}
                    disabled={deletingCourseId === course._id}
                    className="text-red-500 text-sm hover:underline disabled:opacity-50"
                  >
                    {deletingCourseId === course._id ? 'Deactivating...' : 'Deactivate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ManageCourses
