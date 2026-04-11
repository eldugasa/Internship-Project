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

  // Normalize role helper
  const normalizeRole = (r = '') => (r || '').toLowerCase().replace(/_/g, '-');

  // Normalize role
  const userRole = normalizeRole(user?.role);

  // Normalize allowed roles
  const normalizedAllowedRoles = allowedRoles?.map(role => normalizeRole(role));

  
  if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(userRole)) {
   
    return <Navigate to="/login" replace />;
  }

  //  Render nested routes correctly
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
