// src/pages/admin/AdminDashboard.jsx
import React, { useState } from 'react';
import AdminLayout from '../../Component/admin/AdminLayout';
import DashboardOverview from './DashboardOverview';
import UsersManagement from './UsersManagement';
import TeamsManagement from './TeamsManagement';
import ProjectsManagement from './ProjectsManagement';
import SettingsPage from './SettingsPage'; // ← Add this import

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'users':
        return <UsersManagement />;
      case 'teams':
        return <TeamsManagement />;
      case 'projects':
        return <ProjectsManagement />;
      case 'settings':
        return <SettingsPage />; // ← Add this case
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminDashboard;