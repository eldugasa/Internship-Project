import express from "express";
import { prisma } from "../config/db.js";
import authenticate from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import {
  createTask,
  getTasksByProject,
  updateTaskStatus,
  getAllTasks,
  getTaskById,
  updateTask,
  assignTask,
  addTaskComment,
  deleteTask,
  getMyTasks,
  deleteComment,
} from "../controllers/task.controller.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import {
  addCommentValidation,
  assignTaskValidation,
  createTaskValidation,
  updateTaskStatusValidation,
  updateTaskValidation,
} from "../validation/task.validation.js";
import { requiredIntParam } from "../validation/common.validation.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  authorize("SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"),
  requirePermission(PERMISSIONS.ASSIGN_TASKS),
  createTaskValidation,
  validateRequest,
  createTask,
);

router.get("/", authorize("SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"), getAllTasks);

router.get(
  "/project/:projectId",
  authorize("SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "QA_TESTER"),
  requiredIntParam("projectId"),
  validateRequest,
  getTasksByProject,
);

router.get("/my-tasks", authorize("TEAM_MEMBER", "QA_TESTER"), getMyTasks);

router.get(
  "/:id",
  authorize("SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "QA_TESTER"),
  requiredIntParam("id"),
  validateRequest,
  getTaskById,
);

router.put(
  "/:id",
  authorize("SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"),
  requirePermission(PERMISSIONS.ASSIGN_TASKS),
  updateTaskValidation,
  validateRequest,
  updateTask,
);

router.put(
  "/:id/status",
  authorize("SUPER_ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "QA_TESTER"),
  updateTaskStatusValidation,
  validateRequest,
  updateTaskStatus,
);

router.put(
  "/:id/assign",
  authorize("SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"),
  requirePermission(PERMISSIONS.ASSIGN_TASKS),
  assignTaskValidation,
  validateRequest,
  assignTask,
);

router.delete(
  "/:id",
  authorize("SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"),
  requirePermission(PERMISSIONS.ASSIGN_TASKS),
  requiredIntParam("id"),
  validateRequest,
  deleteTask,
);

router.get(
  "/:id/comments",
  authorize("SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "QA_TESTER"),
  requiredIntParam("id"),
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      const comments = await prisma.comment.findMany({
        where: { taskId: parseInt(id, 10) },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(comments);
    } catch (err) {
      console.error("Error fetching comments:", err);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  },
);

router.post(
  "/:id/comments",
  authorize("SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "QA_TESTER"),
  addCommentValidation,
  validateRequest,
  addTaskComment,
);

router.delete(
  "/:id/comments/:commentId",
  authorize("SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "QA_TESTER"),
  requiredIntParam("id"),
  requiredIntParam("commentId"),
  validateRequest,
  deleteComment,
);

export default router;
