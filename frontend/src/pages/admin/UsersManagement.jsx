// src/pages/admin/UsersManagement.jsx
import React, { useState, Suspense } from 'react';
import { useLoaderData, Await, useRevalidator } from 'react-router-dom';
import {
  createUser,
  deleteUser as deleteUserApi,
  updateUserRole,
} from '../../services/usersService';
import { Eye, Edit, Trash2, X, Check, UserPlus } from 'lucide-react';
import { 
  usersLoader, 
  ROLE_OPTIONS, 
  toDisplayRole, 
  getRoleColor, 
  getStatusColor 
} from '../../loader/admin/UsersManagement.loader';

// Re-export the loader for the route
export { usersLoader as loader };

// Loading skeleton component
const UsersSkeleton = () => (
  <div className="p-4 lg:p-6">
    <div className="max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
      
      {/* Filters Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="sm:w-48">
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Table Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {[...Array(5)].map((_, i) => (
                  <th key={i} className="px-6 py-4">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-t border-gray-200">
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse mr-3"></div>
                        <div className="flex-1">
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                          <div className="h-3 w-48 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

// Error component
const UsersError = ({ error, onRetry }) => (
  <div className="p-6 flex items-center justify-center min-h-[400px]">
    <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-center">
      <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Users</h3>
      <p className="text-red-600 mb-4">{error || 'Unable to load user data'}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
      >
        Retry
      </button>
    </div>
  </div>
);

const UsersManagement = () => {
  const loaderData = useLoaderData();
  const revalidator = useRevalidator();
  
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
  const [actionLoading, setActionLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

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

    setActionLoading(true);
    setLocalError(null);
    try {
      await createUser(newUser);
      setNewUser({ name: '', email: '', password: '', role: 'team-member' });
      setShowAddUserPopup(false);
      revalidator.revalidate();
      alert('User added successfully!');
    } catch (err) {
      console.error(err);
      setLocalError(err.message || 'Failed to add user');
      alert(err.message || 'Failed to add user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    setActionLoading(true);
    setLocalError(null);
    try {
      await deleteUserApi(userId);
      revalidator.revalidate();
      alert('User deleted successfully!');
    } catch (err) {
      console.error(err);
      setLocalError(err.message || 'Failed to delete user');
      alert(err.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser({ ...user });
    setShowEditUserPopup(true);
  };

  const saveEditedUser = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    setLocalError(null);
    try {
      await updateUserRole(selectedUser.id, selectedUser.role);
      revalidator.revalidate();
      setShowEditUserPopup(false);
      setSelectedUser(null);
      alert('Role updated successfully!');
    } catch (err) {
      console.error(err);
      setLocalError(err.message || 'Failed to update role');
      alert(err.message || 'Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowViewUserPopup(true);
  };

  // Filter users based on search and role
  const filterUsers = (usersList) => {
    if (!usersList || !Array.isArray(usersList)) return [];
    return usersList.filter(user => {
      const matchesSearch = searchQuery === '' || 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  };

  return (
    <Suspense fallback={<UsersSkeleton />}>
      <Await 
        resolve={loaderData.users}
        errorElement={<UsersError error="Failed to load users" onRetry={() => revalidator.revalidate()} />}
      >
        {(users) => {
          const safeUsers = Array.isArray(users) ? users : [];
          const filteredUsers = filterUsers(safeUsers);

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
                    disabled={actionLoading || revalidator.state === "loading"}
                    className="px-4 py-2 rounded-lg text-white flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                    style={{ background: `linear-gradient(to right, #0f5841, #194f87)` }}
                  >
                    <UserPlus className="w-5 h-5" />
                    Add User
                  </button>
                </div>

                {/* Refresh indicator */}
                {revalidator.state === "loading" && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-blue-700">Refreshing data...</span>
                  </div>
                )}

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
                                      .toUpperCase()
                                      .substring(0, 2)}
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
                                    disabled={actionLoading}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
                                    title="View"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleEditUser(u)}
                                    disabled={actionLoading}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
                                    title="Edit"
                                    style={{ color: '#194f87' }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(u.id)}
                                    disabled={actionLoading}
                                    className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition disabled:opacity-50"
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
                  Showing {filteredUsers.length} of {safeUsers.length} users
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
                        disabled={actionLoading}
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
                          disabled={actionLoading}
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
                          disabled={actionLoading}
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
                          disabled={actionLoading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                        <select 
                          name="role" 
                          value={newUser.role} 
                          onChange={handleInputChange} 
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
                          disabled={actionLoading}
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
                          disabled={actionLoading}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          disabled={actionLoading}
                          className="px-4 py-2 rounded-lg text-white hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                          style={{ background: `linear-gradient(to right, #0f5841, #194f87)` }}
                        >
                          {actionLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Adding...
                            </>
                          ) : (
                            'Add User'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* View User Popup */}
              {showViewUserPopup && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 bg-opacity-50">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-[90%] sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
                    <div className="p-4 sm:p-6">
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

                      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100">
                          <span className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">Role</span>
                          <span className="text-xs sm:text-sm font-medium text-gray-900 capitalize break-words">
                            {selectedUser.role?.replace(/[-_]/g, ' ')}
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100">
                          <span className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">Team</span>
                          <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                            {selectedUser.teamName || selectedUser.team?.name || selectedUser.team || 'Unassigned'}
                          </span>
                        </div>

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
                      </div>

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
                        disabled={actionLoading}
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
                          disabled={actionLoading}
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
                          disabled={actionLoading}
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={saveEditedUser} 
                          disabled={actionLoading}
                          className="px-4 py-2 rounded-lg text-white hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                          style={{ background: `linear-gradient(to right, #0f5841, #194f87)` }}
                        >
                          {actionLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }}
      </Await>
    </Suspense>
  );
};

export default UsersManagement;