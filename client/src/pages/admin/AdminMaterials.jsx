/**
 * AdminMaterials page
 * Shows all course materials across all courses.
 * Fetches each course's materials and combines them into one table.
 */
import { useState, useEffect } from 'react'
import axiosInstance from '../../api/axios'
import { getAllCourses } from '../../api/courses'
import LoadingSpinner from '../../components/LoadingSpinner'

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const AdminMaterials = () => {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const courses = await getAllCourses()
        const all = []
        await Promise.all(
          courses.map(async (course) => {
            try {
              const res = await axiosInstance.get('/materials/course/' + course._id)
              res.data.forEach(m => {
                all.push({ ...m, courseName: course.title, courseCode: course.code })
              })
            } catch {
              // Course may have no materials — skip silently
            }
          })
        )
        setMaterials(all)
      } catch (err) {
        console.error('AdminMaterials load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Course Materials</h1>
        <p className="text-sm text-gray-500 mt-1">
          {materials.length} materials across all courses
        </p>
      </div>

      {materials.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">📁</div>
          <p>No materials uploaded yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-white border border-gray-200 rounded-xl">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">File</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Course</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Uploaded By</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Size</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Visible</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {materials.map(m => (
                <tr key={m._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{m.title}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{m.fileName}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {m.courseName}
                    {m.courseCode && (
                      <span className="text-gray-400 text-xs ml-1">({m.courseCode})</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{m.uploadedBy?.fullName || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{formatBytes(m.fileSize)}</td>
                  <td className="px-4 py-3">
                    {m.isProcessed ? (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">Ready</span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded">Processing</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {m.isVisibleToStudents ? (
                      <span className="text-green-600 text-xs">Visible</span>
                    ) : (
                      <span className="text-gray-400 text-xs">Hidden</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(m.uploadedAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export default AdminMaterials
