/**
 * SavedResources page
 * Shows course materials the student has saved from their
 * recommendations page. Fetches material titles from the
 * materials API for each saved item.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSavedResources, removeSaved, markComplete } from '../api/saved'
import axiosInstance from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

/**
 * @desc Format an ISO date string to a readable short date
 * @param {string} dateStr
 * @returns {string} e.g. "Apr 14, 2026"
 */
function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

const SavedResources = () => {
  const navigate = useNavigate()
  const [savedItems, setSavedItems]       = useState([])
  const [titles, setTitles]               = useState({})
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSavedResources()
        setSavedItems(data)

        // Fetch material title for each saved item in parallel
        const titleResults = await Promise.all(
          data.map(async (item) => {
            try {
              const res = await axiosInstance.get(`/materials/${item.resourceId}`)
              return { id: item.resourceId, title: res.data.title || 'Course Material' }
            } catch {
              return { id: item.resourceId, title: 'Course Material' }
            }
          })
        )
        const titleMap = {}
        titleResults.forEach(({ id, title }) => { titleMap[id] = title })
        setTitles(titleMap)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load saved resources')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleRemove = async (savedId) => {
    try {
      await removeSaved(savedId)
      setSavedItems(prev => prev.filter(item => item._id !== savedId))
    } catch {
      // silent
    }
  }

  const handleComplete = async (savedId) => {
    try {
      const updated = await markComplete(savedId)
      setSavedItems(prev =>
        prev.map(item => item._id === savedId ? updated : item)
      )
    } catch {
      // silent
    }
  }

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-yellow-400 text-black font-semibold px-4 py-2 rounded-lg hover:bg-yellow-500"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Resources</h1>
          <p className="text-sm text-gray-500 mt-1">{savedItems.length} saved item{savedItems.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Empty state */}
      {savedItems.length === 0 && (
        <div className="text-center py-16 flex flex-col items-center">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-xl font-bold text-gray-800">No saved resources yet</h2>
          <p className="text-gray-500 text-sm mt-2 max-w-xs text-center">
            When you find useful course materials or videos, click Save to add them here
          </p>
          <button
            onClick={() => navigate('/courses')}
            className="bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-semibold mt-4 hover:bg-yellow-500"
          >
            Browse Courses
          </button>
        </div>
      )}

      {/* Saved items list */}
      {savedItems.length > 0 && (
        <div className="space-y-3">
          {savedItems.map(item => (
            <div
              key={item._id}
              className="bg-white border border-gray-200 rounded-xl p-4"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📄</span>
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {titles[item.resourceId] || 'Course Material'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {item.isCompleted ? (
                      <span className="text-green-600 text-xs font-medium">
                        ✓ Completed {formatDate(item.completedAt)}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">
                        Saved {formatDate(item.savedAt)}
                      </span>
                    )}
                    {item.isCompleted && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                        Complete
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {!item.isCompleted && (
                    <button
                      onClick={() => handleComplete(item._id)}
                      className="border border-green-400 text-green-600 text-xs px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      Mark Complete
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(item._id)}
                    className="border border-red-300 text-red-400 text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default SavedResources
