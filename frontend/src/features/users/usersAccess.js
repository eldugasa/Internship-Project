import {
  PERMISSION_OPTIONS,
  ROLE_OPTIONS,
  toDisplayRole,
} from "../../loader/admin/UsersManagement.loader";

export const normalizePermissionList = (permissions = []) =>
  Array.isArray(permissions)
    ? [
        ...new Set(
          permissions
            .filter(Boolean)
            .map((permission) => permission.toString().trim().toLowerCase()),
        ),
      ]
    : [];

export const ROLE_DEFAULT_PERMISSIONS = {
  "project-manager": ["manage_teams", "manage_projects"],
};

export const isTeamMemberRole = (role = "") => role === "team-member";

export const applyRoleDefaultPermissions = (role, permissions = []) => {
  const normalizedPermissions = normalizePermissionList(permissions);
  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[role] || [];

  return [...new Set([...normalizedPermissions, ...roleDefaults])];
};

export const getAvailableRoleOptions = ({ canCreateSuperAdmin }) =>
  ROLE_OPTIONS.filter(
    (option) =>
      (option.value !== "super-admin" || canCreateSuperAdmin) &&
      (option.value !== "admin" || canCreateSuperAdmin),
  );

export const getEditableRoleOptions = (user, availableRoleOptions) => {
  const currentRole = user?.role;
  const baseOptions =
    user?.role === "super-admin" ? ROLE_OPTIONS : availableRoleOptions;

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

export const getEditablePermissionOptions = (
  user,
  availablePermissionOptions = PERMISSION_OPTIONS,
) => {
  const currentPermissions = normalizePermissionList(user?.permissions);

  return PERMISSION_OPTIONS.filter(
    (option) =>
      currentPermissions.includes(option.value) ||
      availablePermissionOptions.some((allowed) => allowed.value === option.value),
  );
};

export const createEmptyUserDraft = () => ({
  name: "",
  email: "",
  password: "",
  role: "team-member",
  permissions: [],
});

export const createEditableUser = (user) => ({
  ...user,
  permissions: normalizePermissionList(user?.permissions),
});
