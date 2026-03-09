// src/pages/settings/SettingsPage.jsx (Change Password Section)

import React, { useState, useEffect } from "react";
import { apiClient } from "../../services/apiClient";
import { User, Lock, X, Save, LogOut, Bell, BellOff, RotateCcw, Eye, EyeOff } from 'lucide-react';
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

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Validate password
  const validatePassword = () => {
    const errors = {};
    
    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Change Password - FIXED VERSION
  const handleChangePassword = async () => {
    if (!validatePassword()) {
      return;
    }

    try {
      setPasswordUpdating(true);
      
      // Try different possible endpoint formats
      const payload = { 
        currentPassword, 
        newPassword 
      };
      
      console.log('Sending password change request:', payload);
      
      // Option 1: Try the endpoint you're currently using
      try {
        await apiClient('/users/me/password', {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } catch (err) {
        // Option 2: Try without /me
        if (err.message?.includes('404')) {
          await apiClient('/change-password', {
            method: 'POST',
            body: JSON.stringify(payload)
          });
        } else {
          throw err;
        }
      }

      alert('Password changed successfully! Please login again.');
      
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePassword(false);
      
      // Logout after successful password change
      setTimeout(() => {
        logout();
      }, 2000);
      
    } catch (error) {
      console.error('Error changing password:', error);
      
      // Handle specific error messages
      if (error.message?.includes('current password') || error.message?.includes('incorrect')) {
        setPasswordErrors({ currentPassword: 'Current password is incorrect' });
      } else if (error.message?.includes('same as old')) {
        setPasswordErrors({ newPassword: 'New password must be different from current password' });
      } else {
        alert(error.message || 'Failed to change password');
      }
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

      {/* Notification Preferences Section */}
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

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
              <button onClick={() => setShowEditProfile(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditProfile(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={profileUpdating}
                className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] flex items-center gap-2 disabled:opacity-50"
              >
                {profileUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal - FIXED VERSION */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
              <button onClick={() => setShowChangePassword(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent pr-10 ${
                      passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                )}
              </div>
              
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent pr-10 ${
                      passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                )}
              </div>
              
              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent pr-10 ${
                      passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Requirements:</strong> At least 6 characters
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setPasswordErrors({});
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={passwordUpdating}
                className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] flex items-center gap-2 disabled:opacity-50"
              >
                {passwordUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Change Password
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;