import { prisma } from "../config/db.js";

// ==============================
// Create Team
// ==============================
const createTeam = async (req, res) => {
  try {
    const { name, lead, description, memberIds } = req.body;

    // Prepare nested users
    const members = memberIds?.map(id => ({ id })) || [];

    const team = await prisma.team.create({
      data: {
        name,
        description,
        lead,
        users: {
          connect: members  // Connect existing users
        }
      },
      include: {
        users: true,
        projects: true
      }
    });

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
// Assign User To Team
// ==============================
const assignUserToTeam = async (req, res) => {
  try {
    const { userId } = req.body;
    const { teamId } = req.params;

    const user = await prisma.user.update({
      where: { id: Number(userId) },
      data: { teamId: Number(teamId) },
    });

    res.json({ message: "User assigned to team", user });
  } catch (err) {
    console.error("Error in assignUserToTeam:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// Remove User From Team
// ==============================
const removeUserFromTeam = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await prisma.user.update({
      where: { id: Number(userId) },
      data: { teamId: null },
    });

    res.json({ message: "User removed from team", user });
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