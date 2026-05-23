const normalizeRole = (role = "guest") => role.toLowerCase().replace(/_/g, "-");

export const isAdminTeamsView = (pathname = "") => pathname.startsWith("/admin");

export const getTeamsBasePath = (pathname = "", role = "guest") => {
  if (pathname) {
    return isAdminTeamsView(pathname) ? "/admin/teams" : "/manager/teams";
  }

  const normalizedRole = normalizeRole(role);
  return normalizedRole === "admin" || normalizedRole === "super-admin"
    ? "/admin/teams"
    : "/manager/teams";
};

export const resolveCanManageTeams = (user = {}, isAdminView = false) => {
  const normalizedRole = normalizeRole(user.role || "guest");
  const effectivePermissions = Array.isArray(user.effectivePermissions)
    ? user.effectivePermissions
    : [];
  const permissionOverrides = Array.isArray(user.permissionOverrides)
    ? user.permissionOverrides
    : [];
  const hasExplicitManageTeamsGrant = permissionOverrides.includes("manage_teams");
  const hasExplicitManageTeamsRevoke = permissionOverrides.includes("!manage_teams");

  if (effectivePermissions.includes("*")) {
    return true;
  }

  if (normalizedRole === "project-manager") {
    return !hasExplicitManageTeamsRevoke;
  }

  if (normalizedRole === "admin") {
    return hasExplicitManageTeamsGrant;
  }

  if (isAdminView) {
    return normalizedRole === "super-admin" || hasExplicitManageTeamsGrant;
  }

  return effectivePermissions.includes("manage_teams");
};
