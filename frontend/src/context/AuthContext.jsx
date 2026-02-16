// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import DataService from '../services/dataservices';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('current_user');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user on mount
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Ensure role is normalized when loading from localStorage
        if (parsedUser.role === 'team_member') {
          parsedUser.role = 'team-member';
        } else if (parsedUser.role === 'project_manager') {
          parsedUser.role = 'project-manager';
        }
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('current_user');
      }
    }
    setLoading(false);
  }, []);

const login = async (email, password) => {
  try {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Login failed");
    }

    const data = await response.json();
    const { token, user } = data;

    // Normalize role
    let normalizedRole = user.role;
    if (normalizedRole === "TEAM_MEMBER" || normalizedRole === "team_member") {
      normalizedRole = "team-member";
    } else if (normalizedRole === "PROJECT_MANAGER" || normalizedRole === "project_manager") {
      normalizedRole = "project-manager";
    } else if (normalizedRole === "ADMIN") {
      normalizedRole = "admin";
    }

    const finalUser = { ...user, role: normalizedRole };

    localStorage.setItem("token", token);
    localStorage.setItem("current_user", JSON.stringify(finalUser));
    setUser(finalUser);

    return finalUser;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};



const signup = async (data) => {
  try {
    const response = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
        role: "TEAM_MEMBER" // ✅ always default to team member
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Signup failed");
    }

    const newUser = await response.json();

    // Store user without password
    const { password, ...userData } = newUser;
    localStorage.setItem("current_user", JSON.stringify(userData));
    setUser(userData);

    return userData;
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
};



  const logout = () => {
    localStorage.removeItem('current_user');
    localStorage.removeItem('token'); 
    setUser(null);
  };

  // Helper function to get user role for redirection
  const getUserDashboardPath = () => {
    if (!user) return '/login';
    
    const userRole = user.role === 'team_member' ? 'team-member' : 
                    user.role === 'project_manager' ? 'project-manager' : 
                    user.role;
    
    switch (userRole) {
      case 'admin':
        return '/admin/dashboard';
      case 'project-manager':
        return '/manager/dashboard';
      case 'team-member':
        return '/team-member/dashboard';
      default:
        return '/login';
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    getUserDashboardPath
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};