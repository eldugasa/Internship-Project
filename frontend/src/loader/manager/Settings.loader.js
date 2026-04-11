// src/loader/manager/Settings.loader.js
import { getCurrentUserProfile, updateCurrentUserProfile, updateCurrentUserPassword } from '../../services/usersService';
import { apiClient, queryClient } from '../../services/apiClient';

// ============================================
// 1. QUERY DEFINITIONS
// ============================================

export const userProfileQuery = () => ({
  queryKey: ['user', 'profile'],
  queryFn: async ({ signal }) => {
    const userData = await getCurrentUserProfile({ signal });
    return {
      id: userData.id,
      name: userData.name || '',
      email: userData.email || '',
      role: userData.role || 'project-manager',
      phone: userData.phone || '',
      location: userData.location || '',
      team: userData.team?.name || 'Engineering Team',
      joinDate: userData.createdAt || new Date().toISOString(),
      profileImage: userData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=0f5841&color=fff&size=128`
    };
  },
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
});

export const notificationPrefsQuery = () => ({
  queryKey: ['user', 'notification-prefs'],
  queryFn: async ({ signal }) => {
    const defaultPrefs = {
      taskUpdates: true,
      deadlineReminders: true,
      projectUpdates: true,
      teamMentions: false,
      emailNotifications: true,
      inAppNotifications: true
    };
    
    try {
      const prefs = await apiClient('/notification-prefs', { signal });
      return prefs || defaultPrefs;
    } catch (error) {
      console.log('Using default notification preferences');
      return defaultPrefs;
    }
  },
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
});

// ============================================
// 2. SINGLE ACTION (Handles all mutations)
// ============================================

export const settingsAction = (queryClient) => async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get('intent');
  
  console.log('Settings action called with intent:', intent);
  
  try {
    switch (intent) {
      case 'update-profile': {
        const name = formData.get('name');
        const phone = formData.get('phone');
        const location = formData.get('location');
        
        await updateCurrentUserProfile({ name, phone, location });
        await queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
        
        return new Response(
          JSON.stringify({ success: true, message: 'Profile updated successfully!' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      case 'update-password': {
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');
        
        if (newPassword.length < 6) {
          return new Response(
            JSON.stringify({ error: 'Password must be at least 6 characters' }),
            { headers: { 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        if (newPassword !== confirmPassword) {
          return new Response(
            JSON.stringify({ error: 'Passwords do not match' }),
            { headers: { 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        await updateCurrentUserPassword({ currentPassword: newPassword, newPassword });
        
        return new Response(
          JSON.stringify({ success: true, message: 'Password updated successfully!' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      case 'toggle-notification': {
        const key = formData.get('key');
        const currentValue = formData.get('currentValue') === 'true';
        
        const currentPrefs = await queryClient.getQueryData(['user', 'notification-prefs']);
        const updated = { ...currentPrefs, [key]: !currentValue };
        
        await apiClient('/notification-prefs', {
          method: 'PUT',
          body: JSON.stringify(updated)
        });
        
        await queryClient.invalidateQueries({ queryKey: ['user', 'notification-prefs'] });
        
        return new Response(
          JSON.stringify({ success: true, message: 'Notification preference updated!' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      case 'reset-notifications': {
        await apiClient('/notification-prefs/reset', { method: 'POST' });
        await queryClient.invalidateQueries({ queryKey: ['user', 'notification-prefs'] });
        
        return new Response(
          JSON.stringify({ success: true, message: 'Notification preferences reset to default!' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { headers: { 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    console.error('Action error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Something went wrong' }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
};

// ============================================
// 3. LOADER (React Router v7 - No defer!)
// ============================================

export async function settingsLoader() {
  console.log('🔄 Loading settings data (v7 streaming)...');
  
  // Return plain object with promises - DO NOT AWAIT
  // This enables streaming/skeleton immediately
  return {
    profile: queryClient.ensureQueryData(userProfileQuery()),
    notifications: queryClient.ensureQueryData(notificationPrefsQuery())
  };
}

export default settingsLoader;