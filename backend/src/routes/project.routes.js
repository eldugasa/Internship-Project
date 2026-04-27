import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import {
  createProject,
  deleteProject,
  getAllProjects,
  getProjectById,
  getProjectMembers,
  updateProject,
} from "../controllers/project.controller.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// CREATE PROJECT
router.post(
  "/",
  authorize("SUPER_ADMIN", "admin", "project_manager"),
  requirePermission(PERMISSIONS.MANAGE_PROJECTS),
  createProject,
);

// GET ALL PROJECTS
router.get(
  "/",
  authorize("SUPER_ADMIN", "admin", "project_manager"),
  getAllProjects,
);

// UPDATE PROJECT
router.put(
  "/:id",
  authorize(
    "SUPER_ADMIN",
    "PROJECT_MANAGER",
    "project-manager",
    "project_manager",
    "admin",
  ),
  requirePermission(PERMISSIONS.MANAGE_PROJECTS),
  updateProject,
);

// DELETE PROJECT
router.delete(
  "/:id",
  authorize(
    "SUPER_ADMIN",
    "PROJECT_MANAGER",
    "project-manager",
    "project_manager",
    "admin",
  ),
  requirePermission(PERMISSIONS.MANAGE_PROJECTS),
  deleteProject,
);

// GET SINGLE PROJECT
router.get(
  "/:id",
  authorize(
    "SUPER_ADMIN",
    "admin",
    "project_manager",
    "team-member",
    "team_member",
  ),
  getProjectById,
);

// GET PROJECT MEMBERS
router.get(
  "/:projectId/members",
  authorize(
    "SUPER_ADMIN",
    "admin",
    "project_manager",
    "team-member",
    "team_member",
  ),
  getProjectMembers,
);

export default router;
