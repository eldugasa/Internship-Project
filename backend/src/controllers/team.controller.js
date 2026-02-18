import { prisma } from "../config/db.js";

// ==============================
// Create Team
// ==============================
// team.controller.js (relevant part)
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
    console.error(error);
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

    res.json(teams);
  } catch (err) {
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

    res.json(team);
  } catch (err) {
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
    res.status(500).json({ message: err.message });
  }
};

export {
  createTeam,
  getAllTeams,
  getTeamById,
  assignUserToTeam,
  removeUserFromTeam
};
