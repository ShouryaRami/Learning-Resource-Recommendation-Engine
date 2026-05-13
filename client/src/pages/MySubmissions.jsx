/**
 * MySubmissions page
 * Students view all their submitted deliverables and grades.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMySubmissions } from '../api/submissions'
import axiosInstance from '../api/axios'

const MySubmissions = () => {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading]         = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMySubmissions()
        setSubmissions(Array.isArray(data) ? data : [])
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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Submissions</h1>
        <p className="text-gray-500 text-sm mt-1">Your submitted deliverables and grades</p>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-semibold text-gray-700">No submissions yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Submit your project deliverables from the Dashboard
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 bg-yellow-400 text-black px-5 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500"
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl">
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
                <span className={`text-xs px-3 py-1 rounded-full font-medium flex-shrink-0 ml-3 ${
                  sub.status === 'graded'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {sub.status === 'graded' ? `Grade: ${sub.grade}` : 'Awaiting Grade'}
                </span>
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
                  Submitted {new Date(sub.submittedAt).toLocaleDateString()}
                </p>
              </div>

              {/* Grade section */}
              {sub.status === 'graded' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-green-600 text-sm font-semibold">
                      ✓ Graded: {sub.grade}
                    </span>
                    {sub.gradedAt && (
                      <span className="text-xs text-gray-400">
                        {new Date(sub.gradedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {sub.feedback && (
                    <p className="text-sm text-green-700 mt-1">{sub.feedback}</p>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                  <p className="text-xs text-yellow-700">⏳ Awaiting grade from instructor</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default MySubmissions
