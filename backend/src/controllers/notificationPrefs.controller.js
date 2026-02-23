import { prisma } from "../config/db.js";

// Default notification preferences for each role
const getDefaultPrefs = (role) => {
  const basePrefs = {
    emailNotifications: true,
    inAppNotifications: true,
  };

  const roleSpecificPrefs = {
    ADMIN: {
      userRegistered: true,
      projectCreated: true,
      projectCompleted: true,
      systemAlerts: true,
      roleChanged: true,
    },
    PROJECT_MANAGER: {
      taskAssigned: true,
      taskCompleted: true,
      taskOverdue: true,
      projectDeadline: true,
      teamCreated: true,
      memberJoined: true,
      projectUpdates: true,
      deadlineReminders: true,
    },
    TEAM_MEMBER: {
      taskAssignedToMe: true,
      taskCompletedByMe: true,
      taskOverdueForMe: true,
      deadlineApproaching: true,
      commentAdded: true,
      addedToTeam: true,
    }
  };

  // Normalize role
  const normalizedRole = role?.toUpperCase().replace(/-/g, '_');
  
  // Determine role key
  let roleKey = 'TEAM_MEMBER'; // default
  if (normalizedRole === 'ADMIN') {
    roleKey = 'ADMIN';
  } else if (normalizedRole === 'PROJECT_MANAGER' || normalizedRole === 'PROJECT_MANAGER') {
    roleKey = 'PROJECT_MANAGER';
  }

  return {
    ...basePrefs,
    ...(roleSpecificPrefs[roleKey] || {})
  };
};

// Get user's notification preferences
export const getNotificationPrefs = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        notificationPrefs: true,
        role: true 
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Parse preferences
    let prefs = user.notificationPrefs;
    
    // If prefs is a string (JSON), parse it
    if (typeof prefs === 'string') {
      try {
        prefs = JSON.parse(prefs);
      } catch (e) {
        prefs = {};
      }
    } else if (!prefs) {
      prefs = {};
    }
    
    // If no prefs or empty object, use defaults
    if (!prefs || Object.keys(prefs).length === 0) {
      prefs = getDefaultPrefs(user.role);
      
      // Save default prefs to database
      await prisma.user.update({
        where: { id: userId },
        data: { notificationPrefs: prefs }
      });
    }
    
    res.json(prefs);
  } catch (err) {
    console.error('Error fetching notification preferences:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update notification preferences
export const updateNotificationPrefs = async (req, res) => {
  try {
    const userId = req.user.id;
    const newPrefs = req.body;

    // Validate that we're not sending empty preferences
    if (!newPrefs || Object.keys(newPrefs).length === 0) {
      return res.status(400).json({ message: "Preferences cannot be empty" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { notificationPrefs: newPrefs },
      select: { notificationPrefs: true }
    });

    res.json({
      message: "Notification preferences updated successfully",
      prefs: updatedUser.notificationPrefs
    });
  } catch (err) {
    console.error('Error updating notification preferences:', err);
    res.status(500).json({ message: err.message });
  }
};

// Reset to default preferences
export const resetNotificationPrefs = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    const defaultPrefs = getDefaultPrefs(user.role);

    await prisma.user.update({
      where: { id: userId },
      data: { notificationPrefs: defaultPrefs }
    });

    res.json({
      message: "Notification preferences reset to default",
      prefs: defaultPrefs
    });
  } catch (err) {
    console.error('Error resetting notification preferences:', err);
    res.status(500).json({ message: err.message });
  }
};