// src/components/admin/StatsCards.jsx
import React from 'react';
import { UsersIcon, Users, FolderKanban, ShieldCheck } from 'lucide-react';

const StatsCards = ({ stats }) => {
  const icons = {
    'Total Users': <UsersIcon className="w-8 h-8 text-[#4DA5AD]" />,
    'Active Teams': <Users className="w-8 h-8 text-[#4DA5AD]" />,
    'Total Projects': <FolderKanban className="w-8 h-8 text-[#4DA5AD]" />,
    'Active Users': <ShieldCheck className="w-8 h-8 text-[#4DA5AD]" />
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              <p className="text-sm text-green-600 font-medium mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                {stat.change} from last month
              </p>
            </div>
            <div className="p-3 bg-white rounded-xl shadow-sm">
              {icons[stat.label] || <UsersIcon className="w-8 h-8 text-[#4DA5AD]" />}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;