// src/router.jsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import React from "react";

// Auth
import ProtectedRoute from "./auth/ProtectedRoute";
import ErrorPage from "./pages/ErrorPage";

// Public imports
import LandingPage from "./LandingPage";
import Signup from "./auth/Signup";
import Login from "./auth/Login";
import ForgetPassword from "./auth/ForgetPassword";
import ResetPassword from "./auth/ResetPassword";

// Admin imports
import AdminLayout from "./Component/admin/AdminLayout";
import DashboardOverview, {
  loader as dashboardLoader,
} from "./pages/admin/DashboardOverview";
import UsersManagement, {
  loader as usersLoader,
} from "./pages/admin/UsersManagement";
import TeamsManagement, {
  loader as teamsLoader,
} from "./pages/projectManager/TeamsManagement";
import ProjectsManagement, {
  loader as projectsLoader,
} from "./pages/admin/ProjectsManagement";
import Reports, { loader as reportsLoader } from "./pages/admin/Reports";
import SettingsPage, {
  loader as settingsLoader,
} from "./pages/admin/SettingsPage";
import TeamDetailsPage, {
  loader as teamDetailsLoader,
} from "./pages/projectManager/TeamDetailsPage";
import AdminNotificationsPage from "./Component/admin/AdminNotificationsPage";

// Project Manager imports
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
import TaskDetails from "./pages/projectManager/TaskDetails";
import Progress, {
  loader as pmprogressLoader,
} from "./pages/projectManager/Progress";
import Settings, {
  loader as settingspmLoader,
} from "./pages/projectManager/Settings";
import EditProject from "./pages/projectManager/EditProject";
import ManagerNotificationsPage from "./Component/projectmanager/ManagerNotificationsPage";

// Team Member imports
import TeamMemberLayout from "./Component/teamMember/TeamMemberLayout";
import TeamMemberDashboard from "./pages/teamMember/Dashboard";
import TeamMemberTasks from "./pages/teamMember/Tasks";
import TeamMemberTaskDetails from "./pages/teamMember/TaskDetails";
import TeamMemberProgress from "./pages/teamMember/Progress";
import TeamMemberReports from "./pages/teamMember/Reports";
import TeamMemberProfile from "./pages/teamMember/Profile";
import TeamMemberNotificationsPage from "./Component/teamMember/TeamMemberNotificationsPage";

// Create the router
export const router = createBrowserRouter([
  // Public routes
  {
    path: "/",
    element: <LandingPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/signup",
    element: <Signup />,
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

  // Admin routes
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminLayout />
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
        element: <DashboardOverview />,
        loader: dashboardLoader,
      },
      {
        path: "users",
        element: <UsersManagement />,
        loader: usersLoader,
      },
      {
        path: "teams",
        children: [
          {
            index: true,
            element: <TeamsManagement />,
            loader: teamsLoader,
          },
          {
            path: ":teamId",
            element: <TeamDetailsPage />,
            loader: teamDetailsLoader,
          },
        ],
      },
      {
        path: "projects",
        element: <ProjectsManagement />,
        loader: projectsLoader,
      },
      {
        path: "reports",
        element: <Reports />,
        loader: reportsLoader,
      },
      {
        path: "settings",
        element: <SettingsPage />,
        loader: settingsLoader,
      },
      {
        path: "notifications",
        element: <AdminNotificationsPage />,
      },
    ],
  },

  // Project Manager routes
  {
    path: "/manager",
    element: (
      <ProtectedRoute
        allowedRoles={["project-manager", "project_manager", "admin"]}
      >
        <ManagerLayout />
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
        element: <ProjectManagerDashboard />,
        loader: pmdashboardLoader,
      },
      {
        path: "teams",
        children: [
          {
            index: true,
            element: <TeamsManagement />,
            loader: teamsLoader,
          },
          {
            path: ":teamId",
            element: <TeamDetailsPage />,
            loader: teamDetailsLoader,
          },
        ],
      },
      {
        path: "projects",

        children: [
          {
            index: true,
            element: <Projects />,
            loader: pmprojectsLoader,
          },
          {
            path: "create",
            element: <CreateProject />,
          },
          {
            path: ":id",
            element: <ProjectDetails />,
          },
          {
            path: "edit/:id",
            element: <EditProject />,
          },
        ],
      },
      {
        path: "tasks",
        children: [
          {
            index: true,
            element: <Tasks />,
            loader: pmtasksLoader,
          },
          {
            path: "create",
            element: <CreateTask />,
          },
          {
            path: "edit/:id",
            element: <EditTask />,
          },
          {
            path: ":id",
            element: <TaskDetails />,
          },
        ],
      },
      {
        path: "progress",
        element: <Progress />,
        loader: pmprogressLoader,
      },
      {
        path: "reports",
        element: <Reportpm />,
        loader: reportpmLoader,
      },
      {
        path: "settings",
        element: <Settings />,
        loader: settingspmLoader,
      },
      {
        path: "notifications",
        element: <ManagerNotificationsPage />,
      },
    ],
  },

  // Team Member routes
  {
    path: "/team-member",
    element: (
      <ProtectedRoute allowedRoles={["team-member", "team_member", "admin"]}>
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

  // Dashboard redirect (for backward compatibility)
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Navigate to="/team-member/dashboard" replace />
      </ProtectedRoute>
    ),
  },

  // Catch all - redirect to login
  {
    path: "*",
    element: <Navigate to="/login" />,
  },
]);
