/**
 * ManageUsers page
 * Admin view of all registered users. Supports client-side
 * filtering by role and name/email search.
 */
import { useState, useEffect } from 'react'
import { getUsers } from '../../api/admin'
import LoadingSpinner from '../../components/LoadingSpinner'

/** Role badge colours */
const ROLE_STYLES = {
  admin:      'bg-red-100 text-red-700',
  instructor: 'bg-blue-100 text-blue-700',
  ta:         'bg-purple-100 text-purple-700',
  student:    'bg-green-100 text-green-700',
}

/**
 * @desc Format an ISO date to a short readable date
 * @param {string} dateStr
 * @returns {string} e.g. "Apr 12, 2026"
 */
function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

const ManageUsers = () => {
  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterRole, setFilterRole] = useState('all')

  useEffect(() => {
    getUsers()
      .then(data => { setUsers(data); setLoading(false) })
      .catch(err => {
        console.error('ManageUsers load error:', err)
        setLoading(false)
      })
  }, [])

  // Client-side filtering — search and role filter
  const filtered = users
    .filter(u => filterRole === 'all' || u.role === filterRole)
    .filter(u => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      )
    })

  if (loading) return <LoadingSpinner />

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
        <p className="text-sm text-gray-500 mt-1">
          All registered users — search, filter by role, verify status
        </p>
      </div>

      {/* Search + filter row */}
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
        <p className="text-sm text-gray-500 self-center whitespace-nowrap">
          {filtered.length} user{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">👥</div>
          <p className="font-medium">No users found</p>
          <p className="text-sm mt-1">Try adjusting your search or filter</p>
        </div>
      )}

      {/* Users table */}
      {filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Verified
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Active
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(u => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {u.fullName}
                    {u.isDepartmentHead && (
                      <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 rounded">
                        Dept Head
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      ROLE_STYLES[u.role] || 'bg-gray-100 text-gray-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isVerified ? (
                      <span className="text-green-600 text-xs">✓ Verified</span>
                    ) : (
                      <span className="text-gray-400 text-xs">Unverified</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive !== false ? (
                      <span className="text-green-600 text-xs">Active</span>
                    ) : (
                      <span className="text-red-500 text-xs">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {formatDate(u.createdAt)}
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

export default ManageUsers
