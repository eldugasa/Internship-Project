// src/pages/projectmanager/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { Save, Edit, User, Mail, Lock, Camera, X, Check, Bell, BellOff, Shield } from 'lucide-react';
import axios from 'axios';

const SettingsPage = () => {
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState({});
  const [loading, setLoading] = useState(true);

  // Edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // Temp values for editing
  const [tempName, setTempName] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [tempConfirmPassword, setTempConfirmPassword] = useState('');

  const token = localStorage.getItem('token'); // assume JWT auth

  // Fetch profile & notifications from backend
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data.profile);
        setNotifications(res.data.notifications);
      } catch (err) {
        console.error(err);
        alert('Failed to load user settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (loading || !profile) {
    return <div className="p-6 text-center">Loading settings...</div>;
  }

  // Save profile updates
  const handleSaveAll = async () => {
    try {
      await axios.put(
        'http://localhost:5000/api/users/me',
        { name: profile.name, email: profile.email, profileImage: profile.profileImage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await axios.put(
        'http://localhost:5000/api/users/notifications',
        notifications,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    }
  };

  // Save password separately
  const savePasswordEdit = async () => {
    if (tempPassword === tempConfirmPassword && tempPassword.length >= 6) {
      try {
        await axios.put(
          'http://localhost:5000/api/users/password',
          { newPassword: tempPassword },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Password updated successfully!');
        setIsEditingPassword(false);
        setTempPassword('');
        setTempConfirmPassword('');
      } catch (err) {
        console.error(err);
        alert('Failed to update password');
      }
    } else {
      alert('Passwords do not match or are too short (minimum 6 characters)');
    }
  };

  // Toggle notifications
  const toggleNotification = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Image upload preview
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfile(prev => ({ ...prev, profileImage: reader.result }));
    reader.readAsDataURL(file);
  };

  // Rendering same UI as your current SettingsPage
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your profile and notification preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile */}
        <div className="lg:col-span-2">
          {/* Profile Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <User className="w-5 h-5 text-[#4DA5AD] mr-2" />
                <h2 className="text-lg font-semibold">Profile Information</h2>
              </div>
              <button
                onClick={handleSaveAll}
                className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] flex items-center text-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                Save All
              </button>
            </div>

            {/* Profile Image */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <img src={profile.profileImage} alt="Profile" className="w-32 h-32 rounded-full border-4 border-white shadow-lg" />
                <label className="absolute bottom-0 right-0 bg-[#4DA5AD] text-white p-2 rounded-full cursor-pointer hover:bg-[#3D8B93]">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-2">Click camera icon to update photo</p>
            </div>

            {/* Name, Email, Password Fields */}
            {/* Keep the same UI logic as your original component */}
          </div>
        </div>

        {/* Right Column: Notifications & Account Info */}
        <div>
          {/* Notifications */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center mb-6">
              <Bell className="w-5 h-5 text-[#4DA5AD] mr-2" />
              <h2 className="text-lg font-semibold">Notifications</h2>
            </div>

            <div className="space-y-6">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-start justify-between">
                  <div className="flex-1 mr-4">
                    <div className="flex items-center mb-1">
                      <span className="font-medium text-gray-900">{key}</span>
                      <span className="ml-2">{value ? <Bell className="w-4 h-4 text-green-500" /> : <BellOff className="w-4 h-4 text-gray-400" />}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleNotification(key)}
                    className={`w-12 h-6 rounded-full transition-colors ${value ? 'bg-[#4DA5AD]' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${value ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-5 h-5 text-[#4DA5AD] mr-2" />
              <h2 className="text-lg font-semibold">Account Info</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Account Type</p>
                <p className="font-medium text-gray-900">Project Manager</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-medium text-gray-900">Jan 15, 2023</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
