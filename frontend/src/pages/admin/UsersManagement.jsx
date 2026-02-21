// src/pages/admin/UsersManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  createUser,
  deleteUser as deleteUserApi,
  getUsers,
  updateUserRole,
} from '../../services/usersService';
import { Eye, Edit, Trash2, X, Check, UserPlus } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrator' },
  { value: 'project-manager', label: 'Project Manager' },
  { value: 'team-member', label: 'Team Member' },
];

const TEAM_OPTIONS = [
  'Engineering',
  'Design',
  'Management',
  'QA',
  'DevOps',
  'Marketing',
  'Sales'
];

const toDisplayRole = (role = '') => role.replace(/[-_]/g, ' ');

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [showAddUserPopup, setShowAddUserPopup] = useState(false);
  const [showEditUserPopup, setShowEditUserPopup] = useState(false);
  const [showViewUserPopup, setShowViewUserPopup] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'team-member',
  });

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Role & status colors
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'project-manager':
        return 'bg-blue-100 text-blue-800';
      case 'team-member':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) =>
    status === 'inactive' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';

  // Input change for Add User
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  // Add User
  const handleAddUser = async (e) => {
    e.preventDefault();

    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      const createdUser = await createUser(newUser);
      setUsers((prev) => [...prev, createdUser]);
      setNewUser({ name: '', email: '', password: '', role: 'team-member' });
      setShowAddUserPopup(false);
      alert('User added successfully!');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to add user');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteUserApi(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      alert('User deleted successfully!');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to delete user');
    }
  };

  // Edit user
  const handleEditUser = (user) => {
    setSelectedUser({ ...user });
    setShowEditUserPopup(true);
  };

  const saveEditedUser = async () => {
    if (!selectedUser) return;

    try {
      const updated = await updateUserRole(selectedUser.id, selectedUser.role);
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? { ...u, ...updated } : u)));
      setShowEditUserPopup(false);
      setSelectedUser(null);
      alert('Role updated successfully!');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to update role');
    }
  };

  // View user
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowViewUserPopup(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f5841]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage user roles, permissions, and access</p>
          </div>
          
          <button
            onClick={() => setShowAddUserPopup(true)}
            className="px-4 py-2 rounded-lg text-white flex items-center gap-2 hover:shadow-lg transition-all"
            style={{ background: `linear-gradient(to right, #0f5841, #194f87)` }}
          >
            <UserPlus className="w-5 h-5" />
            Add User
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
              >
                <option value="all">All Roles</option>
                {ROLE_OPTIONS.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3"
                               style={{ background: `linear-gradient(to bottom right, #0f5841, #194f87)` }}>
                            {(u.name || 'U')
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{u.name}</div>
                            <div className="text-sm text-gray-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(u.role)}`}>
                          {toDisplayRole(u.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          {u.team?.name || u.team || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(u.status)}`}>
                          {u.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleViewUser(u)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditUser(u)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            title="Edit"
                            style={{ color: '#194f87' }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No users found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* Add User Popup */}
      {showAddUserPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Add New User</h2>
              <button 
                onClick={() => setShowAddUserPopup(false)} 
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  value={newUser.name} 
                  onChange={handleInputChange} 
                  placeholder="Enter full name" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input 
                  type="email" 
                  name="email" 
                  value={newUser.email} 
                  onChange={handleInputChange} 
                  placeholder="Enter email address" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input 
                  type="password" 
                  name="password" 
                  value={newUser.password} 
                  onChange={handleInputChange} 
                  placeholder="Enter password" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select 
                  name="role" 
                  value={newUser.role} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => setShowAddUserPopup(false)} 
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-lg text-white hover:shadow-lg transition"
                  style={{ background: `linear-gradient(to right, #0f5841, #194f87)` }}
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Popup */}
{/* View User Popup - Fully Responsive */}
{showViewUserPopup && selectedUser && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 bg-opacity-50">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[90%] sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
      <div className="p-4 sm:p-6">
        {/* Header with Title and Close */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">User Details</h2>
          <button 
            onClick={() => setShowViewUserPopup(false)} 
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Avatar and Basic Info - Centered */}
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold mb-2 sm:mb-3"
               style={{ background: `linear-gradient(to bottom right, #0f5841, #194f87)` }}>
            {(selectedUser.name || 'U')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .substring(0, 2)}
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 text-center break-words max-w-full">
            {selectedUser.name}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 text-center break-words max-w-full">
            {selectedUser.email}
          </p>
        </div>

        {/* Details List - Responsive Grid */}
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          {/* Role */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100">
            <span className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">Role</span>
            <span className="text-xs sm:text-sm font-medium text-gray-900 capitalize break-words">
              {selectedUser.role?.replace(/[-_]/g, ' ')}
            </span>
          </div>

          {/* Team */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100">
            <span className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">Team</span>
            <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">
              {selectedUser.teamName || selectedUser.team?.name || selectedUser.team || 'Unassigned'}
            </span>
          </div>

          {/* Phone - Conditional */}
          {selectedUser.phone && (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100">
              <span className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">Phone</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                {selectedUser.phone}
              </span>
            </div>
          )}

          {/* Location - Conditional */}
          {selectedUser.location && (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100">
              <span className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">Location</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                {selectedUser.location}
              </span>
            </div>
          )}

          {/* Joined */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100">
            <span className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">Joined</span>
            <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">
              {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }) : '-'}
            </span>
          </div>

          {/* Last Updated - Conditional */}
          {selectedUser.updatedAt && selectedUser.updatedAt !== selectedUser.createdAt && (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100">
              <span className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">Last Updated</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                {new Date(selectedUser.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>

        {/* Close Button - Full width on mobile, centered on larger screens */}
        <button 
          onClick={() => setShowViewUserPopup(false)} 
          className="w-full sm:w-auto sm:min-w-[200px] mx-auto block px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg text-white hover:shadow-lg transition text-sm sm:text-base"
          style={{ background: `linear-gradient(to right, #0f5841, #194f87)` }}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

      {/* Edit User Popup */}
      {showEditUserPopup && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Edit User Role</h2>
              <button 
                onClick={() => setShowEditUserPopup(false)} 
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input 
                  type="text" 
                  value={selectedUser.name} 
                  disabled 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input 
                  type="email" 
                  value={selectedUser.email} 
                  disabled 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setShowEditUserPopup(false)} 
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveEditedUser} 
                  className="px-4 py-2 rounded-lg text-white hover:shadow-lg transition flex items-center gap-2"
                  style={{ background: `linear-gradient(to right, #0f5841, #194f87)` }}
                >
                  <Check className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;