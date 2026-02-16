import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { createTask, getTasksByProject, updateTaskStatus, getAllTasks} from "../controllers/task.controller.js";

const router = express.Router();

// PROJECT_MANAGER creates task
router.post("/", authenticate, authorize("PROJECT_MANAGER", "project-manager", "project_manager"), createTask);

// Get all tasks for a project (ADMIN + PM + TEAM_MEMBER)
router.get("/project/:projectId", authenticate, authorize("ADMIN","PROJECT_MANAGER","TEAM_MEMBER", "project-manager", "project_manager"), getTasksByProject);

// Update task status (TEAM_MEMBER only for their tasks)
router.put("/:id/status", authenticate, authorize("TEAM_MEMBER"), updateTaskStatus);

// GET all tasks (ADMIN or PROJECT_MANAGER)
router.get("/", authenticate, authorize("ADMIN", "PROJECT_MANAGER", "project-manager", "project_manager"), getAllTasks);

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });

    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.json({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      assigneeId: task.assigneeId,
      assignee: task.assignee.name,
      projectId: task.projectId,
      project: task.project.name,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch task' });
  }
});



// GET /api/tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        assignee: { select: { name: true } },
        project: { select: { name: true } },
      },
    });

    const formatted = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status.toLowerCase(),
      assigneeId: task.assigneeId,
      assignee: task.assignee.name,
      projectId: task.projectId,
      project: task.project.name,
      progress: 0, // default
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

export default router;
