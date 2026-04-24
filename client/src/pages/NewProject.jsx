/**
 * NewProject page
 * Allows students to pitch a new project idea
 * within one of their enrolled courses.
 * Supports optional proposal document upload.
 * Shows a pending approval screen after submit.
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getMyEnrollments } from '../api/enrollments'
import { pitchProject } from '../api/projects'
import LoadingSpinner from '../components/LoadingSpinner'

const NewProject = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    title:       '',
    courseId:    '',
    description: '',
    domain:      'general',
    language:    'any',
    skillLevel:  'beginner'
  })
  const [proposalFile, setProposalFile]         = useState(null)
  const [enrolledCourses, setEnrolledCourses]   = useState([])
  const [loading, setLoading]                   = useState(true)
  const [submitting, setSubmitting]             = useState(false)
  const [error, setError]                       = useState('')
  const [submitted, setSubmitted]               = useState(false)
  const [submittedProject, setSubmittedProject] = useState(null)

  useEffect(() => {
    document.title = 'Pitch a Project — UMBC Learn'
    return () => { document.title = 'UMBC Learn' }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMyEnrollments()
        const approved = data.filter(e => e.status === 'approved')
        setEnrolledCourses(approved)
        // Pre-fill course if navigated from a specific course page
        if (location.state?.courseId) {
          setFormData(prev => ({ ...prev, courseId: location.state.courseId }))
        }
      } catch (err) {
        console.error('NewProject load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('courseId',    formData.courseId)
      fd.append('title',       formData.title)
      fd.append('description', formData.description)
      fd.append('domain',      formData.domain)
      fd.append('language',    formData.language)
      fd.append('skillLevel',  formData.skillLevel)
      if (proposalFile) fd.append('proposalDoc', proposalFile)

      const result = await pitchProject(fd)
      setSubmittedProject(result.project)
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit pitch. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setSubmitted(false)
    setSubmittedProject(null)
    setFormData({
      title: '', courseId: '', description: '',
      domain: 'general', language: 'any', skillLevel: 'beginner'
    })
    setProposalFile(null)
    setError('')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    )
  }

  // --- Success screen ---
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm border p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-900">Project Submitted!</h2>
          <p className="text-gray-500 text-sm mt-2 mb-6">
            Your project pitch has been submitted to the instructor for review.
            You will be able to access recommendations once it is approved.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-yellow-800 text-sm font-medium">
              {submittedProject?.title}
            </p>
            <p className="text-yellow-600 text-xs mt-1">
              {submittedProject?.courseId?.title || formData.courseId}
            </p>
            <span className="mt-2 inline-block bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">
              Pending Approval
            </span>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm"
            >
              Go to Dashboard
            </button>
            <button
              onClick={handleReset}
              className="bg-yellow-400 text-black px-5 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500"
            >
              Pitch Another Project
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- Main form ---
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pitch a Project</h1>
        <p className="text-gray-500 text-sm mt-1">
          Submit your project idea for instructor approval
        </p>
      </div>

      {/* Empty state — no enrolled courses */}
      {enrolledCourses.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">📚</div>
          <p className="font-semibold text-gray-800">You are not enrolled in any courses</p>
          <p className="text-gray-500 text-sm mt-1">
            Enroll in a course first before pitching a project
          </p>
          <button
            onClick={() => navigate('/courses')}
            className="mt-4 bg-yellow-400 text-black px-5 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500"
          >
            Browse Courses
          </button>
        </div>
      )}

      {/* Form — only shown when enrolled in at least one course */}
      {enrolledCourses.length > 0 && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-6">

          {/* Course selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Course <span className="text-red-500">*</span>
            </label>
            <select
              name="courseId"
              value={formData.courseId}
              onChange={handleChange}
              required
              className="border border-gray-300 rounded-lg px-3 py-2.5 w-full text-sm focus:border-yellow-400 focus:outline-none"
            >
              <option value="" disabled>Select a course...</option>
              {enrolledCourses.map(e => (
                <option key={e._id} value={e.courseId?._id || e.courseId}>
                  {e.courseId?.title} ({e.courseId?.code})
                </option>
              ))}
            </select>
          </div>

          {/* Project title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Student Grade Management System"
              required
              className="border border-gray-300 rounded-lg px-3 py-2.5 w-full text-sm focus:border-yellow-400 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Description <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-1">
              Describe what your project does, what problem it solves,
              and any technical requirements you have in mind.
            </p>
            <textarea
              name="description"
              rows={5}
              value={formData.description}
              onChange={handleChange}
              required
              className="border border-gray-300 rounded-lg px-3 py-2.5 w-full text-sm focus:border-yellow-400 focus:outline-none"
            />
          </div>

          {/* Domain / Language / Skill Level */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
              <select
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-3 py-2.5 w-full text-sm focus:border-yellow-400 focus:outline-none"
              >
                <option value="general">General</option>
                <option value="web">Web</option>
                <option value="mobile">Mobile</option>
                <option value="ml">Machine Learning</option>
                <option value="data">Data Science</option>
                <option value="security">Security</option>
                <option value="devops">DevOps</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-3 py-2.5 w-full text-sm focus:border-yellow-400 focus:outline-none"
              >
                <option value="any">Any</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="typescript">TypeScript</option>
                <option value="cpp">C++</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skill Level</label>
              <select
                name="skillLevel"
                value={formData.skillLevel}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-3 py-2.5 w-full text-sm focus:border-yellow-400 focus:outline-none"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Proposal document (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proposal Document <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Upload a PDF or Word document with your detailed project proposal
            </p>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={e => setProposalFile(e.target.files[0] || null)}
            />
            {/* Clickable drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-yellow-400 transition-colors"
            >
              {proposalFile ? (
                <>
                  <div className="text-2xl mb-1">✅</div>
                  <p className="text-gray-700 text-sm font-medium">{proposalFile.name}</p>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setProposalFile(null) }}
                    className="text-red-500 text-xs mt-1 hover:underline"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <>
                  <div className="text-3xl mb-2">📄</div>
                  <p className="text-gray-500 text-sm">Click to upload or drag and drop</p>
                  <p className="text-gray-400 text-xs mt-1">PDF, DOC, DOCX up to 10MB</p>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !formData.courseId || !formData.title || !formData.description}
            className="w-full py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Pitch'}
          </button>
        </form>
      )}
    </div>
  )
}

export default NewProject
