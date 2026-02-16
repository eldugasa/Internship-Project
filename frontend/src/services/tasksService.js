// src/services/tasksService.js
import { apiClient } from './apiClient';

// Status mapping helper
const statusMap = {
  'PENDING': 'pending',
  'IN_PROGRESS': 'in-progress',
  'COMPLETED': 'completed',
  'BLOCKED': 'blocked',
  'REVIEW': 'review'
};

// Priority mapping
const priorityMap = {
  'LOW': 'low',
  'MEDIUM': 'medium',
  'HIGH': 'high',
  'CRITICAL': 'critical'
};

// Helper to normalize task data
const normalizeTask = (task) => ({
  ...task,
  id: task.id,
  title: task.title,
  description: task.description || '',
  status: statusMap[task.status] || task.status?.toLowerCase() || 'pending',
  priority: priorityMap[task.priority] || task.priority?.toLowerCase() || 'medium',
  progress: task.progress || 0,
  assigneeId: task.assigneeId,
  assignee: task.assignee || task.assignedTo || null,
  assigneeName: task.assignee?.name || task.assignedToName || 'Unassigned',
  projectId: task.projectId,
  projectName: task.project?.name || task.projectName || 'Unknown Project',
  teamId: task.teamId,
  teamName: task.team?.name || task.teamName,
  dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : null,
  startDate: task.startDate ? new Date(task.startDate).toLocaleDateString() : null,
  completedDate: task.completedDate ? new Date(task.completedDate).toLocaleDateString() : null,
  estimatedHours: task.estimatedHours || 0,
  actualHours: task.actualHours || 0,
  tags: task.tags || [],
  comments: task.comments || [],
  attachments: task.attachments || [],
  createdAt: task.createdAt ? new Date(task.createdAt).toLocaleDateString() : null,
  updatedAt: task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : null
});

// Get all tasks
export const getTasks = async () => {
  const tasks = await apiClient('/tasks');
  return tasks.map(normalizeTask);
};

// Get task by ID
export const getTaskById = async (id) => {
  const task = await apiClient(`/tasks/${id}`);
  return normalizeTask(task);
};

// Get tasks by project
export const getTasksByProject = async (projectId) => {
  const tasks = await apiClient(`/tasks/project/${projectId}`);
  return tasks.map(normalizeTask);
};

// Create new task
export const createTask = async (taskData) => {
  // Convert UI status to backend status
  const backendStatus = {
    'pending': 'PENDING',
    'in-progress': 'IN_PROGRESS',
    'completed': 'COMPLETED',
    'blocked': 'BLOCKED',
    'review': 'REVIEW'
  }[taskData.status] || 'PENDING';

  const backendPriority = {
    'low': 'LOW',
    'medium': 'MEDIUM',
    'high': 'HIGH',
    'critical': 'CRITICAL'
  }[taskData.priority] || 'MEDIUM';

  const task = await apiClient('/tasks', {
    method: 'POST',
    body: JSON.stringify({
      ...taskData,
      status: backendStatus,
      priority: backendPriority
    })
  });
  return normalizeTask(task);
};

// Update task
export const updateTask = async (id, taskData) => {
  const backendStatus = {
    'pending': 'PENDING',
    'in-progress': 'IN_PROGRESS',
    'completed': 'COMPLETED',
    'blocked': 'BLOCKED',
    'review': 'REVIEW'
  }[taskData.status] || 'PENDING';

  const backendPriority = {
    'low': 'LOW',
    'medium': 'MEDIUM',
    'high': 'HIGH',
    'critical': 'CRITICAL'
  }[taskData.priority] || 'MEDIUM';

  const task = await apiClient(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...taskData,
      status: backendStatus,
      priority: backendPriority
    })
  });
  return normalizeTask(task);
};

// Update task status
export const updateTaskStatus = async (taskId, status) => {
  const backendStatus = {
    'pending': 'PENDING',
    'in-progress': 'IN_PROGRESS',
    'completed': 'COMPLETED',
    'blocked': 'BLOCKED',
    'review': 'REVIEW'
  }[status] || 'PENDING';

  const task = await apiClient(`/tasks/${taskId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: backendStatus })
  });
  return normalizeTask(task);
};

// Update task progress
export const updateTaskProgress = async (taskId, progress) => {
  const task = await apiClient(`/tasks/${taskId}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ progress })
  });
  return normalizeTask(task);
};

// Delete task
export const deleteTask = async (taskId) => {
  return apiClient(`/tasks/${taskId}`, {
    method: 'DELETE'
  });
};

// Assign task to user
export const assignTask = async (taskId, userId) => {
  const task = await apiClient(`/tasks/${taskId}/assign`, {
    method: 'PUT',
    body: JSON.stringify({ userId })
  });
  return normalizeTask(task);
};

// Add comment to task
export const addTaskComment = async (taskId, comment) => {
  return apiClient(`/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ comment })
  });
};

// Get tasks assigned to user
export const getTasksByUser = async (userId) => {
  const tasks = await getTasks();
  return tasks.filter(t => t.assigneeId === userId);
};

// Get tasks by team
export const getTasksByTeam = async (teamId) => {
  const tasks = await getTasks();
  return tasks.filter(t => t.teamId === teamId);
};

// Get task statistics
export const getTaskStats = async (projectId) => {
  const tasks = projectId ? await getTasksByProject(projectId) : await getTasks();
  
  return {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    review: tasks.filter(t => t.status === 'review').length,
    byPriority: {
      low: tasks.filter(t => t.priority === 'low').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      high: tasks.filter(t => t.priority === 'high').length,
      critical: tasks.filter(t => t.priority === 'critical').length
    }
  };
};