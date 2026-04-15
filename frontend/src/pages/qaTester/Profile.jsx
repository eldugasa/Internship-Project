import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, Phone, MapPin, Briefcase, Calendar, Star,
  Edit, Save, Key, LogOut, Loader2, AlertCircle
} from 'lucide-react';
import { getCurrentUserProfile, updateCurrentUserProfile } from '../../services/usersService';

const userProfileQuery = () => ({
  queryKey: ['qa-tester', 'profile'],
  queryFn: async ({ signal }) => {
    const userData = await getCurrentUserProfile({ signal });
    return {
      name: userData.name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      location: userData.location || '',
      skill: userData.skill || '',
      team: userData.team?.name || userData.team || 'Not assigned',
      role: userData.role || 'qa-tester',
      joinDate: userData.createdAt || new Date().toISOString(),
    };
  },
});

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

const QATesterProfile = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedLocation, setEditedLocation] = useState('');
  const [editedSkill, setEditedSkill] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');
  const [localError, setLocalError] = useState('');

  const { data: profile, isLoading, error, refetch } = useQuery({
    ...userProfileQuery(),
    retry: 1,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData) => {
      return await updateCurrentUserProfile({
        name: updatedData.name,
        phone: updatedData.phone,
        location: updatedData.location,
        skill: updatedData.skill,
      });
    },
    onSuccess: () => {
      setLocalSuccess('Profile updated successfully');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['qa-tester', 'profile'] });
      setTimeout(() => setLocalSuccess(''), 3000);
    },
    onError: (err) => {
      setLocalError(err.message || 'Failed to save profile');
      setTimeout(() => setLocalError(''), 3000);
    },
  });

  const handleEdit = () => {
    if (profile) {
      setEditedName(profile.name || '');
      setEditedPhone(profile.phone || '');
      setEditedLocation(profile.location || '');
      setEditedSkill(profile.skill || '');
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setLocalError('');
  };

  const handleSave = () => {
    updateProfileMutation.mutate({
      name: editedName,
      phone: editedPhone,
      location: editedLocation,
      skill: editedSkill,
    });
  };

  const handleChangePassword = () => {
    navigate('/change-password');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) return <div className="p-6">Loading profile...</div>;
  if (error) return <div className="p-6 text-red-500">Failed to load profile data</div>;

  const isSaving = updateProfileMutation.isPending;

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">QA Profile</h1>
        
        {isEditing ? (
          <div className="flex gap-2">
            <button 
              onClick={handleCancel} 
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3c8a91] flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </button>
          </div>
        ) : (
          <button 
            onClick={handleEdit} 
            className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#4DA5AD] hover:bg-[#4DA5AD]-700 flex items-center gap-2"
          >
            <Edit className="w-4 h-4" /> Edit Profile
          </button>
        )}
      </div>

      {localSuccess && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg">{localSuccess}</div>
      )}
      {localError && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">{localError}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B]"></div>

        <div className="px-6 pb-6">
          <div className="flex items-end -mt-10 mb-6">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
              {profile.name?.charAt(0).toUpperCase() || 'Q'}
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
                  <p className="text-[#4DA5AD] capitalize">{profile.role?.replace(/_/g, ' ') || 'QA Tester'}</p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <InfoRow icon={Mail} label="Email" value={profile.email} loading={isLoading} />
            <InfoRow 
              icon={Phone} 
              label="Phone" 
              value={isEditing ? editedPhone : profile.phone} 
              isEditing={isEditing}
              onChange={setEditedPhone}
              placeholder="Add phone number"
              loading={isLoading}
            />
            <InfoRow 
              icon={MapPin} 
              label="Location" 
              value={isEditing ? editedLocation : profile.location} 
              isEditing={isEditing}
              onChange={setEditedLocation}
              placeholder="Add location"
              loading={isLoading}
            />
            <InfoRow 
              icon={Star} 
              label="QA Skill / Domain" 
              value={isEditing ? editedSkill : profile.skill} 
              isEditing={isEditing}
              onChange={setEditedSkill}
              placeholder="E.g., Automation, Manual, Load Testing..."
              loading={isLoading}
            />
            <InfoRow icon={Briefcase} label="Team" value={profile.team} loading={isLoading} />
            <InfoRow 
              icon={Calendar} 
              label="Member Since" 
              value={new Date(profile.joinDate).toLocaleDateString()} 
              loading={isLoading}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <button onClick={handleChangePassword} className="text-sm text-[#4DA5AD] hover:underline flex items-center gap-1">
              <Key className="w-4 h-4" /> Change Password
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button onClick={handleLogout} className="px-6 py-2 text-red-600 hover:bg-red-50 rounded-lg transition inline-flex items-center gap-2">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default QATesterProfile;
