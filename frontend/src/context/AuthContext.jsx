// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import {
  loginApi,
  logoutApi,
  getCurrentUser,
  fetchCurrentUserApi,
  persistCurrentUser,
} from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const clearAuthState = () => {
    logoutApi();
    setUser(null);
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
          const freshUser = await fetchCurrentUserApi();
          setUser(freshUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (error?.code === 401) {
          clearAuthState();
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      const userData = await loginApi(email, password);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    clearAuthState();
    setError(null);
  };

  const refreshUser = async () => {
    try {
      const freshUser = await fetchCurrentUserApi();
      setUser(freshUser);
      return freshUser;
    } catch (error) {
      if (error?.code === 401) {
        clearAuthState();
      }
      throw error;
    }
  };

  const updateStoredUser = (nextUser) => {
    const normalizedUser = persistCurrentUser({
      ...nextUser,
      token: nextUser?.token || user?.token,
    });
    setUser(normalizedUser);
    return normalizedUser;
  };

  // Get user's dashboard path based on role
  const getUserDashboardPath = () => {
    if (!user) return '/login';
    
    const role = user.role?.toLowerCase() || '';
    
    switch (role) {
      case 'super-admin':
      case 'admin':
        return '/admin/dashboard';
      case 'project-manager':
      case 'project_manager':
        return '/manager/dashboard';
      case 'qa-tester':
      case 'qa_tester':
        return '/qa-tester/dashboard';
      case 'team-member':
      case 'team_member':
        return '/team-member/dashboard';
      default:
        return '/login';
    }
  };

  const getPermissions = () => {
    if (!user) return [];

    const permissions = Array.isArray(user.effectivePermissions)
      ? user.effectivePermissions
      : user.effectivePermissions
        ? [user.effectivePermissions]
        : [];

    return permissions;
  };

  // Check if user has specific role
  const hasRole = (roles) => {
    if (!user || !user.role) return false;
    const normalizeRole = (role = "") => role.toLowerCase().replace(/_/g, "-");
    const userRole = normalizeRole(user.role);
    
    if (Array.isArray(roles)) {
      return roles.some(role => normalizeRole(role) === userRole);
    }
    
    return normalizeRole(roles) === userRole;
  };

  // Check if user is admin
  const isAdmin = () => {
    const role = user?.role?.toLowerCase();
    return role === 'admin' || role === 'super-admin';
  };

  // Check if user is project manager
  const isProjectManager = () => {
    const role = user?.role?.toLowerCase();
    return role === 'project-manager' || role === 'project_manager';
  };

  // Check if user is team member
  const isTeamMember = () => {
    const role = user?.role?.toLowerCase();
    return role === 'team-member' || role === 'team_member';
  };

  const isQATester = () => {
    const role = user?.role?.toLowerCase();
    return role === 'qa-tester' || role === 'qa_tester';
  };

  const isSuperAdmin = () => {
    return user?.role?.toLowerCase() === 'super-admin';
  };

  const hasPermission = (permission) => {
    const permissions = getPermissions();
    return permissions.includes('*') || permissions.includes(permission);
  };

  const hasAnyPermission = (permissions = []) => {
    return permissions.some((permission) => hasPermission(permission));
  };

  const hasAllPermissions = (permissions = []) => {
    return permissions.every((permission) => hasPermission(permission));
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    getUserDashboardPath,
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isSuperAdmin,
    isProjectManager,
    isQATester,
    isTeamMember,
    refreshUser,
    updateStoredUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
