// src/components/projectmanager/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

const Sidebar = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  navItems,
  userName,
  userRole,
  userInitials,
  setShowLogoutConfirm
}) => {
  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-40 bg-white border-r border-gray-200
        flex flex-col transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? "lg:w-20" : "lg:w-64"} w-64
        ${isMobileMenuOpen ? "translate-x-0 shadow-xl" : "-translate-x-full lg:translate-x-0"}
      `}
    >
      {/* Logo with Close Button on RIGHT when menu is open */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        {!sidebarCollapsed ? (
          <h1 className="text-xl font-bold">
            <span style={{ color: '#0f5841' }}>Project</span>
            <span style={{ color: '#194f87' }}>Manager</span>
          </h1>
        ) : (
          <h1 className="text-xl font-bold mx-auto lg:mx-0">
            <span style={{ color: '#0f5841' }}>P</span>
            <span style={{ color: '#194f87' }}>M</span>
          </h1>
        )}
        
        {/* Close button on the RIGHT - only visible on mobile when menu is open */}
        {isMobileMenuOpen && (
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg transition ml-auto"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}

        {/* Desktop toggle button - only visible on desktop */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:block p-1.5 hover:bg-gray-100 rounded-lg transition"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      {/* MAIN Section */}
      <div className="flex-1 px-3 py-4">
        <p className={`text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ${sidebarCollapsed ? 'lg:text-center' : 'lg:px-2'}`}>
          MAIN
        </p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center ${sidebarCollapsed ? 'lg:justify-center' : 'lg:px-3'} px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? "text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
                style={({ isActive }) => 
                  isActive ? { background: `linear-gradient(to right, #0f5841, #194f87)` } : {}
                }
                title={sidebarCollapsed ? item.label : ""}
              >
                <Icon className={`w-5 h-5 ${sidebarCollapsed ? 'lg:mr-0' : 'lg:mr-3'} mr-3 text-gray-500`} />
                <span className={sidebarCollapsed ? 'lg:hidden' : ''}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Card */}
      <div className="p-4 border-t border-gray-200">
        <div
          className={`flex items-center ${sidebarCollapsed ? 'lg:justify-center' : ''} p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer`}
          onClick={() => {
            window.location.href = "/manager/settings";
          }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
               style={{ background: `linear-gradient(to bottom right, #0f5841, #194f87)` }}>
            {userInitials}
          </div>

          <div className={`flex-1 min-w-0 ml-3 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-500 truncate capitalize">
              {userRole.replace(/_/g, ' ')}
            </p>
          </div>

          {!sidebarCollapsed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLogoutConfirm(true);
              }}
              className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition ml-2"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Logout button for collapsed state */}
        {sidebarCollapsed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowLogoutConfirm(true);
            }}
            className="hidden lg:flex w-full mt-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition justify-center"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;