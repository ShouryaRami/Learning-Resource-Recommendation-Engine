/**
 * ManageDepartments page
 * Admin can view all departments, create new ones,
 * and manage each department's courses, faculty,
 * and department head assignment.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axios'
import { getUsers } from '../../api/admin'
import { getAllCourses } from '../../api/courses'
import LoadingSpinner from '../../components/LoadingSpinner'

const ManageDepartments = () => {
  const navigate = useNavigate()

  // Department list state
  const [departments, setDepartments]   = useState([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [form, setForm]                 = useState({ name: '', code: '', description: '' })
  const [saving, setSaving]             = useState(false)
  const [notification, setNotification] = useState({ message: '', type: '' })

  // Department detail state
  const [selectedDept, setSelectedDept]     = useState(null)
  const [deptCourses, setDeptCourses]       = useState([])
  const [deptFaculty, setDeptFaculty]       = useState([])
  const [loadingDetail, setLoadingDetail]   = useState(false)
  const [editMode, setEditMode]             = useState(false)
  const [editForm, setEditForm]             = useState({ name: '', code: '', description: '' })
  const [deletingDept, setDeletingDept]     = useState(false)

  useEffect(() => {
    axiosInstance.get('/departments')
      .then(r => setDepartments(r.data))
      .catch(err => console.error('Load departments error:', err))
      .finally(() => setLoading(false))
  }, [])

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification({ message: '', type: '' }), 3000)
  }

  const handleSelectDept = async (dept) => {
    setSelectedDept(dept)
    setEditMode(false)
    setLoadingDetail(true)
    try {
      const [allCourses, allInstructors] = await Promise.all([
        getAllCourses(),
        getUsers({ role: 'instructor' })
      ])
      const filtered = allCourses.filter(c => {
        const dId = c.department?._id || c.department
        return dId?.toString() === dept._id?.toString()
      })
      setDeptCourses(filtered)
      setDeptFaculty(allInstructors)
    } catch (err) {
      console.error('Load dept detail error:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleCreate = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      showNotification('Department name and code are required', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await axiosInstance.post('/departments', form)
      setDepartments(prev => [...prev, res.data.department || res.data])
      setForm({ name: '', code: '', description: '' })
      setShowForm(false)
      showNotification('Department created successfully')
    } catch (err) {
      showNotification(
        err.response?.data?.message || 'Failed to create department',
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateDepartment = async () => {
    try {
      const res = await axiosInstance.patch(`/departments/${selectedDept._id}`, editForm)
      const updated = res.data.department || res.data
      setDepartments(prev => prev.map(d => d._id === selectedDept._id ? updated : d))
      setSelectedDept(updated)
      setEditMode(false)
      showNotification('Department updated')
    } catch (err) {
      showNotification(
        err.response?.data?.message || 'Failed to update department',
        'error'
      )
    }
  }

  const handleDeleteDepartment = async (deptId) => {
    if (!window.confirm(
      'Delete this department? This will not delete the courses inside it. Are you sure?'
    )) return
    setDeletingDept(true)
    try {
      await axiosInstance.delete(`/departments/${deptId}`)
      setDepartments(prev => prev.filter(d => d._id !== deptId))
      setSelectedDept(null)
      showNotification('Department deleted')
    } catch (err) {
      showNotification(
        err.response?.data?.message || 'Failed to delete department',
        'error'
      )
    } finally {
      setDeletingDept(false)
    }
  }

  const handleToggleDeptHead = async (userId, currentValue) => {
    try {
      const res = await axiosInstance.patch(`/admin/users/${userId}`, {
        isDepartmentHead: !currentValue
      })
      const updatedUser = res.data.user
      setDeptFaculty(prev =>
        prev.map(u => u._id === userId ? { ...u, isDepartmentHead: updatedUser.isDepartmentHead } : u)
      )
    } catch (err) {
      showNotification('Failed to update department head', 'error')
    }
  }

  // Unique instructors across courses in this department
  const deptInstructorIds = new Set()
  deptCourses.forEach(c =>
    c.faculty?.forEach(f => deptInstructorIds.add((f._id || f).toString()))
  )
  const deptInstructors = deptFaculty.filter(u => deptInstructorIds.has(u._id?.toString()))

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Departments</h1>
          <p className="text-gray-500 text-sm mt-1">
            {departments.length} department{departments.length !== 1 ? 's' : ''} in system
          </p>
        </div>
        <button
          onClick={() => setShowForm(prev => !prev)}
          className="bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500"
        >
          {showForm ? 'Cancel' : '+ New Department'}
        </button>
      </div>

      {/* Notification */}
      {notification.message && (
        <div className={`rounded-lg p-3 mb-4 text-sm flex items-center gap-2 ${
          notification.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <span>{notification.type === 'success' ? '✓' : '✕'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Create New Department</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Software Engineering"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
              <input
                type="text"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. SENG"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Brief description of the department"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowForm(false)}
              className="border border-gray-300 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="bg-yellow-400 text-black text-sm px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Department'}
            </button>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      {loading ? (
        <LoadingSpinner />
      ) : departments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🏛️</div>
          <p className="font-semibold text-gray-700">No departments yet</p>
          <p className="text-gray-400 text-sm mt-1">Create your first department above</p>
        </div>
      ) : (
        <div className="flex gap-6">

          {/* LEFT — Department list */}
          <div className="w-1/3 flex-shrink-0">
            <div className="space-y-2">
              {departments.map(dept => (
                <div
                  key={dept._id}
                  onClick={() => handleSelectDept(dept)}
                  className={`bg-white border rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-shadow ${
                    selectedDept?._id === dept._id
                      ? 'border-yellow-400 shadow-sm'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
                    {dept.code?.slice(0, 4)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{dept.name}</p>
                    <p className="text-xs text-gray-400 truncate">{dept.description || 'No description'}</p>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    dept.isActive !== false
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {dept.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Department detail panel */}
          <div className="flex-1">
            {!selectedDept ? (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-12 text-center">
                <div className="text-4xl mb-3">👈</div>
                <p className="text-gray-500 text-sm">Select a department to view details</p>
              </div>
            ) : loadingDetail ? (
              <LoadingSpinner />
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6">

                {/* Detail header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center text-black font-bold">
                      {selectedDept.code?.slice(0, 4)}
                    </div>
                    <div>
                      <h2 className="font-bold text-xl text-gray-900">{selectedDept.name}</h2>
                      <p className="text-gray-500 text-sm">{selectedDept.code}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditMode(true)
                        setEditForm({
                          name: selectedDept.name,
                          code: selectedDept.code,
                          description: selectedDept.description || ''
                        })
                      }}
                      className="border border-gray-300 text-gray-600 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDepartment(selectedDept._id)}
                      disabled={deletingDept}
                      className="border border-red-300 text-red-500 text-sm px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingDept ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>

                {/* Edit form */}
                {editMode && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Code</label>
                        <input
                          type="text"
                          value={editForm.code}
                          onChange={e => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={() => setEditMode(false)}
                        className="border border-gray-300 text-gray-600 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateDepartment}
                        className="bg-yellow-400 text-black text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-yellow-500"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{deptCourses.length}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Courses</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{deptInstructors.length}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Faculty</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {deptCourses.filter(c => c.isActive !== false).length}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Active Courses</p>
                  </div>
                </div>

                {/* Courses section */}
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-800">Courses</h3>
                  <button
                    onClick={() => navigate('/admin/courses', {
                      state: { defaultDept: selectedDept._id }
                    })}
                    className="text-yellow-600 text-sm hover:underline"
                  >
                    + Add Course
                  </button>
                </div>

                {deptCourses.length === 0 ? (
                  <p className="text-gray-400 text-sm mb-5">No courses in this department</p>
                ) : (
                  <div className="mb-5 space-y-2">
                    {deptCourses.map(course => (
                      <div
                        key={course._id}
                        className="bg-white border border-gray-100 rounded-lg p-3 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium text-sm text-gray-900">{course.title}</p>
                          <p className="text-xs text-gray-400">{course.code} · {course.semester}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            course.isActive !== false
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {course.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            onClick={() => navigate(`/courses/${course._id}`)}
                            className="text-yellow-600 text-xs hover:underline"
                          >
                            View →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Faculty in department */}
                <h3 className="font-semibold text-gray-800 mb-3">
                  Instructors with courses in this department
                </h3>
                {deptInstructors.length === 0 ? (
                  <p className="text-gray-400 text-sm mb-5">No instructors assigned to courses yet</p>
                ) : (
                  <div className="mb-5 space-y-2">
                    {deptInstructors.map(inst => (
                      <div key={inst._id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                          {inst.fullName?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{inst.fullName}</p>
                          <p className="text-xs text-gray-400 truncate">{inst.email}</p>
                        </div>
                        {inst.isDepartmentHead && (
                          <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full ml-auto flex-shrink-0">
                            Dept Head
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Department Head Assignment */}
                <h3 className="font-semibold text-gray-800 mb-2">Department Head Assignment</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Assign one or more instructors as department head. A faculty member can be
                  dept head of multiple departments.
                </p>
                <div className="space-y-1 mb-4">
                  {deptFaculty.map(inst => (
                    <div
                      key={inst._id}
                      onClick={() => handleToggleDeptHead(inst._id, inst.isDepartmentHead)}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        readOnly
                        checked={!!inst.isDepartmentHead}
                        className="w-4 h-4 accent-yellow-400"
                      />
                      <div>
                        <p className="text-sm text-gray-800">{inst.fullName}</p>
                        <p className="text-xs text-gray-400">{inst.email}</p>
                      </div>
                    </div>
                  ))}
                  {deptFaculty.length === 0 && (
                    <p className="text-gray-400 text-sm">No instructors in system</p>
                  )}
                </div>

                {/* Note about deletion */}
                <p className="text-xs text-gray-400 italic mt-2">
                  Note: Department deletion requires OTP confirmation for security.
                  This will be enabled in a future update.
                </p>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageDepartments
