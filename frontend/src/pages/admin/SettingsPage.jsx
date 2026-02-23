import React, { useState, useEffect } from "react";
import { apiClient } from "../../services/apiClient";
import { User, Lock, X, Save, LogOut, Bell, BellOff, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileUpdating, setProfileUpdating] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  // Notification preferences from backend
  const [notifications, setNotifications] = useState({});

  // Fetch user and notification preferences
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile
        const data = await apiClient('/users/me');
        setUser(data);
        setName(data.name);
        setEmail(data.email);
        
        // Fetch notification preferences from backend
        try {
          const prefs = await apiClient('/notification-prefs');
          setNotifications(prefs);
        } catch (prefErr) {
          console.error('Error fetching notification prefs:', prefErr);
          // Set defaults if API fails
          setNotifications({
            userRegistered: true,
            projectCreated: true,
            projectCompleted: true,
            systemAlerts: true,
            roleChanged: true,
            emailNotifications: true,
            inAppNotifications: true
          });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        alert('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Update Profile
  const handleUpdateProfile = async () => {
    if (!name.trim() || !email.trim()) {
      alert('Name and email are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      setProfileUpdating(true);
      const updatedUser = await apiClient('/users/me/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, email }),
      });

      if (email !== user.email) {
        alert('Email updated! Please login again with your new email.');
        logout();
      } else {
        setUser(updatedUser);
        setShowEditProfile(false);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.message || 'Failed to update profile');
    } finally {
      setProfileUpdating(false);
    }
  };

  // Change Password
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      setPasswordUpdating(true);
      await apiClient('/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({ 
          currentPassword, 
          newPassword 
        }),
      });

      alert('Password changed successfully! Please login again.');
      logout();
    } catch (error) {
      console.error('Error changing password:', error);
      alert(error.message || 'Failed to change password');
    } finally {
      setPasswordUpdating(false);
    }
  };

  // Toggle notification with backend save
  const toggleNotification = async (key) => {
    try {
      setPrefsSaving(true);
      const updated = { ...notifications, [key]: !notifications[key] };
      setNotifications(updated);
      
      // Save to backend
      await apiClient('/notification-prefs', {
        method: 'PUT',
        body: JSON.stringify(updated)
      });
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      alert('Failed to save notification preferences');
      // Revert on error
      setNotifications(notifications);
    } finally {
      setPrefsSaving(false);
    }
  };

  // Reset to default preferences
  const resetToDefault = async () => {
    try {
      setPrefsSaving(true);
      const response = await apiClient('/notification-prefs/reset', {
        method: 'POST'
      });
      setNotifications(response.prefs);
      alert('Notification preferences reset to default');
    } catch (error) {
      console.error('Error resetting preferences:', error);
      alert('Failed to reset preferences');
    } finally {
      setPrefsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      {/* Profile Summary Card */}
      {user && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900">{user.name}</p>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500 mt-1 capitalize">Role: {user.role?.replace(/[_-]/g, ' ')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setShowEditProfile(true)}
          className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition flex items-center space-x-4"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <User className="w-6 h-6 text-blue-500" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Edit Profile</h3>
            <p className="text-sm text-gray-500">Update your name and email</p>
          </div>
        </button>

        <button
          onClick={() => setShowChangePassword(true)}
          className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition flex items-center space-x-4"
        >
          <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
            <Lock className="w-6 h-6 text-green-500" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Change Password</h3>
            <p className="text-sm text-gray-500">Update your password</p>
          </div>
        </button>
      </div>

      {/* Notification Preferences Section - Now using API */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5" style={{ color: '#0f5841' }} />
            Notification Preferences
          </h2>
          <button
            onClick={resetToDefault}
            disabled={prefsSaving}
            className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </button>
        </div>

        {prefsSaving && (
          <div className="text-center py-2 text-sm text-gray-500">
            Saving preferences...
          </div>
        )}

        <div className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => {
            // Skip internal preferences if you want
            if (key === 'emailNotifications' || key === 'inAppNotifications') return null;
            
            return (
              <div key={key} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  {value ? (
                    <Bell className="w-4 h-4" style={{ color: '#0f5841' }} />
                  ) : (
                    <BellOff className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <button
                  onClick={() => toggleNotification(key)}
                  disabled={prefsSaving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:ring-offset-2 ${
                    prefsSaving ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{ backgroundColor: value ? '#0f5841' : '#d1d5db' }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Global notification settings */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Global Settings</h3>
          <div className="space-y-3">
            {notifications.emailNotifications !== undefined && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Email Notifications</span>
                <button
                  onClick={() => toggleNotification('emailNotifications')}
                  disabled={prefsSaving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    prefsSaving ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{ backgroundColor: notifications.emailNotifications ? '#0f5841' : '#d1d5db' }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )}
            {notifications.inAppNotifications !== undefined && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">In-App Notifications</span>
                <button
                  onClick={() => toggleNotification('inAppNotifications')}
                  disabled={prefsSaving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    prefsSaving ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{ backgroundColor: notifications.inAppNotifications ? '#0f5841' : '#d1d5db' }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.inAppNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Note */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Security Note:</strong> If you change your email or password, you'll need to login again.
        </p>
      </div>

      {/* Edit Profile Modal (keep existing) */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          {/* ... existing modal content ... */}
        </div>
      )}

      {/* Change Password Modal (keep existing) */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          {/* ... existing modal content ... */}
        </div>
      )}
    </div>
  );
};

export default SettingsPage;