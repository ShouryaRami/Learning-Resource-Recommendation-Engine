/**
 * CourseDetail page
 * Unified course view for all roles.
 * Students see enrollment status, their projects, tips, and enrollment CTAs.
 * Staff (instructor/ta/admin) see a 5-tab management view —
 * Students, Projects, Materials, Tips & Tools, and AI Assistant.
 * This replaces the old split between CourseDetail and CourseManagement.
 */
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axiosInstance from '../api/axios'
import { getCourse, getCourseStudents, toggleCourseAI, addDeliverable, removeDeliverable, updateDeliverable } from '../api/courses'
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
import {
  getCourseTips,
  createTip,
  updateTip,
  deleteTip,
  toggleTipVisibility
} from '../api/tips'
import { getCourseSubmissions, gradeSubmission } from '../api/submissions'
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

/** @desc Map a tip category to its display icon */
function tipIcon(category) {
  const icons = {
    study_tip: '📌',
    tool_recommendation: '🔧',
    resource_link: '🔗',
    general: '💡'
  }
  return icons[category] || '💡'
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
  const [myEnrollment, setMyEnrollment]     = useState(null)
  const [myProjects, setMyProjects]         = useState([])
  const [enrolling, setEnrolling]           = useState(false)
  const [activeStudentTab, setActiveStudentTab] = useState('projects')

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
  const [notification, setNotification]               = useState({ message: '', type: '' })
  const [showPrivacyNotice, setShowPrivacyNotice]     = useState(true)
  const fileInputRef = useRef(null)

  // Submissions tab state
  const [submissions, setSubmissions]             = useState([])
  const [submissionsLoaded, setSubmissionsLoaded] = useState(false)
  const [gradingData, setGradingData]             = useState({})
  const [editingGrade, setEditingGrade]           = useState({})
  const [submissionTab, setSubmissionTab]         = useState('deliverables')
  const [downloadingSubId, setDownloadingSubId]   = useState(null)

  // Deliverables state (sub-documents on the course)
  const [deliverables, setDeliverables]               = useState([])
  const [showDeliverableForm, setShowDeliverableForm] = useState(false)
  const [deliverableForm, setDeliverableForm]         = useState({ name: '', description: '', dueDate: '' })
  const [addingDeliverable, setAddingDeliverable]     = useState(false)
  const [deletingDeliverableId, setDeletingDeliverableId] = useState(null)
  const [editingDeliverable, setEditingDeliverable]   = useState(null)
  const [editDelForm, setEditDelForm]                 = useState({ name: '', description: '', dueDate: '' })

  // Tips tab state
  const [tips, setTips]                 = useState([])
  const [showTipForm, setShowTipForm]   = useState(false)
  const [editingTip, setEditingTip]     = useState(null)
  const [tipForm, setTipForm]           = useState({
    title: '', content: '', category: 'general', toolUrl: ''
  })
  const [tipNotification, setTipNotification] = useState({ message: '', type: '' })
  const [savingTip, setSavingTip]             = useState(false)
  const [deletingTipId, setDeletingTipId]     = useState(null)

  // AI chat state — shared between staff tab and enrolled student section
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput]       = useState('')
  const [chatLoading, setChatLoading]   = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [courseData, enrollmentData] = await Promise.all([
          getCourse(courseId),
          getMyEnrollments()
        ])
        setCourse(courseData)
        setDeliverables(courseData.deliverables?.filter(d => d.isActive) || [])

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

        // Tips are fetched for all roles — backend filters visibility for students
        try {
          const tipsData = await getCourseTips(courseId)
          setTips(tipsData)
        } catch (err) {
          console.error('Tips fetch error:', err)
          // Non-critical — page still works without tips
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

  // Load chat history for staff AI tab and enrolled students
  useEffect(() => {
    if (!user || !courseId) return
    axiosInstance.get('/chat/history/' + courseId)
      .then(res => setChatMessages(res.data.messages || []))
      .catch(() => {})
  }, [courseId, user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

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
      const result = await uploadMaterial(formData)
      // uploadMaterial returns { message, material } — extract the material object
      const newMaterial = result.material || result
      setMaterials(prev => [newMaterial, ...prev])
      setShowUpload(false)
      setUploadTitle('')
      setUploadDesc('')
      setSelectedFile(null)
      setIsVisibleToStudents(true)
      setNotification({ message: 'Material uploaded successfully', type: 'success' })
      // Poll until text extraction completes
      if (!newMaterial.isProcessed && newMaterial._id) {
        const pollId = setInterval(async () => {
          try {
            const res = await axiosInstance.get('/materials/' + newMaterial._id)
            if (res.data.isProcessed) {
              setMaterials(prev =>
                prev.map(m => m._id === newMaterial._id ? { ...m, isProcessed: true } : m)
              )
              clearInterval(pollId)
            }
          } catch { clearInterval(pollId) }
        }, 3000)
        // Give up after 2 minutes
        setTimeout(() => clearInterval(pollId), 120000)
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed')
      setNotification({ message: err.response?.data?.message || 'Upload failed', type: 'error' })
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
      setNotification({ message: 'Material deleted', type: 'success' })
    } catch (err) {
      console.error('Delete material error:', err)
      setNotification({ message: 'Failed to delete material', type: 'error' })
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

  const handleAddDeliverable = async () => {
    if (!deliverableForm.name.trim()) return
    setAddingDeliverable(true)
    try {
      const result = await addDeliverable(courseId, {
        name:        deliverableForm.name.trim(),
        description: deliverableForm.description,
        dueDate:     deliverableForm.dueDate || null
      })
      setDeliverables(prev => [...prev, result.deliverable])
      setShowDeliverableForm(false)
      setDeliverableForm({ name: '', description: '', dueDate: '' })
    } catch (err) {
      console.error('Add deliverable error:', err)
    } finally {
      setAddingDeliverable(false)
    }
  }

  const handleDeleteDeliverable = async (deliverableId) => {
    if (!window.confirm('Remove this deliverable assignment?')) return
    setDeletingDeliverableId(deliverableId)
    try {
      await removeDeliverable(courseId, deliverableId)
      setDeliverables(prev => prev.filter(d => d._id !== deliverableId))
    } catch (err) {
      console.error('Delete deliverable error:', err)
    } finally {
      setDeletingDeliverableId(null)
    }
  }

  const handleToggleAI = async () => {
    try {
      const result = await toggleCourseAI(courseId)
      setCourse(prev => ({ ...prev, aiProcessingEnabled: result.aiProcessingEnabled }))
    } catch (err) {
      console.error('Toggle AI error:', err)
    }
  }

  const handleDownloadSubmission = async (fileId, fileName) => {
    setDownloadingSubId(fileId)
    try {
      const response = await axiosInstance.get(
        `/submissions/file/${fileId}`,
        { responseType: 'blob' }
      )
      const contentType = response.headers['content-type'] || 'application/octet-stream'
      const blob = new Blob([response.data], { type: contentType })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName || 'submission')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error:', err.message)
      alert('Could not download file. Please try again.')
    } finally {
      setDownloadingSubId(null)
    }
  }

  const handleUpdateDeliverable = async (delId) => {
    try {
      const result = await updateDeliverable(courseId, delId, editDelForm)
      setDeliverables(prev =>
        prev.map(d => d._id === delId ? result.deliverable : d)
      )
      setEditingDeliverable(null)
    } catch (err) {
      console.error('Update deliverable error:', err.message)
    }
  }

  const handleGradeSubmission = async (subId) => {
    const data = gradingData[subId] || {}
    if (!data.grade?.trim()) return
    try {
      await gradeSubmission(subId, {
        grade: data.grade,
        feedback: data.feedback || ''
      })
      setSubmissions(prev => prev.map(s =>
        s._id === subId
          ? { ...s, grade: data.grade, feedback: data.feedback || '', status: 'graded' }
          : s
      ))
      setEditingGrade(prev => ({ ...prev, [subId]: false }))
    } catch (err) {
      console.error('Grade error:', err)
    }
  }

  // --- Tips tab --- //

  /** @desc Show tip notification and auto-clear after 3s */
  const showTipNotification = (message, type = 'success') => {
    setTipNotification({ message, type })
    setTimeout(() => setTipNotification({ message: '', type: '' }), 3000)
  }

  /** @desc Handle tip form submit for create and edit */
  const handleSaveTip = async () => {
    if (!tipForm.title.trim() || !tipForm.content.trim()) {
      showTipNotification('Title and content are required', 'error')
      return
    }
    setSavingTip(true)
    try {
      if (editingTip) {
        const result = await updateTip(editingTip._id, tipForm)
        setTips(prev => prev.map(t => t._id === editingTip._id ? result.tip : t))
        showTipNotification('Tip updated successfully')
      } else {
        const result = await createTip({ ...tipForm, courseId })
        setTips(prev => [result.tip, ...prev])
        showTipNotification('Tip added successfully')
      }
      setShowTipForm(false)
      setEditingTip(null)
      setTipForm({ title: '', content: '', category: 'general', toolUrl: '' })
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save tip'
      showTipNotification(msg, 'error')
    } finally {
      setSavingTip(false)
    }
  }

  /** @desc Handle tip delete with confirmation */
  const handleDeleteTip = async (tipId) => {
    if (!window.confirm('Remove this tip?')) return
    setDeletingTipId(tipId)
    try {
      await deleteTip(tipId)
      setTips(prev => prev.filter(t => t._id !== tipId))
      showTipNotification('Tip removed')
    } catch (err) {
      showTipNotification('Failed to remove tip', 'error')
    } finally {
      setDeletingTipId(null)
    }
  }

  /** @desc Toggle visibility of tip for students */
  const handleToggleTipVisibility = async (tipId) => {
    try {
      const result = await toggleTipVisibility(tipId)
      setTips(prev => prev.map(t =>
        t._id === tipId ? { ...t, isVisibleToStudents: result.isVisibleToStudents } : t
      ))
    } catch (err) {
      showTipNotification('Failed to update visibility', 'error')
    }
  }

  // --- AI Chat --- //

  const handleSendMessage = async () => {
    const text = chatInput.trim()
    if (!text || chatLoading) return
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: text }])
    setChatLoading(true)
    try {
      const res = await axiosInstance.post('/chat', { message: text, courseId })
      setChatMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch {
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Failed to get a response. Please try again.' }
      ])
    } finally {
      setChatLoading(false)
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

  const studentTabClass = (tab) =>
    `pb-2 mr-6 text-sm transition-colors ${
      activeStudentTab === tab
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
            {course?.aiProcessingEnabled === false && (
              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full border border-orange-200 mt-3">
                <span>⚠️</span>
                <span>AI processing disabled for this course</span>
              </span>
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
          <p className="text-base font-semibold text-gray-900 mt-1">
            {course.faculty?.length > 0
              ? course.faculty.map(f => f.fullName || f.email || 'Instructor').join(', ')
              : 'TBD'}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Teaching Assistants</p>
          <p className="text-base font-semibold text-gray-900 mt-1">
            {course.tas?.length > 0
              ? course.tas.map(t => t.fullName || t.email || 'TA').join(', ')
              : 'None assigned'}
          </p>
        </div>
      </div>

      {/* ============================================================
          STAFF VIEW — 5-tab management interface
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
            <button className={tabClass('tips')} onClick={() => setActiveTab('tips')}>
              Tips &amp; Tools
              {tips.length > 0 && (
                <span className="bg-yellow-400 text-black text-xs px-1.5 py-0.5 rounded-full ml-1 font-bold">
                  {tips.length}
                </span>
              )}
            </button>
            <button className={tabClass('ai')} onClick={() => setActiveTab('ai')}>
              AI Assistant
            </button>
            <button
              className={tabClass('submissions')}
              onClick={async () => {
                setActiveTab('submissions')
                if (!submissionsLoaded) {
                  try {
                    const data = await getCourseSubmissions(courseId)
                    setSubmissions(data)
                    setSubmissionsLoaded(true)
                  } catch (err) {
                    console.error('Load submissions error:', err)
                  }
                }
              }}
            >
              Submissions
              {submissions.length > 0 && (
                <span className="bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded-full ml-1 font-bold">
                  {submissions.length}
                </span>
              )}
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
              {/* Upload / delete feedback notification */}
              {notification.message && (
                <div className={`mb-4 px-4 py-3 rounded-lg text-sm flex justify-between items-center ${
                  notification.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <span>{notification.message}</span>
                  <button
                    onClick={() => setNotification({ message: '', type: '' })}
                    aria-label="Dismiss notification"
                    className="text-gray-400 hover:text-gray-600 ml-3"
                  >
                    ✕
                  </button>
                </div>
              )}
              {/* Data privacy notice — always visible, dismissible per session */}
              {showPrivacyNotice && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-500 text-xl flex-shrink-0 mt-0.5">🔒</span>
                    <div className="flex-1">
                      <p className="font-semibold text-blue-800 text-sm">Data Privacy Notice</p>
                      <p className="text-blue-700 text-sm mt-1 leading-relaxed">
                        When you upload course materials, the system automatically extracts text
                        content to power the AI chat and recommendation features. This extracted
                        text is sent to Google Gemini API for processing student questions. If
                        your materials contain sensitive content you can disable AI processing
                        for this course using the toggle below.
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-blue-800">AI Processing:</span>
                          <button
                            onClick={handleToggleAI}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                              course?.aiProcessingEnabled !== false ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              course?.aiProcessingEnabled !== false ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                          <span className="text-sm text-blue-700">
                            {course?.aiProcessingEnabled !== false ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <button
                          onClick={() => setShowPrivacyNotice(false)}
                          className="text-blue-500 text-xs hover:text-blue-700 underline ml-auto"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                    onChange={e => {
                      const file = e.target.files[0] || null
                      setSelectedFile(file)
                      if (file && !uploadTitle.trim()) {
                        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
                        setUploadTitle(nameWithoutExt.replace(/[-_]/g, ' '))
                      }
                    }}
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
                          {course?.aiProcessingEnabled !== false && material.isProcessed && (
                            <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                              🤖 Used for AI
                            </span>
                          )}
                          {course?.aiProcessingEnabled === false && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              AI off
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

          {/* TIPS & TOOLS TAB */}
          {activeTab === 'tips' && (
            <div className="p-5">
              {/* Notification bar */}
              {tipNotification.message && (
                <div className={`rounded-lg p-3 mb-4 text-sm flex items-center gap-2 ${
                  tipNotification.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <span>{tipNotification.type === 'success' ? '✓' : '✕'}</span>
                  <span>{tipNotification.message}</span>
                </div>
              )}

              {/* Header row */}
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="font-bold text-gray-900">Tips &amp; Tools</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Share study tips and tool recommendations with your students
                  </p>
                </div>
                {!showTipForm && (
                  <button
                    onClick={() => {
                      setEditingTip(null)
                      setTipForm({ title: '', content: '', category: 'general', toolUrl: '' })
                      setShowTipForm(true)
                    }}
                    className="bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500"
                  >
                    + Add Tip
                  </button>
                )}
              </div>

              {/* Add / Edit form */}
              {showTipForm && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-5">
                  <h4 className="font-semibold text-gray-800 mb-4">
                    {editingTip ? 'Edit Tip' : 'Add New Tip'}
                  </h4>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={tipForm.title}
                    onChange={e => setTipForm({ ...tipForm, title: e.target.value })}
                    placeholder="e.g. Use Postman to test your API first"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-yellow-400"
                  />

                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={tipForm.content}
                    onChange={e => setTipForm({ ...tipForm, content: e.target.value })}
                    rows={4}
                    placeholder="Write your tip or recommendation here..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-yellow-400 resize-none"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={tipForm.category}
                        onChange={e => setTipForm({ ...tipForm, category: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="general">General</option>
                        <option value="study_tip">Study Tip</option>
                        <option value="tool_recommendation">Tool Recommendation</option>
                        <option value="resource_link">Resource Link</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tool URL (optional)</label>
                      <input
                        type="url"
                        value={tipForm.toolUrl}
                        onChange={e => setTipForm({ ...tipForm, toolUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end mt-4">
                    <button
                      onClick={() => { setShowTipForm(false); setEditingTip(null) }}
                      className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveTip}
                      disabled={savingTip}
                      className="bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500 disabled:opacity-50"
                    >
                      {savingTip ? 'Saving...' : editingTip ? 'Update Tip' : 'Add Tip'}
                    </button>
                  </div>
                </div>
              )}

              {/* Tips list */}
              {tips.length === 0 && !showTipForm ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">💡</div>
                  <p className="font-semibold text-gray-700">No tips yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add study tips, tool recommendations, or resource links for your students
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tips.map(tip => (
                    <div
                      key={tip._id}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3 items-start flex-1">
                          <span className="text-xl">{tipIcon(tip.category)}</span>
                          <div>
                            <p className="font-semibold text-gray-900">{tip.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              By {tip.createdBy?.fullName} · {new Date(tip.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            tip.isVisibleToStudents
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {tip.isVisibleToStudents ? '👁 Visible' : '🔒 Hidden'}
                          </span>
                          <button
                            onClick={() => handleToggleTipVisibility(tip._id)}
                            className={`text-xs border rounded px-2 py-1 ${
                              tip.isVisibleToStudents
                                ? 'border-gray-300 text-gray-500'
                                : 'border-green-300 text-green-600'
                            }`}
                          >
                            {tip.isVisibleToStudents ? 'Hide' : 'Show'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingTip(tip)
                              setTipForm({
                                title: tip.title,
                                content: tip.content,
                                category: tip.category,
                                toolUrl: tip.toolUrl || ''
                              })
                              setShowTipForm(true)
                            }}
                            className="text-blue-500 text-xs hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTip(tip._id)}
                            disabled={deletingTipId === tip._id}
                            className="text-red-400 text-xs hover:text-red-600 disabled:opacity-40"
                          >
                            {deletingTipId === tip._id ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 leading-relaxed mt-3">{tip.content}</p>

                      {tip.toolUrl && (
                        <a
                          href={tip.toolUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow-600 text-xs hover:underline mt-2 inline-flex items-center gap-1"
                        >
                          🔗 Open Tool →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI ASSISTANT TAB */}
          {activeTab === 'ai' && (
            <div className="flex flex-col" style={{ height: '28rem' }}>
              {course?.aiProcessingEnabled === false ? (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                  <p className="text-orange-700 text-sm">
                    ⚠️ AI processing is disabled for this course. The AI assistant cannot
                    access course materials and will only provide general responses.
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                  <p className="text-gray-500 text-xs">
                    🔒 AI responses are grounded in your course materials. Extracted text
                    is processed by Google Gemini API.
                  </p>
                </div>
              )}
              <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    Ask a question about this course&apos;s materials.
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-sm lg:max-w-md px-3 py-2 rounded-lg text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-yellow-400 text-black'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-3 py-2 rounded-lg text-sm text-gray-500">
                      Thinking...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2 border-t border-gray-100 pt-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Ask about course materials..."
                  disabled={chatLoading}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* SUBMISSIONS TAB */}
          {activeTab === 'submissions' && (
            <div>
              {/* Sub-tab navigation */}
              <div className="flex gap-1 mb-5">
                <button
                  onClick={() => setSubmissionTab('deliverables')}
                  className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
                    submissionTab === 'deliverables'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Deliverables &amp; Instructions
                </button>
                <button
                  onClick={() => setSubmissionTab('submissions')}
                  className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
                    submissionTab === 'submissions'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Student Submissions
                  {submissions.length > 0 && (
                    <span className="ml-1.5 bg-gray-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {submissions.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Deliverables sub-tab */}
              {submissionTab === 'deliverables' && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-800">Deliverable Assignments</h3>
                    {!showDeliverableForm && (
                      <button
                        onClick={() => setShowDeliverableForm(true)}
                        className="bg-yellow-400 text-black text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-yellow-500"
                      >
                        + Add Deliverable
                      </button>
                    )}
                  </div>

                  {showDeliverableForm && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3">
                      <input
                        type="text"
                        placeholder="Deliverable name (required)"
                        value={deliverableForm.name}
                        onChange={e => setDeliverableForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                      <textarea
                        placeholder="Description (optional)"
                        value={deliverableForm.description}
                        onChange={e => setDeliverableForm(f => ({ ...f, description: e.target.value }))}
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                      <input
                        type="date"
                        value={deliverableForm.dueDate}
                        onChange={e => setDeliverableForm(f => ({ ...f, dueDate: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddDeliverable}
                          disabled={addingDeliverable || !deliverableForm.name.trim()}
                          className="bg-yellow-400 text-black text-sm px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 disabled:opacity-50"
                        >
                          {addingDeliverable ? 'Adding...' : 'Add'}
                        </button>
                        <button
                          onClick={() => { setShowDeliverableForm(false); setDeliverableForm({ name: '', description: '', dueDate: '' }) }}
                          className="text-gray-500 text-sm hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {deliverables.length === 0 && !showDeliverableForm ? (
                    <div className="text-center py-10 text-gray-400">
                      <div className="text-4xl mb-2">📋</div>
                      <p>No deliverable assignments yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {deliverables.map(d => (
                        <div key={d._id} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{d.name}</p>
                              {d.description && (
                                <p className="text-xs text-gray-500 mt-0.5">{d.description}</p>
                              )}
                              {d.dueDate && (
                                <p className="text-xs text-gray-400 mt-0.5">Due: {formatDate(d.dueDate)}</p>
                              )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0 ml-3">
                              <button
                                onClick={() => {
                                  setEditingDeliverable(d._id)
                                  setEditDelForm({
                                    name: d.name,
                                    description: d.description || '',
                                    dueDate: d.dueDate ? d.dueDate.split('T')[0] : ''
                                  })
                                }}
                                className="text-blue-500 text-xs hover:text-blue-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteDeliverable(d._id)}
                                disabled={deletingDeliverableId === d._id}
                                className="text-red-400 text-xs hover:text-red-600 disabled:opacity-40"
                              >
                                {deletingDeliverableId === d._id ? 'Removing...' : 'Remove'}
                              </button>
                            </div>
                          </div>

                          {editingDeliverable === d._id && (
                            <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                              <input
                                type="text"
                                value={editDelForm.name}
                                onChange={e => setEditDelForm(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
                                placeholder="Deliverable name"
                              />
                              <textarea
                                value={editDelForm.description}
                                onChange={e => setEditDelForm(prev => ({ ...prev, description: e.target.value }))}
                                rows={2}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-yellow-400"
                                placeholder="Instructions (optional)"
                              />
                              <input
                                type="date"
                                value={editDelForm.dueDate}
                                onChange={e => setEditDelForm(prev => ({ ...prev, dueDate: e.target.value }))}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setEditingDeliverable(null)}
                                  className="border border-gray-300 text-gray-600 text-xs px-3 py-1.5 rounded-lg"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleUpdateDeliverable(d._id)}
                                  className="bg-yellow-400 text-black text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-yellow-500"
                                >
                                  Save Changes
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

              {/* Student Submissions sub-tab */}
              {submissionTab === 'submissions' && (
                <div>
                  {submissions.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-4xl mb-2">📋</div>
                      <p>No submissions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {submissions.map(sub => (
                        <div key={sub._id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <p className="font-semibold text-gray-900">{sub.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {sub.studentId?.fullName} · {sub.studentId?.email}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                Project: {sub.projectId?.title}
                              </p>
                              {sub.deliverableName && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Deliverable: {sub.deliverableName}
                                </p>
                              )}
                              {sub.description && (
                                <p className="text-sm text-gray-600 mt-2">{sub.description}</p>
                              )}
                              <div className="flex gap-3 mt-2 flex-wrap items-center">
                                {sub.deliverableUrl && (
                                  <a
                                    href={sub.deliverableUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-yellow-600 hover:underline"
                                  >
                                    🔗 View URL →
                                  </a>
                                )}
                                {sub.submittedFileId && (
                                  <button
                                    onClick={() => handleDownloadSubmission(sub.submittedFileId, sub.submittedFileName)}
                                    disabled={downloadingSubId === sub.submittedFileId}
                                    className="text-xs text-blue-600 hover:underline disabled:text-gray-400"
                                  >
                                    {downloadingSubId === sub.submittedFileId
                                      ? 'Downloading...'
                                      : `📎 ${sub.submittedFileName || 'Download file'}`}
                                  </button>
                                )}
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              sub.status === 'graded'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {sub.status === 'graded' ? `Graded: ${sub.grade}` : 'Submitted'}
                            </span>
                          </div>

                          <div className="mt-3 pt-3 border-t border-gray-200">
                            {sub.status === 'graded' && !editingGrade[sub._id] && (
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-xs text-gray-400">
                                    Graded by {sub.gradedBy?.fullName || 'Instructor'}
                                  </p>
                                  {sub.feedback && (
                                    <p className="text-sm text-gray-600 mt-1 bg-white p-2 rounded-lg border border-gray-100">
                                      {sub.feedback}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    setEditingGrade(prev => ({ ...prev, [sub._id]: true }))
                                    setGradingData(prev => ({
                                      ...prev,
                                      [sub._id]: { grade: sub.grade || '', feedback: sub.feedback || '' }
                                    }))
                                  }}
                                  className="text-xs text-blue-500 hover:text-blue-700 underline flex-shrink-0 ml-3"
                                >
                                  Edit Grade
                                </button>
                              </div>
                            )}

                            {(sub.status !== 'graded' || editingGrade[sub._id]) && (
                              <div>
                                <p className="text-xs font-semibold text-gray-600 mb-2">
                                  {editingGrade[sub._id] ? 'Update Grade' : 'Record Grade'}
                                </p>
                                <div className="flex gap-2 mb-2">
                                  <input
                                    type="text"
                                    placeholder="Grade (e.g. A, 95/100)"
                                    value={gradingData[sub._id]?.grade || ''}
                                    onChange={e => setGradingData(prev => ({
                                      ...prev,
                                      [sub._id]: { ...prev[sub._id], grade: e.target.value }
                                    }))}
                                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm flex-1 focus:outline-none focus:border-yellow-400"
                                  />
                                </div>
                                <textarea
                                  placeholder="Feedback (optional)"
                                  value={gradingData[sub._id]?.feedback || ''}
                                  onChange={e => setGradingData(prev => ({
                                    ...prev,
                                    [sub._id]: { ...prev[sub._id], feedback: e.target.value }
                                  }))}
                                  rows={2}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm resize-none focus:outline-none focus:border-yellow-400 mb-2"
                                />
                                <div className="flex gap-2">
                                  {editingGrade[sub._id] && (
                                    <button
                                      onClick={() => setEditingGrade(prev => ({ ...prev, [sub._id]: false }))}
                                      className="border border-gray-300 text-gray-600 text-sm px-4 py-1.5 rounded-lg"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleGradeSubmission(sub._id)}
                                    disabled={!gradingData[sub._id]?.grade}
                                    className="bg-yellow-400 text-black text-sm px-4 py-1.5 rounded-lg font-semibold hover:bg-yellow-500 disabled:opacity-40"
                                  >
                                    {editingGrade[sub._id] ? 'Update Grade' : 'Save Grade'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          STUDENT VIEW — tabbed section for approved enrolled students
      ============================================================ */}

      {!isStaff && myEnrollment?.status === 'approved' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          {/* Student tab navigation */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={studentTabClass('projects')}
              onClick={() => setActiveStudentTab('projects')}
            >
              My Projects
            </button>
            <button
              className={studentTabClass('ai')}
              onClick={() => setActiveStudentTab('ai')}
            >
              AI Assistant
            </button>
            <button
              className={studentTabClass('tips')}
              onClick={() => setActiveStudentTab('tips')}
            >
              Tips &amp; Tools
              {tips.length > 0 && (
                <span className="bg-yellow-400 text-black text-xs px-1.5 py-0.5 rounded-full ml-1 font-bold">
                  {tips.length}
                </span>
              )}
            </button>
          </div>

          {/* MY PROJECTS tab */}
          {activeStudentTab === 'projects' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">My Projects in This Course</h2>
                <Link
                  to="/new-project"
                  state={{ courseId }}
                  className="bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500"
                >
                  + Pitch a Project
                </Link>
              </div>
              {myProjects.length > 0 ? (
                <div className="space-y-3">
                  {myProjects.map(project => (
                    <ProjectCard key={project._id} project={project} />
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  No projects yet. Create your first project!
                </div>
              )}
            </div>
          )}

          {/* AI ASSISTANT tab */}
          {activeStudentTab === 'ai' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">AI Course Assistant</h2>
              {course?.aiProcessingEnabled === false ? (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                  <p className="text-orange-700 text-sm">
                    ⚠️ AI processing is disabled for this course. The AI assistant cannot
                    access course materials and will only provide general responses.
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                  <p className="text-gray-500 text-xs">
                    🔒 AI responses are grounded in your course materials. Extracted text
                    is processed by Google Gemini API.
                  </p>
                </div>
              )}
              <div className="flex flex-col" style={{ height: '22rem' }}>
                <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      Ask a question about this course&apos;s materials.
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-yellow-400 text-black'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 px-3 py-2 rounded-lg text-sm text-gray-500">
                        Thinking...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2 border-t border-gray-100 pt-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Ask about course materials..."
                    disabled={chatLoading}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500 disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TIPS & TOOLS tab — student read-only view */}
          {activeStudentTab === 'tips' && (
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Tips &amp; Tools</h3>
              <p className="text-sm text-gray-500 mb-5">
                Tips and tool recommendations from your instructor
              </p>

              {tips.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">💡</div>
                  <p className="text-gray-500 text-sm">No tips shared yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tips.map(tip => (
                    <div key={tip._id} className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex gap-3 items-start">
                        <span className="text-xl">{tipIcon(tip.category)}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{tip.title}</p>
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{tip.content}</p>
                          {tip.toolUrl && (
                            <a
                              href={tip.toolUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-yellow-600 text-xs hover:underline mt-2"
                            >
                              🔗 Open Tool →
                            </a>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Shared by {tip.createdBy?.fullName}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
