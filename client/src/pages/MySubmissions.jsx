/**
 * MySubmissions page
 * Students view all their submitted deliverables and grades,
 * and submit pending deliverables inline without leaving the page.
 */
import { useState, useEffect, useRef } from 'react'
import { getMySubmissions, getPendingSubmissions, createSubmission } from '../api/submissions'
import { getMyProjects } from '../api/projects'
import axiosInstance from '../api/axios'

/**
 * @desc Format a date string safely in local timezone.
 * Prevents the UTC midnight off-by-one day issue.
 * @param {string|Date} dateVal
 * @returns {string}
 */
const formatDate = (dateVal) => {
  if (!dateVal) return ''
  if (typeof dateVal === 'string' && dateVal.length === 10) {
    const [year, month, day] = dateVal.split('-')
    return new Date(Number(year), Number(month) - 1, Number(day))
      .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }
  return new Date(dateVal).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  })
}

/**
 * @desc Return Tailwind color classes based on grade value.
 * @param {string} grade
 * @returns {{ bg: string, text: string, border: string }}
 */
const getGradeColor = (grade) => {
  if (!grade) return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' }
  const g = grade.toString().trim().toUpperCase()
  if (g === 'A' || g === 'A+' || g === 'A-') return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' }
  if (g === 'B' || g === 'B+' || g === 'B-') return { bg: 'bg-lime-100', text: 'text-lime-700', border: 'border-lime-200' }
  if (g === 'C' || g === 'C+' || g === 'C-') return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' }
  if (g === 'D' || g === 'D+' || g === 'D-') return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' }
  if (g === 'F') return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' }
  let score = null
  if (g.includes('/')) {
    const parts = g.split('/')
    const num = parseFloat(parts[0])
    const denom = parseFloat(parts[1])
    if (!isNaN(num) && !isNaN(denom) && denom > 0) score = (num / denom) * 100
  } else {
    score = parseFloat(g.replace('%', ''))
  }
  if (score !== null && !isNaN(score)) {
    if (score >= 90) return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' }
    if (score >= 80) return { bg: 'bg-lime-100', text: 'text-lime-700', border: 'border-lime-200' }
    if (score >= 70) return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' }
    if (score >= 60) return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' }
    return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' }
  }
  return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' }
}

