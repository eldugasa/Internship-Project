// src/components/admin/AdminSidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const AdminSidebar = () => {
  const navigate = useNavigate();

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/teams', label: 'Teams', icon: '👨‍👩‍👧‍👦' },
    { path: '/admin/projects', label: 'Projects', icon: '📋' },
    { path: '/admin/reports', label: 'Reports', icon: '📈' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  const handleLogout = () => {
    // Clear token or any auth info
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-80px)] flex flex-col justify-between">
      {/* Menu */}
      <nav className="p-4">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Logout button at bottom */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
        >
          <span className="text-lg">🔓</span>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
