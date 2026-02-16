// src/components/admin/AdminLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom'; // Add this import
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <Outlet /> {/* This renders the nested route content */}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
