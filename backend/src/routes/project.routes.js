import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { 
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,  // ✅ Import from controller
  getProjectMembers 
} from "../controllers/project.controller.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// CREATE PROJECT
router.post(
  "/",
  authorize("project_manager"),
  createProject
);

// GET ALL PROJECTS
router.get(
  "/",
  authorize("admin", "project_manager"),
  getAllProjects
);

// UPDATE PROJECT - USE CONTROLLER
router.put(
  "/:id", 
  authorize("PROJECT_MANAGER", "project-manager", "project_manager", "admin"), 
  updateProject  // ✅ Use the controller, not inline
);

// GET SINGLE PROJECT
router.get(
  "/:id",
  authorize("admin", "project_manager", "team-member", "team_member"),
  getProjectById
);

// GET PROJECT MEMBERS
router.get(
  '/:projectId/members', 
  authorize("admin", "project_manager", "team-member", "team_member"),
  getProjectMembers
);

export default router;