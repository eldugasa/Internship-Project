import { PERMISSIONS } from "../../config/permissions";

const normalizeRole = (role = "guest") => role.toLowerCase().replace(/_/g, "-");

export const isAdminProjectsView = (pathname = "") => pathname.startsWith("/admin");

export const getProjectsBasePath = (pathname = "") =>
  isAdminProjectsView(pathname) ? "/admin/projects" : "/manager/projects";

export const getProjectDetailsPath = (pathname = "", projectId) =>
  `${getProjectsBasePath(pathname)}/${projectId}`;

export const getProjectEditPath = (pathname = "", projectId) =>
  `${getProjectsBasePath(pathname)}/edit/${projectId}`;

export const getProjectCreatePath = (pathname = "") =>
  `${getProjectsBasePath(pathname)}/create`;

export const getProjectTaskCreatePath = (pathname = "", projectId) =>
  isAdminProjectsView(pathname)
    ? null
    : `/manager/tasks/create${projectId ? `?projectId=${projectId}` : ""}`;

export const getProjectTaskDetailsPath = (pathname = "", taskId) =>
  isAdminProjectsView(pathname) ? null : `/manager/tasks/${taskId}`;

export const resolveCanManageProjects = (user = {}, pathname = "") => {
  const normalizedRole = normalizeRole(user?.role || "guest");
  const effectivePermissions = Array.isArray(user?.effectivePermissions)
    ? user.effectivePermissions
    : [];
  const permissionOverrides = Array.isArray(user?.permissionOverrides)
    ? user.permissionOverrides
    : [];
  const hasExplicitGrant = permissionOverrides.includes(PERMISSIONS.MANAGE_PROJECTS);
  const hasExplicitRevoke = permissionOverrides.includes(`!${PERMISSIONS.MANAGE_PROJECTS}`);
  const isAdminView = isAdminProjectsView(pathname);

  if (effectivePermissions.includes("*")) {
    return true;
  }

  if (normalizedRole === "project-manager") {
    return !hasExplicitRevoke;
  }

  if (normalizedRole === "admin") {
    return hasExplicitGrant;
  }

  if (isAdminView) {
    return normalizedRole === "super-admin" || hasExplicitGrant;
  }

  return effectivePermissions.includes(PERMISSIONS.MANAGE_PROJECTS);
};
