// src/components/admin/AdminSidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UsersRound,
  FolderKanban,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

const AdminSidebar = ({ collapsed, onToggle, onClose, isMobile }) => {
  const navigate = useNavigate();

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/teams', label: 'Teams', icon: UsersRound },
    { path: '/admin/projects', label: 'Projects', icon: FolderKanban },
    { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Get user from localStorage for the user card
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userName = user?.name || 'Admin User';
  const userRole = user?.role || 'admin';
  
  const userInitials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <aside className={`
      h-full bg-white border-r border-gray-200
      flex flex-col transition-all duration-300 ease-in-out
      ${collapsed ? 'w-20' : 'w-64'}
    `}>
      {/* Logo with Toggle */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!collapsed ? (
          <h1 className="text-xl font-bold">
            <span style={{ color: '#0f5841' }}>Admin</span>
            <span style={{ color: '#194f87' }}>Panel</span>
          </h1>
        ) : (
          <h1 className="text-xl font-bold w-full text-center">
            <span style={{ color: '#0f5841' }}>A</span>
            <span style={{ color: '#194f87' }}>P</span>
          </h1>
        )}
        
        {/* Desktop toggle button */}
        {!isMobile && (
          <button
            onClick={onToggle}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            )}
          </button>
        )}

        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition ml-2"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-2">
          <p className={`text-xs font-semibold text-gray-400 uppercase tracking-wider ${collapsed && !isMobile ? 'text-center' : 'px-3'}`}>
            {collapsed && !isMobile ? '•••' : 'MAIN'}
          </p>
        </div>
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center ${collapsed && !isMobile ? 'justify-center' : 'px-3'} py-2.5 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
                style={({ isActive }) => 
                  isActive ? { background: `linear-gradient(to right, #0f5841, #194f87)` } : {}
                }
                title={collapsed && !isMobile ? item.label : ""}
              >
                <Icon className={`w-5 h-5 ${collapsed && !isMobile ? '' : 'mr-3'} text-gray-500 flex-shrink-0`} />
                {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Card */}
      <div className="p-4 border-t border-gray-200">
        <div
          className={`flex items-center ${collapsed && !isMobile ? 'justify-center' : ''} p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer`}
          onClick={() => {
            navigate("/admin/settings");
            if (isMobile && onClose) onClose();
          }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
               style={{ background: `linear-gradient(to bottom right, #0f5841, #194f87)` }}>
            {userInitials}
          </div>

          {(!collapsed || isMobile) && (
            <>
              <div className="flex-1 min-w-0 ml-3">
                <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-gray-500 truncate capitalize">
                  {userRole.replace(/_/g, ' ')}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition ml-2"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        
        {/* Logout button for collapsed desktop state */}
        {collapsed && !isMobile && (
          <button
            onClick={handleLogout}
            className="w-full mt-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex justify-center"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;