/**
 * RoleAssignment page
 * Admin can change user roles, set the isDepartmentHead flag
 * for instructors, and toggle user active status.
 */
import { useState, useEffect } from 'react'
import axiosInstance from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'

const ROLE_OPTIONS = ['student', 'instructor', 'ta', 'admin']

const ROLE_COLOURS = {
  admin:      'bg-red-100 text-red-700',
  instructor: 'bg-blue-100 text-blue-700',
  ta:         'bg-purple-100 text-purple-700',
  student:    'bg-green-100 text-green-700',
}

const RoleAssignment = () => {
  const [users, setUsers]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(null)
  const [successId, setSuccessId] = useState(null)
  const [search, setSearch]       = useState('')
  const [filterRole, setFilterRole] = useState('all')

  useEffect(() => {
    axiosInstance.get('/admin/users')
      .then(res => { setUsers(res.data); setLoading(false) })
      .catch(err => {
        console.error('RoleAssignment load error:', err)
        setLoading(false)
      })
  }, [])

  const patch = async (userId, fields) => {
    setSaving(userId)
    try {
      const res = await axiosInstance.patch(`/admin/users/${userId}`, fields)
      setUsers(prev =>
        prev.map(u => u._id === userId ? { ...u, ...res.data.user } : u)
      )
      setSuccessId(userId)
      setTimeout(() => setSuccessId(null), 2000)
    } catch (err) {
      console.error('Patch user error:', err)
    } finally {
      setSaving(null)
    }
  }

  const handleRoleChange = (userId, newRole) => patch(userId, { role: newRole })

  const handleDeptHeadToggle = (userId, current) =>
    patch(userId, { isDepartmentHead: !current })

  const handleActiveToggle = (userId, current) =>
    patch(userId, { isActive: !current })

  const filtered = users
    .filter(u => filterRole === 'all' || u.role === filterRole)
    .filter(u => {
      if (!search) return true
      const q = search.toLowerCase()
      return u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    })

  if (loading) return <LoadingSpinner />

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Assign roles and permissions to users
        </p>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-6 flex-wrap items-center">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="instructor">Instructors</option>
          <option value="ta">Teaching Assistants</option>
          <option value="admin">Admins</option>
        </select>
        <p className="text-sm text-gray-500 whitespace-nowrap">
          {filtered.length} user{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">👥</div>
          <p>No users found</p>
        </div>
      )}

      {/* Users table */}
      {filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Current Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Dept Head</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Active</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(u => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.fullName}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u._id, e.target.value)}
                      disabled={saving === u._id}
                      className={`text-xs px-2 py-1 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-yellow-400 disabled:opacity-50 capitalize ${
                        ROLE_COLOURS[u.role] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {ROLE_OPTIONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === 'instructor' ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!u.isDepartmentHead}
                          onChange={() => handleDeptHeadToggle(u._id, u.isDepartmentHead)}
                          disabled={saving === u._id}
                          className="w-4 h-4 accent-yellow-400"
                        />
                        <span className="text-xs text-gray-600">Dept Head</span>
                      </label>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive !== false ? (
                      <span className="text-green-600 text-xs">Active</span>
                    ) : (
                      <span className="text-red-500 text-xs">Inactive</span>
                    )}
                    <button
                      onClick={() => handleActiveToggle(u._id, u.isActive)}
                      disabled={saving === u._id}
                      className="ml-2 text-xs text-gray-400 hover:text-red-500 disabled:opacity-50"
                    >
                      {u.isActive !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {successId === u._id && (
                      <span className="text-green-600 text-xs">✓ Saved</span>
                    )}
                    {saving === u._id && successId !== u._id && (
                      <span className="text-gray-400 text-xs">Saving...</span>
                    )}
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

export default RoleAssignment
