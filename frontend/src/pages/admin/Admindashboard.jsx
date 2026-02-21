// src/pages/admin/AdminDashboard.jsx
import React, { useState } from 'react';
import AdminLayout from '../../Component/admin/AdminLayout';
import DashboardOverview from './DashboardOverview';
import UsersManagement from './UsersManagement';
import TeamsManagement from './TeamsManagement';
import ProjectsManagement from './ProjectsManagement';
import SettingsPage from './SettingsPage';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'teams', label: 'Teams', icon: '👨‍👩‍👧‍👦' },
    { id: 'projects', label: 'Projects', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

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
        return <SettingsPage />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {/* Mobile Tab Navigation */}
      <div className="lg:hidden mb-4">
        <div className="flex overflow-x-auto pb-2 hide-scrollbar">
          <div className="flex space-x-2 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
                style={activeTab === tab.id ? { background: `linear-gradient(to right, #0f5841, #194f87)` } : {}}
              >
                <span className="mr-2">{tab.icon}</span>
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-2 sm:px-4 lg:px-6">
        {renderContent()}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;