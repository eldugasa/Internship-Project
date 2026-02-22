// src/components/admin/AdminLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import NotificationBell from './NotificationBell';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Get user from localStorage
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

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Mobile Header with Menu Button */}
      {isMobile && (
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              style={{ background: `linear-gradient(to right, #0f5841, #194f87)` }}
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                   style={{ background: `linear-gradient(to bottom right, #0f5841, #194f87)` }}>
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-bold text-gray-900">Admin Panel</span>
            </div>
          </div>
          
          {/* Desktop Profile on Mobile */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer"
              style={{ background: `linear-gradient(to bottom right, #0f5841, #194f87)` }}
              onClick={() => navigate('/admin/settings')}
            >
              {userInitials}
            </div>
          </div>
        </div>
      )}
      
      {/* Main content area with sidebar and content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div
          className={`
            ${isMobile ? 'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out' : 'relative'}
            ${isMobile && !isMobileMenuOpen ? '-translate-x-full' : 'translate-x-0'}
          `}
        >
          <AdminSidebar 
            collapsed={sidebarCollapsed} 
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            onClose={closeMobileMenu}
            isMobile={isMobile}
          />
        </div>

        {/* Mobile Overlay */}
        {isMobile && isMobileMenuOpen && (
          <div
            onClick={closeMobileMenu}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            aria-hidden="true"
          />
        )}
        
        {/* Main content */}
        <main className={`
          flex-1 overflow-y-auto 
          transition-all duration-300
          ${isMobile ? 'p-4' : 'p-6'}
        `}>
          <div className="max-w-7xl mx-auto">
            {/* Desktop Header */}
            {!isMobile && (
              <div className="mb-6 flex justify-between items-center">
                <div></div>
                <div className="flex items-center gap-4">
                  <NotificationBell />
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{userName}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {userRole.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:shadow-md transition"
                      style={{ background: `linear-gradient(to bottom right, #0f5841, #194f87)` }}
                      onClick={() => navigate('/admin/settings')}
                    >
                      {userInitials}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;