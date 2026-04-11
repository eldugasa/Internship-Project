// src/pages/manager/SettingsPage.jsx
import React, { useState, useEffect, Suspense } from 'react';
import { useLoaderData, useSubmit, useActionData, Await } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Save, Edit, User, Mail, Shield, Bell, BellOff, 
  RotateCcw, Check, X, Eye, EyeOff, Loader2
} from 'lucide-react';
import { 
  settingsLoader,
  userProfileQuery,
  notificationPrefsQuery
} from '../../loader/manager/Settings.loader';

// Re-export the loader for the route
export { settingsLoader as loader };

// Loading skeleton component - shows IMMEDIATELY
const SettingsSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between mb-6">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Error component
const SettingsError = ({ error, onRetry }) => {
  const errorMessage = error?.message || error || 'Unable to load settings';
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Settings</h3>
        <p className="text-red-600 mb-6">{errorMessage}</p>
        <button onClick={onRetry} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
          Retry
        </button>
      </div>
    </div>
  );
};

// Actual Settings Content - rendered after data loads
const SettingsContent = ({ profile: initialProfile, notifications: initialNotifications }) => {
  const submit = useSubmit();
  const actionData = useActionData();
  const queryClient = useQueryClient();
  
  // Local UI state
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [tempConfirmPassword, setTempConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localMessage, setLocalMessage] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  
  // React Query for real-time updates with initial data from loader
  const { data: profile, refetch: refetchProfile } = useQuery({
    ...userProfileQuery(),
    initialData: initialProfile,
  });
  
  const { data: notifications, refetch: refetchNotifications } = useQuery({
    ...notificationPrefsQuery(),
    initialData: initialNotifications,
  });
  
  // Handle action responses
  useEffect(() => {
    const handleActionResponse = async () => {
      if (!actionData) return;
      
      try {
        let data;
        if (actionData instanceof Response) {
          data = await actionData.json();
        } else {
          data = actionData;
        }
        
        if (data.success) {
          setLocalMessage(data.message);
          setLocalError(null);
          
          await refetchProfile();
          await refetchNotifications();
          
          if (pendingAction === 'update-profile') {
            setIsEditingName(false);
          }
          if (pendingAction === 'update-password') {
            setIsEditingPassword(false);
            setTempPassword('');
            setTempConfirmPassword('');
          }
          
          setTimeout(() => setLocalMessage(null), 3000);
        } else if (data.error) {
          setLocalError(data.error);
          setLocalMessage(null);
          setTimeout(() => setLocalError(null), 3000);
        }
      } catch (error) {
        console.error('Error parsing action response:', error);
        setLocalError('An unexpected error occurred');
        setTimeout(() => setLocalError(null), 3000);
      } finally {
        setPendingAction(null);
      }
    };
    
    handleActionResponse();
  }, [actionData, refetchProfile, refetchNotifications, pendingAction]);
  
  const handleSaveProfile = () => {
    const formData = new FormData();
    formData.append('intent', 'update-profile');
    formData.append('name', profile.name);
    formData.append('phone', profile.phone || '');
    formData.append('location', profile.location || '');
    setPendingAction('update-profile');
    submit(formData, { method: 'post' });
  };
  
  const handleUpdateName = () => {
    const formData = new FormData();
    formData.append('intent', 'update-profile');
    formData.append('name', tempName);
    formData.append('phone', profile.phone || '');
    formData.append('location', profile.location || '');
    setPendingAction('update-profile');
    submit(formData, { method: 'post' });
  };
  
  const handleUpdatePassword = () => {
    const formData = new FormData();
    formData.append('intent', 'update-password');
    formData.append('newPassword', tempPassword);
    formData.append('confirmPassword', tempConfirmPassword);
    setPendingAction('update-password');
    submit(formData, { method: 'post' });
  };
  
  const handleToggleNotification = (key, currentValue) => {
    const formData = new FormData();
    formData.append('intent', 'toggle-notification');
    formData.append('key', key);
    formData.append('currentValue', currentValue);
    setPendingAction('toggle-notification');
    submit(formData, { method: 'post' });
  };
  
  const handleResetNotifications = () => {
    const formData = new FormData();
    formData.append('intent', 'reset-notifications');
    setPendingAction('reset-notifications');
    submit(formData, { method: 'post' });
  };
  
  const isLoading = pendingAction !== null;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your profile and notification preferences</p>
        </div>
        
        {/* Success/Error Messages */}
        {localMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5" />
            {localMessage}
          </div>
        )}
        {localError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <X className="w-5 h-5" />
            {localError}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Profile */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#0f5841]" />
                  <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white rounded-lg flex items-center gap-2 text-sm transition disabled:opacity-50"
                >
                  {pendingAction === 'update-profile' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save All
                </button>
              </div>
              
              {/* Name Field */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <>
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
                        placeholder="Enter your name"
                      />
                      <button
                        onClick={handleUpdateName}
                        disabled={isLoading}
                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setIsEditingName(false)}
                        className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        {profile.name}
                      </div>
                      <button
                        onClick={() => {
                          setTempName(profile.name);
                          setIsEditingName(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition text-[#194f87]"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Email Field */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    {profile.email}
                  </div>
                  <div className="p-2 text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              
              {/* Password Field */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                {isEditingPassword ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">New Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={tempPassword}
                          onChange={(e) => setTempPassword(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent pr-10"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={tempConfirmPassword}
                          onChange={(e) => setTempConfirmPassword(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent pr-10"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdatePassword}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 text-sm disabled:opacity-50"
                      >
                        {pendingAction === 'update-password' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Update Password'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingPassword(false);
                          setTempPassword('');
                          setTempConfirmPassword('');
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                      ••••••••
                    </div>
                    <button
                      onClick={() => setIsEditingPassword(true)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition text-[#194f87]"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Phone & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="text"
                    value={profile.phone || ''}
                    onChange={(e) => {
                      profile.phone = e.target.value;
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
                    placeholder="Add phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={profile.location || ''}
                    onChange={(e) => {
                      profile.location = e.target.value;
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
                    placeholder="Add location"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column: Notifications & Account Info */}
          <div className="space-y-6">
            {/* Notifications Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#0f5841]" />
                  <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                </div>
                <button
                  onClick={handleResetNotifications}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>
              
              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => {
                  if (key === 'emailNotifications' || key === 'inAppNotifications') return null;
                  
                  return (
                    <div key={key} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          {value ? (
                            <Bell className="w-4 h-4 text-[#0f5841]" />
                          ) : (
                            <BellOff className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleNotification(key, value)}
                        disabled={isLoading}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          isLoading ? 'opacity-50 cursor-not-allowed' : ''
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
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Global Settings</h3>
                <div className="space-y-3">
                  {notifications.emailNotifications !== undefined && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Email Notifications</span>
                      <button
                        onClick={() => handleToggleNotification('emailNotifications', notifications.emailNotifications)}
                        disabled={isLoading}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          isLoading ? 'opacity-50 cursor-not-allowed' : ''
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
                </div>
              </div>
            </div>
            
            {/* Account Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-[#0f5841]" />
                <h2 className="text-lg font-semibold text-gray-900">Account Info</h2>
              </div>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Account Type</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {profile.role?.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Team</p>
                  <p className="font-medium text-gray-900">{profile.team}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Member Since</p>
                  <p className="font-medium text-gray-900">
                    {new Date(profile.joinDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Settings Page - Shows skeleton immediately while data streams
const SettingsPage = () => {
  const data = useLoaderData();
  
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <Await
        resolve={Promise.all([data.profile, data.notifications])}
        errorElement={<SettingsError error="Failed to load settings" onRetry={() => window.location.reload()} />}
      >
        {([profile, notifications]) => (
          <SettingsContent profile={profile} notifications={notifications} />
        )}
      </Await>
    </Suspense>
  );
};

export default SettingsPage;