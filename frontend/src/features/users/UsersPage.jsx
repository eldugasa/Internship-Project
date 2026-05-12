import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createUser,
  deleteUser as deleteUserApi,
  updateUserAccess,
} from "../../services/usersService";
import {
  PERMISSION_OPTIONS,
  ROLE_OPTIONS,
  toDisplayRole,
  userQueryKeys,
  usersQuery,
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
} from "./UsersPage.components";
import {
  applyRoleDefaultPermissions,
  createEditableUser,
  createEmptyUserDraft,
  getAvailableRoleOptions,
  getEditablePermissionOptions,
  getEditableRoleOptions,
  isTeamMemberRole,
  normalizePermissionList,
} from "./usersAccess";

const UsersPage = () => {
  const queryClient = useQueryClient();
  const { user: currentUser, isSuperAdmin, isProjectManager, updateStoredUser } =
    useAuth();

  const canCreateSuperAdmin = isSuperAdmin();
  const canManageAdminAccounts = canCreateSuperAdmin;
  const canAssignPermissions = !isProjectManager();
  const availableRoleOptions = useMemo(
    () => getAvailableRoleOptions({ canCreateSuperAdmin }),
    [canCreateSuperAdmin],
  );
  const availablePermissionOptions = useMemo(() => PERMISSION_OPTIONS, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAddUserPopup, setShowAddUserPopup] = useState(false);
  const [showEditUserPopup, setShowEditUserPopup] = useState(false);
  const [showViewUserPopup, setShowViewUserPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState(createEmptyUserDraft());
  const [toast, setToast] = useState(null);

  const {
    data: users = [],
    isLoading,
    error,
    isFetching,
    refetch,
  } = useQuery(usersQuery());

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

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
    onSuccess: (createdUser, _variables, context) => {
      queryClient.setQueryData(userQueryKeys.all, (old = []) =>
        old.map((user) =>
          user.id === context.optimisticUser.id ? createdUser : user,
        ),
      );
      showToast("User added successfully!", "success");
      setShowAddUserPopup(false);
      setNewUser(createEmptyUserDraft());
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(userQueryKeys.all, context.previousUsers);
      showToast(error.message || "Failed to add user", "error");
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
    onError: (error, _userId, context) => {
      queryClient.setQueryData(userQueryKeys.all, context.previousUsers);
      showToast(error.message || "Failed to delete user", "error");
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
    onError: (error, _variables, context) => {
      queryClient.setQueryData(userQueryKeys.all, context.previousUsers);
      showToast(error.message || "Failed to update role", "error");
    },
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
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
        ? normalizePermissionList(prev?.permissions).filter(
            (item) => item !== permission,
          )
        : [...normalizePermissionList(prev?.permissions), permission],
    }));
  };

  const handleAddUser = (event) => {
    event.preventDefault();

    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    addUserMutation.mutate(
      isTeamMemberRole(newUser.role) ? { ...newUser, permissions: [] } : newUser,
    );
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(createEditableUser(user));
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

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];

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
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("Export completed successfully!", "success");
  };

  if (isLoading) {
    return <UsersSkeleton />;
  }

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
        onViewUser={(user) => {
          setSelectedUser(user);
          setShowViewUserPopup(true);
        }}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <AnimatePresence>
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
            availableRoleOptions={getEditableRoleOptions(
              selectedUser,
              availableRoleOptions,
            )}
            availablePermissionOptions={getEditablePermissionOptions(
              selectedUser,
              availablePermissionOptions,
            )}
            showPermissionAssignment={canAssignPermissions}
            roleLocked={
              ["admin", "super-admin"].includes(selectedUser.role) &&
              !canManageAdminAccounts
            }
            lockMessage={
              ["admin", "super-admin"].includes(selectedUser.role) &&
              !canManageAdminAccounts
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
      </AnimatePresence>

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

export default UsersPage;
