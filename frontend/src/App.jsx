import { createBrowserRouter, Navigate } from "react-router-dom";
import React from "react";

import ProtectedRoute from "./auth/ProtectedRoute";
import ErrorPage from "./pages/ErrorPage";
import LandingPage from "./LandingPage";
import Login from "./auth/Login";
import ForgetPassword from "./auth/ForgetPassword";
import ResetPassword from "./auth/ResetPassword";

import AdminLayout from "./Component/admin/AdminLayout";
import DashboardOverview from "./pages/admin/DashboardOverview";
import UsersManagement from "./pages/admin/UsersManagement";
import { usersLoader } from "./loader/admin/UsersManagement.loader";
import TeamsManagement, {
  loader as teamsLoader,
} from "./pages/projectManager/TeamsManagement";
import ProjectsManagement from "./pages/admin/ProjectsManagement";
import { projectsLoader } from "./loader/admin/ProjectsManagement.loader";
import Reports from "./pages/admin/Reports";
import { reportsLoader } from "./loader/admin/Reports.loader";
import SettingsPage from "./pages/admin/SettingsPage";
import { settingsLoader } from "./loader/admin/Settings.loader";
import TeamDetailsPage, {
  loader as teamDetailsLoader,
} from "./pages/projectManager/TeamDetailsPage";
import AdminNotificationsPage from "./Component/admin/AdminNotificationsPage";

import ManagerLayout from "./Component/projectmanager/PromanagerLayout";
import ProjectManagerDashboard, {
  loader as pmdashboardLoader,
} from "./pages/projectManager/ProjectManagerDashboard";
import Projects, {
  loader as pmprojectsLoader,
} from "./pages/projectManager/Projects";
import CreateProject from "./pages/projectManager/CreateProject";
import ProjectDetails from "./pages/projectManager/ProjectDetails";
import Tasks, { loader as pmtasksLoader } from "./pages/projectManager/Tasks";
import Reportpm, {
  loader as reportpmLoader,
} from "./pages/projectManager/Reports";
import CreateTask from "./pages/projectManager/CreateTask";
import EditTask from "./pages/projectManager/EditTask";
import TaskDetails, {
  loader as taskDetailLoader,
  action as taskDetailAction,
} from "./pages/projectManager/TaskDetails";
import Progress, {
  loader as pmprogressLoader,
} from "./pages/projectManager/Progress";
import Settings, {
  loader as settingspmLoader,
} from "./pages/projectManager/Settings";
import EditProject from "./pages/projectManager/EditProject";
import ManagerNotificationsPage from "./Component/projectmanager/ManagerNotificationsPage";

import TeamMemberLayout from "./Component/teamMember/TeamMemberLayout";
import TeamMemberDashboard from "./pages/teamMember/Dashboard";
import TeamMemberTasks from "./pages/teamMember/Tasks";
import TeamMemberTaskDetails from "./pages/teamMember/TaskDetails";
import TeamMemberProgress from "./pages/teamMember/Progress";
import TeamMemberReports from "./pages/teamMember/Reports";
import TeamMemberProfile from "./pages/teamMember/Profile";
import TeamMemberNotificationsPage from "./Component/teamMember/TeamMemberNotificationsPage";
import { queryClient } from "./services/apiClient";

import QATesterLayout from "./Component/qaTester/QATesterLayout";
import QATesterDashboard from "./pages/qaTester/Dashboard";
import QATesterTasks from "./pages/qaTester/Tasks";
import QATesterTaskDetails from "./pages/qaTester/TaskDetails";
import QATesterProjects from "./pages/qaTester/Projects";
import QATesterProfile from "./pages/qaTester/Profile";
import QATesterNotificationsPage from "./Component/qaTester/QATesterNotificationsPage";

import DashboardPage from "./pages/dashboard/DashboardPage";
import { PERMISSIONS } from "./config/permissions";
import { useAuth } from "./context/AuthContext";

