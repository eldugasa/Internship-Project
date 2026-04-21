
import { createBrowserRouter, Navigate } from "react-router-dom";
import React from "react";

// Auth
import ProtectedRoute from "./auth/ProtectedRoute";
import ErrorPage from "./pages/ErrorPage";

// Public imports
import LandingPage from "./LandingPage";
import Login from "./auth/Login";
import ForgetPassword from "./auth/ForgetPassword";
import ResetPassword from "./auth/ResetPassword";

// Admin imports
import AdminLayout from "./Component/admin/AdminLayout";
import DashboardOverview from "./pages/admin/DashboardOverview";
import UsersManagement from "./pages/admin/UsersManagement";
import {usersLoader} from "./loader/admin/UsersManagement.loader";
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
import TaskDetails, {loader as taskDetailLoader, action as taskDetailAction} from "./pages/projectManager/TaskDetails";
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
import { queryClient } from "./services/apiClient";

// QA Tester imports
import QATesterLayout from "./Component/qaTester/QATesterLayout";
import QATesterDashboard from "./pages/qaTester/Dashboard";
import QATesterTasks from "./pages/qaTester/Tasks";
import QATesterTaskDetails from "./pages/qaTester/TaskDetails";
import QATesterProjects from "./pages/qaTester/Projects";
import QATesterProfile from "./pages/qaTester/Profile";
import QATesterNotificationsPage from "./Component/qaTester/QATesterNotificationsPage";

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
      },
      {
        path: "users",
        element: <UsersManagement />,
         loader: usersLoader(queryClient),
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
            loader: taskDetailLoader(queryClient),  // ← Add (queryClient)
              action: taskDetailAction(queryClient),
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
// Team Member routes
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

  // QA Tester routes
  {
    path: "/qa-tester",
    element: (
      <ProtectedRoute allowedRoles={["qa-tester", "qa_tester", "admin"]}>
        <QATesterLayout />
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
        element: <QATesterDashboard />,
      },
      {
        path: "tasks",
        children: [
          {
            index: true,
            element: <QATesterTasks />,
          },
          {
            path: ":id",
            element: <QATesterTaskDetails />,
          },
        ],
      },
      {
        path: "projects",
        element: <QATesterProjects />,
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
