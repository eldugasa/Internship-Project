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
import { validateRequest } from "../middleware/validate.middleware.js";
import {
  createProjectValidation,
  updateProjectValidation,
} from "../validation/project.validation.js";
import { requiredIntParam } from "../validation/common.validation.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// CREATE PROJECT
router.post(
  "/",
  authorize("SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"),
  requirePermission(PERMISSIONS.MANAGE_PROJECTS),
  createProjectValidation,
  validateRequest,
  createProject,
);

// GET ALL PROJECTS
router.get(
  "/",
  authorize("SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"),
  getAllProjects,
);

// UPDATE PROJECT
router.put(
  "/:id",
  authorize("SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"),
  requirePermission(PERMISSIONS.MANAGE_PROJECTS),
  updateProjectValidation,
  validateRequest,
  updateProject,
);

// DELETE PROJECT
router.delete(
  "/:id",
  authorize("SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"),
  requirePermission(PERMISSIONS.MANAGE_PROJECTS),
  requiredIntParam("id"),
  validateRequest,
  deleteProject,
);

// GET SINGLE PROJECT
router.get(
  "/:id",
  authorize("SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"),
  requiredIntParam("id"),
  validateRequest,
  getProjectById,
);

// GET PROJECT MEMBERS
router.get(
  "/:projectId/members",
  authorize("SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"),
  requiredIntParam("projectId"),
  validateRequest,
  getProjectMembers,
);

export default router;
