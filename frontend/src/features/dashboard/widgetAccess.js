import { PERMISSIONS } from "../../config/permissions";

export const workspaceWidgetConfigs = [
  {
    key: "team",
    title: "Team Member Work",
    description: "Track personal tasks, progress, and execution details from the member workspace.",
    accentBg: "bg-green-50",
    accentBorder: "border-green-200",
    primaryLabel: "Open Member Dashboard",
    primaryTo: "/team-member/dashboard",
    primaryClassName: "rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white",
    secondaryLabel: "View My Tasks",
    secondaryTo: "/team-member/tasks",
    secondaryClassName: "rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-800",
  },
  {
    key: "pm",
    title: "Project Manager Work",
    description: "Manage projects, teams, assignments, and execution workflows.",
    accentBg: "bg-blue-50",
    accentBorder: "border-blue-200",
    primaryLabel: "Open Manager Dashboard",
    primaryTo: "/manager/dashboard",
    primaryClassName: "rounded-lg bg-[#194f87] px-4 py-2 text-sm font-semibold text-white",
    secondaryLabel: "Manage Tasks",
    secondaryTo: "/manager/tasks",
    secondaryClassName: "rounded-lg border border-[#194f87] px-4 py-2 text-sm font-semibold text-[#194f87]",
  },
  {
    key: "qa",
    title: "QA Testing Work",
    description: "Review assigned QA tasks, validate quality, and move work through testing.",
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-200",
    primaryLabel: "Open QA Dashboard",
    primaryTo: "/qa-tester/dashboard",
    primaryClassName: "rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white",
    secondaryLabel: "View QA Tasks",
    secondaryTo: "/qa-tester/tasks",
    secondaryClassName: "rounded-lg border border-amber-600 px-4 py-2 text-sm font-semibold text-amber-700",
  },
  {
    key: "admin",
    title: "Admin Work",
    description: "Manage users, projects, reports, and platform-wide administration.",
    accentBg: "bg-purple-50",
    accentBorder: "border-purple-200",
    primaryLabel: "Open Admin Dashboard",
    primaryTo: "/admin/dashboard",
    primaryClassName: "rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white",
    secondaryLabel: "Manage Users",
    secondaryTo: "/admin/users",
    secondaryClassName: "rounded-lg border border-purple-700 px-4 py-2 text-sm font-semibold text-purple-800",
  },
];

export const getVisibleWidgets = ({ hasPermission, isSuperAdmin, role }) => {
  const visibleKeys = [];

  if (role === "team-member") {
    visibleKeys.push("team");
  }

  if (
    role === "project-manager" ||
    hasPermission(PERMISSIONS.MANAGE_TEAMS) ||
    hasPermission(PERMISSIONS.MANAGE_PROJECTS) ||
    hasPermission(PERMISSIONS.ASSIGN_TASKS)
  ) {
    visibleKeys.push("pm");
  }

  if (role === "qa-tester" || hasPermission(PERMISSIONS.TEST_TASKS)) {
    visibleKeys.push("qa");
  }

  if (
    role === "admin" ||
    role === "super-admin" ||
    hasPermission(PERMISSIONS.MANAGE_USERS) ||
    hasPermission(PERMISSIONS.MANAGE_TEAMS) ||
    hasPermission(PERMISSIONS.MANAGE_PROJECTS) ||
    hasPermission(PERMISSIONS.VIEW_REPORTS) ||
    hasPermission(PERMISSIONS.MANAGE_SETTINGS)
  ) {
    visibleKeys.push("admin");
  }

  if (isSuperAdmin()) {
    visibleKeys.push("super-admin");
  }

  return [...new Set(visibleKeys)];
};
