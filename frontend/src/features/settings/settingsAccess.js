const ADMIN_NOTIFICATION_FIELDS = [
  {
    key: "userRegistered",
    label: "New User Registered",
    description: "Get notified when a new user account is created.",
  },
  {
    key: "userDeleted",
    label: "User Deleted",
    description: "Get notified when a user account is deleted.",
  },
  {
    key: "teamCreated",
    label: "Team Created",
    description: "Get notified when a new team is created.",
  },
  {
    key: "teamDeleted",
    label: "Team Deleted",
    description: "Get notified when a team is deleted.",
  },
  {
    key: "projectCreated",
    label: "Project Created",
    description: "Get notified when a new project is created.",
  },
  {
    key: "projectCompleted",
    label: "Project Completed",
    description: "Get notified when a project is marked complete.",
  },
  {
    key: "roleChanged",
    label: "Role Changed",
    description: "Get notified when user access or role changes.",
  },
  {
    key: "systemAlerts",
    label: "System Alerts",
    description: "Get notified about important admin-side system alerts.",
  },
];

export const isAdminSettingsMode = (mode = "manager", user = {}) => {
  const normalizedRole = (user?.role || "").toLowerCase().replace(/_/g, "-");
  return mode === "admin" || normalizedRole === "admin" || normalizedRole === "super-admin";
};

export const normalizeSettingsUser = (user = {}) => ({
  createdAt: user.createdAt || user.joinDate || new Date().toISOString(),
  email: user.email || "",
  location: user.location || "",
  name: user.name || "",
  phone: user.phone || "",
  profileImage: user.profileImage || null,
  role: user.role || "team-member",
  team: user.team?.name || user.team || "Unassigned",
});

export const getDefaultNotificationPrefs = () => ({
  deadlineReminders: true,
  emailNotifications: true,
  inAppNotifications: true,
  projectUpdates: true,
  taskUpdates: true,
  teamMentions: false,
});

export const getVisibleNotificationFields = (mode = "manager", notifications = {}, user = {}) => {
  if (isAdminSettingsMode(mode, user)) {
    return ADMIN_NOTIFICATION_FIELDS.filter((field) => notifications[field.key] !== undefined);
  }

  return Object.entries(notifications)
    .filter(([key]) => key !== "emailNotifications" && key !== "inAppNotifications")
    .map(([key]) => ({
      key,
      label: key.replace(/([A-Z])/g, " $1").trim(),
      description: "",
    }));
};
