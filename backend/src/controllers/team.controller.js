import { prisma } from "../config/db.js";
import {
  createBulkNotifications,
  createNotification,
  NOTIFICATION_TYPES,
} from "../utils/notificationHelper.js";

const notifyAdminUsersAboutTeamMemberAddition = async ({
  actorName,
  memberName,
  teamId,
  teamName,
}) => {
  const adminUsers = await prisma.user.findMany({
    where: {
      status: "active",
      role: { in: ["ADMIN", "SUPER_ADMIN"] },
    },
    select: { id: true },
  });

  if (!adminUsers.length) {
    return;
  }

  await createBulkNotifications(
    adminUsers.map((admin) => ({
      userId: admin.id,
      type: NOTIFICATION_TYPES.SYSTEM_ALERT,
      title: "Team Member Added",
      message: actorName
        ? `${actorName} added ${memberName} to team "${teamName}".`
        : `${memberName} was added to team "${teamName}".`,
      data: {
        teamId,
        teamName,
        memberName,
      },
      link: `/admin/teams/${teamId}`,
      read: false,
    })),
  );
};

// ==============================
// Create Team
// ==============================
const createTeam = async (req, res) => {
  try {
    const { name, leadId, description, memberIds } = req.body;

    // If leadId is provided, get the user's name
    let leadName = null;
    if (leadId) {
      const leadUser = await prisma.user.findUnique({
        where: { id: Number(leadId) }
      });
      if (leadUser) {
        leadName = leadUser.name;
      }
    }

    // Prepare nested users
    const members = memberIds?.map(id => ({ id: Number(id) })) || [];

    const team = await prisma.team.create({
      data: {
        name,
        description,
        lead: leadName,
        users: {
          connect: members
        }
      },
      include: {
        users: true,
        projects: true
      }
    });

    // Send notifications to all members added to the team
    if (members.length > 0) {
      try {
        for (const member of members) {
          const memberUser = await prisma.user.findUnique({
            where: { id: member.id },
            select: { name: true },
          });

          await createNotification({
            userId: member.id,
            type: NOTIFICATION_TYPES.ADDED_TO_TEAM,
            title: 'Added to Team',
            message: `You have been added to team "${team.name}"`,
            data: { teamId: team.id, teamName: team.name },
            link: `/team-member/teams/${team.id}`
          });

          await notifyAdminUsersAboutTeamMemberAddition({
            actorName: req.user?.name,
            memberName: memberUser?.name || `User #${member.id}`,
            teamId: team.id,
            teamName: team.name,
          });
        }
        console.log(`✅ Sent notifications to ${members.length} team members`);
      } catch (notifErr) {
        console.error('Error sending team creation notifications:', notifErr);
      }
    }

    res.status(201).json({ team });
  } catch (error) {
    console.error("Error in createTeam:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Get All Teams
// ==============================
const getAllTeams = async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true },
        },
        projects: true
      }
    });

    // Format teams to match frontend expectations
    const formattedTeams = teams.map(team => ({
      id: team.id,
      name: team.name,
      description: team.description || "",
      lead: team.lead || "Unassigned",
      leadName: team.lead || "Unassigned",
      memberCount: team.users.length,
      members: team.users,
      projects: team.projects,
      projectCount: team.projects.length,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt
    }));

    res.json(formattedTeams);
  } catch (err) {
    console.error("ERROR in getAllTeams:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// Get Team By ID
// ==============================
const getTeamById = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: Number(teamId) },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true },
        },
        projects: true
      }
    });

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Format team to match frontend expectations
    const formattedTeam = {
      id: team.id,
      name: team.name,
      description: team.description || "",
      lead: team.lead || "Unassigned",
      leadName: team.lead || "Unassigned",
      memberCount: team.users.length,
      members: team.users,
      projects: team.projects,
      projectCount: team.projects.length,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt
    };

    res.json(formattedTeam);
  } catch (err) {
    console.error("ERROR in getTeamById:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// Delete Team (Admin only)
// ==============================
const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: Number(teamId) },
      include: {
        projects: true,
        users: true
      }
    });

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if team has projects
    if (team.projects.length > 0) {
      return res.status(400).json({ 
        message: "Cannot delete team with existing projects. Please reassign or delete the projects first." 
      });
    }

    // Notify all members that team is being deleted
    if (team.users.length > 0) {
      try {
        for (const user of team.users) {
          await createNotification({
            userId: user.id,
            type: 'team_deleted',
            title: 'Team Deleted',
            message: `Team "${team.name}" has been deleted`,
            data: { teamId: team.id, teamName: team.name }
          });
        }
        console.log(`✅ Sent deletion notifications to ${team.users.length} members`);
      } catch (notifErr) {
        console.error('Error sending team deletion notifications:', notifErr);
      }
    }

    // Remove team reference from all users
    await prisma.user.updateMany({
      where: { teamId: Number(teamId) },
      data: { teamId: null }
    });

    // Delete the team
    await prisma.team.delete({
      where: { id: Number(teamId) }
    });

    res.json({ message: "Team deleted successfully" });
  } catch (err) {
    console.error("Error deleting team:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// Assign User To Team - WITH NOTIFICATION
// ==============================
const assignUserToTeam = async (req, res) => {
  try {
    const { userId } = req.body;
    const { teamId } = req.params;

    // Get team details for notification
    const team = await prisma.team.findUnique({
      where: { id: Number(teamId) }
    });

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Update user's team assignment
    const user = await prisma.user.update({
      where: { id: Number(userId) },
      data: { teamId: Number(teamId) },
    });

    // Send notification to the user who was added
    try {
      await createNotification({
        userId: Number(userId),
        type: NOTIFICATION_TYPES.ADDED_TO_TEAM,
        title: 'Added to Team',
        message: `You have been added to team "${team.name}"`,
        data: { 
          teamId: team.id, 
          teamName: team.name,
          userId: user.id 
        },
        link: `/team-member/teams/${team.id}`
      });

      await notifyAdminUsersAboutTeamMemberAddition({
        actorName: req.user?.name,
        memberName: user.name || `User #${user.id}`,
        teamId: team.id,
        teamName: team.name,
      });

      console.log(`✅ Notification sent to user ${userId} for team addition`);
    } catch (notifErr) {
      console.error('Error sending team addition notification:', notifErr);
    }

    res.json({ message: "User assigned to team", user });
  } catch (err) {
    console.error("Error in assignUserToTeam:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// Remove User From Team - WITH NOTIFICATION
// ==============================
const removeUserFromTeam = async (req, res) => {
  try {
    const { userId } = req.body;
    const { teamId } = req.params;

    // Get user with current team before removal
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      include: {
        team: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const previousTeam = user.team;
    const previousTeamName = previousTeam?.name || 'Unknown Team';

    // Remove user from team
    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: { teamId: null },
    });

    // Send notification to the user who was removed
    try {
      await createNotification({
        userId: Number(userId),
        type: NOTIFICATION_TYPES.MEMBER_REMOVED,
        title: 'Removed from Team',
        message: `You have been removed from team "${previousTeamName}"`,
        data: { 
          teamId: Number(teamId), 
          teamName: previousTeamName,
          userId: user.id 
        }
      });
      console.log(`✅ Notification sent to user ${userId} for team removal`);
    } catch (notifErr) {
      console.error('Error sending team removal notification:', notifErr);
    }

    res.json({ message: "User removed from team", user: updatedUser });
  } catch (err) {
    console.error("Error in removeUserFromTeam:", err);
    res.status(500).json({ message: err.message });
  }
};

// Export all functions
export {
  createTeam,
  getAllTeams,
  getTeamById,
  deleteTeam,
  assignUserToTeam,
  removeUserFromTeam
};
