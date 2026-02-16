import { prisma } from "../config/db.js";

// Create a task (PROJECT_MANAGER only)
const createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, dueDate } = req.body;

    // Check if assigned user exists
    const user = await prisma.user.findUnique({ where: { id: Number(assignedTo) } });
    if (!user) return res.status(404).json({ message: "Assigned user not found" });
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: "TODO",
        progress: 0,
        projectId: Number(projectId),
        assignedTo: Number(assignedTo),
        dueDate: new Date(dueDate)
      }
    });
        res.status(201).json({ message: "Task created", task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get tasks for a specific project
const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await prisma.task.findMany({
      where: { projectId: Number(projectId) },
      include: { assignee: true, project: true }
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update task status/progress (TEAM_MEMBER or PROJECT_MANAGER)
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress } = req.body;

    const task = await prisma.task.findUnique({ where: { id: Number(id) } });
    if (!task) return res.status(404).json({ message: "Task not found" });

    // TEAM_MEMBER can only update their own tasks
    if (req.user.role === "TEAM_MEMBER" && task.assignedTo !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: { status, progress }
    });

    res.json({ message: "Task updated", task: updatedTask });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get all tasks (ADMIN + PROJECT_MANAGER)
const getAllTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: { assignee: true, project: true }
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Export everything in ESM style
export { createTask, updateTaskStatus, getTasksByProject, getAllTasks };