import express from "express";
import { prisma } from "../config/db.js"; // ✅ ADD missing import
import authenticate from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { 
  createTask, 
  getTasksByProject, 
  updateTaskStatus, 
  getAllTasks,
  getTaskById  // ✅ You'll need to add this to controller
} from "../controllers/task.controller.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// POST /api/tasks - Create task (PROJECT_MANAGER only)
router.post("/", 
  authorize("PROJECT_MANAGER", "project-manager", "project_manager"), 
  createTask
);

// GET /api/tasks/project/:projectId - Get tasks by project (All roles)
router.get("/project/:projectId", 
  authorize("ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "project-manager", "project_manager"), 
  getTasksByProject
);

// PUT /api/tasks/:id/status - Update task status (TEAM_MEMBER only for their tasks)
router.put("/:id/status", 
  authorize("TEAM_MEMBER"), 
  updateTaskStatus
);

// GET /api/tasks - Get all tasks (ADMIN or PROJECT_MANAGER)
router.get("/", 
  authorize("ADMIN", "PROJECT_MANAGER", "project-manager", "project_manager"), 
  getAllTasks
);

// GET /api/tasks/:id - Get single task by ID (All roles with ownership check)
router.get("/:id", 
  authorize("ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "project-manager", "project_manager"),
  getTaskById  // ✅ Move this logic to controller
);

export default router;