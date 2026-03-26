// src/loader/manager/Settings.loader.js
import { getCurrentUserProfile } from '../../services/usersService';
import { apiClient } from '../../services/apiClient';

// Helper to get default preferences
const getDefaultPrefs = () => ({
  taskUpdates: true,
  deadlineReminders: true,
  projectUpdates: true,
  teamMentions: false,
  emailNotifications: true,
  inAppNotifications: true
});

// ✅ Return promises directly - NO AWAIT!
export function settingsLoader() {
  const profilePromise = getCurrentUserProfile();
  const prefsPromise = apiClient('/notification-prefs').catch(() => getDefaultPrefs());
  
  return {
    profile: profilePromise,
    notifications: prefsPromise
  };
}