const MySubmissions = () => {
  const [submissions, setSubmissions]       = useState([])
  const [pendingItems, setPendingItems]     = useState([])
  const [loading, setLoading]               = useState(true)

  // inline submission form state
  const [expandedItemId, setExpandedItemId] = useState(null)
  const [courseProjects, setCourseProjects] = useState({})
  const [submitForm, setSubmitForm]         = useState({ title: '', description: '', deliverableUrl: '', projectId: '' })
  const [submitFile, setSubmitFile]         = useState(null)
  const [submitting, setSubmitting]         = useState(false)
  const [submitError, setSubmitError]       = useState('')
  const fileInputRef                        = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [subs, pending] = await Promise.all([
          getMySubmissions(),
          getPendingSubmissions()
        ])
        setSubmissions(Array.isArray(subs) ? subs : [])
        setPendingItems(Array.isArray(pending) ? pending : [])
      } catch (err) {
        console.error('Load submissions error:', err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await axiosInstance.get(
        `/submissions/file/${fileId}`,
        { responseType: 'blob' }
      )
      const blob = new Blob([response.data])
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
    }
  }

  /**
   * @desc Toggle the inline submission form for a pending deliverable.
   * Lazy-loads active projects for the course on first open.
   * @param {Object} item - Pending deliverable item
   */
  const handleOpenSubmit = async (item) => {
    if (expandedItemId === item.deliverableId) {
      setExpandedItemId(null)
      setSubmitError('')
      return
    }

    setExpandedItemId(item.deliverableId)
    setSubmitError('')
    setSubmitFile(null)
    setSubmitForm({
      title:          item.deliverableName || '',
      description:    '',
      deliverableUrl: '',
      projectId:      ''
    })

    const cId = item.courseId?.toString()
    if (cId && !courseProjects[cId]) {
      try {
        const all = await getMyProjects()
        const active = (Array.isArray(all) ? all : [])
          .filter(p => p.courseId?.toString() === cId && p.status === 'active')
        setCourseProjects(prev => ({ ...prev, [cId]: active }))
        if (active.length === 1) {
          setSubmitForm(prev => ({ ...prev, projectId: active[0]._id }))
        }
      } catch (err) {
        console.error('Load projects error:', err.message)
        setCourseProjects(prev => ({ ...prev, [cId]: [] }))
      }
    } else if (cId && courseProjects[cId]?.length === 1) {
      setSubmitForm(prev => ({ ...prev, projectId: courseProjects[cId][0]._id }))
    }
  }

  /**
   * @desc Submit a deliverable using the inline form.
   * On success, removes the item from pendingItems and prepends to submissions.
   * @param {Object} item - Pending deliverable item
   */
  const handleSubmit = async (item) => {
    setSubmitError('')
    if (!submitForm.title.trim()) {
      setSubmitError('Title is required.')
      return
    }
    if (!submitForm.projectId) {
      setSubmitError('Please select a project.')
      return
    }

    setSubmitting(true)
    try {
      const result = await createSubmission(
        {
          projectId:      submitForm.projectId,
          title:          submitForm.title.trim(),
          description:    submitForm.description.trim(),
          deliverableUrl: submitForm.deliverableUrl.trim(),
          deliverableName: item.deliverableName,
          deliverableId:  item.deliverableId
        },
        submitFile
      )
      setPendingItems(prev => prev.filter(p => p.deliverableId !== item.deliverableId))
      setSubmissions(prev => [result.submission, ...prev])
      setExpandedItemId(null)
      setSubmitFile(null)
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Submission failed.'
      setSubmitError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isEmpty = pendingItems.length === 0 && submissions.length === 0

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Submissions</h1>
        <p className="text-gray-500 text-sm mt-1">Your deliverables and grades</p>
      </div>

      {isEmpty ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-semibold text-gray-700">No deliverables yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Your instructor has not assigned any deliverables yet
          </p>
        </div>
      ) : (
        <div className="max-w-3xl">

          {/* SECTION 1 — Pending deliverables */}
          {pendingItems.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Pending Submissions</h2>
              <p className="text-sm text-gray-500 mb-4">
                Deliverables assigned to you that need to be submitted
              </p>
              <div className="space-y-3">
                {pendingItems.map(item => {
                  const cId = item.courseId?.toString()
                  const projects = courseProjects[cId]
                  const isOpen = expandedItemId === item.deliverableId

                  return (
                    <div key={item.deliverableId} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

                      {/* Card header row */}
                      <div className="border-l-4 border-yellow-400 p-4 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{item.deliverableName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.courseTitle}{item.courseCode ? ` (${item.courseCode})` : ''}
                          </p>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                          )}
                          {item.dueDate && (
                            <p className="text-xs text-orange-500 mt-1 font-medium">
                              Due: {formatDate(item.dueDate)}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                            ⏳ Not submitted
                          </span>
                          <button
                            onClick={() => handleOpenSubmit(item)}
                            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 whitespace-nowrap font-medium"
                          >
                            {isOpen ? 'Cancel ✕' : 'Submit →'}
                          </button>
                        </div>
                      </div>

                      {/* Inline submission form */}
                      {isOpen && (
                        <div className="border-t border-gray-100 bg-gray-50 p-4">
                          {projects === undefined ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                              Loading your projects…
                            </div>
                          ) : projects.length === 0 ? (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
                              You need an approved project in this course to submit a deliverable.
                              Go to your course page and pitch a project first.
                            </div>
                          ) : (
                            <div className="space-y-3">

                              {/* Project selector (only if multiple active projects) */}
                              {projects.length > 1 && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Project <span className="text-red-500">*</span>
                                  </label>
                                  <select
                                    value={submitForm.projectId}
                                    onChange={e => setSubmitForm(prev => ({ ...prev, projectId: e.target.value }))}
                                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                  >
                                    <option value="">— Select a project —</option>
                                    {projects.map(p => (
                                      <option key={p._id} value={p._id}>{p.title}</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {/* Auto-selected project label */}
                              {projects.length === 1 && (
                                <div className="text-xs text-gray-500">
                                  Project: <span className="font-medium text-gray-700">{projects[0].title}</span>
                                </div>
                              )}

                              {/* Title */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Submission title <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={submitForm.title}
                                  onChange={e => setSubmitForm(prev => ({ ...prev, title: e.target.value }))}
                                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                  placeholder="e.g. Final Report"
                                />
                              </div>

                              {/* Description */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
                                <textarea
                                  value={submitForm.description}
                                  onChange={e => setSubmitForm(prev => ({ ...prev, description: e.target.value }))}
                                  rows={2}
                                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                                  placeholder="Any notes for your instructor…"
                                />
                              </div>

                              {/* URL */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Link (optional)</label>
                                <input
                                  type="url"
                                  value={submitForm.deliverableUrl}
                                  onChange={e => setSubmitForm(prev => ({ ...prev, deliverableUrl: e.target.value }))}
                                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                  placeholder="https://github.com/…"
                                />
                              </div>

                              {/* File upload */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  File attachment (optional — PDF, ZIP, DOC, DOCX, TXT · max 25 MB)
                                </label>
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-xs bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100"
                                  >
                                    📎 Choose file
                                  </button>
                                  {submitFile && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                      <span className="truncate max-w-xs">{submitFile.name}</span>
                                      <button
                                        type="button"
                                        onClick={() => { setSubmitFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                                        className="text-red-400 hover:text-red-600 font-bold"
                                      >✕</button>
                                    </div>
                                  )}
                                </div>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept=".pdf,.zip,.doc,.docx,.txt"
                                  className="hidden"
                                  onChange={e => setSubmitFile(e.target.files?.[0] || null)}
                                />
                              </div>

                              {/* Error */}
                              {submitError && (
                                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                  {submitError}
                                </p>
                              )}

                              {/* Actions */}
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => handleSubmit(item)}
                                  disabled={submitting}
                                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                                >
                                  {submitting ? 'Submitting…' : 'Submit deliverable'}
                                </button>
                                <button
                                  onClick={() => { setExpandedItemId(null); setSubmitError('') }}
                                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* SECTION 2 — Submitted deliverables */}
          {submissions.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Submitted</h2>
              <p className="text-sm text-gray-500 mb-4">Your submitted deliverables and grades</p>
              <div className="space-y-4">
                {submissions.map(sub => (
                  <div key={sub._id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

                    {/* Top row */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{sub.title}</p>
                        {sub.deliverableName && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                            {sub.deliverableName}
                          </span>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {sub.courseId?.title || 'Course'} · {sub.projectId?.title || 'Project'}
                        </p>
                      </div>
                      {(() => {
                        const colors = getGradeColor(sub.grade)
                        return (
                          <span className={`text-xs px-3 py-1 rounded-full font-medium flex-shrink-0 ml-3 ${
                            sub.status === 'graded'
                              ? `${colors.bg} ${colors.text}`
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {sub.status === 'graded' ? `Grade: ${sub.grade}` : 'Awaiting Grade'}
                          </span>
                        )
                      })()}
                    </div>

                    {/* Description */}
                    {sub.description && (
                      <p className="text-sm text-gray-600 mb-3">{sub.description}</p>
                    )}

                    {/* File and URL links */}
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      {sub.submittedFileId && (
                        <button
                          onClick={() => handleDownload(sub.submittedFileId, sub.submittedFileName)}
                          className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                        >
                          <span>📎</span>
                          <span>{sub.submittedFileName || 'Download File'}</span>
                        </button>
                      )}
                      {sub.deliverableUrl && (
                        <a
                          href={sub.deliverableUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200"
                        >
                          <span>🔗</span>
                          <span>View Link</span>
                        </a>
                      )}
                      <p className="text-xs text-gray-400 ml-auto">
                        Submitted {formatDate(sub.submittedAt)}
                      </p>
                    </div>

                    {/* Grade section */}
                    {sub.status === 'graded' ? (() => {
                      const colors = getGradeColor(sub.grade)
                      return (
                        <div className={`${colors.bg} border ${colors.border} rounded-lg p-3 mt-2`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-semibold ${colors.text}`}>
                              ✓ Grade: {sub.grade}
                            </span>
                            {sub.gradedAt && (
                              <span className="text-xs text-gray-400">
                                {formatDate(sub.gradedAt)}
                              </span>
                            )}
                          </div>
                          {sub.feedback && (
                            <p className={`text-sm mt-1 ${colors.text}`}>{sub.feedback}</p>
                          )}
                        </div>
                      )
                    })() : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                        <p className="text-xs text-yellow-700">⏳ Awaiting grade from instructor</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </>
  )
}

export default MySubmissions
