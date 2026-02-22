// src/components/admin/AdminHeader.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, LogOut, User } from 'lucide-react';
import NotificationBell from './NotificationBell';

const AdminHeader = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Admin User');
  
  // Get user from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || 'Admin User');
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Get user initials
  const getUserInitials = () => {
    return userName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        {/* Empty div for spacing */}
        <div></div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Notification Bell Component */}
          <NotificationBell />

          {/* Help Button */}
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{userName}</div>
              <div className="text-xs text-gray-500">Administrator</div>
            </div>
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:shadow-md transition"
              style={{ background: `linear-gradient(to bottom right, #0f5841, #194f87)` }}
              onClick={() => navigate('/admin/settings')}
            >
              {getUserInitials()}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;