/**
 * ManageResources page
 * Admin view of all seeded resources in the database.
 */
import { useState, useEffect } from 'react'
import axiosInstance from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'

const TYPE_COLOURS = {
  tutorial:      'bg-blue-100 text-blue-700',
  documentation: 'bg-purple-100 text-purple-700',
  github:        'bg-gray-100 text-gray-700',
  video:         'bg-red-100 text-red-700',
  article:       'bg-green-100 text-green-700',
  book:          'bg-yellow-100 text-yellow-700',
  library:       'bg-indigo-100 text-indigo-700',
}

const ManageResources = () => {
  const [resources, setResources] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    axiosInstance.get('/resources')
      .then(res => { setResources(res.data); setLoading(false) })
      .catch(err => {
        console.error('ManageResources load error:', err)
        setLoading(false)
      })
  }, [])

  const filtered = resources
    .filter(r => filterType === 'all' || r.resourceType === filterType)
    .filter(r => {
      if (!search) return true
      const q = search.toLowerCase()
      return r.title?.toLowerCase().includes(q) || r.domain?.toLowerCase().includes(q)
    })

  if (loading) return <LoadingSpinner />

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Resources</h1>
        <p className="text-sm text-gray-500 mt-1">
          {resources.length} seeded resources in the database
        </p>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-6 flex-wrap items-center">
        <input
          type="text"
          placeholder="Search by title or domain..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          <option value="all">All Types</option>
          <option value="tutorial">Tutorial</option>
          <option value="documentation">Documentation</option>
          <option value="github">GitHub</option>
          <option value="video">Video</option>
          <option value="article">Article</option>
          <option value="book">Book</option>
          <option value="library">Library</option>
        </select>
        <p className="text-sm text-gray-500 whitespace-nowrap">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🔧</div>
          <p>No resources match your filter</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(r => (
          <div key={r._id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 text-sm">{r.title}</p>
                  {r.resourceType && (
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      TYPE_COLOURS[r.resourceType] || 'bg-gray-100 text-gray-600'
                    }`}>
                      {r.resourceType}
                    </span>
                  )}
                </div>
                {r.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.description}</p>
                )}
                <div className="flex gap-3 mt-2 flex-wrap">
                  {r.domain    && <span className="text-xs text-gray-400">Domain: {r.domain}</span>}
                  {r.language  && <span className="text-xs text-gray-400">· {r.language}</span>}
                  {r.skillLevel && <span className="text-xs text-gray-400">· {r.skillLevel}</span>}
                </div>
              </div>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-600 text-xs hover:underline flex-shrink-0"
              >
                Visit →
              </a>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default ManageResources
