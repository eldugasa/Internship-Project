import {
  AlertCircle,
  Bell,
  CheckCircle,
  CheckCircle2,
  Clock,
  Flag,
  FolderKanban,
  MessageSquare,
  Shield,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";

const defaultPresentation = {
  Icon: Bell,
  iconColor: "text-gray-500",
  iconBg: "bg-gray-50",
};

const buildPresentation = (Icon, iconColor, iconBg) => ({
  Icon,
  iconColor,
  iconBg,
});

export const notificationPageConfigs = {
  admin: {
    baseRoute: "/admin",
    title: "Admin Notifications",
    backPath: "/admin/dashboard",
    emptyMessage: "You're all caught up!",
  },
  manager: {
    baseRoute: "/manager",
    title: "Notifications",
    backPath: "/manager/dashboard",
    emptyMessage: "You're all caught up!",
  },
  qa: {
    baseRoute: "/qa-tester",
    title: "Notifications",
    backPath: null,
    emptyMessage: "No notifications available.",
  },
  teamMember: {
    baseRoute: "/team-member",
    title: "Team Member Notifications",
    backPath: "/team-member/dashboard",
    emptyMessage: "You're all caught up!",
  },
};

const adminNotifications = {
  user_registered: buildPresentation(UserPlus, "text-green-500", "bg-green-50"),
  project_created: buildPresentation(FolderKanban, "text-blue-500", "bg-blue-50"),
  project_completed: buildPresentation(CheckCircle, "text-green-500", "bg-green-50"),
  system_alert: buildPresentation(AlertCircle, "text-red-500", "bg-red-50"),
  role_changed: buildPresentation(Shield, "text-indigo-500", "bg-indigo-50"),
};

const managerNotifications = {
  task_completed: buildPresentation(CheckCircle, "text-green-500", "bg-green-50"),
  task_overdue: buildPresentation(AlertCircle, "text-red-500", "bg-red-50"),
  deadline: buildPresentation(Clock, "text-yellow-500", "bg-yellow-50"),
  deadline_approaching: buildPresentation(Clock, "text-yellow-500", "bg-yellow-50"),
  deadline_passed: buildPresentation(Flag, "text-orange-500", "bg-orange-50"),
  team_created: buildPresentation(Users, "text-purple-500", "bg-purple-50"),
  member_joined: buildPresentation(Users, "text-blue-500", "bg-blue-50"),
  project_started: buildPresentation(Trophy, "text-indigo-500", "bg-indigo-50"),
  project_created: buildPresentation(FolderKanban, "text-blue-500", "bg-blue-50"),
};

const teamMemberNotifications = {
  task_assigned: buildPresentation(CheckCircle, "text-green-500", "bg-green-50"),
  task_assigned_to_me: buildPresentation(CheckCircle, "text-green-500", "bg-green-50"),
  task_completed: buildPresentation(CheckCircle, "text-green-500", "bg-green-50"),
  task_completed_by_me: buildPresentation(CheckCircle, "text-green-500", "bg-green-50"),
  task_overdue: buildPresentation(AlertCircle, "text-red-500", "bg-red-50"),
  task_overdue_for_me: buildPresentation(AlertCircle, "text-red-500", "bg-red-50"),
  deadline_approaching: buildPresentation(Clock, "text-yellow-500", "bg-yellow-50"),
  comment_added: buildPresentation(MessageSquare, "text-blue-500", "bg-blue-50"),
  added_to_team: buildPresentation(UserPlus, "text-purple-500", "bg-purple-50"),
};

const qaNotifications = {
  default: buildPresentation(CheckCircle2, "text-[#4DA5AD]", "bg-[#4DA5AD]/10"),
};

export const getNotificationPresentation = (mode, type = "") => {
  if (mode === "admin") {
    return adminNotifications[type] || defaultPresentation;
  }

  if (mode === "manager") {
    return managerNotifications[type] || defaultPresentation;
  }

  if (mode === "teamMember") {
    if (type.includes("assigned") || type.includes("completed")) {
      return buildPresentation(CheckCircle, "text-green-500", "bg-green-50");
    }
    if (type.includes("overdue")) {
      return buildPresentation(AlertCircle, "text-red-500", "bg-red-50");
    }
    if (type.includes("deadline")) {
      return buildPresentation(Clock, "text-yellow-500", "bg-yellow-50");
    }
    if (type.includes("comment")) {
      return buildPresentation(MessageSquare, "text-blue-500", "bg-blue-50");
    }
    if (type.includes("added_to_team")) {
      return buildPresentation(UserPlus, "text-purple-500", "bg-purple-50");
    }
    return teamMemberNotifications[type] || defaultPresentation;
  }

  if (mode === "qa") {
    return qaNotifications.default;
  }

  return defaultPresentation;
};

export const getNotificationBadges = (mode, notification) => {
  if (mode === "admin") {
    return [
      notification.project
        ? { text: notification.project, className: "bg-blue-50 text-blue-600" }
        : null,
      notification.user
        ? { text: notification.user, className: "bg-green-50 text-green-600" }
        : null,
    ].filter(Boolean);
  }

  if (mode === "manager") {
    return [
      notification.project
        ? { text: notification.project, className: "bg-blue-50 text-blue-600" }
        : null,
      notification.member
        ? { text: notification.member, className: "bg-purple-50 text-purple-600" }
        : null,
    ].filter(Boolean);
  }

  if (mode === "teamMember") {
    return [
      notification.project
        ? { text: notification.project, className: "bg-blue-50 text-blue-600" }
        : null,
      notification.task
        ? { text: notification.task, className: "bg-green-50 text-green-600" }
        : null,
    ].filter(Boolean);
  }

  return [];
};

export const getNotificationBaseRoute = (mode = "manager") =>
  notificationPageConfigs[mode]?.baseRoute || notificationPageConfigs.manager.baseRoute;

export const getNotificationLinkByRole = (mode = "manager", notification = {}) => {
  const baseRoute = getNotificationBaseRoute(mode);
  const link = notification.link;

  if (link) {
    if (mode === "qa" || mode === "teamMember") {
      if (link.includes("/teams") || link.includes("/projects")) {
        return `${baseRoute}/dashboard`;
      }

      if (link.startsWith("/tasks/")) {
        return `${baseRoute}${link}`;
      }
    }

    return link;
  }

  const parsedData =
    typeof notification.data === "string"
      ? (() => {
          try {
            return JSON.parse(notification.data);
          } catch {
            return {};
          }
        })()
      : notification.data || {};

  const taskId = notification.taskId || notification.task?.id || parsedData?.taskId;

  if (mode === "qa" || mode === "teamMember") {
    switch (notification.type) {
      case "task_assigned":
      case "task_assigned_to_me":
      case "task_completed":
      case "task_completed_by_me":
      case "task_overdue":
      case "task_overdue_for_me":
      case "deadline_approaching":
      case "comment_added":
        return taskId ? `${baseRoute}/tasks/${taskId}` : `${baseRoute}/tasks`;
      default:
        return `${baseRoute}/dashboard`;
    }
  }

  if (mode === "manager") {
    if (taskId) {
      return `${baseRoute}/tasks/${taskId}`;
    }
    return `${baseRoute}/notifications`;
  }

  if (mode === "admin") {
    if (notification.projectId || parsedData?.projectId) {
      return `${baseRoute}/projects/${notification.projectId || parsedData.projectId}`;
    }
    return `${baseRoute}/notifications`;
  }

  return `${baseRoute}/notifications`;
};
