// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import { loginApi, logoutApi, getCurrentUser } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
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
    logoutApi();
    setUser(null);
    setError(null);
  };

  // Get user's dashboard path based on role
  const getUserDashboardPath = () => {
    if (!user) return '/login';
    
    const role = user.role?.toLowerCase() || '';
    
    switch (role) {
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

  // Check if user has specific role
  const hasRole = (roles) => {
    if (!user || !user.role) return false;
    
    const userRole = user.role.toLowerCase();
    
    if (Array.isArray(roles)) {
      return roles.some(role => role.toLowerCase() === userRole);
    }
    
    return roles.toLowerCase() === userRole;
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.role?.toLowerCase() === 'admin';
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

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    getUserDashboardPath,
    hasRole,
    isAdmin,
    isProjectManager,
    isQATester,
    isTeamMember,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
