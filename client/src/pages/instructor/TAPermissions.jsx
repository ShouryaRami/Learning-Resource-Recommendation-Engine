/**
 * TAPermissions page
 * Instructors control per-course per-TA permissions here.
 * Select a course, then toggle what each TA can do in that course.
 * Changes are saved individually per TA with a Save Changes button.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getAllCourses } from '../../api/courses'
import { getCoursePermissions, updateTAPermissions } from '../../api/ta'
import LoadingSpinner from '../../components/LoadingSpinner'

/**
 * All seven permission fields with display labels and descriptions.
 * Rendered as a checklist for each TA.
 */
const PERMISSION_FIELDS = [
  {
    field: 'canApproveEnrollments',
    label: 'Can approve enrollments',
    description: 'Review and approve student enrollment requests'
  },
  {
    field: 'canViewStudentReports',
    label: 'Can view student reports',
    description: 'View student progress and activity reports'
  },
  {
    field: 'canApproveProjects',
    label: 'Can approve project pitches',
    description: 'Review and approve project pitches from students'
  },
  {
    field: 'canAddResources',
    label: 'Can upload course materials',
    description: 'Upload new materials to the course library'
  },
  {
    field: 'canDeleteResources',
    label: 'Can delete course materials',
    description: 'Remove materials from the course library'
  },
  {
    field: 'canGradeStudents',
    label: 'Can grade students',
    description: 'Record and update student grades'
  },
  {
    field: 'canRemoveStudents',
    label: 'Can remove students from course',
    description: 'Remove students from this course'
  }
]

/** Default permission record with all flags false */
const DEFAULT_PERMISSIONS = Object.fromEntries(
  PERMISSION_FIELDS.map(({ field }) => [field, false])
)

const TAPermissions = () => {
  const { user } = useAuth()

  const [courses, setCourses]                   = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [taPermissions, setTaPermissions]       = useState([])
  const [loading, setLoading]                   = useState(true)
  const [saving, setSaving]                     = useState(false)
  const [saveSuccessId, setSaveSuccessId]       = useState(null)

  // Load instructor's courses on mount
  useEffect(() => {
    const load = async () => {
      try {
        const allCourses = await getAllCourses()
        const userId = user?._id || user?.id

        const instructorCourses = allCourses.filter(course =>
          course.faculty?.some(f => {
            const fId = f._id?.toString() || f?.toString()
            return fId === userId?.toString()
          })
        )
        setCourses(instructorCourses)
      } catch (err) {
        console.error('TAPermissions load error:', err)
      } finally {
        setLoading(false)
      }
    }
    if (user) load()
  }, [user])

  const handleCourseChange = async (courseId) => {
    setSelectedCourseId(courseId)
    setTaPermissions([])
    if (!courseId) return

    try {
      // Get existing permission records for this course
      const existingPerms = await getCoursePermissions(courseId)

      // Get the TAs assigned to this course from the course object
      const selectedCourse = courses.find(c => c._id === courseId)
      const tas = selectedCourse?.tas || []

      if (tas.length === 0) {
        setTaPermissions([])
        return
      }

      // Merge: for each TA, find their existing perm or default to all-false
      const merged = tas.map(ta => {
        const taId = ta._id?.toString() || ta?.toString()
        const existing = existingPerms.find(p => {
          const permTaId = p.taUserId?._id?.toString() || p.taUserId?.toString()
          return permTaId === taId
        })
        return {
          taUserId:  ta,              // populated user object
          courseId,
          ...(existing || DEFAULT_PERMISSIONS)
        }
      })
      setTaPermissions(merged)
    } catch (err) {
      console.error('Load TA permissions error:', err)
    }
  }

  const handlePermissionChange = (taUserId, field, value) => {
    const taId = taUserId?._id?.toString() || taUserId?.toString()
    setTaPermissions(prev =>
      prev.map(perm => {
        const permTaId = perm.taUserId?._id?.toString() || perm.taUserId?.toString()
        return permTaId === taId ? { ...perm, [field]: value } : perm
      })
    )
  }

  const handleSave = async (taUserId) => {
    const taId = taUserId?._id?.toString() || taUserId?.toString()
    const perm = taPermissions.find(p => {
      const permTaId = p.taUserId?._id?.toString() || p.taUserId?.toString()
      return permTaId === taId
    })
    if (!perm) return

    setSaving(true)
    try {
      await updateTAPermissions({
        taUserId:              taId,
        courseId:              selectedCourseId,
        canApproveEnrollments: perm.canApproveEnrollments,
        canViewStudentReports: perm.canViewStudentReports,
        canApproveProjects:    perm.canApproveProjects,
        canAddResources:       perm.canAddResources,
        canDeleteResources:    perm.canDeleteResources,
        canGradeStudents:      perm.canGradeStudents,
        canRemoveStudents:     perm.canRemoveStudents
      })
      // Flash success indicator on this TA's card briefly
      setSaveSuccessId(taId)
      setTimeout(() => setSaveSuccessId(null), 2000)
    } catch (err) {
      console.error('Save TA permissions error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">TA Permissions</h1>
        <p className="text-gray-500 text-sm mt-1">
          Control what each teaching assistant can do in your courses
        </p>
      </div>

      {/* Course selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select a course to manage TA permissions
        </label>
        <select
          value={selectedCourseId}
          onChange={e => handleCourseChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 w-full max-w-xs text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          <option value="">Select a course...</option>
          {courses.map(c => (
            <option key={c._id} value={c._id}>
              {c.title} — {c.code}
            </option>
          ))}
        </select>
      </div>

      {/* No course selected */}
      {!selectedCourseId && (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <div className="text-3xl mb-2">👆</div>
          <p className="text-gray-500">
            Select a course above to manage TA permissions
          </p>
        </div>
      )}

      {/* Course selected but no TAs */}
      {selectedCourseId && taPermissions.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-700 font-medium">
            No TAs assigned to this course yet.
          </p>
          <p className="text-yellow-600 text-sm mt-1">
            Contact admin to assign TAs to this course.
          </p>
        </div>
      )}

      {/* TA permission cards */}
      <div className="space-y-4">
        {taPermissions.map(perm => {
          const ta    = perm.taUserId
          const taId  = ta?._id?.toString() || ta?.toString()
          const name  = ta?.fullName || 'Unknown TA'
          const email = ta?.email || ''

          return (
            <div key={taId} className="bg-white border border-gray-200 rounded-xl p-5">

              {/* TA header row */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="font-semibold text-gray-900">{name}</p>
                  <p className="text-xs text-gray-400">{email}</p>
                </div>
                <div className="flex items-center gap-3">
                  {saveSuccessId === taId && (
                    <span className="text-green-600 text-xs">✓ Saved</span>
                  )}
                  <button
                    onClick={() => handleSave(ta)}
                    disabled={saving}
                    className="bg-yellow-400 text-black text-sm px-4 py-2 rounded-lg font-medium hover:bg-yellow-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {/* Permission checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PERMISSION_FIELDS.map(({ field, label, description }) => (
                  <label
                    key={field}
                    className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={!!perm[field]}
                      onChange={e => handlePermissionChange(ta, field, e.target.checked)}
                      className="w-4 h-4 accent-yellow-400 flex-shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{label}</p>
                      <p className="text-xs text-gray-400">{description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

export default TAPermissions
