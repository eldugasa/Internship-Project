// src/pages/teamMember/Profile.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Mail, Phone, Calendar, MapPin,
  Briefcase, Award, Edit, Save,
  Camera, Lock, Bell, Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TeamMemberProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState({
    taskUpdates: true,
    deadlineReminders: true,
    weeklyReports: true,
  });

  // Fetch profile from backend
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users/${user.id}`);
        const data = res.data;

        setProfile({
          name: data.name || '',
          role: data.role || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || 'Addis Ababa, Ethiopia',
          team: data.team || 'Engineering Team',
          joinDate: data.joinDate || '2023-01-01',
          bio: data.bio || 'Tell us about yourself...',
          skills: data.skills || [],
          certifications: data.certifications || [],
          languages: data.languages || [],
        });

        setNotifications({
          taskUpdates: data.notifications?.taskUpdates ?? true,
          deadlineReminders: data.notifications?.deadlineReminders ?? true,
          weeklyReports: data.notifications?.weeklyReports ?? true,
        });
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        alert('Error loading profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:5000/api/users/${user.id}`, {
        ...profile,
        notifications,
      });
      alert('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save profile');
    }
  };

  const toggleNotification = (field) => {
    setNotifications(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (isLoading || !profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your profile and settings</p>
        </div>

        {isEditing ? (
          <div className="flex space-x-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] flex items-center"
            >
              <Save className="w-4 h-4 mr-2" /> Save
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] flex items-center"
          >
            <Edit className="w-4 h-4 mr-2" /> Edit Profile
          </button>
        )}
      </div>

      {/* Basic Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-6 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] rounded-full flex items-center justify-center text-white text-xl font-bold">
            {profile.name?.split(' ').map(n => n[0]).join('')}
          </div>

          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  value={profile.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                <p className="text-lg text-[#4DA5AD] font-medium">{profile.role}</p>
              </>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['email', 'phone', 'location', 'team', 'joinDate'].map(field => (
            <div key={field} className="flex items-center gap-3">
              {isEditing ? (
                <input
                  type="text"
                  value={profile[field]}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <span className="text-gray-700">{profile[field]}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">About</h3>
        {isEditing ? (
          <textarea
            value={profile.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        ) : (
          <p className="text-gray-600">{profile.bio}</p>
        )}
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2" /> Notifications
        </h3>

        <div className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-gray-700 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <button
                onClick={() => toggleNotification(key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  value ? 'bg-[#4DA5AD]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamMemberProfile;
