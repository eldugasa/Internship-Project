import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import {
  requireAnyPermission,
  requirePermission,
} from "../middleware/permission.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
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
  requireAnyPermission(PERMISSIONS.MANAGE_TEAMS, PERMISSIONS.MANAGE_USERS),
  getAllTeams
);

// GET team by ID
router.get(
  "/:teamId",
  requireAnyPermission(PERMISSIONS.MANAGE_TEAMS, PERMISSIONS.MANAGE_USERS),
  getTeamById,
);

// POST create team
router.post(
  "/",
  requirePermission(PERMISSIONS.MANAGE_TEAMS),
  createTeam
);

// DELETE team (Admin only)
router.delete(
  "/:teamId",
  requirePermission(PERMISSIONS.MANAGE_TEAMS),
  deleteTeam
);

// Add member to team
router.put(
  "/:teamId/add-member",
  requirePermission(PERMISSIONS.MANAGE_TEAMS),
  assignUserToTeam
);

// Remove member from team
router.put(
  "/:teamId/remove-member",
  requirePermission(PERMISSIONS.MANAGE_TEAMS),
  removeUserFromTeam
);

export default router;
