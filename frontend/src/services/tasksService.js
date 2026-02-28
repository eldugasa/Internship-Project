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

const normalizeTask = (task) => {
  // Log to see what we're getting

  
  return {
    ...task,
    id: task.id,
    title: task.title,
    description: task.description || '',
    status: statusMap[task.status] || task.status?.toLowerCase() || 'pending',
    priority: priorityMap[task.priority] || task.priority?.toLowerCase() || 'medium',
    progress: task.progress || 0,
    
    // Assignee fields - handle both nested and direct formats
    assigneeId: task.assigneeId,
    assignee: task.assignee || null,
    assigneeName: task.assignee?.name || task.assigneeName || 'Unassigned',
    
    // Project fields
    projectId: task.projectId,
    project: task.project || null,
    projectName: task.project?.name || task.projectName || 'Unknown Project',
    
    // Date fields - handle properly
    dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : null,
    rawDueDate: task.dueDate, // Keep original for editing
    
    // Other fields
    estimatedHours: task.estimatedHours || 0,
    actualHours: task.actualHours || 0,
    tags: task.tags || [],
    comments: task.comments || [],
    
    // Timestamps
    createdAt: task.createdAt ? new Date(task.createdAt).toLocaleDateString() : null,
    updatedAt: task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : null
  };
};

// Get all tasks
export const getTasks = async () => {
  const tasks = await apiClient('/tasks');
  return tasks.map(normalizeTask);
};

export const getTaskById = async (id) => {
  const response = await apiClient(`/tasks/${id}`);
  console.log('getTaskById response:', response);
  // The response might be the task directly or nested
  const taskData = response.task || response;
  return normalizeTask(taskData);
};

// Get tasks by project
export const getTasksByProject = async (projectId) => {
  const tasks = await apiClient(`/tasks/project/${projectId}`);
  return tasks.map(normalizeTask);
};
export const createTask = async (taskData) => {
  console.log('createTask received:', taskData);
  
  const payload = {
    title: taskData.title,
    description: taskData.description || '',
    projectId: parseInt(taskData.projectId),
    assignedTo: parseInt(taskData.assigneeId || taskData.assignedTo),
    dueDate: taskData.dueDate,
    priority: taskData.priority?.toUpperCase() || 'MEDIUM',
    estimatedHours: taskData.estimatedHours ? parseFloat(taskData.estimatedHours) : null
  };

  console.log('Sending payload:', payload);

  const response = await apiClient('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  
  
   taskData = response.task || response;
  return normalizeTask(taskData);
};

// Get tasks assigned to current user (for Team Members)
export const getMyTasks = async () => {
  try {
    const tasks = await apiClient('/tasks/my-tasks');
    return tasks.map(normalizeTask);
  } catch (error) {
    console.error('Error fetching my tasks:', error);
    return [];
  }
};

// Update the existing getTasksByUser to use the new endpoint
export const getTasksByUser = async (userId) => {
  
  if (userId === JSON.parse(localStorage.getItem('user'))?.id) {
    return getMyTasks();
  }
  const tasks = await getTasks();
  return tasks.filter(t => t.assigneeId === userId);
};

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

  const response = await apiClient(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...taskData,
      status: backendStatus,
      priority: backendPriority
    })
  });
  
  
   taskData = response.task || response;
  return normalizeTask(taskData);
};

// Update task status

export const updateTaskStatus = async (taskId, status, progress) => {
  try {
   
    
    const backendStatus = {
      'pending': 'PENDING',
      'in-progress': 'IN_PROGRESS',
      'completed': 'COMPLETED',
      'blocked': 'BLOCKED',
      'review': 'REVIEW'
    }[status] || 'PENDING';

    const payload = { 
      status: backendStatus
    };
    
    if (progress !== undefined) {
      payload.progress = progress;
    }

    console.log('Sending payload to backend:', payload);

    const response = await apiClient(`/tasks/${taskId}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    
 
    const taskData = response.task || response;
    return normalizeTask(taskData);
  } catch (error) {
    console.error('Error in updateTaskStatus:', error);
    throw error;
  }
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


export const getTaskComments = async (taskId) => {
  try {
    const comments = await apiClient(`/tasks/${taskId}/comments`);
    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};



export const addTaskComment = async (taskId, commentData) => {
  const response = await apiClient(`/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify(commentData)
  });
  return response.comment; // Return only the comment object
};
export const deleteTaskComment = async (taskId, commentId) => {
  return await apiClient(`/tasks/${taskId}/comments/${commentId}`, {
    method: 'DELETE'
  });
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