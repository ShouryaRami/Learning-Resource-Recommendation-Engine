/**
 * CourseDetail page
 * Unified course view for all roles.
 * Students see enrollment status, their projects, and enrollment CTAs.
 * Staff (instructor/ta/admin) see a 3-tab management view —
 * Students, Projects, and Materials — with full course management controls.
 * This replaces the old split between CourseDetail and CourseManagement.
 */
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getCourse, getCourseStudents } from '../api/courses'
import { getMyEnrollments, requestEnrollment, rejectEnrollment } from '../api/enrollments'
import {
  getMyProjects,
  getCourseProjects,
  approveProject,
  rejectProject
} from '../api/projects'
import {
  getCourseMaterials,
  uploadMaterial,
  deleteMaterial,
  downloadMaterial,
  toggleMaterialVisibility
} from '../api/materials'
import ProjectCard from '../components/cards/ProjectCard'
import LoadingSpinner from '../components/LoadingSpinner'

/**
 * @desc Format raw byte count into a human-readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} e.g. "2.4 MB"
 */
function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * @desc Format an ISO date string to a short readable date
 * @param {string} dateStr - ISO date string
 * @returns {string} e.g. "Apr 12, 2026"
 */
function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

// Enrollment status badge for students
const enrollmentBadge = (status) => {
  if (!status) return (
    <span className="text-xs text-gray-400 px-3 py-1 rounded-full border border-gray-600">
      Not enrolled
    </span>
  )
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

  // Instructors, TAs, and admins see the full management view
  const isStaff = ['instructor', 'ta', 'admin'].includes(user?.role)

  // --- Shared state ---
  const [course, setCourse]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  // --- Student-only state ---
  const [myEnrollment, setMyEnrollment] = useState(null)
  const [myProjects, setMyProjects]     = useState([])
  const [enrolling, setEnrolling]       = useState(false)

  // --- Staff-only state ---
  const [students, setStudents]   = useState([])
  const [projects, setProjects]   = useState([])
  const [materials, setMaterials] = useState([])
  const [activeTab, setActiveTab] = useState('students')

  // Projects tab filter and inline rejection
  const [projectFilter, setProjectFilter] = useState('all')
  const [rejectingId, setRejectingId]     = useState(null)
  const [feedbackText, setFeedbackText]   = useState('')

  // Materials tab — upload form state
  const [showUpload, setShowUpload]                   = useState(false)
  const [uploadTitle, setUploadTitle]                 = useState('')
  const [uploadDesc, setUploadDesc]                   = useState('')
  const [selectedFile, setSelectedFile]               = useState(null)
  const [uploading, setUploading]                     = useState(false)
  const [uploadError, setUploadError]                 = useState('')
  const [isVisibleToStudents, setIsVisibleToStudents] = useState(true)
  const [downloadingId, setDownloadingId]             = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [courseData, enrollmentData] = await Promise.all([
          getCourse(courseId),
          getMyEnrollments()
        ])
        setCourse(courseData)

        if (isStaff) {
          // Staff load all course data in parallel
          const [studentsData, projectsData, materialsData] = await Promise.all([
            getCourseStudents(courseId).catch(() => []),
            getCourseProjects(courseId).catch(() => []),
            getCourseMaterials(courseId).catch(() => [])
          ])
          setStudents(studentsData)
          setProjects(projectsData)
          setMaterials(materialsData)
        } else {
          // Students only need their own enrollment and projects
          const found = enrollmentData.find(
            e => (e.courseId?._id || e.courseId) === courseId
          )
          setMyEnrollment(found || null)

          const allProjects = await getMyProjects().catch(() => [])
          setMyProjects(
            allProjects.filter(p => (p.courseId?._id || p.courseId) === courseId)
          )
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

  // --- Student: request enrollment ---
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

  // --- Staff: Students tab — remove a student by rejecting their enrollment ---
  const handleRemoveStudent = async (enrollmentId) => {
    if (!window.confirm('Remove this student from the course?')) return
    try {
      await rejectEnrollment(enrollmentId)
      setStudents(prev => prev.filter(s => s._id !== enrollmentId))
    } catch (err) {
      console.error('Remove student error:', err)
    }
  }

  // --- Staff: Projects tab --- //

  const handleApproveProject = async (projectId) => {
    try {
      await approveProject(projectId)
      setProjects(prev =>
        prev.map(p => p._id === projectId ? { ...p, status: 'active' } : p)
      )
    } catch (err) {
      console.error('Approve project error:', err)
    }
  }

  const handleRejectProject = async (projectId) => {
    try {
      await rejectProject(projectId, feedbackText)
      setProjects(prev =>
        prev.map(p => p._id === projectId ? { ...p, status: 'rejected' } : p)
      )
      setRejectingId(null)
      setFeedbackText('')
    } catch (err) {
      console.error('Reject project error:', err)
    }
  }

  // --- Staff: Materials tab --- //

  const handleUpload = async () => {
    if (!uploadTitle.trim()) { setUploadError('Title is required'); return }
    if (!selectedFile) { setUploadError('Please select a file'); return }
    setUploading(true)
    setUploadError('')
    try {
      const formData = new FormData()
      formData.append('courseId', courseId)
      formData.append('title', uploadTitle.trim())
      formData.append('description', uploadDesc.trim())
      formData.append('isVisibleToStudents', isVisibleToStudents.toString())
      formData.append('file', selectedFile)
      const newMaterial = await uploadMaterial(formData)
      setMaterials(prev => [newMaterial, ...prev])
      setShowUpload(false)
      setUploadTitle('')
      setUploadDesc('')
      setSelectedFile(null)
      setIsVisibleToStudents(true)
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const cancelUpload = () => {
    setShowUpload(false)
    setUploadTitle('')
    setUploadDesc('')
    setSelectedFile(null)
    setUploadError('')
    setIsVisibleToStudents(true)
  }

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Delete this material? This cannot be undone.')) return
    try {
      await deleteMaterial(materialId)
      setMaterials(prev => prev.filter(m => m._id !== materialId))
    } catch (err) {
      console.error('Delete material error:', err)
    }
  }

  const handleDownload = async (materialId, fileName) => {
    setDownloadingId(materialId)
    try {
      await downloadMaterial(materialId, fileName)
    } catch (err) {
      console.error('Download error:', err)
    } finally {
      setDownloadingId(null)
    }
  }

  const handleToggleVisibility = async (materialId) => {
    try {
      await toggleMaterialVisibility(materialId)
      setMaterials(prev => prev.map(m =>
        m._id === materialId
          ? { ...m, isVisibleToStudents: !m.isVisibleToStudents }
          : m
      ))
    } catch (err) {
      console.error('Toggle visibility error:', err)
    }
  }

  // Derived: filtered project list for the Projects tab
  const filteredProjects = projectFilter === 'all'
    ? projects
    : projects.filter(p => p.status === projectFilter)

  const tabClass = (tab) =>
    `pb-2 mr-6 text-sm transition-colors ${
      activeTab === tab
        ? 'border-b-2 border-yellow-400 text-yellow-600 font-semibold'
        : 'text-gray-500 hover:text-gray-700'
    }`

  const filterBtnClass = (f) =>
    `text-xs px-3 py-1 rounded-full border transition-colors ${
      projectFilter === f
        ? 'bg-gray-900 text-white border-gray-900'
        : 'border-gray-300 text-gray-500 hover:bg-gray-50'
    }`

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

  // Students should not see deactivated courses
  if (!isStaff && course.isActive === false) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-gray-800">This course is no longer active</h2>
        <p className="text-gray-500 text-sm mt-2">
          The instructor has closed this course.
        </p>
        <button
          onClick={() => navigate('/courses')}
          className="mt-6 bg-yellow-400 text-black px-5 py-2 rounded-lg font-semibold hover:bg-yellow-500 text-sm"
        >
          Browse Other Courses
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Hero section — same for all roles */}
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
          {/* Enrollment status badge — students only */}
          {!isStaff && (
            <div className="flex-shrink-0">
              {enrollmentBadge(myEnrollment?.status || null)}
            </div>
          )}
        </div>
      </div>

      {/* Info cards row — same for all roles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Department</p>
          <p className="text-base font-semibold text-gray-900 mt-1">
            {course.department?.name || 'N/A'}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Instructor</p>
          {course.faculty?.length > 0 ? (
            course.faculty.map(f => (
              <div key={f._id} className="mt-1">
                <p className="font-medium text-gray-900">{f.fullName}</p>
                <p className="text-gray-500 text-sm">{f.email}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400 mt-1">TBD</p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Teaching Assistants</p>
          {course.tas?.length > 0 ? (
            course.tas.map(ta => (
              <p key={ta._id} className="font-medium text-gray-900 mt-1">{ta.fullName}</p>
            ))
          ) : (
            <p className="text-gray-400 mt-1">None assigned</p>
          )}
        </div>
      </div>

      {/* ============================================================
          STAFF VIEW — 3-tab management interface
      ============================================================ */}
      {isStaff && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          {/* Tab navigation */}
          <div className="flex border-b border-gray-200 mb-6">
            <button className={tabClass('students')} onClick={() => setActiveTab('students')}>
              Students ({students.length})
            </button>
            <button className={tabClass('projects')} onClick={() => setActiveTab('projects')}>
              Projects ({projects.length})
            </button>
            <button className={tabClass('materials')} onClick={() => setActiveTab('materials')}>
              Materials ({materials.length})
            </button>
          </div>

          {/* STUDENTS TAB */}
          {activeTab === 'students' && (
            students.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">👥</div>
                <p>No students enrolled yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Skill Level</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Enrolled</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map(s => (
                      <tr key={s._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{s.userId?.fullName || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{s.userId?.email || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full capitalize">
                            {s.userId?.skillLevel || 'beginner'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full capitalize">
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(s.approvedAt)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleRemoveStudent(s._id)}
                            className="text-red-500 text-xs hover:underline"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* PROJECTS TAB */}
          {activeTab === 'projects' && (
            <div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {['all', 'pitch_pending', 'active', 'rejected'].map(f => (
                  <button
                    key={f}
                    onClick={() => setProjectFilter(f)}
                    className={filterBtnClass(f)}
                  >
                    {f === 'all'
                      ? 'All'
                      : f === 'pitch_pending'
                      ? 'Pending'
                      : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {filteredProjects.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-2">📋</div>
                  <p>No projects found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProjects.map(project => (
                    <div key={project._id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{project.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            By: {project.userId?.fullName || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {project.description?.slice(0, 100)}
                            {project.description?.length > 100 ? '...' : ''}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 items-end ml-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            project.status === 'pitch_pending' ? 'bg-yellow-100 text-yellow-700' :
                            project.status === 'active'        ? 'bg-green-100 text-green-700' :
                            project.status === 'rejected'      ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {project.status === 'pitch_pending' ? 'Pending' : project.status}
                          </span>
                          {project.status === 'pitch_pending' && (
                            <>
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
                            </>
                          )}
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
                              onClick={() => handleRejectProject(project._id)}
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
              )}
            </div>
          )}

          {/* MATERIALS TAB */}
          {activeTab === 'materials' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowUpload(prev => !prev)}
                  className="bg-yellow-400 text-black text-sm px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500"
                >
                  + Upload Material
                </button>
              </div>

              {/* Upload form — shown inline when button is clicked */}
              {showUpload && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Upload Course Material</h3>
                  <input
                    type="text"
                    placeholder="Material title (required)"
                    value={uploadTitle}
                    onChange={e => setUploadTitle(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={uploadDesc}
                    onChange={e => setUploadDesc(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />

                  {/* Drop zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-yellow-400 transition-colors"
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm text-gray-700">{selectedFile.name}</span>
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedFile(null) }}
                          aria-label="Remove selected file"
                          className="text-red-400 text-xs hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-500">Click to select file</p>
                        <p className="text-xs text-gray-400 mt-1">PDF · Word · PowerPoint · ZIP</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.docx,.doc,.pptx,.ppt,.zip,.txt"
                    onChange={e => setSelectedFile(e.target.files[0] || null)}
                  />

                  {/* Visibility toggle */}
                  <div className="flex items-center gap-3 mt-3 p-3 bg-white rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      id="visibilityToggle"
                      checked={isVisibleToStudents}
                      onChange={() => setIsVisibleToStudents(prev => !prev)}
                      className="w-4 h-4 accent-yellow-400"
                    />
                    <label htmlFor="visibilityToggle" className="text-sm text-gray-700 cursor-pointer">
                      Visible to students
                    </label>
                    <span className="text-xs text-gray-400">
                      {isVisibleToStudents ? '(students can see and download)' : '(instructors and TAs only)'}
                    </span>
                  </div>

                  {uploadError && (
                    <p className="text-red-500 text-xs mt-2">{uploadError}</p>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500 disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                    <button onClick={cancelUpload} className="text-gray-500 text-sm hover:text-gray-700">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Materials list */}
              {materials.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-2">📁</div>
                  <p>No materials uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {materials.map(material => (
                    <div
                      key={material._id}
                      className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{material.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{material.fileName}</p>
                        <div className="flex gap-3 mt-2 items-center flex-wrap">
                          <span className="text-xs text-gray-500">{formatBytes(material.fileSize)}</span>
                          {material.isProcessed ? (
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">
                              ✓ Text extracted
                            </span>
                          ) : (
                            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded">
                              ⏳ Processing...
                            </span>
                          )}
                          {material.isVisibleToStudents ? (
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">
                              👁 Students can see
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded">
                              🔒 Staff only
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3 items-center flex-shrink-0">
                        <button
                          onClick={() => handleDownload(material._id, material.fileName)}
                          disabled={downloadingId === material._id}
                          className="text-blue-600 text-xs hover:underline disabled:text-gray-400"
                        >
                          {downloadingId === material._id ? 'Downloading...' : 'Download'}
                        </button>
                        <button
                          onClick={() => handleToggleVisibility(material._id)}
                          className={`text-xs px-2 py-1 rounded border transition-colors ${
                            material.isVisibleToStudents
                              ? 'border-gray-300 text-gray-500 hover:bg-gray-50'
                              : 'border-green-300 text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {material.isVisibleToStudents ? 'Hide from students' : 'Show to students'}
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(material._id)}
                          className="text-red-500 text-xs hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          STUDENT VIEW — enrollment state and project sections
      ============================================================ */}

      {/* Approved student: show their projects in this course */}
      {!isStaff && myEnrollment?.status === 'approved' && (
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
          {myProjects.length > 0 ? (
            <div className="mt-4 space-y-3">
              {myProjects.map(project => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          ) : (
            <div className="mt-4 text-center text-gray-400 py-8">
              No projects yet. Create your first project!
            </div>
          )}
        </div>
      )}

      {/* Not enrolled or rejected: show enroll CTA */}
      {!isStaff && (!myEnrollment || myEnrollment.status === 'rejected') && (
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

      {/* Enrollment pending: show waiting message */}
      {!isStaff && myEnrollment?.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Enrollment Pending</h3>
          <p className="text-gray-600 text-sm mt-1">
            Your enrollment request is awaiting approval from the instructor.
          </p>
        </div>
      )}
    </>
  )
}

export default CourseDetail
