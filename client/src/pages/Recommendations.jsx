/**
 * Recommendations page
 * Shows the full learning path for a student's active project.
 * Divided into three sections: course materials, YouTube videos,
 * and GitHub code examples — plus a Gemini-generated narrative.
 * Fetches fresh data from the API on each load.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRecommendations } from '../api/recommendations'
import { downloadMaterial } from '../api/materials'
import axiosInstance from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

/**
 * MaterialCard
 * Displays a single course material excerpt with save and download actions.
 * @param {Object} props.material - { title, fileName, excerpt, score, materialId }
 * @param {string[]} props.savedIds - IDs already saved by the student
 * @param {string|null} props.downloadingId - ID currently being downloaded
 * @param {Function} props.onSave - (materialId) => void
 * @param {Function} props.onDownload - (materialId, fileName) => void
 */
function MaterialCard({ material, savedIds, downloadingId, onSave, onDownload }) {
  const [expanded, setExpanded] = useState(false)
  const excerpt = material.excerpt || ''
  const isLong = excerpt.length > 200
  const isSaved = savedIds?.includes(material.materialId)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">📄</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm">{material.title}</p>
          <p className="text-xs text-gray-400 mt-0.5 mb-2">{material.fileName}</p>
          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
            {isLong && !expanded ? excerpt.slice(0, 200) + '...' : excerpt}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(prev => !prev)}
              className="text-xs text-yellow-600 hover:underline mt-1"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
          {material.score > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Relevance: {material.score} keyword matches
            </p>
          )}
          {/* Action buttons — only shown when handlers are provided */}
          {(onSave || onDownload) && (
            <div className="flex gap-2 mt-3">
              {onSave && material.materialId && (
                <button
                  onClick={() => onSave(material.materialId)}
                  disabled={isSaved}
                  className="bg-yellow-400 text-black text-xs px-3 py-1.5 rounded-lg hover:bg-yellow-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaved ? 'Saved ✓' : 'Save'}
                </button>
              )}
              {onDownload && material.materialId && (
                <button
                  onClick={() => onDownload(material.materialId, material.fileName)}
                  disabled={downloadingId === material.materialId}
                  className="border border-gray-300 text-gray-600 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {downloadingId === material.materialId ? 'Downloading...' : 'Download'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * VideoCard
 * Displays a single YouTube video with thumbnail and channel info.
 * @param {Object} props.video - { title, url, thumbnail, channelTitle, description }
 */
function VideoCard({ video }) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex gap-3 hover:border-yellow-400 transition-colors"
    >
      {video.thumbnail ? (
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-28 h-16 object-cover rounded flex-shrink-0"
        />
      ) : (
        <div className="w-28 h-16 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center text-2xl">
          ▶️
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">
          {video.title}
        </p>
        <p className="text-xs text-gray-400 mt-1">{video.channelTitle}</p>
        {video.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{video.description}</p>
        )}
      </div>
    </a>
  )
}

/**
 * GitHubCard
 * Displays a single GitHub repository with star count and description.
 * @param {Object} props.repo - { name, url, stars, description, language, owner }
 */
function GitHubCard({ repo }) {
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex gap-3 hover:border-yellow-400 transition-colors"
    >
      <div className="text-2xl flex-shrink-0">💻</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-800 text-sm">{repo.name}</p>
          {repo.language && (
            <span className="bg-gray-100 text-gray-500 text-xs rounded px-1.5 py-0.5">
              {repo.language}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{repo.owner}</p>
        {repo.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{repo.description}</p>
        )}
        <div className="flex items-center gap-1 mt-2">
          <span className="text-xs">⭐</span>
          <span className="text-xs text-gray-500">{repo.stars?.toLocaleString()} stars</span>
        </div>
      </div>
    </a>
  )
}

const Recommendations = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()

  const [data, setData]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [savedIds, setSavedIds]       = useState([])
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getRecommendations(projectId)
        setData(result)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load recommendations')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  const handleSaveMaterial = async (materialId) => {
    try {
      await axiosInstance.post('/saved', { resourceId: materialId, projectId })
      setSavedIds(prev => [...prev, materialId])
    } catch (err) {
      console.error('Save material error:', err)
    }
  }

  const handleDownloadMaterial = async (materialId, fileName) => {
    setDownloadingId(materialId)
    try {
      await downloadMaterial(materialId, fileName)
    } catch (err) {
      console.error('Download material error:', err)
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-yellow-400 text-black font-semibold px-4 py-2 rounded-lg hover:bg-yellow-500"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  const { courseMaterials = [], videos = [], codeExamples = [], narrative } = data

  const isEmpty = courseMaterials.length === 0 && videos.length === 0 && codeExamples.length === 0

  return (
    <>
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learning Path</h1>
          <p className="text-sm text-gray-500 mt-1">
            Resources tailored to your project and course materials
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="border border-gray-300 text-gray-600 text-sm px-4 py-2 rounded hover:bg-gray-50 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Gemini learning narrative */}
      {narrative && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <p className="text-yellow-800 text-sm font-medium mb-1">Your learning path explained</p>
          <p className="text-yellow-700 text-sm leading-relaxed">{narrative}</p>
        </div>
      )}

      {isEmpty && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">📭</div>
          <p className="font-medium">No recommendations found yet</p>
          <p className="text-sm mt-1">
            Make sure your course has uploaded materials and try again.
          </p>
        </div>
      )}

      {/* Section 1 — Course Materials (60% weight, shown first) */}
      {courseMaterials.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-gray-800">From Your Course Materials</h2>
            <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-2 py-0.5">
              {courseMaterials.length}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Sections from your professor's uploaded materials relevant to your project
          </p>
          <div className="space-y-3">
            {courseMaterials.map((m, i) => (
              <MaterialCard
                key={m.materialId || i}
                material={m}
                savedIds={savedIds}
                downloadingId={downloadingId}
                onSave={handleSaveMaterial}
                onDownload={handleDownloadMaterial}
              />
            ))}
          </div>
        </section>
      )}

      {/* Section 2 — YouTube Tutorials (25% weight) */}
      {videos.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-gray-800">Learn the Coding</h2>
            <span className="bg-red-100 text-red-700 text-xs rounded-full px-2 py-0.5">
              {videos.length}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            YouTube tutorials for your language and project domain
          </p>
          <div className="space-y-3">
            {videos.map((v, i) => (
              <VideoCard key={v.videoId || i} video={v} />
            ))}
          </div>
        </section>
      )}

      {/* Section 3 — GitHub Code Examples (15% weight) */}
      {codeExamples.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-gray-800">See It In Code</h2>
            <span className="bg-gray-100 text-gray-600 text-xs rounded-full px-2 py-0.5">
              {codeExamples.length}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Open-source repositories on GitHub to learn from real projects
          </p>
          <div className="space-y-3">
            {codeExamples.map((r, i) => (
              <GitHubCard key={r.url || i} repo={r} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

export default Recommendations
