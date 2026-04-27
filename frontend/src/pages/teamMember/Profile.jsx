// src/pages/teamMember/Profile.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, Phone, MapPin, Briefcase, Calendar,
  Edit, Save, Key, LogOut, Loader2, AlertCircle
} from 'lucide-react';
import { getCurrentUserProfile, updateCurrentUserProfile } from '../../services/usersService';

// ============================================
// 1. QUERY DEFINITIONS
// ============================================

const userProfileQuery = () => ({
  queryKey: ['team-member', 'profile'],
  queryFn: async ({ signal }) => {
    const userData = await getCurrentUserProfile({ signal });
    return {
      name: userData.name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      location: userData.location || '',
      team: userData.team?.name || userData.team || 'Not assigned',
      role: userData.role || '',
      joinDate: userData.createdAt || new Date().toISOString(),
    };
  },
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
});

// ============================================
// 2. HELPER COMPONENTS
// ============================================

const InfoRow = ({ icon: Icon, label, value, isEditing, onChange, placeholder, loading }) => (
  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
    <Icon className="w-5 h-5 text-gray-500" />
    <div className="flex-1">
      <p className="text-xs text-gray-500">{label}</p>
      {loading ? (
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
      ) : isEditing ? (
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

// ============================================
// 3. SKELETON COMPONENT
// ============================================

const ProfileSkeleton = () => (
  <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B]"></div>
        
        <div className="px-6 pb-6">
          <div className="flex items-end -mt-10 mb-6">
            <div className="w-20 h-20 rounded-xl bg-gray-200 animate-pulse border-4 border-white"></div>
            <div className="ml-4 flex-1">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// 4. ERROR COMPONENT
// ============================================

const ProfileError = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <p className="text-gray-600 mb-4">{error?.message || 'Failed to load profile'}</p>
      <button 
        onClick={onRetry}
        className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93]"
      >
        Retry
      </button>
    </div>
  </div>
);

// ============================================
// 5. MAIN COMPONENT
// ============================================

const TeamMemberProfile = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedLocation, setEditedLocation] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');
  const [localError, setLocalError] = useState('');

  // Fetch profile using React Query
  const { 
    data: profile, 
    isLoading,
    error,
    refetch: refetchProfile
  } = useQuery({
    ...userProfileQuery(),
    retry: 1,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData) => {
      return await updateCurrentUserProfile({
        name: updatedData.name,
        phone: updatedData.phone,
        location: updatedData.location,
      });
    },
    onMutate: async (updatedData) => {
      await queryClient.cancelQueries({ queryKey: ['team-member', 'profile'] });
      
      const previousProfile = queryClient.getQueryData(['team-member', 'profile']);
      
      queryClient.setQueryData(['team-member', 'profile'], (old) => ({
        ...old,
        ...updatedData,
      }));
      
      return { previousProfile };
    },
    onSuccess: () => {
      setLocalSuccess('Profile updated successfully');
      setIsEditing(false);
      setEditedName('');
      setEditedPhone('');
      setEditedLocation('');
      setTimeout(() => setLocalSuccess(''), 3000);
    },
    onError: (err, variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(['team-member', 'profile'], context.previousProfile);
      }
      setLocalError(err.message || 'Failed to save profile');
      setTimeout(() => setLocalError(''), 3000);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['team-member', 'profile'] });
    },
  });

  const handleEdit = () => {
    if (profile) {
      setEditedName(profile.name || '');
      setEditedPhone(profile.phone || '');
      setEditedLocation(profile.location || '');
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName('');
    setEditedPhone('');
    setEditedLocation('');
    setLocalError('');
  };

  const handleSave = () => {
    updateProfileMutation.mutate({
      name: editedName,
      phone: editedPhone,
      location: editedLocation,
    });
  };

  const handleChangePassword = () => {
    navigate('/change-password');
  };

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to logout?')) {
      return;
    }

    logout();
    navigate('/login');
  };

  // Show skeleton while loading
  if (isLoading && !profile) {
    return <ProfileSkeleton />;
  }

  // Show error state
  if (error && !profile) {
    return <ProfileError error={error} onRetry={() => refetchProfile()} />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 text-center">
        <p className="text-red-500 mb-4">Failed to load profile</p>
        <button 
          onClick={() => refetchProfile()} 
          className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  const isSaving = updateProfileMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          
          {isEditing ? (
            <div className="flex gap-2">
              <button 
                onClick={handleCancel} 
                disabled={isSaving}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
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
                    <Loader2 className="w-4 h-4 animate-spin" />
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
              onClick={handleEdit} 
              className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] flex items-center gap-2"
            >
              <Edit className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>

        {/* Messages */}
        {localSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {localSuccess}
          </div>
        )}
        {localError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {localError}
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
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-xl font-bold bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#4DA5AD]"
                    placeholder="Your name"
                  />
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                    <p className="text-[#4DA5AD] capitalize">{profile.role?.replace(/_/g, ' ') || 'Team Member'}</p>
                  </>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              {/* Email - Not editable */}
              <InfoRow 
                icon={Mail} 
                label="Email" 
                value={profile.email} 
                loading={isLoading}
              />
              
              {/* Phone - Editable */}
              <InfoRow 
                icon={Phone} 
                label="Phone" 
                value={isEditing ? editedPhone : profile.phone} 
                isEditing={isEditing}
                onChange={setEditedPhone}
                placeholder="Add phone number"
                loading={isLoading}
              />
              
              {/* Location - Editable */}
              <InfoRow 
                icon={MapPin} 
                label="Location" 
                value={isEditing ? editedLocation : profile.location} 
                isEditing={isEditing}
                onChange={setEditedLocation}
                placeholder="Add location"
                loading={isLoading}
              />
              
              {/* Team - Not editable */}
              <InfoRow 
                icon={Briefcase} 
                label="Team" 
                value={profile.team}
                loading={isLoading}
              />
              
              {/* Join Date - Not editable */}
              <InfoRow 
                icon={Calendar} 
                label="Member Since" 
                value={new Date(profile.joinDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long',
                  day: 'numeric'
                })} 
                loading={isLoading}
              />
            </div>

            {/* Password Change Link */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button 
                onClick={handleChangePassword}
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
            onClick={handleLogout} 
            className="px-6 py-2 text-red-600 hover:bg-red-50 rounded-lg transition inline-flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberProfile;
