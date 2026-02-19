import express from "express";
import { prisma } from "../config/db.js";
import authenticate from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { 
  createTask, 
  getTasksByProject, 
  updateTaskStatus, 
  getAllTasks,
  getTaskById,
  updateTaskProgress,
  updateTask,
  assignTask,
  addTaskComment,
  deleteTask
} from "../controllers/task.controller.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ===== TASK ROUTES =====

// POST /api/tasks - Create task (PROJECT_MANAGER only)
router.post("/", 
  authorize("PROJECT_MANAGER", "project-manager", "project_manager"), 
  createTask
);

// GET /api/tasks - Get all tasks (ADMIN or PROJECT_MANAGER)
router.get("/", 
  authorize("ADMIN", "PROJECT_MANAGER", "project-manager", "project_manager"), 
  getAllTasks
);

// GET /api/tasks/project/:projectId - Get tasks by project (All roles)
router.get("/project/:projectId", 
  authorize("ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "project-manager", "project_manager"), 
  getTasksByProject
);

// GET /api/tasks/:id - Get single task by ID (All roles with ownership check)
router.get("/:id", 
  authorize("ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "project-manager", "project_manager"),
  getTaskById
);

// ✅ ADD THIS: PUT /api/tasks/:id - Update task (PROJECT_MANAGER or ADMIN)
router.put("/:id", 
  authorize("ADMIN", "PROJECT_MANAGER", "project-manager", "project_manager"),
  updateTask
);

// PUT /api/tasks/:id/status - Update task status
router.put("/:id/status", 
  authorize("TEAM_MEMBER", "PROJECT_MANAGER", "project-manager", "project_manager"), 
  updateTaskStatus
);

// ✅ ADD THIS: PUT /api/tasks/:id/assign - Assign task to user
router.put("/:id/assign", 
  authorize("PROJECT_MANAGER", "project-manager", "project_manager"),
  assignTask
);

// ✅ ADD THIS: DELETE /api/tasks/:id - Delete task
router.delete("/:id", 
  authorize("ADMIN", "PROJECT_MANAGER", "project-manager", "project_manager"),
  deleteTask
);

// ===== COMMENT ROUTES =====

// ✅ ADD THIS: GET /api/tasks/:id/comments - Get all comments
router.get("/:id/comments", 
  authorize("ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "project-manager", "project_manager"),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const comments = await prisma.comment.findMany({
        where: { taskId: parseInt(id) },
        include: {
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      res.json(comments);
    } catch (err) {
      console.error("Error fetching comments:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ✅ ADD THIS: POST /api/tasks/:id/comments - Add a comment
router.post("/:id/comments", 
  authorize("ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "project-manager", "project_manager"),
  addTaskComment
);

export default router;