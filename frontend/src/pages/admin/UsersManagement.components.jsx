import React, { useEffect } from "react";
import {motion, AnimatePresence} from "framer-motion";
import { Check, Download, Edit, Eye, Trash2, UserPlus, X } from "lucide-react";
import {
  ROLE_OPTIONS,
  getRoleColor,
  getStatusColor,
  toDisplayRole,
} from "../../loader/admin/UsersManagement.loader";

const formatPermissionLabel = (permission = "") =>
  permission
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const isTeamMemberRole = (role = "") => role === "team-member";

const getDisplayValue = (value, fallback = "Not provided") => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    return trimmedValue || fallback;
  }
  return value;
};

const formatDisplayDate = (value, fallback = "Not provided") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const PermissionSelector = ({
  selectedPermissions = [],
  onToggle,
  options = [],
  disabled = false,
}) => {
  const normalizedSelectedPermissions = Array.isArray(selectedPermissions)
    ? selectedPermissions
    : [];

  return (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Extra Permissions
    </label>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 p-3">
      {options.map((permission) => {
        const checked = normalizedSelectedPermissions.includes(permission.value);
        return (
          <label
            key={permission.value}
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
              disabled ? "opacity-60" : "cursor-pointer hover:bg-gray-50"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(permission.value)}
              disabled={disabled}
              className="h-4 w-4 rounded border-gray-300 text-[#194f87] focus:ring-[#194f87]"
            />
            <span>{permission.label}</span>
          </label>
        );
      })}
    </div>
    <p className="mt-2 text-xs text-gray-500">
      The user keeps their main role and gains these abilities in addition.
    </p>
  </div>
  );
};

