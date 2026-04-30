/**
 * LearningPaths page
 * Shows structured learning paths for all active projects.
 * Each project has a sequenced path: course materials first,
 * then YouTube videos, then GitHub code examples.
 * Students can track completion and download materials.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axiosInstance from '../api/axios'
import { getMyProjects } from '../api/projects'
import { downloadMaterial } from '../api/materials'
import LoadingSpinner from '../components/LoadingSpinner'

const LearningPaths = () => {
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const [projects, setProjects]               = useState([])
  const [recommendations, setRecommendations] = useState({})
  const [expandedProject, setExpandedProject] = useState(null)
  const [loading, setLoading]                 = useState(true)
  const [loadingRec, setLoadingRec]           = useState(null)
  const [completedIds, setCompletedIds]       = useState([])
  const [downloadingId, setDownloadingId]     = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [data, savedRes] = await Promise.all([
          getMyProjects(),
          axiosInstance.get('/saved').catch(() => ({ data: [] }))
        ])
        const active = data.filter(p => p.status === 'active')
        setProjects(active)
        // Pre-load which resources the student has already completed
        const done = savedRes.data
          .filter(s => s.isCompleted)
          .map(s => s.resourceId?._id || s.resourceId)
          .filter(Boolean)
        setCompletedIds(done)
      } catch (err) {
        console.error('LearningPaths load error:', err)
      } finally {
        setLoading(false)
      }
    }
    if (user) load()
  }, [user])

  const handleExpandProject = async (projectId) => {
    if (recommendations[projectId]) return
    setLoadingRec(projectId)
    try {
      const res = await axiosInstance.get('/recommendations/' + projectId)
      setRecommendations(prev => ({ ...prev, [projectId]: res.data }))
    } catch (err) {
      console.error('Load recommendations error:', err)
    } finally {
      setLoadingRec(null)
    }
  }

  const handleMarkComplete = async (resourceId, projectId) => {
    try {
      const saveRes = await axiosInstance.post('/saved', { resourceId, projectId })
      const savedId = saveRes.data.saved?._id || saveRes.data._id
      if (savedId) {
        await axiosInstance.patch('/saved/' + savedId + '/complete')
      }
      setCompletedIds(prev => [...prev, resourceId])
    } catch (err) {
      console.error('Mark complete error:', err)
    }
  }

  const handleSaveMaterial = async (materialId, projectId) => {
    try {
      await axiosInstance.post('/saved', { resourceId: materialId, projectId })
    } catch (err) {
      console.error('Save material error:', err)
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

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Learning Paths</h1>
        <p className="text-gray-500 text-sm mt-1">Your structured learning sequence for each project</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-xl font-bold text-gray-800">No active projects yet</h2>
          <p className="text-gray-500 text-sm mt-2">
            You need an approved project to see your learning path
          </p>
          <button
            onClick={() => navigate('/courses')}
            className="bg-yellow-400 text-black px-5 py-2 rounded-lg text-sm font-semibold mt-4 hover:bg-yellow-500"
          >
            Browse Courses
          </button>
        </div>
      ) : (
        projects.map(project => {
          const rec        = recommendations[project._id]
          const isExpanded = expandedProject === project._id
          const total      = rec?.summary?.totalSteps || 1
          const done       = completedIds.length
          const pct        = Math.round((done / total) * 100)

          return (
            <div key={project._id} className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden">

              {/* Project header — click to expand/collapse */}
              <div
                className="p-5 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
                onClick={() => {
                  const isExpanding = expandedProject !== project._id
                  setExpandedProject(prev => prev === project._id ? null : project._id)
                  if (isExpanding && !recommendations[project._id]) {
                    handleExpandProject(project._id)
                  }
                }}
              >
                <div>
                  <h3 className="font-bold text-gray-900">{project.title}</h3>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Active</span>
                    {project.domain && (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                        {project.domain}
                      </span>
                    )}
                    {project.language && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                        {project.language}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Course: {project.courseId?.title || project.courseId?.code || 'Unknown course'}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {rec && (
                    <span className="text-xs text-gray-500">
                      {rec.summary?.totalSteps} resources
                    </span>
                  )}
                  <span className="text-gray-400 text-lg">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded learning path content */}
              {isExpanded && (
                <>
                  {loadingRec === project._id ? (
                    <div className="p-6 text-center border-t border-gray-100">
                      <LoadingSpinner />
                      <p className="text-gray-400 text-sm mt-2">Loading your learning path...</p>
                    </div>
                  ) : rec ? (
                    <>
                      {/* AI narrative */}
                      {rec.narrative && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-5 mt-4 rounded-r-lg">
                          <p className="text-yellow-800 text-xs font-semibold uppercase tracking-wide mb-2">
                            Your learning path explained
                          </p>
                          <p className="text-yellow-800 text-sm leading-relaxed whitespace-pre-wrap">{rec.narrative}</p>
                        </div>
                      )}

                      {/* Progress bar */}
                      <div className="px-5 py-4 bg-gray-50 border-t border-b border-gray-100 mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium text-gray-700">Learning Progress</p>
                          <p className="text-sm text-gray-500">{done} completed</p>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full transition-all"
                            style={{ width: pct + '%' }}
                          />
                        </div>
                      </div>

                      {/* Section 1 — Course Materials */}
                      {rec.courseMaterials?.length > 0 && (
                        <div className="px-5 pt-4">
                          <h4 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                            <span>📄</span>
                            <span>Course Materials</span>
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                              {rec.courseMaterials.length}
                            </span>
                          </h4>
                          <div className="space-y-3">
                            {rec.courseMaterials.map((material, i) => (
                              <div
                                key={i}
                                className={`border rounded-lg p-4 ${
                                  material.score > 0 ? 'border-blue-200' : 'border-gray-200'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900 text-sm">{material.title}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{material.fileName}</p>
                                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                                      {material.excerpt?.slice(0, 200)}
                                      {material.excerpt?.length > 200 ? '...' : ''}
                                    </p>
                                  </div>
                                  <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded ml-3 flex-shrink-0">
                                    Course
                                  </span>
                                </div>
                                <div className="flex gap-2 mt-3 flex-wrap">
                                  <button
                                    onClick={() => handleDownload(material.materialId, material.fileName)}
                                    disabled={downloadingId === material.materialId}
                                    className="border border-gray-300 text-gray-600 text-xs px-3 py-1.5 rounded hover:bg-gray-50 disabled:opacity-50"
                                  >
                                    {downloadingId === material.materialId ? 'Downloading...' : '📥 Download'}
                                  </button>
                                  {completedIds.includes(material.materialId) ? (
                                    <span className="text-green-600 text-xs px-3 py-1.5 font-medium">
                                      ✓ Completed
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleMarkComplete(material.materialId, project._id)}
                                      className="bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded hover:bg-green-200"
                                    >
                                      Mark Complete
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Section 2 — Instructor Tips */}
                      {rec.instructorTips?.length > 0 && (
                        <div className="px-5 pt-4">
                          <h4 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                            <span>💡</span>
                            <span>Instructor Tips</span>
                            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">
                              {rec.instructorTips.length}
                            </span>
                          </h4>
                          <div className="space-y-2">
                            {rec.instructorTips.map((tip, i) => (
                              <div key={tip.tipId || i} className="border border-yellow-200 bg-yellow-50 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <span className="text-lg flex-shrink-0">
                                    {tip.category === 'tool_recommendation' ? '🔧'
                                      : tip.category === 'resource_link' ? '🔗'
                                      : tip.category === 'study_tip' ? '💡'
                                      : '📝'}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-sm">{tip.title}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      Shared by {tip.createdBy || 'Instructor'}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">{tip.content}</p>
                                    {tip.toolUrl && (
                                      <a
                                        href={tip.toolUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-yellow-600 hover:underline mt-1 inline-block"
                                      >
                                        Open Tool →
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Section 3 — YouTube Videos */}
                      {rec.videos?.length > 0 && (
                        <div className="px-5 pt-4">
                          <h4 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                            <span>🎬</span>
                            <span>Video Tutorials</span>
                            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                              {rec.videos.length}
                            </span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {rec.videos.slice(0, 4).map((video, i) => (
                              <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                                {video.thumbnail && (
                                  <img
                                    src={video.thumbnail}
                                    alt={video.title}
                                    className="w-full h-32 object-cover"
                                  />
                                )}
                                <div className="p-3">
                                  <p className="text-sm font-medium text-gray-900 line-clamp-2">{video.title}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">{video.channelTitle}</p>
                                  <a
                                    href={video.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-block bg-red-500 text-white text-xs px-3 py-1.5 rounded hover:bg-red-600"
                                  >
                                    ▶ Watch
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Section 4 — GitHub Code Examples */}
                      {rec.codeExamples?.length > 0 && (
                        <div className="px-5 pt-4 pb-5">
                          <h4 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                            <span>💻</span>
                            <span>Code Examples</span>
                            <span className="bg-gray-800 text-white text-xs px-2 py-0.5 rounded-full">
                              {rec.codeExamples.length}
                            </span>
                          </h4>
                          <div className="space-y-2">
                            {rec.codeExamples.map((repo, i) => (
                              <div
                                key={i}
                                className="border border-gray-200 rounded-lg p-3 flex justify-between items-start"
                              >
                                <div className="flex-1">
                                  <p className="font-mono text-sm font-medium text-gray-900">{repo.name}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{repo.description}</p>
                                  <div className="flex gap-2 mt-1">
                                    <span className="text-xs text-gray-400">⭐ {repo.stars?.toLocaleString()}</span>
                                    {repo.language && (
                                      <span className="text-xs text-gray-400">{repo.language}</span>
                                    )}
                                  </div>
                                </div>
                                <a
                                  href={repo.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-yellow-600 text-xs hover:underline ml-3 flex-shrink-0"
                                >
                                  View →
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-6 text-center border-t border-gray-100 text-gray-400">
                      <p>Could not load recommendations for this project</p>
                      <button
                        onClick={() => handleExpandProject(project._id)}
                        className="text-yellow-600 text-sm mt-2 hover:underline"
                      >
                        Try again
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

export default LearningPaths
