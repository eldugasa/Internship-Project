// src/components/admin/UserTable.jsx
import React, { useState } from 'react';
import { Edit, Eye, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { getRoleBadge, getStatusBadge } from '../../utils/adminUtils';

const UserTable = ({ users, onUpdateRole, onUpdateStatus, onDelete, compact = false }) => {
  const [expandedMobileRows, setExpandedMobileRows] = useState({});

  const handleRoleChange = (userId, newRole) => {
    if (onUpdateRole) onUpdateRole(userId, newRole);
  };

  const handleStatusChange = (userId, newStatus) => {
    if (onUpdateStatus) onUpdateStatus(userId, newStatus);
  };

  const handleDelete = (userId) => {
    if (onDelete) onDelete(userId);
  };

  const toggleMobileRow = (userId) => {
    setExpandedMobileRows(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  if (compact) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {users.map((user) => {
          const status = getStatusBadge(user.status);
          return (
            <div key={user.id} className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#0f5841] to-[#194f87] rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm flex-shrink-0">
                  {user.avatar || user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{user.name}</p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${status.class} ml-2 flex-shrink-0`}>
                {status.text}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Mobile Card View
  const MobileCardView = () => (
    <div className="space-y-3 sm:hidden">
      {users.map((user) => {
        const status = getStatusBadge(user.status);
        const role = getRoleBadge(user.role);
        const isExpanded = expandedMobileRows[user.id];
        
        return (
          <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Card Header - Always visible */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0f5841] to-[#194f87] rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                  {user.avatar || user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={() => toggleMobileRow(user.id)}
                className="p-2 hover:bg-gray-100 rounded-lg ml-2 flex-shrink-0"
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>

            {/* Expandable Details */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                <div className="space-y-3">
                  {/* Role */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Role</span>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className={`${role.color} px-3 py-1 rounded-full text-sm font-medium border-none focus:ring-2 focus:ring-[#194f87] cursor-pointer`}
                    >
                      <option value="team_member">Team Member</option>
                      <option value="project_manager">Project Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Team */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Team</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                      {user.team}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Status</span>
                    <select
                      value={user.status}
                      onChange={(e) => handleStatusChange(user.id, e.target.value)}
                      className={`${status.class} px-3 py-1 rounded-full text-sm font-medium border-none focus:ring-2 focus:ring-[#194f87] cursor-pointer`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Join Date */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Joined</span>
                    <span className="text-sm text-gray-900">{user.joinDate}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition" title="Edit">
                      <Edit className="w-4 h-4 text-[#194f87]" />
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
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Desktop Table View
  const DesktopTableView = () => (
    <div className="hidden sm:block overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map((user) => {
            const status = getStatusBadge(user.status);
            const role = getRoleBadge(user.role);
            return (
              <tr key={user.id} className="hover:bg-gray-50 transition">
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#0f5841] to-[#194f87] rounded-full flex items-center justify-center text-white font-medium mr-2 sm:mr-3 text-xs sm:text-sm flex-shrink-0">
                      {user.avatar || user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{user.name}</div>
                      <div className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className={`${role.color} px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border-none focus:ring-2 focus:ring-[#194f87] cursor-pointer`}
                  >
                    <option value="team_member">Team Member</option>
                    <option value="project_manager">Project Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <span className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs sm:text-sm">
                    {user.team}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.status}
                    onChange={(e) => handleStatusChange(user.id, e.target.value)}
                    className={`${status.class} px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border-none focus:ring-2 focus:ring-[#194f87] cursor-pointer`}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {user.joinDate}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition" title="Edit">
                      <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#194f87]" />
                    </button>
                    <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition" title="View">
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-1.5 sm:p-2 hover:bg-red-50 rounded-lg transition" 
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
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

  return (
    <>
      <MobileCardView />
      <DesktopTableView />
    </>
  );
};

export default UserTable;