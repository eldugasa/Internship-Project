export const PERMISSIONS = {
  VIEW_DASHBOARD: "view_dashboard",
  MANAGE_USERS: "manage_users",
  MANAGE_TEAMS: "manage_teams",
  MANAGE_PROJECTS: "manage_projects",
  ASSIGN_TASKS: "assign_tasks",
  TEST_TASKS: "test_tasks",
  VIEW_REPORTS: "view_reports",
  MANAGE_SETTINGS: "manage_settings",
  MANAGE_ROLES: "manage_roles",
};

export const PERMISSION_OPTIONS = [
  { value: PERMISSIONS.MANAGE_USERS, label: "Manage Users" },
  { value: PERMISSIONS.MANAGE_TEAMS, label: "Manage Teams" },
  { value: PERMISSIONS.MANAGE_PROJECTS, label: "Manage Projects" },
  { value: PERMISSIONS.ASSIGN_TASKS, label: "Assign Tasks" },
  { value: PERMISSIONS.TEST_TASKS, label: "Test Tasks" },
  { value: PERMISSIONS.MANAGE_ROLES, label: "Manage Roles" },
];
