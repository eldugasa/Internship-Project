import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import {
  createTeam,
  getAllTeams,
  getTeamById,
  deleteTeam,
  assignUserToTeam,
  removeUserFromTeam
} from "../controllers/team.controller.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET all teams
router.get(
  "/",
  authorize("ADMIN", "PROJECT_MANAGER", "project-manager", "project_manager"),
  getAllTeams
);

// GET team by ID
router.get("/:teamId", getTeamById);

// POST create team
router.post(
  "/",
  authorize("ADMIN", "PROJECT_MANAGER", "project-manager", "project_manager"),
  createTeam
);

// DELETE team (Admin only)
router.delete(
  "/:teamId",
  authorize("ADMIN"),
  deleteTeam
);

// Add member to team
router.put(
  "/:teamId/add-member",
  authorize("ADMIN", "PROJECT_MANAGER", "project-manager", "project_manager"),
  assignUserToTeam
);

// Remove member from team
router.put(
  "/:teamId/remove-member",
  authorize("ADMIN", "PROJECT_MANAGER", "project-manager", "project_manager"),
  removeUserFromTeam
);

export default router;