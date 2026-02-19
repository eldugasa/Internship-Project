// backend/src/controllers/task.controller.js
import { prisma } from "../config/db.js";  // ✅ CRITICAL: This was missing!

// Get task by ID
// In backend/src/controllers/task.controller.js - Update getTaskById:

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

    // Check authorization - FIX: Use assigneeId instead of assignedTo
    if (req.user.role !== "ADMIN" && 
        req.user.role !== "PROJECT_MANAGER" && 
        task.assigneeId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view this task" });
    }

    // Format response to match what frontend's normalizeTask expects
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
      
      // Assignee info - frontend expects these fields
      assigneeId: task.assigneeId,
      assignee: task.assignee, // Full assignee object
      
      // Project info
      projectId: task.projectId,
      project: task.project, // Full project object
      
      // Comments
      comments: task.comments,
      
      // Timestamps
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
         assigneeId: Number(assignedTo),
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

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assigneeId, priority, dueDate, estimatedHours, status, progress } = req.body;

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Build update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (assigneeId !== undefined) updateData.assigneeId = parseInt(assigneeId);
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours ? parseFloat(estimatedHours) : null;
    if (status !== undefined) updateData.status = status;
    if (progress !== undefined) updateData.progress = progress;
    
    updateData.updatedAt = new Date();

    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } }
      }
    });

    res.json({
      message: "Task updated successfully",
      task: updatedTask
    });
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ message: err.message });
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
  getAllTasks,
  updateTask 
};