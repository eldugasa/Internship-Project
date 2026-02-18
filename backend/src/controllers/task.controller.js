// backend/src/controllers/task.controller.js
import { prisma } from "../config/db.js";  // ✅ CRITICAL: This was missing!

// Get task by ID
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
      include: {
        assignee: { 
          select: { 
            id: true, 
            name: true, 
            email: true,
            role: true 
          } 
        },
        project: { 
          select: { 
            id: true, 
            name: true,
            description: true,
            status: true 
          } 
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check authorization
    if (req.user.role !== "ADMIN" && 
        req.user.role !== "PROJECT_MANAGER" && 
        task.assignedTo !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view this task" });
    }

    res.json({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      progress: task.progress || 0,
      priority: task.priority || 'MEDIUM',
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      assigneeId: task.assigneeId,
      assignee: task.assignee?.name || null,
      assigneeEmail: task.assignee?.email || null,
      assigneeRole: task.assignee?.role || null,
      projectId: task.projectId,
      project: task.project?.name || null,
      projectDescription: task.project?.description || null,
      projectStatus: task.project?.status || null,
      comments: task.comments?.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: {
          id: comment.user.id,
          name: comment.user.name,
          email: comment.user.email
        }
      })) || [],
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    });
  } catch (err) {
    console.error('Error in getTaskById:', err);
    res.status(500).json({ message: 'Failed to fetch task' });
  }
};

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
        status: "PENDING",
        progress: 0,
        priority: "MEDIUM",
        projectId: Number(projectId),
        assignedTo: Number(assignedTo),
        dueDate: dueDate ? new Date(dueDate) : null
      }
    });
    
    res.status(201).json({ message: "Task created", task });
  } catch (err) {
    console.error('Error in createTask:', err);
    res.status(500).json({ message: err.message });
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
    console.error('Error in getTasksByProject:', err);
    res.status(500).json({ message: err.message });
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
    console.error('Error in updateTaskStatus:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get all tasks (ADMIN + PROJECT_MANAGER)
const getAllTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: { 
        assignee: true, 
        project: true 
      }
    });
    res.json(tasks);
  } catch (err) {
    console.error('Error in getAllTasks:', err);  // This will now show in your backend console
    res.status(500).json({ message: err.message });
  }
};

// Update task progress
const updateTaskProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;

    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check authorization
    if (req.user.role !== "ADMIN" && 
        req.user.role !== "PROJECT_MANAGER" && 
        task.assignedTo !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this task" });
    }

    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { 
        progress,
        status: progress === 100 ? 'DONE' : 
                progress > 0 ? 'IN_PROGRESS' : 'PENDING'
      }
    });

    res.json({
      message: 'Task progress updated',
      progress: updatedTask.progress,
      status: updatedTask.status
    });
  } catch (err) {
    console.error('Error updating task progress:', err);
    res.status(500).json({ message: 'Failed to update task progress' });
  }
};

// Assign task to user
const assignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { assignedTo: parseInt(userId) },
      include: {
        assignee: { select: { name: true, email: true } }
      }
    });

    res.json({
      message: 'Task assigned successfully',
      taskId: task.id,
      assignee: task.assignee?.name || null,
      assigneeId: task.assignedTo
    });
  } catch (err) {
    console.error('Error assigning task:', err);
    res.status(500).json({ message: 'Failed to assign task' });
  }
};

// Add comment to task
const addTaskComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId: parseInt(id),
        userId: req.user.id
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json({
      message: 'Comment added',
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: comment.user
      }
    });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ message: 'Failed to add comment' });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user.role !== "ADMIN" && req.user.role !== "PROJECT_MANAGER") {
      return res.status(403).json({ message: "Not authorized to delete tasks" });
    }

    await prisma.comment.deleteMany({
      where: { taskId: parseInt(id) }
    });

    await prisma.task.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ message: 'Failed to delete task' });
  }
};

// Export all functions
export { 
  createTask, 
  getTasksByProject, 
  getTaskById,
  updateTaskStatus, 
  updateTaskProgress,
  assignTask,
  addTaskComment,
  deleteTask,
  getAllTasks 
};