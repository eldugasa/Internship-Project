// src/router.jsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import React from 'react';

// Auth
import ProtectedRoute from './auth/ProtectedRoute';

// Public imports
import LandingPage from "./LandingPage";
import Signup from './auth/Signup';
import Login from './auth/Login';
import ForgetPassword from './auth/ForgetPassword';
import ResetPassword from './auth/ResetPassword';

// Admin imports
import AdminLayout from './Component/admin/AdminLayout';
import DashboardOverview from './pages/admin/DashboardOverview';
import UsersManagement from './pages/admin/UsersManagement';
import TeamsManagement from './pages/admin/TeamsManagement';
import ProjectsManagement from './pages/admin/ProjectsManagement';
import Reports from './pages/admin/Reports';
import SettingsPage from './pages/admin/SettingsPage';
import TeamDetailsPage from './pages/admin/TeamDetailsPage';
import AdminNotificationsPage from './Component/admin/AdminNotificationsPage';

// Project Manager imports
import ManagerLayout from './Component/projectmanager/PromanagerLayout';
import ProjectManagerDashboard from './pages/projectManager/ProjectManagerDashboard';
import Projects from './pages/projectManager/Projects';
import CreateProject from './pages/projectManager/CreateProject';
import ProjectDetails from './pages/projectManager/ProjectDetails';
import Tasks from './pages/projectManager/Tasks';
import Reportpm from './pages/projectManager/Reports';
import CreateTask from './pages/projectManager/CreateTask';
import EditTask from './pages/projectManager/EditTask';
import TaskDetails from './pages/projectManager/TaskDetails';
import Progress from './pages/projectManager/Progress';
import Settings from './pages/projectManager/Settings';
import EditProject from "./pages/projectManager/EditProject";
import ManagerNotificationsPage from './Component/projectmanager/ManagerNotificationsPage';

// Team Member imports
import TeamMemberLayout from './Component/teamMember/TeamMemberLayout';
import TeamMemberDashboard from './pages/teamMember/Dashboard';
import TeamMemberTasks from './pages/teamMember/Tasks';
import TeamMemberTaskDetails from './pages/teamMember/TaskDetails';
import TeamMemberProgress from './pages/teamMember/Progress';
import TeamMemberReports from './pages/teamMember/Reports';
import TeamMemberProfile from './pages/teamMember/Profile';
import TeamMemberNotificationsPage from './Component/teamMember/TeamMemberNotificationsPage';

// Create the router
export const router = createBrowserRouter([
  // Public routes
  {
    path: "/",
    element: <LandingPage />,
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
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
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
      },
      {
        path: "teams",
        children: [
          {
            index: true,
            element: <TeamsManagement />,
          },
          {
            path: ":teamId",
            element: <TeamDetailsPage />,
          },
        ],
      },
      {
        path: "projects",
        element: <ProjectsManagement />,
      },
      {
        path: "reports",
        element: <Reports />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
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
      <ProtectedRoute allowedRoles={['project-manager', 'project_manager', 'admin']}>
        <ManagerLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <ProjectManagerDashboard />,
      },
      {
        path: "projects",
        children: [
          {
            index: true,
            element: <Projects />,
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
      },
      {
        path: "reports",
        element: <Reportpm />,
      },
      {
        path: "settings",
        element: <Settings />,
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
      <ProtectedRoute allowedRoles={['team-member', 'team_member', 'admin']}>
        <TeamMemberLayout />
      </ProtectedRoute>
    ),
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