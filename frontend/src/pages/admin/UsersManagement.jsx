// src/pages/admin/UsersManagement.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createUser,
  deleteUser as deleteUserApi,
  updateUserAccess,
} from "../../services/usersService";
import {
  usersQuery,
  userQueryKeys,
  PERMISSION_OPTIONS,
  ROLE_OPTIONS,
  toDisplayRole,
} from "../../loader/admin/UsersManagement.loader";
import { useAuth } from "../../context/AuthContext";
import {
  AddUserPopup,
  EditUserPopup,
  Toast,
  UsersError,
  UsersManagementContent,
  UsersSkeleton,
  ViewUserPopup,
  isTeamMemberRole,
} from "./UsersManagement.components";

const normalizePermissionList = (permissions = []) =>
  Array.isArray(permissions)
    ? [...new Set(permissions.filter(Boolean).map((permission) => permission.toString().trim().toLowerCase()))]
    : [];

const ROLE_DEFAULT_PERMISSIONS = {
  "project-manager": ["manage_teams", "manage_projects"],
};

const applyRoleDefaultPermissions = (role, permissions = []) => {
  const normalizedPermissions = normalizePermissionList(permissions);
  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[role] || [];

  return [...new Set([...normalizedPermissions, ...roleDefaults])];
};

// Main UsersManagement Component
const UsersManagement = () => {
  const queryClient = useQueryClient();
  const { user: currentUser, isSuperAdmin, isProjectManager, updateStoredUser } = useAuth();
  const canCreateSuperAdmin = isSuperAdmin();
  const canManageAdminAccounts = canCreateSuperAdmin;
  const canAssignPermissions = !isProjectManager();
  const availableRoleOptions = useMemo(
    () =>
      ROLE_OPTIONS.filter(
        (option) =>
          (option.value !== "super-admin" || canCreateSuperAdmin) &&
          (option.value !== "admin" || canCreateSuperAdmin),
      ),
    [canCreateSuperAdmin],
  );
  const availablePermissionOptions = useMemo(() => PERMISSION_OPTIONS, []);
  const getEditableRoleOptions = (user) => {
    const currentRole = user?.role;
    const baseOptions = user?.role === "super-admin" ? ROLE_OPTIONS : availableRoleOptions;

    if (!currentRole || baseOptions.some((option) => option.value === currentRole)) {
      return baseOptions;
    }

    const currentOption =
      ROLE_OPTIONS.find((option) => option.value === currentRole) || {
        value: currentRole,
        label: toDisplayRole(currentRole),
      };

    return [currentOption, ...baseOptions];
  };
  const getEditablePermissionOptions = (user) => {
    const currentPermissions = normalizePermissionList(user?.permissions);
    return PERMISSION_OPTIONS.filter(
      (option) =>
        currentPermissions.includes(option.value) ||
        availablePermissionOptions.some((allowed) => allowed.value === option.value),
    );
  };

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAddUserPopup, setShowAddUserPopup] = useState(false);
  const [showEditUserPopup, setShowEditUserPopup] = useState(false);
  const [showViewUserPopup, setShowViewUserPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "team-member",
    permissions: [],
  });
  const [toast, setToast] = useState(null);

  // 1. React Query for data fetching
  const {
    data: users = [],
    isLoading,
    error,
    isFetching,
    refetch,
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
      queryClient.setQueryData(userQueryKeys.all, (old = []) => [
        ...old,
        optimisticUser,
      ]);

      return { previousUsers, optimisticUser };
    },
    onSuccess: (newUser, variables, context) => {
      queryClient.setQueryData(userQueryKeys.all, (old = []) =>
        old.map((user) =>
          user.id === context.optimisticUser.id ? newUser : user,
        ),
      );
      showToast("User added successfully!", "success");
      setShowAddUserPopup(false);
      setNewUser({ name: "", email: "", password: "", role: "team-member", permissions: [] });
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(userQueryKeys.all, context.previousUsers);
      showToast(err.message || "Failed to add user", "error");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUserApi,
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: userQueryKeys.all });
      const previousUsers = queryClient.getQueryData(userQueryKeys.all);

      queryClient.setQueryData(userQueryKeys.all, (old = []) =>
        old.filter((user) => user.id !== userId),
      );

      return { previousUsers };
    },
    onSuccess: () => {
      showToast("User deleted successfully!", "success");
    },
    onError: (err, userId, context) => {
      queryClient.setQueryData(userQueryKeys.all, context.previousUsers);
      showToast(err.message || "Failed to delete user", "error");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role, permissions, status }) =>
      updateUserAccess(userId, { role, permissions, status }),
    onMutate: async ({ userId, role, permissions, status }) => {
      await queryClient.cancelQueries({ queryKey: userQueryKeys.all });
      const previousUsers = queryClient.getQueryData(userQueryKeys.all);

      queryClient.setQueryData(userQueryKeys.all, (old = []) =>
        old.map((user) =>
          user.id === userId ? { ...user, role, permissions, status } : user,
        ),
      );

      return { previousUsers };
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(userQueryKeys.all, (old = []) =>
        old.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
      );

      if (currentUser?.id === updatedUser.id) {
        updateStoredUser(updatedUser);
      }

      showToast("Access updated successfully!", "success");
      setShowEditUserPopup(false);
      setSelectedUser(null);
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(userQueryKeys.all, context.previousUsers);
      showToast(err.message || "Failed to update role", "error");
    },
  });

  // Helper functions
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "role"
        ? {
            permissions: isTeamMemberRole(value)
              ? []
              : applyRoleDefaultPermissions(value, prev.permissions),
          }
        : {}),
    }));
  };

  const toggleNewUserPermission = (permission) => {
    setNewUser((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((item) => item !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const toggleSelectedUserPermission = (permission) => {
    setSelectedUser((prev) => ({
      ...prev,
      permissions: normalizePermissionList(prev?.permissions).includes(permission)
        ? normalizePermissionList(prev?.permissions).filter((item) => item !== permission)
        : [...normalizePermissionList(prev?.permissions), permission],
    }));
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (
      !newUser.name.trim() ||
      !newUser.email.trim() ||
      !newUser.password.trim()
    ) {
      showToast("Please fill in all required fields", "error");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      showToast("Please enter a valid email address", "error");
      return;
    }
    addUserMutation.mutate(
      isTeamMemberRole(newUser.role)
        ? { ...newUser, permissions: [] }
        : newUser,
    );
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser({
      ...user,
      permissions: normalizePermissionList(user?.permissions),
    });
    setShowEditUserPopup(true);
  };

  const saveEditedUser = (updatedUser, options = {}) => {
    if (!updatedUser) return;

    const normalizedUser = isTeamMemberRole(updatedUser.role)
      ? { ...updatedUser, permissions: [] }
      : {
          ...updatedUser,
          permissions: normalizePermissionList(updatedUser.permissions),
        };

    if (options.draftOnly) {
      setSelectedUser(
        isTeamMemberRole(updatedUser.role)
          ? { ...updatedUser, permissions: [] }
          : {
              ...updatedUser,
              permissions: applyRoleDefaultPermissions(
                updatedUser.role,
                updatedUser.permissions,
              ),
            },
      );
      return;
    }

    updateRoleMutation.mutate({
      userId: normalizedUser.id,
      role: normalizedUser.role,
      permissions: normalizedUser.permissions || [],
      status: normalizedUser.status || "active",
    });
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowViewUserPopup(true);
  };

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === "" ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  const paginatedUsers = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, roleFilter, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Name", "Email", "Role", "Team", "Status"];
    const csvData = filteredUsers.map((user) => [
      user.name,
      user.email,
      toDisplayRole(user.role),
      user.team?.name || user.team || "Unassigned",
      user.status || "active",
    ]);
    const csvContent = [headers, ...csvData]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Export completed successfully!", "success");
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
    <div>
      <UsersManagementContent
        users={users}
        filteredUsers={filteredUsers}
        paginatedUsers={paginatedUsers}
        searchQuery={searchQuery}
        roleFilter={roleFilter}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        isFetching={isFetching}
        isAddingUser={addUserMutation.isPending}
        isDeletingUser={deleteUserMutation.isPending}
        onExport={exportToCSV}
        onShowAddUser={() => setShowAddUserPopup(true)}
        onSearchChange={setSearchQuery}
        onRoleFilterChange={setRoleFilter}
        onViewUser={handleViewUser}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* Popups */}
      {showAddUserPopup && (
        <AddUserPopup
          newUser={newUser}
          onInputChange={handleInputChange}
          onPermissionToggle={toggleNewUserPermission}
          onSubmit={handleAddUser}
          onClose={() => setShowAddUserPopup(false)}
          isSaving={addUserMutation.isPending}
          availableRoleOptions={availableRoleOptions}
          availablePermissionOptions={availablePermissionOptions}
          showPermissionAssignment={canAssignPermissions}
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
          onPermissionToggle={toggleSelectedUserPermission}
          isSaving={updateRoleMutation.isPending}
          availableRoleOptions={getEditableRoleOptions(selectedUser)}
          availablePermissionOptions={getEditablePermissionOptions(selectedUser)}
          showPermissionAssignment={canAssignPermissions}
          roleLocked={
            ["admin", "super-admin"].includes(selectedUser.role) && !canManageAdminAccounts
          }
          lockMessage={
            ["admin", "super-admin"].includes(selectedUser.role) && !canManageAdminAccounts
              ? "Only super admins can edit admin-level accounts."
              : ""
          }
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
