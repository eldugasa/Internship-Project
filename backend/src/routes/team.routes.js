import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// GET all teams with dynamic memberCount and placeholder performance
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "PROJECT_MANAGER", "project-manager", "project_manager"),
  async (req, res) => {
    try {
      const teams = await prisma.team.findMany({
        include: { users: true } // fetch users to calculate memberCount
      });

      const formattedTeams = teams.map(team => ({
        id: team.id,
        name: team.name,
        description: team.description || "",
        lead: team.lead || "",
        memberCount: team.users.length,
        performance: 0 // placeholder, can compute later
      }));

      res.json(formattedTeams);
    } catch (err) {
      console.error("Failed to fetch teams:", err);
      res.status(500).json({ message: "Failed to load teams" });
    }
  }
);

// Existing routes
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "PROJECT_MANAGER", "project-manager", "project_manager"),
  async (req, res) => {
    const { name, description, lead } = req.body;
    try {
      const newTeam = await prisma.team.create({
        data: { name, description, lead }
      });
      res.status(201).json(newTeam);
    } catch (err) {
      console.error("Failed to create team:", err);
      res.status(500).json({ message: "Failed to create team" });
    }
  }
);

router.get("/:teamId", authenticate, async (req, res) => {
  const { teamId } = req.params;
  try {
    const team = await prisma.team.findUnique({
      where: { id: parseInt(teamId) },
      include: { users: true }
    });

    if (!team) return res.status(404).json({ message: "Team not found" });

    res.json({
      id: team.id,
      name: team.name,
      description: team.description || "",
      lead: team.lead || "",
      memberCount: team.users.length,
      performance: 0
    });
  } catch (err) {
    console.error("Failed to fetch team:", err);
    res.status(500).json({ message: "Failed to load team" });
  }
});

// Optional: add/remove members
router.put("/:teamId/add-member", authenticate, authorize("ADMIN","PROJECT_MANAGER","project-manager","project_manager"), async (req, res) => {
  const { teamId } = req.params;
  const { userId } = req.body;
  try {
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { teamId: parseInt(teamId) }
    });
    res.json({ message: "User added to team" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add member" });
  }
});

router.put("/:teamId/remove-member", authenticate, authorize("ADMIN","PROJECT_MANAGER","project-manager","project_manager"), async (req, res) => {
  const { userId } = req.body;
  try {
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { teamId: null }
    });
    res.json({ message: "User removed from team" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove member" });
  }
});

export default router;