const AdminAreaGuard = ({ children }) => (
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

const ManagerAreaGuard = ({ children }) => (
  <ProtectedRoute
    allowedRoles={["project-manager", "project_manager", "admin", "super-admin"]}
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

const QAAreaGuard = ({ children }) => (
  <ProtectedRoute
    allowedRoles={["qa-tester", "qa_tester", "admin", "super-admin"]}
    requiredPermissions={[PERMISSIONS.TEST_TASKS]}
  >
    {children}
  </ProtectedRoute>
);

const ProjectWorkspaceGuard = ({ children }) => {
  const { hasPermission, hasRole } = useAuth();
  const canViewProjects =
    hasRole(["project-manager", "project_manager"]) ||
    hasPermission(PERMISSIONS.MANAGE_PROJECTS);

  return canViewProjects ? children : <Navigate to="/login" replace />;
};

const ProjectManagementGuard = ({ children }) => {
  const { hasPermission } = useAuth();

  return hasPermission(PERMISSIONS.MANAGE_PROJECTS)
    ? children
    : <Navigate to="/login" replace />;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/signup",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/forgot-password",
    element: <ForgetPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/admin",
    element: (
      <AdminAreaGuard>
        <AdminLayout />
      </AdminAreaGuard>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute
            requiredPermissions={[
              PERMISSIONS.MANAGE_USERS,
              PERMISSIONS.MANAGE_TEAMS,
              PERMISSIONS.MANAGE_PROJECTS,
              PERMISSIONS.VIEW_REPORTS,
              PERMISSIONS.MANAGE_SETTINGS,
            ]}
          >
            <DashboardOverview />
          </ProtectedRoute>
        ),
      },
      {
        path: "users",
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.MANAGE_USERS]}>
            <UsersManagement />
          </ProtectedRoute>
        ),
        loader: usersLoader(queryClient),
      },
      {
        path: "teams",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute
                allowedRoles={["admin", "super-admin"]}
              >
                <TeamsManagement />
              </ProtectedRoute>
            ),
            loader: teamsLoader(queryClient),
          },
          {
            path: ":teamId",
            element: (
              <ProtectedRoute
                allowedRoles={["admin", "super-admin"]}
              >
                <TeamDetailsPage />
              </ProtectedRoute>
            ),
            loader: teamDetailsLoader,
          },
        ],
      },
      {
        path: "projects",
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.MANAGE_PROJECTS]}>
            <ProjectsManagement />
          </ProtectedRoute>
        ),
        loader: projectsLoader,
      },
      {
        path: "reports",
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_REPORTS]}>
            <Reports />
          </ProtectedRoute>
        ),
        loader: reportsLoader,
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.MANAGE_SETTINGS]}>
            <SettingsPage />
          </ProtectedRoute>
        ),
        loader: settingsLoader,
      },
      {
        path: "notifications",
        element: <AdminNotificationsPage />,
      },
    ],
  },
  {
    path: "/manager",
    element: (
      <ManagerAreaGuard>
        <ManagerLayout />
      </ManagerAreaGuard>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute
            requiredPermissions={[
              PERMISSIONS.MANAGE_TEAMS,
              PERMISSIONS.MANAGE_PROJECTS,
              PERMISSIONS.ASSIGN_TASKS,
              PERMISSIONS.VIEW_REPORTS,
            ]}
          >
            <ProjectManagerDashboard />
          </ProtectedRoute>
        ),
        loader: pmdashboardLoader,
      },
      {
        path: "teams",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <TeamsManagement />
              </ProtectedRoute>
            ),
            loader: teamsLoader(queryClient),
          },
          {
            path: ":teamId",
            element: (
              <ProtectedRoute>
                <TeamDetailsPage />
              </ProtectedRoute>
            ),
            loader: teamDetailsLoader,
          },
        ],
      },
      {
        path: "users",
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.MANAGE_USERS]}>
            <UsersManagement />
          </ProtectedRoute>
        ),
        loader: usersLoader(queryClient),
      },
      {
        path: "projects",
        children: [
          {
            index: true,
            element: (
              <ProjectWorkspaceGuard>
                <Projects />
              </ProjectWorkspaceGuard>
            ),
            loader: pmprojectsLoader,
          },
          {
            path: "create",
            element: (
              <ProjectManagementGuard>
                <CreateProject />
              </ProjectManagementGuard>
            ),
          },
          {
            path: ":id",
            element: (
              <ProjectWorkspaceGuard>
                <ProjectDetails />
              </ProjectWorkspaceGuard>
            ),
          },
          {
            path: "edit/:id",
            element: (
              <ProjectManagementGuard>
                <EditProject />
              </ProjectManagementGuard>
            ),
          },
        ],
      },
      {
        path: "tasks",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute requiredPermissions={[PERMISSIONS.ASSIGN_TASKS]}>
                <Tasks />
              </ProtectedRoute>
            ),
            loader: pmtasksLoader,
          },
          {
            path: "create",
            element: (
              <ProtectedRoute requiredPermissions={[PERMISSIONS.ASSIGN_TASKS]}>
                <CreateTask />
              </ProtectedRoute>
            ),
          },
          {
            path: "edit/:id",
            element: (
              <ProtectedRoute requiredPermissions={[PERMISSIONS.ASSIGN_TASKS]}>
                <EditTask />
              </ProtectedRoute>
            ),
          },
          {
            path: ":id",
            element: (
              <ProtectedRoute requiredPermissions={[PERMISSIONS.ASSIGN_TASKS]}>
                <TaskDetails />
              </ProtectedRoute>
            ),
            loader: taskDetailLoader(queryClient),
            action: taskDetailAction(queryClient),
          },
        ],
      },
      {
        path: "progress",
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_REPORTS]}>
            <Progress />
          </ProtectedRoute>
        ),
        loader: pmprogressLoader,
      },
      {
        path: "reports",
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_REPORTS]}>
            <Reportpm />
          </ProtectedRoute>
        ),
        loader: reportpmLoader,
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.MANAGE_SETTINGS]}>
            <Settings />
          </ProtectedRoute>
        ),
        loader: settingspmLoader,
      },
      {
        path: "notifications",
        element: <ManagerNotificationsPage />,
      },
    ],
  },
  {
    path: "/team-member",
    element: (
      <ProtectedRoute allowedRoles={["team-member", "team_member", "admin", "super-admin"]}>
        <TeamMemberLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <TeamMemberDashboard />,
      },
      {
        path: "tasks",
        children: [
          {
            index: true,
            element: <TeamMemberTasks />,
          },
          {
            path: ":id",
            element: <TeamMemberTaskDetails />,
          },
        ],
      },
      {
        path: "progress",
        element: <TeamMemberProgress />,
      },
      {
        path: "reports",
        element: <TeamMemberReports />,
      },
      {
        path: "profile",
        element: <TeamMemberProfile />,
      },
      {
        path: "notifications",
        element: <TeamMemberNotificationsPage />,
      },
      {
        path: "*",
        element: <Navigate to="dashboard" replace />,
      },
    ],
  },
  {
    path: "/qa-tester",
    element: (
      <QAAreaGuard>
        <QATesterLayout />
      </QAAreaGuard>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.TEST_TASKS]}>
            <QATesterDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "tasks",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute requiredPermissions={[PERMISSIONS.TEST_TASKS]}>
                <QATesterTasks />
              </ProtectedRoute>
            ),
          },
          {
            path: ":id",
            element: (
              <ProtectedRoute requiredPermissions={[PERMISSIONS.TEST_TASKS]}>
                <QATesterTaskDetails />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "projects",
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.TEST_TASKS]}>
            <QATesterProjects />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: <QATesterProfile />,
      },
      {
        path: "notifications",
        element: <QATesterNotificationsPage />,
      },
      {
        path: "*",
        element: <Navigate to="dashboard" replace />,
      },
    ],
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/login" />,
  },
]);
