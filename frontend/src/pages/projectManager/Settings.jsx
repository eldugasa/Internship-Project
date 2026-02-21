// src/pages/projectmanager/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Save, Edit, User, Mail, Lock, Camera, X, Check, 
  Bell, BellOff, Shield, Key, Eye, EyeOff 
} from 'lucide-react';
import { getCurrentUserProfile, updateCurrentUserProfile, updateCurrentUserPassword } from '../../services/usersService';

const SettingsPage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // Temp values for editing
  const [tempName, setTempName] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [tempConfirmPassword, setTempConfirmPassword] = useState('');

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Notification preferences (stored in localStorage)
  const [notifications, setNotifications] = useState({
    taskUpdates: true,
    deadlineReminders: true,
    projectUpdates: true,
    teamMentions: false
  });

  // Fetch profile from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const userData = await getCurrentUserProfile();
        setProfile({
          id: userData.id,
          name: userData.name || '',
          email: userData.email || '',
          role: userData.role || 'project-manager',
          phone: userData.phone || '',
          location: userData.location || '',
          team: userData.team?.name || 'Engineering Team',
          joinDate: userData.createdAt || new Date().toISOString(),
          profileImage: userData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=0f5841&color=fff&size=128`
        });
        
        // Load notification preferences from localStorage
        const savedNotifications = localStorage.getItem('notificationPrefs');
        if (savedNotifications) {
          setNotifications(JSON.parse(savedNotifications));
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Save all changes
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setError('');
      
      await updateCurrentUserProfile({
        name: profile.name,
        phone: profile.phone,
        location: profile.location,
      });

      // Save notification preferences to localStorage
      localStorage.setItem('notificationPrefs', JSON.stringify(notifications));
      
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Save password
  const savePasswordEdit = async () => {
    if (tempPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (tempPassword !== tempConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      await updateCurrentUserPassword({
        currentPassword: tempPassword, // Note: You need to add current password field
        newPassword: tempPassword
      });

      setSuccess('Password updated successfully!');
      setIsEditingPassword(false);
      setTempPassword('');
      setTempConfirmPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating password:', err);
      setError(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  // Toggle notifications
  const toggleNotification = (key) => {
    setNotifications(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('notificationPrefs', JSON.stringify(updated));
      return updated;
    });
  };

  // Image upload handler
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // In a real app, you would upload to server and get URL back
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile(prev => ({ ...prev, profileImage: reader.result }));
      // You would also upload to server here
    };
    reader.readAsDataURL(file);
  };

  if (loading || !profile) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f5841]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your profile and notification preferences</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <X className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" style={{ color: '#0f5841' }} />
                <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
              </div>
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-white flex items-center gap-2 text-sm transition disabled:opacity-50"
                style={{ background: `linear-gradient(to right, #0f5841, #194f87)` }}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save All
                  </>
                )}
              </button>
            </div>

            {/* Profile Image */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <img 
                  src={profile.profileImage} 
                  alt="Profile" 
                  className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover"
                />
                {/* <label 
                  className="absolute bottom-0 right-0 p-2 rounded-full text-white cursor-pointer transition shadow-lg"
                  style={{ background: `linear-gradient(to bottom right, #0f5841, #194f87)` }}
                >
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label> */}
              </div>
              {/* <p className="text-xs text-gray-500 mt-2">Click camera to update photo</p> */}
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
                      onClick={() => {
                        setProfile({ ...profile, name: tempName });
                        setIsEditingName(false);
                      }}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
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
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                      style={{ color: '#194f87' }}
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
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={savePasswordEdit}
                      disabled={saving}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 text-sm"
                    >
                      {saving ? 'Updating...' : 'Update Password'}
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
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                    style={{ color: '#194f87' }}
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
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
                  placeholder="Add phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={profile.location || ''}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
                  placeholder="Add location"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Notifications & Account Info */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="w-5 h-5" style={{ color: '#0f5841' }} />
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            </div>

            <div className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                  <div className="flex-1 mr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      {value ? (
                        <Bell className="w-4 h-4" style={{ color: '#0f5841' }} />
                      ) : (
                        <BellOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleNotification(key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:ring-offset-2`}
                    style={{ backgroundColor: value ? '#0f5841' : '#d1d5db' }}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5" style={{ color: '#0f5841' }} />
              <h2 className="text-lg font-semibold text-gray-900">Account Info</h2>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Account Type</p>
                <p className="font-medium text-gray-900 capitalize">
                  {profile.role.replace(/_/g, ' ')}
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
  );
};

export default SettingsPage;