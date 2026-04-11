// src/loader/manager/Settings.loader.js
import { getCurrentUserProfile } from "../../services/usersService";
import { apiClient, queryClient } from "../../services/apiClient";

// Helper to get default preferences
const getDefaultPrefs = () => ({
  taskUpdates: true,
  deadlineReminders: true,
  projectUpdates: true,
  teamMentions: false,
  emailNotifications: true,
  inAppNotifications: true,
});

export const userQuery = () => ({
  queryKey: ["currentUser"],
  queryFn: getCurrentUserProfile,
  staleTime: 1000 * 60 * 5,
  cacheTime: 1000 * 60 * 10,
});

const getNotificationPrefs = async () => {
  try {
    return await apiClient("/notification-prefs");
  } catch {
    return getDefaultPrefs();
  }
};

export const notificationPrefsQuery = () => ({
  queryKey: ["notificationPrefs"],
  queryFn: getNotificationPrefs,
  staleTime: 1000 * 60 * 5,
  cacheTime: 1000 * 60 * 10,
});

// ✅ Return promises directly - NO AWAIT!
export async function settingsLoader() {
  const [userData, notificationPrefs] = await Promise.all([
    queryClient.ensureQueryData(userQuery()),
    queryClient.ensureQueryData(notificationPrefsQuery()),
  ]);

  return {
    user: userData,
    notifications: notificationPrefs,
  };
}
