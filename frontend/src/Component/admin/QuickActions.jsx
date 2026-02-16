// src/components/admin/QuickActions.jsx
import React from 'react';

const QuickActions = () => {
  const actions = [
    {
      icon: '📊',
      title: 'Generate Report',
      description: 'System analytics',
      color: 'from-blue-50 to-white',
      border: 'border-blue-100',
      hover: 'hover:border-blue-300'
    },
    {
      icon: '⚙️',
      title: 'System Settings',
      description: 'Configure system',
      color: 'from-purple-50 to-white',
      border: 'border-purple-100',
      hover: 'hover:border-purple-300'
    },
    {
      icon: '🔐',
      title: 'Access Logs',
      description: 'View activity logs',
      color: 'from-green-50 to-white',
      border: 'border-green-100',
      hover: 'hover:border-green-300'
    },
    {
      icon: '📋',
      title: 'Create Project',
      description: 'Start new project',
      color: 'from-orange-50 to-white',
      border: 'border-orange-100',
      hover: 'hover:border-orange-300'
    },
    {
      icon: '👥',
      title: 'Add Team',
      description: 'Create new team',
      color: 'from-pink-50 to-white',
      border: 'border-pink-100',
      hover: 'hover:border-pink-300'
    },
    {
      icon: '📧',
      title: 'Send Announcement',
      description: 'Broadcast message',
      color: 'from-indigo-50 to-white',
      border: 'border-indigo-100',
      hover: 'hover:border-indigo-300'
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-[#4DA5AD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            className={`bg-gradient-to-br ${action.color} border ${action.border} rounded-xl p-4 text-left transition-all duration-200 ${action.hover} hover:shadow-md`}
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{action.icon}</div>
              <div>
                <div className="font-medium text-gray-900">{action.title}</div>
                <div className="text-sm text-gray-500 mt-1">{action.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions; // This is the default export