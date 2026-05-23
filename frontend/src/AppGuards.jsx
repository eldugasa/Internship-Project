import React from "react";
import { Navigate } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import { PERMISSIONS } from "./config/permissions";
import { useAuth } from "./context/AuthContext";

export const AdminAreaGuard = ({ children }) => (
  <ProtectedRoute
    allowedRoles={["admin", "super-admin"]}
    requiredPermissions={[
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.MANAGE_TEAMS,
      PERMISSIONS.MANAGE_PROJECTS,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.MANAGE_SETTINGS,
    ]}
  >
    {children}
  </ProtectedRoute>
);

export const ManagerAreaGuard = ({ children }) => (
  <ProtectedRoute
    allowedRoles={["project-manager", "admin", "super-admin"]}
    requiredPermissions={[
      PERMISSIONS.MANAGE_TEAMS,
      PERMISSIONS.MANAGE_PROJECTS,
      PERMISSIONS.ASSIGN_TASKS,
      PERMISSIONS.VIEW_REPORTS,
    ]}
  >
    {children}
  </ProtectedRoute>
);

export const QAAreaGuard = ({ children }) => (
  <ProtectedRoute
    allowedRoles={["qa-tester", "admin", "super-admin"]}
    requiredPermissions={[PERMISSIONS.TEST_TASKS]}
  >
    {children}
  </ProtectedRoute>
);

export const ProjectWorkspaceGuard = ({ children }) => {
  const { hasPermission, hasRole } = useAuth();
  const canViewProjects =
    hasRole(["project-manager"]) ||
    hasPermission(PERMISSIONS.MANAGE_PROJECTS);

  return canViewProjects ? children : <Navigate to="/login" replace />;
};

export const ProjectManagementGuard = ({ children }) => {
  const { hasPermission } = useAuth();

  return hasPermission(PERMISSIONS.MANAGE_PROJECTS)
    ? children
    : <Navigate to="/login" replace />;
};
