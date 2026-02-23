// src/App.jsx
import React from "react";
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';

// Public imports
import LandingPage from "./LandingPage";
import Signup from './auth/Signup';
import Login from './auth/Login';
import ForgetPassword from './auth/ForgetPassword';

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

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgetPassword />} />

        {/* Admin routes - Protected */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardOverview />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="teams" element={<TeamsManagement />} />
          <Route path="teams/:teamId" element={<TeamDetailsPage />} />
          <Route path="projects" element={<ProjectsManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<SettingsPage />} />
          {/* ADD THIS ROUTE */}
          <Route path="notifications" element={<AdminNotificationsPage />} />
        </Route>

        {/* Project Manager routes - Protected */}
        <Route path="/manager" element={
          <ProtectedRoute allowedRoles={['project-manager', 'project_manager', 'admin']}>
            <ManagerLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ProjectManagerDashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/create" element={<CreateProject />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="projects/edit/:id" element={<EditProject />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="tasks/create" element={<CreateTask />} />
          <Route path="tasks/edit/:id" element={<EditTask />} />
          <Route path="tasks/:id" element={<TaskDetails />} />
          <Route path="progress" element={<Progress />} />
          <Route path="reports" element={<Reportpm />} />
          <Route path="settings" element={<Settings />} />
          {/* ADD THIS ROUTE */}
          <Route path="notifications" element={<ManagerNotificationsPage />} />
        </Route>

        {/* Team Member routes - Protected */}
        <Route path="/team-member" element={
          <ProtectedRoute allowedRoles={['team-member', 'team_member', 'admin']}>
            <TeamMemberLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TeamMemberDashboard />} />
          <Route path="tasks" element={<TeamMemberTasks />} />
          <Route path="tasks/:id" element={<TeamMemberTaskDetails />} />
          <Route path="progress" element={<TeamMemberProgress />} />
          <Route path="reports" element={<TeamMemberReports />} />
          <Route path="profile" element={<TeamMemberProfile />} />
          {/* ADD THIS ROUTE */}
          <Route path="notifications" element={<TeamMemberNotificationsPage />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Redirect old /dashboard route */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Navigate to="/team-member/dashboard" replace />
          </ProtectedRoute>
        } />

        {/* Catch-all route - redirect to login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </AuthProvider>
  );
}