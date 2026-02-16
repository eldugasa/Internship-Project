// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Normalize role
  const userRole =
    user.role === 'team_member' ? 'team-member' :
    user.role === 'project_manager' ? 'project-manager' :
    user.role;

  // Normalize allowed roles
  const normalizedAllowedRoles = allowedRoles?.map(role =>
    role === 'team_member' ? 'team-member' :
    role === 'project_manager' ? 'project-manager' :
    role
  );

  // If allowedRoles is provided, enforce it
  if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(userRole)) {
    // 🚫 Don’t redirect into another protected route (loop risk)
    return <Navigate to="/login" replace />;
  }

  // ✅ Render nested routes correctly
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
