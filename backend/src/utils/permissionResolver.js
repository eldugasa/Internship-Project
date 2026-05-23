import {
  ROLE_DEFAULT_PERMISSIONS,
  ROLE_PERMISSIONS,
} from "../config/permissions.js";

export const normalizeRole = (role = "TEAM_MEMBER") =>
  role.toString().trim().toUpperCase().replace(/-/g, "_");

export const normalizePermissions = (permissions = []) => {
  if (!Array.isArray(permissions)) {
    return [];
  }

  return [...new Set(
    permissions
      .filter(Boolean)
      .map((permission) => permission.toString().trim().toLowerCase()),
  )];
};

export const normalizePermissionOverrides = (permissions = []) => {
  if (!Array.isArray(permissions)) {
    return [];
  }

  return [...new Set(
    permissions
      .filter(Boolean)
      .map((permission) => {
        const normalizedPermission = permission.toString().trim().toLowerCase();
        return normalizedPermission.startsWith("!")
          ? `!${normalizedPermission.slice(1)}`
          : normalizedPermission;
      }),
  )];
};

const getGrantedPermissions = (permissions = []) =>
  normalizePermissionOverrides(permissions).filter(
    (permission) => !permission.startsWith("!"),
  );

const getRevokedPermissions = (permissions = []) =>
  normalizePermissionOverrides(permissions)
    .filter((permission) => permission.startsWith("!"))
    .map((permission) => permission.slice(1));

const getRolePermissionBaseline = (role) => {
  const normalizedRole = normalizeRole(role);
  const basePermissions = normalizePermissions(
    ROLE_PERMISSIONS[normalizedRole] || [],
  ).filter((permission) => permission !== "*");
  const roleDefaultPermissions = normalizePermissions(
    ROLE_DEFAULT_PERMISSIONS[normalizedRole] || [],
  );

  return [...new Set([...basePermissions, ...roleDefaultPermissions])];
};

export const getEditablePermissions = (role, storedPermissions = []) => {
  const rolePermissionBaseline = getRolePermissionBaseline(role);
  const grantedPermissions = normalizePermissions(
    getGrantedPermissions(storedPermissions),
  );
  const revokedPermissions = new Set(getRevokedPermissions(storedPermissions));
  const activePermissions = [...new Set([
    ...rolePermissionBaseline,
    ...grantedPermissions,
  ])];

  return activePermissions.filter(
    (permission) => !revokedPermissions.has(permission),
  );
};

export const encodePermissionsForRole = (role, selectedPermissions = []) => {
  const rolePermissionBaseline = getRolePermissionBaseline(role);
  const normalizedSelectedPermissions = normalizePermissions(selectedPermissions);

  const grantedPermissions = normalizedSelectedPermissions.filter(
    (permission) => !rolePermissionBaseline.includes(permission),
  );
  const revokedPermissions = rolePermissionBaseline
    .filter((permission) => !normalizedSelectedPermissions.includes(permission))
    .map((permission) => `!${permission}`);

  return [...new Set([...grantedPermissions, ...revokedPermissions])];
};

export const getEffectivePermissions = (role, storedPermissions = []) => {
  const normalizedRole = normalizeRole(role);
  const basePermissions = ROLE_PERMISSIONS[normalizedRole] || [];
  const editablePermissions = getEditablePermissions(role, storedPermissions);

  if (basePermissions.includes("*") || editablePermissions.includes("*")) {
    return ["*"];
  }

  return editablePermissions;
};
