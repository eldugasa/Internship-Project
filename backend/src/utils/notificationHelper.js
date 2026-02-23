import { prisma } from "../config/db.js";

// Map notification types to preference keys
const typeToPrefMap = {
  // Admin notifications
  'user_registered': 'userRegistered',
  'project_created': 'projectCreated',
  'project_completed': 'projectCompleted',
  'system_alert': 'systemAlerts',
  'role_changed': 'roleChanged',
  
  // Project Manager notifications
  'task_assigned': 'taskAssigned',
  'task_completed': 'taskCompleted',
  'task_overdue': 'taskOverdue',
  'project_deadline': 'projectDeadline',
  'team_created': 'teamCreated',
  'member_joined': 'memberJoined',
  
  // Team Member notifications
  'task_assigned_to_me': 'taskAssignedToMe',
  'task_completed_by_me': 'taskCompletedByMe',
  'task_overdue_for_me': 'taskOverdueForMe',
  'deadline_approaching': 'deadlineApproaching',
  'comment_added': 'commentAdded',
  'added_to_team': 'addedToTeam'
};

// Create single notification with preference check
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  data = {},
  link = null
}) => {
  try {
    // Get user's notification preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        notificationPrefs: true,
        email: true 
      }
    });

    if (!user) {
      console.log(`User ${userId} not found`);
      return null;
    }

    // Parse preferences
    let prefs = user.notificationPrefs;
    if (typeof prefs === 'string') {
      try {
        prefs = JSON.parse(prefs);
      } catch (e) {
        prefs = {};
      }
    } else if (!prefs) {
      prefs = {};
    }

    // Check if user wants this type of notification
    const prefKey = typeToPrefMap[type];
    
    // If user has explicitly disabled this notification type, don't send
    if (prefKey && prefs[prefKey] === false) {
      console.log(`User ${userId} has disabled ${type} notifications`);
      return null;
    }

    // Check if in-app notifications are enabled globally
    if (prefs.inAppNotifications === false) {
      console.log(`User ${userId} has disabled in-app notifications`);
      return null;
    }

    // Create the notification
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

    // TODO: Send email if enabled
    // if (prefs.emailNotifications === true) {
    //   await sendEmailNotification(user.email, { title, message, type, link });
    // }

    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
};

// Create notifications for multiple users
export const createBulkNotifications = async (notifications) => {
  try {
    // Get unique user IDs
    const userIds = [...new Set(notifications.map(n => n.userId))];
    
    // Get preferences for all users
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, notificationPrefs: true }
    });

    // Create a map of user preferences
    const prefsMap = {};
    users.forEach(user => {
      let prefs = user.notificationPrefs;
      if (typeof prefs === 'string') {
        try {
          prefs = JSON.parse(prefs);
        } catch (e) {
          prefs = {};
        }
      } else if (!prefs) {
        prefs = {};
      }
      prefsMap[user.id] = prefs;
    });

    // Filter notifications based on preferences
    const filteredNotifications = notifications.filter(notif => {
      const userPrefs = prefsMap[notif.userId] || {};
      const prefKey = typeToPrefMap[notif.type];
      
      // Check if user has disabled in-app notifications
      if (userPrefs.inAppNotifications === false) return false;
      
      // Check if user has disabled this specific type
      if (prefKey && userPrefs[prefKey] === false) return false;
      
      return true;
    });

    if (filteredNotifications.length === 0) {
      return { count: 0 };
    }

    const result = await prisma.notification.createMany({
      data: filteredNotifications
    });

    return result;
  } catch (err) {
    console.error('Error creating bulk notifications:', err);
    return null;
  }
};

// Notification types constants
export const NOTIFICATION_TYPES = {
  // Admin
  USER_REGISTERED: 'user_registered',
  PROJECT_CREATED: 'project_created',
  PROJECT_COMPLETED: 'project_completed',
  SYSTEM_ALERT: 'system_alert',
  ROLE_CHANGED: 'role_changed',

  // Project Manager
  TASK_ASSIGNED: 'task_assigned',
  TASK_COMPLETED: 'task_completed',
  TASK_OVERDUE: 'task_overdue',
  PROJECT_DEADLINE: 'project_deadline',
  TEAM_CREATED: 'team_created',
  MEMBER_JOINED: 'member_joined',

  // Team Member
  TASK_ASSIGNED_TO_ME: 'task_assigned_to_me',
  TASK_COMPLETED_BY_ME: 'task_completed_by_me',
  TASK_OVERDUE_FOR_ME: 'task_overdue_for_me',
  DEADLINE_APPROACHING: 'deadline_approaching',
  COMMENT_ADDED: 'comment_added',
  ADDED_TO_TEAM: 'added_to_team'
};