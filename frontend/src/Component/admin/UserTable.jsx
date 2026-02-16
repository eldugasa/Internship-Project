// src/components/admin/UserTable.jsx
import React from 'react';
import { Edit, Eye, Trash2 } from 'lucide-react';
import { getRoleBadge, getStatusBadge } from '../../utils/adminUtils';

const UserTable = ({ users, onUpdateRole, onUpdateStatus, onDelete, compact = false }) => {
  const handleRoleChange = (userId, newRole) => {
    if (onUpdateRole) onUpdateRole(userId, newRole);
  };

  const handleStatusChange = (userId, newStatus) => {
    if (onUpdateStatus) onUpdateStatus(userId, newStatus);
  };

  const handleDelete = (userId) => {
    if (onDelete) onDelete(userId);
  };

  if (compact) {
    return (
      <div className="space-y-4">
        {users.map((user) => {
          const status = getStatusBadge(user.status);
          return (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] rounded-full flex items-center justify-center text-white font-medium">
                  {user.avatar}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.class}`}>
                {status.text}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map((user) => {
            const status = getStatusBadge(user.status);
            const role = getRoleBadge(user.role);
            return (
              <tr key={user.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] rounded-full flex items-center justify-center text-white font-medium mr-3">
                      {user.avatar}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className={`${role.color} px-3 py-1 rounded-full text-sm font-medium border-none focus:ring-2 focus:ring-[#4DA5AD] cursor-pointer`}
                  >
                    <option value="team_member">Team Member</option>
                    <option value="project_manager">Project Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    {user.team}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.status}
                    onChange={(e) => handleStatusChange(user.id, e.target.value)}
                    className={`${status.class} px-3 py-1 rounded-full text-sm font-medium border-none focus:ring-2 focus:ring-[#4DA5AD] cursor-pointer`}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.joinDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition" title="Edit">
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition" title="View">
                      <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition" 
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;