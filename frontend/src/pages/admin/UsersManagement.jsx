// src/pages/admin/UsersManagement.jsx
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createUser,
  deleteUser as deleteUserApi,
  updateUserRole,
} from '../../services/usersService';
import { Eye, Edit, Trash2, X, Check, UserPlus, Download } from 'lucide-react';
import { 
  usersQuery,
  userQueryKeys,
  ROLE_OPTIONS, 
  toDisplayRole, 
  getRoleColor, 
  getStatusColor 
} from '../../loader/admin/UsersManagement.loader';

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
      <p className="text-red-600 mb-4">
        {error && error.includes('prisma.user.findMany') 
          ? 'Database connection failed. Please check your internet connection or try again later.' 
          : 'Unable to load user data. Please try again.'}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
      >
        Retry
      </button>
    </div>
  </div>
);

// View User Popup
const ViewUserPopup = ({ user, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 bg-opacity-50">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[90%] sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">User Details</h2>
          <button 
            onClick={onClose} 
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold mb-2 sm:mb-3"
               style={{ background: `linear-gradient(to bottom right, #0f5841, #194f87)` }}>
            {(user.name || 'U')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .substring(0, 2)}
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 text-center break-words max-w-full">
            {user.name}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 text-center break-words max-w-full">
            {user.email}
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100">
            <span className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">Role</span>
            <span className="text-xs sm:text-sm font-medium text-gray-900 capitalize break-words">
              {toDisplayRole(user.role)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100">
            <span className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">Team</span>
            <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">
              {user.teamName || user.team?.name || user.team || 'Unassigned'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100">
            <span className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">Status</span>
            <span className={`text-xs sm:text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(user.status)}`}>
              {user.status || 'active'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100">
            <span className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">Joined</span>
            <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }) : '-'}
            </span>
          </div>
        </div>

        <button 
          onClick={onClose} 
          className="w-full sm:w-auto sm:min-w-[200px] mx-auto block px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg text-white hover:shadow-lg transition text-sm sm:text-base"
          style={{ background: `linear-gradient(to right, #0f5841, #194f87)` }}
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

// Edit User Popup
const EditUserPopup = ({ user, onClose, onSave, isSaving }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Edit User Role</h2>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          disabled={isSaving}
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input 
            type="text" 
            value={user.name} 
            disabled 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input 
            type="email" 
            value={user.email} 
            disabled 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <select
            value={user.role}
            onChange={(e) => onSave({ ...user, role: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
            disabled={isSaving}
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button 
            onClick={onClose} 
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(user)} 
            disabled={isSaving}
            className="px-4 py-2 rounded-lg text-white hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            style={{ background: `linear-gradient(to right, #0f5841, #194f87)` }}
          >
            {isSaving ? (
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
);

// Add User Popup
const AddUserPopup = ({ newUser, onInputChange, onSubmit, onClose, isSaving }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Add New User</h2>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          disabled={isSaving}
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
          <input 
            type="text" 
            name="name" 
            value={newUser.name} 
            onChange={onInputChange} 
            placeholder="Enter full name" 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent" 
            required 
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
          <input 
            type="email" 
            name="email" 
            value={newUser.email} 
            onChange={onInputChange} 
            placeholder="Enter email address" 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent" 
            required 
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
          <input 
            type="password" 
            name="password" 
            value={newUser.password} 
            onChange={onInputChange} 
            placeholder="Enter password" 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent" 
            required 
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
          <select 
            name="role" 
            value={newUser.role} 
            onChange={onInputChange} 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
            disabled={isSaving}
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSaving}
            className="px-4 py-2 rounded-lg text-white hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            style={{ background: `linear-gradient(to right, #0f5841, #194f87)` }}
          >
            {isSaving ? (
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
);

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`px-4 py-3 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
      }`}>
        {message}
      </div>
    </div>
  );
};

// Main UsersManagement Component
const UsersManagement = () => {
  const queryClient = useQueryClient();
  
  // State management
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
  const [toast, setToast] = useState(null);

  // 1. React Query for data fetching
  const { 
    data: users = [], 
    isLoading, 
    error,
    isFetching,
    refetch 
  } = useQuery(usersQuery());

  // 2. Mutations with optimistic updates
  const addUserMutation = useMutation({
    mutationFn: createUser,
    onMutate: async (newUserData) => {
      await queryClient.cancelQueries({ queryKey: userQueryKeys.all });
      const previousUsers = queryClient.getQueryData(userQueryKeys.all);
      
      const optimisticUser = {
        id: `temp-${Date.now()}`,
        ...newUserData,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData(userQueryKeys.all, (old = []) => [...old, optimisticUser]);
      
      return { previousUsers, optimisticUser };
    },
    onSuccess: (newUser, variables, context) => {
      queryClient.setQueryData(userQueryKeys.all, (old = []) => 
        old.map(user => user.id === context.optimisticUser.id ? newUser : user)
      );
      showToast('User added successfully!', 'success');
      setShowAddUserPopup(false);
      setNewUser({ name: '', email: '', password: '', role: 'team-member' });
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(userQueryKeys.all, context.previousUsers);
      showToast(err.message || 'Failed to add user', 'error');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUserApi,
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: userQueryKeys.all });
      const previousUsers = queryClient.getQueryData(userQueryKeys.all);
      
      queryClient.setQueryData(userQueryKeys.all, (old = []) => 
        old.filter(user => user.id !== userId)
      );
      
      return { previousUsers };
    },
    onSuccess: () => {
      showToast('User deleted successfully!', 'success');
    },
    onError: (err, userId, context) => {
      queryClient.setQueryData(userQueryKeys.all, context.previousUsers);
      showToast(err.message || 'Failed to delete user', 'error');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => updateUserRole(userId, role),
    onMutate: async ({ userId, role }) => {
      await queryClient.cancelQueries({ queryKey: userQueryKeys.all });
      const previousUsers = queryClient.getQueryData(userQueryKeys.all);
      
      queryClient.setQueryData(userQueryKeys.all, (old = []) => 
        old.map(user => user.id === userId ? { ...user, role } : user)
      );
      
      return { previousUsers };
    },
    onSuccess: () => {
      showToast('Role updated successfully!', 'success');
      setShowEditUserPopup(false);
      setSelectedUser(null);
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(userQueryKeys.all, context.previousUsers);
      showToast(err.message || 'Failed to update role', 'error');
    },
  });

  // Helper functions
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    addUserMutation.mutate(newUser);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser({ ...user });
    setShowEditUserPopup(true);
  };

  const saveEditedUser = (updatedUser) => {
    if (!updatedUser) return;
    updateRoleMutation.mutate({ userId: updatedUser.id, role: updatedUser.role });
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowViewUserPopup(true);
  };

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    return users.filter(user => {
      const matchesSearch = searchQuery === '' || 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Team', 'Status'];
    const csvData = filteredUsers.map(user => [
      user.name,
      user.email,
      toDisplayRole(user.role),
      user.team?.name || user.team || 'Unassigned',
      user.status || 'active'
    ]);
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export completed successfully!', 'success');
  };

  // Loading state
  if (isLoading) {
    return <UsersSkeleton />;
  }

  // Error state
  if (error) {
    return <UsersError error={error.message} onRetry={() => refetch()} />;
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
          
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
            <button
              onClick={() => setShowAddUserPopup(true)}
              disabled={addUserMutation.isPending}
              className="px-4 py-2 rounded-lg text-white flex items-center gap-2 hover:shadow-lg transition disabled:opacity-50"
              style={{ background: `linear-gradient(to right, #0f5841, #194f87)` }}
            >
              <UserPlus className="w-5 h-5" />
              Add User
            </button>
          </div>
        </div>

        {/* Refresh indicator */}
        {isFetching && (
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

        {/* User count badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
            Total: {users.length}
          </span>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
            Admins: {users.filter(u => u.role === 'admin').length}
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
            PMs: {users.filter(u => u.role === 'project-manager').length}
          </span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
            Members: {users.filter(u => u.role === 'team-member').length}
          </span>
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
                            disabled={deleteUserMutation.isPending}
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
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* Popups */}
      {showAddUserPopup && (
        <AddUserPopup
          newUser={newUser}
          onInputChange={handleInputChange}
          onSubmit={handleAddUser}
          onClose={() => setShowAddUserPopup(false)}
          isSaving={addUserMutation.isPending}
        />
      )}

      {showEditUserPopup && selectedUser && (
        <EditUserPopup
          user={selectedUser}
          onClose={() => {
            setShowEditUserPopup(false);
            setSelectedUser(null);
          }}
          onSave={saveEditedUser}
          isSaving={updateRoleMutation.isPending}
        />
      )}

      {showViewUserPopup && selectedUser && (
        <ViewUserPopup
          user={selectedUser}
          onClose={() => {
            setShowViewUserPopup(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default UsersManagement;