export const UsersSkeleton = () => (
  <div className="p-4 lg:p-6">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

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

export const UsersError = ({ error, onRetry }) => (
  <div className="p-6 flex items-center justify-center min-h-[400px]">
    <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-center">
      <h3 className="text-lg font-semibold text-red-800 mb-2">
        Failed to Load Users
      </h3>
      <p className="text-red-600 mb-4">
        {error && error.includes("prisma.user.findMany")
          ? "Database connection failed. Please check your internet connection or try again later."
          : "Unable to load user data. Please try again."}
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

export const UsersManagementContent = ({
  users,
  filteredUsers,
  paginatedUsers,
  searchQuery,
  roleFilter,
  page,
  pageSize,
  totalPages,
  isFetching,
  isAddingUser,
  isDeletingUser,
  onExport,
  onShowAddUser,
  onSearchChange,
  onRoleFilterChange,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onPageChange,
  onPageSizeChange,
}) => (
  <div className="p-4 lg:p-6">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            User Management
          </h1>
          <p className="text-gray-600">
            Manage user roles, permissions, and access
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onExport}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
          <motion.button
           whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 500 }}
            onClick={onShowAddUser}
            disabled={isAddingUser}
            className="px-4 py-2 rounded-lg text-white flex items-center cursor-pointer gap-2 hover:shadow-lg transition disabled:opacity-50"
            style={{
              background: "linear-gradient(to right, #0f5841, #194f87)",
            }}
          >
            <UserPlus className="w-5 h-5" />
            Add User
          </motion.button>
        </div>
      </div>

      {isFetching && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-blue-700">Refreshing data...</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => onRoleFilterChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
            >
              <option value="all">All Roles</option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
          Total: {users.length}
        </span>
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
          Admins: {users.filter((u) => u.role === "admin").length}
        </span>
        <span className="px-2 py-1 bg-fuchsia-100 text-fuchsia-800 rounded-full text-xs">
          Super Admins: {users.filter((u) => u.role === "super-admin").length}
        </span>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
          PMs: {users.filter((u) => u.role === "project-manager").length}
        </span>
        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">
          QA Testers: {users.filter((u) => u.role === "qa-tester").length}
        </span>
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
          Members: {users.filter((u) => u.role === "team-member").length}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <AnimatePresence mode='wait'>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
             <motion.tr
            layout 
            key={user.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="hover:bg-gray-50 transition-colors"
          >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3"
                          style={{
                            background:
                              "linear-gradient(to bottom right, #0f5841, #194f87)",
                          }}
                        >
                          {(user.name || "U")
                            .split(" ")
                            .map((name) => name[0])
                            .join("")
                            .toUpperCase()
                            .substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}
                      >
                        {toDisplayRole(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                        {user.team?.name || user.team || "Unassigned"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}
                      >
                        {user.status || "active"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onViewUser(user)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditUser(user)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="Edit"
                          style={{ color: "#194f87" }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteUser(user.id)}
                          disabled={isDeletingUser}
                          className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <motion.tr layout key="empty-state">
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No users found matching your criteria
                  </td>
                </motion.tr>
              )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-500">
          Showing {paginatedUsers.length ? (page - 1) * pageSize + 1 : 0} to{" "}
          {Math.min(page * pageSize, filteredUsers.length)} of{" "}
          {filteredUsers.length} filtered users ({users.length} total)
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="users-page-size" className="text-sm text-gray-500">
              Rows
            </label>
            <select
              id="users-page-size"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 500 }}
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 px-3 py-2 bg-green-800 text-white text-sm  transition  disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </motion.button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 500 }}
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-300 px-3 py-2 min-w-fit- bg-green-800 text-white text-sm  transition  disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const ViewUserPopup = ({ user, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -30 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -30 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 bg-opacity-50"
  >
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[90%] sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            User Details
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold mb-2 sm:mb-3"
            style={{
              background: "linear-gradient(to bottom right, #0f5841, #194f87)",
            }}
          >
            {(user.name || "U")
              .split(" ")
              .map((name) => name[0])
              .join("")
              .toUpperCase()
              .substring(0, 2)}
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 text-center break-words max-w-full">
            {getDisplayValue(user.name, "Unnamed user")}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 text-center break-words max-w-full">
            {getDisplayValue(user.email)}
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100">
            <span className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">
              Role
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-900 capitalize break-words">
              {getDisplayValue(toDisplayRole(user.role))}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100">
            <span className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">
              Team
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">
              {getDisplayValue(
                user.teamName || user.team?.name || user.team,
                "Unassigned",
              )}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100">
            <span className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">
              Phone
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">
              {getDisplayValue(user.phone)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100">
            <span className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">
              Location
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">
              {getDisplayValue(user.location)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100">
            <span className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">
              Skill
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">
              {getDisplayValue(user.skill)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100">
            <span className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">
              Status
            </span>
            <span
              className={`text-xs sm:text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(user.status)}`}
            >
              {getDisplayValue(user.status, "Active")}
            </span>
          </div>

          {!isTeamMemberRole(user.role) ? (
            <div className="py-2 border-b border-gray-100">
              <span className="text-xs sm:text-sm text-gray-500 block mb-2">
                Extra Permissions
              </span>
              <div className="flex flex-wrap gap-2">
                {user.permissions?.length ? (
                  user.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                    >
                      {formatPermissionLabel(permission)}
                    </span>
                  ))
                ) : (
                  <span className="text-xs sm:text-sm text-gray-900">None</span>
                )}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100">
            <span className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-0">
              Joined
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">
              {formatDisplayDate(user.createdAt)}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full sm:w-auto sm:min-w-[200px] mx-auto block px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg text-white hover:shadow-lg transition text-sm sm:text-base"
          style={{ background: "linear-gradient(to right, #0f5841, #194f87)" }}
        >
          Close
        </button>
      </div>
    </div>
  </motion.div>
);

export const EditUserPopup = ({
  user,
  onClose,
  onSave,
  onPermissionToggle,
  isSaving,
  availableRoleOptions,
  availablePermissionOptions,
  showPermissionAssignment = true,
  roleLocked = false,
  lockMessage = "",
}) => (
  <motion.div
    initial={{ opacity: 0, y: -30 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -30 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 bg-opacity-50"
  >
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Edit User Access</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          disabled={isSaving}
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="max-h-[calc(90vh-88px)] overflow-y-auto p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            value={user.name}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <select
            value={user.role}
            onChange={(e) =>
              onSave({ ...user, role: e.target.value }, { draftOnly: true })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
            disabled={isSaving || roleLocked}
          >
            {availableRoleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          {lockMessage ? (
            <p className="mt-2 text-xs text-amber-700">{lockMessage}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={user.status || "active"}
            onChange={(e) =>
              onSave({ ...user, status: e.target.value }, { draftOnly: true })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
            disabled={isSaving || roleLocked}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {showPermissionAssignment && !isTeamMemberRole(user.role) ? (
          <PermissionSelector
            selectedPermissions={user.permissions}
            onToggle={onPermissionToggle}
            options={availablePermissionOptions}
            disabled={isSaving || roleLocked}
          />
        ) : null}

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
            disabled={isSaving || roleLocked}
            className="px-4 py-2 rounded-lg text-white hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            style={{
              background: "linear-gradient(to right, #0f5841, #194f87)",
            }}
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
  </motion.div>
);

export const AddUserPopup = ({
  newUser,
  onInputChange,
  onPermissionToggle,
  onSubmit,
  onClose,
  isSaving,
  availableRoleOptions,
  availablePermissionOptions,
  showPermissionAssignment = true,
}) => (
  <motion.div
    initial={{ opacity: 0, y: -30 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -30 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 bg-opacity-50"
  >
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password *
          </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role *
          </label>
          <select
            name="role"
            value={newUser.role}
            onChange={onInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
            disabled={isSaving}
          >
            {availableRoleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {showPermissionAssignment && !isTeamMemberRole(newUser.role) ? (
          <PermissionSelector
            selectedPermissions={newUser.permissions}
            onToggle={onPermissionToggle}
            options={availablePermissionOptions}
            disabled={isSaving}
          />
        ) : null}

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
            style={{
              background: "linear-gradient(to right, #0f5841, #194f87)",
            }}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Adding...
              </>
            ) : (
              "Add User"
            )}
          </button>
        </div>
      </form>
    </div>
  </motion.div>
);

export const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div
        className={`px-4 py-3 rounded-lg shadow-lg ${
          type === "success"
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-red-50 border border-red-200 text-red-800"
        }`}
      >
        {message}
      </div>
    </div>
  );
};
