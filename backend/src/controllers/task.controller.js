// backend/src/controllers/task.controller.js
import { prisma } from "../config/db.js";
import { createNotification, NOTIFICATION_TYPES } from '../utils/notificationHelper.js';

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
            status: true,
            managerId: true 
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

    if (req.user.role !== "ADMIN" && 
        req.user.role !== "PROJECT_MANAGER" && 
        task.assigneeId !== req.user.id) {
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
      assignee: task.assignee,
      projectId: task.projectId,
      project: task.project,
      comments: task.comments,
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
    const { title, description, projectId, assignedTo, dueDate, priority, estimatedHours } = req.body;

    // Check if assigned user exists
    const user = await prisma.user.findUnique({ 
      where: { id: Number(assignedTo) } 
    });
    
    if (!user) {
      return res.status(404).json({ message: "Assigned user not found" });
    }

    // Get project details to find the manager
    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) },
      select: { managerId: true, name: true }
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        title,
        description: description || "",
        status: "PENDING",
        progress: 0,
        priority: priority || "MEDIUM",
        projectId: Number(projectId),
        assigneeId: Number(assignedTo),
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Create notifications
    try {
      // Notify project manager
      if (project.managerId) {
        await createNotification({
          userId: project.managerId,
          type: NOTIFICATION_TYPES.TASK_ASSIGNED,
          title: 'Task Assigned',
          message: `Task "${task.title}" has been assigned to ${user.name || 'team member'}`,
          data: { taskId: task.id, projectId: task.projectId },
          link: `/manager/tasks/${task.id}`
        });
      }

      // Notify the assignee (team member)
      await createNotification({
        userId: task.assigneeId,
        type: NOTIFICATION_TYPES.TASK_ASSIGNED_TO_ME,
        title: 'New Task Assigned',
        message: `You have been assigned to "${task.title}" in project "${project.name}"`,
        data: { taskId: task.id, projectId: task.projectId },
        link: `/team-member/tasks/${task.id}`
      });
    } catch (notifErr) {
      console.error('Error creating notifications:', notifErr);
      // Don't fail the task creation if notifications fail
    }
    
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
      include: { 
        assignee: { 
          select: { id: true, name: true, email: true, role: true } 
        }, 
        project: { 
          select: { id: true, name: true } 
        }
      }
    });
    res.json(tasks);
  } catch (err) {
    console.error('Error in getTasksByProject:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get tasks assigned to the current user (for Team Members)
const getMyTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { 
        assigneeId: req.user.id 
      },
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
        }
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    
    // Format tasks
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      progress: task.progress || 0,
      priority: task.priority || 'MEDIUM',
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      projectId: task.projectId,
      projectName: task.project?.name || 'Unknown Project',
      assigneeId: task.assigneeId,
      assigneeName: task.assignee?.name || 'Unassigned',
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }));
    
    res.json(formattedTasks);
  } catch (err) {
    console.error('Error in getMyTasks:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update task status/progress (TEAM_MEMBER or PROJECT_MANAGER)
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress } = req.body;

    const task = await prisma.task.findUnique({ 
      where: { id: Number(id) },
      include: {
        project: { 
          select: { managerId: true, name: true } 
        },
        assignee: { 
          select: { name: true } 
        }
      }
    });
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // TEAM_MEMBER can only update their own tasks
    if (req.user.role === "TEAM_MEMBER" && task.assigneeId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: You can only update your own tasks" });
    }

    // Prepare update data
    const updateData = {
      updatedAt: new Date()
    };
    
    if (status) updateData.status = status;
    if (progress !== undefined) updateData.progress = progress;

    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: updateData
    });

    // Create notification for task completion
    if (status === 'COMPLETED' || status === 'DONE' || progress === 100) {
      try {
        // Notify project manager
        if (task.project && task.project.managerId) {
          await createNotification({
            userId: task.project.managerId,
            type: NOTIFICATION_TYPES.TASK_COMPLETED,
            title: 'Task Completed',
            message: `Task "${task.title}" was completed by ${task.assignee?.name || 'team member'}`,
            data: { taskId: task.id, projectId: task.projectId },
            link: `/manager/tasks/${task.id}`
          });
        }
      } catch (notifErr) {
        console.error('Error creating completion notification:', notifErr);
      }
    }

    res.json({ 
      message: "Task updated", 
      task: updatedTask 
    });
  } catch (err) {
    console.error('❌ Error in updateTaskStatus:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get all tasks (ADMIN + PROJECT_MANAGER)
const getAllTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: { 
        assignee: { 
          select: { id: true, name: true, email: true, role: true } 
        }, 
        project: { 
          select: { id: true, name: true } 
        }
      }
    });
    res.json(tasks);
  } catch (err) {
    console.error('Error in getAllTasks:', err);   
    res.status(500).json({ message: err.message });
  }
};

