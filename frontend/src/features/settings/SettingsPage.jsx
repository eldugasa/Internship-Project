import React, { useEffect, useMemo, useState } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Lock,
  Mail,
  RotateCcw,
  Save,
  Shield,
  User,
  X,
} from "lucide-react";
import { apiClient } from "../../services/apiClient";
import { getCurrentUserProfile } from "../../services/usersService";
import {
  getDefaultNotificationPrefs,
  getVisibleNotificationFields,
  normalizeSettingsUser,
} from "./settingsAccess";

const SettingsSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="mx-auto max-w-7xl p-4 lg:p-6">
      <div className="mb-8">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex justify-between">
              <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="space-y-6">
              {[...Array(4)].map((_, index) => (
                <div key={index}>
                  <div className="mb-2 h-4 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200" />
            <div className="space-y-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded bg-gray-100" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const SharedSettingsPage = ({ mode = "manager" }) => {
  const loaderData = useLoaderData();
  const navigate = useNavigate();
  const initialUser = useMemo(
    () => normalizeSettingsUser(loaderData?.profile || loaderData?.user || {}),
    [loaderData],
  );
  const initialNotifications = useMemo(
    () => loaderData?.notifications || getDefaultNotificationPrefs(),
    [loaderData],
  );

  const {
    data: user = initialUser,
    isLoading: isUserLoading,
  } = useQuery({
    queryKey: ["settings", "user", mode],
    queryFn: getCurrentUserProfile,
    initialData: initialUser,
    select: normalizeSettingsUser,
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: notifications = initialNotifications,
    isLoading: isNotificationsLoading,
  } = useQuery({
    queryKey: ["settings", "notification-prefs", mode],
    queryFn: async () => {
      try {
        return await apiClient("/notification-prefs");
      } catch {
        return getDefaultNotificationPrefs();
      }
    },
    initialData: initialNotifications,
    staleTime: 1000 * 60 * 5,
  });

  const [userData, setUserData] = useState(initialUser);
  const [notificationPrefs, setNotificationPrefs] = useState(initialNotifications);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [name, setName] = useState(initialUser.name || "");
  const [email, setEmail] = useState(initialUser.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);

  useEffect(() => {
    setUserData(user);
    setName(user.name || "");
    setEmail(user.email || "");
  }, [user]);

  useEffect(() => {
    setNotificationPrefs(notifications || getDefaultNotificationPrefs());
  }, [notifications]);

  const isLoading = isUserLoading || isNotificationsLoading;

  const visibleNotificationFields = useMemo(
    () => getVisibleNotificationFields(mode, notificationPrefs, userData),
    [mode, notificationPrefs, userData],
  );

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleUpdateProfile = async () => {
    if (!name.trim() || !email.trim()) {
      alert("Name and email are required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      setProfileUpdating(true);
      const updatedUser = normalizeSettingsUser(
        await apiClient("/users/me/profile", {
          method: "PUT",
          body: JSON.stringify({ name, email }),
        }),
      );

      if (email !== userData.email) {
        alert("Email updated! Please login again with your new email.");
        logout();
      } else {
        setUserData(updatedUser);
        setShowEditProfile(false);
        alert("Profile updated successfully!");
      }
    } catch (error) {
      alert(error.message || "Failed to update profile");
    } finally {
      setProfileUpdating(false);
    }
  };

  const validatePassword = () => {
    const errors = {};

    if (!currentPassword) {
      errors.currentPassword = "Current password is required";
    }
    if (!newPassword) {
      errors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) {
      return;
    }

    try {
      setPasswordUpdating(true);
      const payload = { currentPassword, newPassword };

      try {
        await apiClient("/users/me/password", {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } catch (error) {
        if (error.message?.includes("404")) {
          await apiClient("/change-password", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        } else {
          throw error;
        }
      }

      alert("Password changed successfully! Please login again.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePassword(false);
      setTimeout(() => logout(), 2000);
    } catch (error) {
      if (error.message?.includes("current password") || error.message?.includes("incorrect")) {
        setPasswordErrors({ currentPassword: "Current password is incorrect" });
      } else if (error.message?.includes("same as old")) {
        setPasswordErrors({
          newPassword: "New password must be different from current password",
        });
      } else {
        alert(error.message || "Failed to change password");
      }
    } finally {
      setPasswordUpdating(false);
    }
  };

  const toggleNotification = async (key) => {
    const previousPrefs = notificationPrefs;
    const updatedPrefs = { ...notificationPrefs, [key]: !notificationPrefs[key] };
    setNotificationPrefs(updatedPrefs);

    try {
      setPrefsSaving(true);
      await apiClient("/notification-prefs", {
        method: "PUT",
        body: JSON.stringify(updatedPrefs),
      });
    } catch (error) {
      setNotificationPrefs(previousPrefs);
      alert("Failed to save notification preferences");
    } finally {
      setPrefsSaving(false);
    }
  };

  const resetToDefault = async () => {
    try {
      setPrefsSaving(true);
      const response = await apiClient("/notification-prefs/reset", { method: "POST" });
      setNotificationPrefs(response.prefs || getDefaultNotificationPrefs());
      alert("Notification preferences reset to default");
    } catch (error) {
      alert("Failed to reset preferences");
    } finally {
      setPrefsSaving(false);
    }
  };

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto max-w-7xl p-4 lg:p-6">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 lg:text-3xl">Settings</h1>
          <p className="text-gray-600">Manage your profile and notification preferences</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-[#0f5841]" />
                  <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                </div>
              </div>

              <div className="mb-6 flex items-center space-x-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-[#4DA5AD] to-[#2D4A6B] text-2xl font-bold text-white">
                  {userData.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-900">{userData.name}</p>
                  <p className="text-gray-600">{userData.email}</p>
                  <p className="mt-1 text-sm capitalize text-gray-500">
                    Role: {userData.role?.replace(/[_-]/g, " ")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="flex items-center space-x-4 rounded-xl border border-gray-200 bg-white p-6 transition hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                    <User className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Edit Profile</h3>
                    <p className="text-sm text-gray-500">Update your name and email</p>
                  </div>
                </button>

                <button
                  onClick={() => setShowChangePassword(true)}
                  className="flex items-center space-x-4 rounded-xl border border-gray-200 bg-white p-6 transition hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
                    <Lock className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Change Password</h3>
                    <p className="text-sm text-gray-500">Update your password</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[#0f5841]" />
                  <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                </div>
                <button
                  onClick={resetToDefault}
                  disabled={prefsSaving}
                  className="flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              </div>

              <div className="space-y-4">
                {visibleNotificationFields.map(({ key, label, description }) => {
                  const value = !!notificationPrefs[key];

                  return (
                    <div key={key} className="flex items-center justify-between rounded-lg p-3 transition hover:bg-gray-50">
                      <div className="mr-4 flex-1">
                        <div className="flex items-start gap-2">
                          {value ? (
                            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#0f5841]" />
                          ) : (
                            <BellOff className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                          )}
                          <div>
                            <span className="block font-medium text-gray-900">{label}</span>
                            {description ? <p className="mt-1 text-xs text-gray-500">{description}</p> : null}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleNotification(key)}
                        disabled={prefsSaving}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          prefsSaving ? "cursor-not-allowed opacity-50" : ""
                        }`}
                        style={{ backgroundColor: value ? "#0f5841" : "#d1d5db" }}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            value ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 border-t border-gray-200 pt-4">
                <h3 className="mb-3 text-sm font-medium text-gray-900">Global Settings</h3>
                <div className="space-y-3">
                  {notificationPrefs.emailNotifications !== undefined && (
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                      <span className="text-gray-700">Email Notifications</span>
                      <button
                        onClick={() => toggleNotification("emailNotifications")}
                        disabled={prefsSaving}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          prefsSaving ? "cursor-not-allowed opacity-50" : ""
                        }`}
                        style={{
                          backgroundColor: notificationPrefs.emailNotifications ? "#0f5841" : "#d1d5db",
                        }}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notificationPrefs.emailNotifications ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  )}
                  {notificationPrefs.inAppNotifications !== undefined && (
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                      <span className="text-gray-700">In-App Notifications</span>
                      <button
                        onClick={() => toggleNotification("inAppNotifications")}
                        disabled={prefsSaving}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          prefsSaving ? "cursor-not-allowed opacity-50" : ""
                        }`}
                        style={{
                          backgroundColor: notificationPrefs.inAppNotifications ? "#0f5841" : "#d1d5db",
                        }}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notificationPrefs.inAppNotifications ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#0f5841]" />
                <h2 className="text-lg font-semibold text-gray-900">Account Info</h2>
              </div>
              <div className="space-y-4">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="mb-1 text-xs text-gray-500">Account Type</p>
                  <p className="font-medium capitalize text-gray-900">{userData.role?.replace(/_/g, " ")}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="mb-1 text-xs text-gray-500">Team</p>
                  <p className="font-medium text-gray-900">{userData.team}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="mb-1 text-xs text-gray-500">Member Since</p>
                  <p className="font-medium text-gray-900">
                    {new Date(userData.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            <strong>Security Note:</strong> If you change your email or password, you'll need to login again.
          </p>
        </div>

        {showEditProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                <button onClick={() => setShowEditProfile(false)} className="rounded-lg p-2 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#4DA5AD]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#4DA5AD]"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProfile}
                  disabled={profileUpdating}
                  className="flex items-center gap-2 rounded-lg bg-[#4DA5AD] px-4 py-2 text-white hover:bg-[#3D8B93] disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {profileUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showChangePassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
                <button onClick={() => setShowChangePassword(false)} className="rounded-lg p-2 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      className={`w-full rounded-lg border px-4 py-2 pr-10 focus:border-transparent focus:ring-2 focus:ring-[#4DA5AD] ${
                        passwordErrors.currentPassword ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className={`w-full rounded-lg border px-4 py-2 pr-10 focus:border-transparent focus:ring-2 focus:ring-[#4DA5AD] ${
                        passwordErrors.newPassword ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className={`w-full rounded-lg border px-4 py-2 pr-10 focus:border-transparent focus:ring-2 focus:ring-[#4DA5AD] ${
                        passwordErrors.confirmPassword ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowChangePassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordErrors({});
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={passwordUpdating}
                  className="flex items-center gap-2 rounded-lg bg-[#4DA5AD] px-4 py-2 text-white hover:bg-[#3D8B93] disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {passwordUpdating ? "Updating..." : "Change Password"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedSettingsPage;
