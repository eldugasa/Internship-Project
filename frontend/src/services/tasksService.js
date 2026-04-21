// src/services/tasksService.js
import { apiClient } from './apiClient';
 
// Status mapping helper
const statusMap = {
  'PENDING': 'pending',
  'IN_PROGRESS': 'in-progress',
  'COMPLETED': 'completed',
  'BLOCKED': 'blocked',
  'REVIEW': 'review',
  'IN_TEST': 'in-test',
  'PASSED': 'passed',
  'FAILED': 'failed',
  'PENDING_RETEST': 'pending-retest'
};
 
const reverseStatusMap = {
  'pending': 'PENDING',
  'in-progress': 'IN_PROGRESS',
  'completed': 'COMPLETED',
  'blocked': 'BLOCKED',
  'review': 'REVIEW',
  'in-test': 'IN_TEST',
  'passed': 'PASSED',
  'failed': 'FAILED',
  'pending-retest': 'PENDING_RETEST'
};
 
// Priority mapping
const priorityMap = {
  'LOW': 'low',
  'MEDIUM': 'medium',
  'HIGH': 'high',
  'CRITICAL': 'critical'
};
 
const reversePriorityMap = {
  'low': 'LOW',
  'medium': 'MEDIUM',
  'high': 'HIGH',
  'critical': 'CRITICAL'
};

const doneStatuses = new Set(['completed', 'passed']);

const normalizeProgress = (task) => {
  const normalizedStatus = statusMap[task.status] || task.status?.toLowerCase() || 'pending';

  if (doneStatuses.has(normalizedStatus)) {
    return 100;
  }

  const progress = Number(task.progress);

  if (!Number.isFinite(progress)) {
    return 0;
  }

  if (progress < 0) return 0;
  if (progress > 100) return 100;
  return progress;
};
 
const normalizeTask = (task) => {
  const normalizedStatus = statusMap[task.status] || task.status?.toLowerCase() || 'pending';

  return {
    ...task,
    id: task.id,
    title: task.title,
    description: task.description || '',
    status: normalizedStatus,
    priority: priorityMap[task.priority] || task.priority?.toLowerCase() || 'medium',
    progress: normalizeProgress(task),
    previousProgress: task.previousProgress || 0,
    
    assigneeId: task.assigneeId || task.assignedTo,
    assignee: task.assignee || null,
    assigneeName: task.assignee?.name || task.assigneeName || 'Unassigned',
    qaTesterId: task.qaTesterId || null,
    qaTester: task.qaTester || null,
    qaTesterName: task.qaTester?.name || task.qaTesterName || 'Unassigned',
    
    projectId: task.projectId,
    project: task.project || null,
    projectName: task.project?.name || task.projectName || 'Unknown Project',
    teamName:
      task.project?.team?.name ||
      task.project?.teamName ||
      task.team?.name ||
      task.teamName ||
      'Unassigned',
    
    dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : null,
    rawDueDate: task.dueDate,

    tags: task.tags || [],
    comments: task.comments || [],
    
    createdAt: task.createdAt ? new Date(task.createdAt).toLocaleDateString() : null,
    updatedAt: task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : null
  };
};
 
// Get all tasks
export const getTasks = async ({ signal } = {}) => {
  const tasks = await apiClient('/tasks', { signal });
  return tasks.map(normalizeTask);
};
 
// Get task by ID
export const getTaskById = async (id, { signal } = {}) => {
  const response = await apiClient(`/tasks/${id}`, { signal });
  const taskData = response.task || response;
  return normalizeTask(taskData);
};
 
// Get tasks by project
export const getTasksByProject = async (projectId, { signal } = {}) => {
  const tasks = await apiClient(`/tasks/project/${projectId}`, { signal });
  return tasks.map(normalizeTask);
};
 