// Update task progress
const updateTaskProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;

    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
      include: {
        project: { 
          select: { managerId: true, name: true } 
        },
        assignee: { 
          select: { name: true } 
        }
      }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user.role !== "ADMIN" && 
        req.user.role !== "PROJECT_MANAGER" && 
        task.assigneeId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this task" });
    }

    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { 
        progress,
        status: progress === 100 ? 'COMPLETED' : 
                progress > 0 ? 'IN_PROGRESS' : 'PENDING'
      }
    });

    // Notify project manager when task is completed
    if (progress === 100 && task.project && task.project.managerId) {
      try {
        await createNotification({
          userId: task.project.managerId,
          type: NOTIFICATION_TYPES.TASK_COMPLETED,
          title: 'Task Completed',
          message: `Task "${task.title}" has been completed by ${task.assignee?.name || 'team member'}`,
          data: { taskId: task.id, projectId: task.projectId },
          link: `/manager/tasks/${task.id}`
        });
      } catch (notifErr) {
        console.error('Error creating completion notification:', notifErr);
      }
    }

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

    // Get current task details
    const existingTask = await prisma.task.findUnique({
      where: { id: parseInt(id) },
      include: {
        project: { 
          select: { managerId: true, name: true } 
        }
      }
    });

    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Get user info for notification
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { name: true }
    });

    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { assigneeId: parseInt(userId) },
      include: {
        assignee: { select: { name: true, email: true } }
      }
    });

    // Notify the newly assigned user
    try {
      await createNotification({
        userId: parseInt(userId),
        type: NOTIFICATION_TYPES.TASK_ASSIGNED_TO_ME,
        title: 'Task Assigned to You',
        message: `You have been assigned to task "${existingTask.title}" in project "${existingTask.project?.name}"`,
        data: { taskId: existingTask.id, projectId: existingTask.projectId },
        link: `/team-member/tasks/${existingTask.id}`
      });
    } catch (notifErr) {
      console.error('Error creating assignment notification:', notifErr);
    }

    res.json({
      message: 'Task assigned successfully',
      taskId: updatedTask.id,
      assignee: updatedTask.assignee?.name || null,
      assigneeId: updatedTask.assigneeId
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

    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
      include: {
        project: { select: { managerId: true } },
        assignee: { select: { id: true } }
      }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

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

    // Notify relevant people (project manager and assignee if they're not the commenter)
    const notifyUsers = [];
    if (task.project?.managerId && task.project.managerId !== req.user.id) {
      notifyUsers.push(task.project.managerId);
    }
    if (task.assigneeId && task.assigneeId !== req.user.id) {
      notifyUsers.push(task.assigneeId);
    }

    // Send notifications
    try {
      for (const userId of notifyUsers) {
        await createNotification({
          userId,
          type: NOTIFICATION_TYPES.COMMENT_ADDED,
          title: 'New Comment',
          message: `${req.user.name} commented on task "${task.title}"`,
          data: { taskId: task.id, commentId: comment.id },
          link: `/tasks/${task.id}`
        });
      }
    } catch (notifErr) {
      console.error('Error creating comment notification:', notifErr);
    }

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

const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params; // id is taskId, commentId is the comment's ID

    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) }
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Security: Only the author, an ADMIN, or a PROJECT_MANAGER can delete
    const isAuthor = comment.userId === req.user.id;
    const isPrivileged = req.user.role === "ADMIN" || req.user.role === "PROJECT_MANAGER";

    if (!isAuthor && !isPrivileged) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    await prisma.comment.delete({
      where: { id: parseInt(commentId) }
    });

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ message: "Failed to delete comment" });
  }
};

// Remember to add deleteComment to your export { ... } list at the bottom!


// Update task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assigneeId, priority, dueDate, estimatedHours, status, progress } = req.body;

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: parseInt(id) },
      include: {
        project: { select: { managerId: true } }
      }
    });

    if (!existingTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Build update data
    const updateData = {
      updatedAt: new Date()
    };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (assigneeId !== undefined) updateData.assigneeId = parseInt(assigneeId);
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours ? parseFloat(estimatedHours) : null;
    if (status !== undefined) updateData.status = status;
    if (progress !== undefined) updateData.progress = progress;

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

    // Delete comments first (due to foreign key constraint)
    await prisma.comment.deleteMany({
      where: { taskId: parseInt(id) }
    });

    // Delete the task
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
  getMyTasks,
  getTaskById,
  updateTaskStatus, 
  updateTaskProgress,
  assignTask,
  addTaskComment,
  deleteTask,
  getAllTasks,
  updateTask,
  deleteComment
};