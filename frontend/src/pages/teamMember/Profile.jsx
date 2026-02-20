// src/pages/teamMember/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, Phone, MapPin, Briefcase, Calendar,
  Edit, Save, Key, LogOut, User
} from 'lucide-react';
import { getCurrentUserProfile, updateCurrentUserProfile } from '../../services/usersService';

const TeamMemberProfile = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const userData = await getCurrentUserProfile();
        console.log('User data:', userData); // Debug log
        
        setProfile({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          location: userData.location || '',
          team: userData.team?.name || userData.team || 'Not assigned', // ✅ Extract name from team object
          role: userData.role || '',
          joinDate: userData.createdAt || new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchProfile();
  }, [user]);

  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');
      
      await updateCurrentUserProfile({
        name: profile.name,
        phone: profile.phone,
        location: profile.location,
      });
      
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 text-center">
        <p className="text-red-500 mb-4">{error || 'Failed to load profile'}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          
          {isEditing ? (
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditing(false)} 
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save
                  </>
                )}
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditing(true)} 
              className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] flex items-center gap-2"
            >
              <Edit className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Cover */}
          <div className="h-20 bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B]"></div>

          {/* Avatar & Basic Info */}
          <div className="px-6 pb-6">
            <div className="flex items-end -mt-10 mb-6">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                {profile.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="ml-4 flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="text-xl font-bold bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#4DA5AD]"
                    placeholder="Your name"
                  />
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                    <p className="text-[#4DA5AD] capitalize">{profile.role?.replace(/_/g, ' ')}</p>
                  </>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              {/* Email */}
              <InfoRow 
                icon={Mail} 
                label="Email" 
                value={profile.email} 
              />
              
              {/* Phone */}
              <InfoRow 
                icon={Phone} 
                label="Phone" 
                value={profile.phone} 
                isEditing={isEditing}
                onChange={(val) => handleInputChange('phone', val)}
                placeholder="Add phone number"
              />
              
              {/* Location */}
              <InfoRow 
                icon={MapPin} 
                label="Location" 
                value={profile.location} 
                isEditing={isEditing}
                onChange={(val) => handleInputChange('location', val)}
                placeholder="Add location"
              />
              
              {/* Team - Extract name from object */}
              <InfoRow 
                icon={Briefcase} 
                label="Team" 
                value={profile.team} // Now it's a string, not an object
              />
              
              {/* Join Date */}
              <InfoRow 
                icon={Calendar} 
                label="Member Since" 
                value={new Date(profile.joinDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long',
                  day: 'numeric'
                })} 
              />
            </div>

            {/* Password Change Link */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button 
                onClick={() => window.location.href = '/change-password'}
                className="text-sm text-[#4DA5AD] hover:underline flex items-center gap-1"
              >
                <Key className="w-4 h-4" /> Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div className="mt-6 text-center">
          <button 
            onClick={logout} 
            className="px-6 py-2 text-red-600 hover:bg-red-50 rounded-lg transition inline-flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple Info Row Component
const InfoRow = ({ icon: Icon, label, value, isEditing, onChange, placeholder }) => (
  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
    <Icon className="w-5 h-5 text-gray-500" />
    <div className="flex-1">
      <p className="text-xs text-gray-500">{label}</p>
      {isEditing ? (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-sm bg-transparent border-b border-gray-200 focus:border-[#4DA5AD] outline-none py-1"
          placeholder={placeholder}
        />
      ) : (
        <p className="text-sm font-medium text-gray-900">{value || '—'}</p>
      )}
    </div>
  </div>
);

export default TeamMemberProfile;