// Create task
export const createTask = async (taskData, { signal } = {}) => {
  const payload = {
    title: taskData.title,
    description: taskData.description || '',
    projectId: parseInt(taskData.projectId),
    assignedTo: parseInt(taskData.assigneeId || taskData.assignedTo),
    qaTesterId: taskData.qaTesterId ? parseInt(taskData.qaTesterId) : null,
    dueDate: taskData.dueDate,
    priority: reversePriorityMap[taskData.priority] || 'MEDIUM'
  };
 
  const response = await apiClient('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
    signal
  });
  
  const taskResponse = response.task || response;
  return normalizeTask(taskResponse);
};
 
// Get tasks assigned to current user
export const getMyTasks = async ({ signal } = {}) => {
  try {
    const tasks = await apiClient('/tasks/my-tasks', { signal });
    return tasks.map(normalizeTask);
  } catch (error) {
    if (error.name === 'AbortError') {
      return [];
    }
    console.error('Error fetching my tasks:', error);
    return [];
  }
};
 
// Get tasks by user
export const getTasksByUser = async (userId, { signal } = {}) => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (userId === currentUser?.id) {
    return getMyTasks({ signal });
  }
  
  const tasks = await getTasks({ signal });
  return tasks.filter(t => t.assigneeId === userId);
};
 
// Update task
export const updateTask = async (id, taskData, { signal } = {}) => {
  const backendStatus = reverseStatusMap[taskData.status] || 'PENDING';
  const backendPriority = reversePriorityMap[taskData.priority] || 'MEDIUM';
 
  const response = await apiClient(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...taskData,
      assigneeId: taskData.assigneeId || taskData.assignedTo,
      qaTesterId: taskData.qaTesterId ?? null,
      status: backendStatus,
      priority: backendPriority
    }),
    signal
  });
  
  const taskResponse = response.task || response;
  return normalizeTask(taskResponse);
};
 
// Update task status
export const updateTaskStatus = async (taskId, status, progress, { signal } = {}) => {
  const backendStatus = reverseStatusMap[status] || 'PENDING';
 
  const payload = { status: backendStatus };
  
  if (progress !== undefined) {
    payload.progress = progress;
  }
 
  const response = await apiClient(`/tasks/${taskId}/status`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    signal
  });
  
  const taskData = response.task || response;
  return normalizeTask(taskData);
};
 
// Update task progress
export const updateTaskProgress = async (taskId, progress, { signal } = {}) => {
  const task = await apiClient(`/tasks/${taskId}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ progress }),
    signal
  });
  return normalizeTask(task);
};
 
// Delete task
export const deleteTask = async (taskId, { signal } = {}) => {
  return apiClient(`/tasks/${taskId}`, {
    method: 'DELETE',
    signal
  });
};
 
// Assign task to user
export const assignTask = async (taskId, userId, { signal } = {}) => {
  const task = await apiClient(`/tasks/${taskId}/assign`, {
    method: 'PUT',
    body: JSON.stringify({ userId }),
    signal
  });
  return normalizeTask(task);
};
 
// Get task comments
export const getTaskComments = async (taskId, { signal } = {}) => {
  try {
    const comments = await apiClient(`/tasks/${taskId}/comments`, { signal });
    return comments;
  } catch (error) {
    if (error.name === 'AbortError') {
      return [];
    }
    console.error('Error fetching comments:', error);
    return [];
  }
};
 
// Add task comment
export const addTaskComment = async (taskId, commentData, { signal } = {}) => {
  const response = await apiClient(`/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify(commentData),
    signal
  });
  return response.comment || response;
};
 
// Delete task comment
export const deleteTaskComment = async (taskId, commentId, { signal } = {}) => {
  return await apiClient(`/tasks/${taskId}/comments/${commentId}`, {
    method: 'DELETE',
    signal
  });
};
 
// Get tasks by team
export const getTasksByTeam = async (teamId, { signal } = {}) => {
  const tasks = await getTasks({ signal });
  return tasks.filter(t => t.teamId === teamId);
};
 
// Get task statistics
export const getTaskStats = async (projectId, { signal } = {}) => {
  const tasks = projectId ? await getTasksByProject(projectId, { signal }) : await getTasks({ signal });
  
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
    },
    completionRate: tasks.length > 0
      ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
      : 0
  };
};
