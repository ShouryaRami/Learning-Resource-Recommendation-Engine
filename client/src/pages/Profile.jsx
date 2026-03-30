import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api/users';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [skillLevel, setSkillLevel] = useState(user?.skillLevel || 'beginner');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      const userId = user.id || user._id;
      await updateProfile(userId, { fullName, skillLevel });
      updateUser({ fullName, skillLevel });
      setEditing(false);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setFullName(user?.fullName || '');
    setSkillLevel(user?.skillLevel || 'beginner');
    setError('');
  };

  const inputClass =
    'w-full border border-gray-300 rounded-lg p-3 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-yellow-400';

  return (
    
    <div className="max-w-2xl">
          <div className="bg-white border border-gray-200 rounded-lg p-8">

            {/* Header row */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                <span className="text-black text-xl font-bold">{initials}</span>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{user?.fullName}</div>
                <div className="text-sm text-gray-500 mt-0.5">{user?.email}</div>
                <span className={`mt-2 inline-block text-xs font-medium px-2 py-1 rounded-full ${
                  user?.role === 'admin'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
                </span>
              </div>
            </div>

            {/* Success message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-green-700 text-sm">
                {success}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Basic Information */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Basic Information</h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="border border-gray-300 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {!editing ? (
                <div className="space-y-3">
                  {[
                    { label: 'Full Name', value: user?.fullName },
                    { label: 'Email', value: user?.email },
                    {
                      label: 'Skill Level',
                      value: user?.skillLevel
                        ? user.skillLevel.charAt(0).toUpperCase() + user.skillLevel.slice(1)
                        : '',
                    },
                    {
                      label: 'Role',
                      value: user?.role
                        ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                        : '',
                    },
                    {
                      label: 'Member Since',
                      value: user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'N/A',
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between items-center py-3 border-b border-gray-100"
                    >
                      <span className="text-sm text-gray-500">{row.label}</span>
                      <span className="text-sm font-medium text-gray-900">{row.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Skill Level</label>
                    <select
                      value={skillLevel}
                      onChange={(e) => setSkillLevel(e.target.value)}
                      className={inputClass}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-yellow-400 text-black font-semibold text-sm px-4 py-2 rounded-lg hover:bg-yellow-500 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="border border-gray-300 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Security section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Security</h2>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div>
                  <div className="text-sm text-gray-500">Password</div>
                  <div className="text-sm font-medium text-gray-900 mt-0.5">••••••••</div>
                </div>
                <button
                  onClick={() => alert('Password change will be available in a future update')}
                  className="text-yellow-600 text-sm hover:underline"
                >
                  Change
                </button>
              </div>
            </div>

          </div>
        </div>
  );
};

export default Profile;
