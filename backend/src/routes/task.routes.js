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
  deleteTask,
   getMyTasks 
} from "../controllers/task.controller.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ===== TASK ROUTES =====


router.post("/", 
  authorize("PROJECT_MANAGER", "project-manager", "project_manager"), 
  createTask
);


router.get("/", 
  authorize("ADMIN", "PROJECT_MANAGER", "project-manager", "project_manager"), 
  getAllTasks
);

// GET /api/tasks/project/:projectId - Get tasks by project (All roles)
router.get("/project/:projectId", 
  authorize("ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "project-manager", "project_manager"), 
  getTasksByProject
);

// GET /api/tasks/my-tasks - Get tasks for current user (Team Member)
router.get("/my-tasks",
  authorize("TEAM_MEMBER", "team-member", "team_member"),
  getMyTasks
);


router.get("/:id", 
  authorize("ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "project-manager", "project_manager"),
  getTaskById
);


router.put("/:id", 
  authorize("ADMIN", "PROJECT_MANAGER", "project-manager", "project_manager"),
  updateTask
);

// PUT /api/tasks/:id/status - Update task status
router.put("/:id/status", 
  authorize("TEAM_MEMBER", "PROJECT_MANAGER", "project-manager", "project_manager"), 
  updateTaskStatus
);



// GET /api/tasks/my-tasks - Get tasks for current user (Team Member)
router.get("/my-tasks", 
  authenticate,
  authorize("TEAM_MEMBER", "team-member", "team_member"),
  getMyTasks
);


router.put("/:id/assign", 
  authorize("PROJECT_MANAGER", "project-manager", "project_manager"),
  assignTask
);


router.delete("/:id", 
  authorize("ADMIN", "PROJECT_MANAGER", "project-manager", "project_manager"),
  deleteTask
);

// ===== COMMENT ROUTES =====

//  GET /api/tasks/:id/comments - Get all comments
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