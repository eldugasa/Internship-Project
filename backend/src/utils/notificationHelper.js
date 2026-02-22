import { prisma } from "../config/db.js";

// Create single notification
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  data = {},
  link = null
}) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data,
        link,
        read: false
      }
    });
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
};

// Create notifications for multiple users
export const createBulkNotifications = async (notifications) => {
  try {
    const result = await prisma.notification.createMany({
      data: notifications
    });
    return result;
  } catch (err) {
    console.error('Error creating bulk notifications:', err);
    return null;
  }
};

// Notification types constants
export const NOTIFICATION_TYPES = {
  // Admin notifications
  USER_REGISTERED: 'user_registered',
  PROJECT_CREATED: 'project_created',
  PROJECT_COMPLETED: 'project_completed',
  SYSTEM_ALERT: 'system_alert',
  ROLE_CHANGED: 'role_changed',

  // Project Manager notifications
  TASK_ASSIGNED: 'task_assigned',
  TASK_COMPLETED: 'task_completed',
  TASK_OVERDUE: 'task_overdue',
  PROJECT_DEADLINE: 'project_deadline',
  TEAM_CREATED: 'team_created',
  MEMBER_JOINED: 'member_joined',

  // Team Member notifications
  TASK_ASSIGNED_TO_ME: 'task_assigned_to_me',
  TASK_COMPLETED_BY_ME: 'task_completed_by_me',
  TASK_OVERDUE_FOR_ME: 'task_overdue_for_me',
  DEADLINE_APPROACHING: 'deadline_approaching',
  COMMENT_ADDED: 'comment_added',
  ADDED_TO_TEAM: 'added_to_team'
};