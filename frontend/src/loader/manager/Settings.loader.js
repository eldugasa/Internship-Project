// src/loader/manager/Settings.loader.js
import { getCurrentUserProfile } from '../../services/usersService';
import { apiClient } from '../../services/apiClient';

export async function settingsLoader() {
  try {
    const [userData, prefs] = await Promise.all([
      getCurrentUserProfile(),
      apiClient('/notification-prefs').catch(() => null)
    ]);
    
    const defaultPrefs = {
      taskUpdates: true,
      deadlineReminders: true,
      projectUpdates: true,
      teamMentions: false,
      emailNotifications: true,
      inAppNotifications: true
    };
    
    return {
      profile: {
        id: userData.id,
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || 'project-manager',
        phone: userData.phone || '',
        location: userData.location || '',
        team: userData.team?.name || 'Engineering Team',
        joinDate: userData.createdAt || new Date().toISOString(),
        profileImage: userData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=0f5841&color=fff&size=128`
      },
      notifications: prefs || defaultPrefs
    };
  } catch (error) {
    console.error('Error loading settings:', error);
    return {
      profile: null,
      notifications: null,
      error: error.message || 'Failed to load settings'
    };
  }
}