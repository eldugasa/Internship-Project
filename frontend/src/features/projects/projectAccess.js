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
  const isAdminView = isAdminProjectsView(pathname);
  const hasManageProjectsPermission = effectivePermissions.includes(
    PERMISSIONS.MANAGE_PROJECTS,
  );

  if (effectivePermissions.includes("*")) {
    return true;
  }

  if (normalizedRole === "project-manager") {
    return hasManageProjectsPermission;
  }

  if (normalizedRole === "admin") {
    return hasManageProjectsPermission;
  }

  if (isAdminView) {
    return normalizedRole === "super-admin" || hasManageProjectsPermission;
  }

  return hasManageProjectsPermission;
};
