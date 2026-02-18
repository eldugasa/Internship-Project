// src/components/admin/AdminLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header - fixed at top */}
      <div className="flex-shrink-0">
        <AdminHeader />
      </div>
      
      {/* Main content area with sidebar and content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - fixed width, no scroll */}
        <div className="w-64 flex-shrink-0 h-full overflow-hidden">
          <AdminSidebar />
        </div>
        
        {/* Main content - scrollable */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;