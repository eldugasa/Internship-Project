// src/loader/manager/Tasks.loader.js
import { getTasks } from '../../services/tasksService';
import { getProjects } from '../../services/projectsService';

// Helper functions
export const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'in-progress': return 'bg-blue-100 text-blue-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getProjectName = (projectId, projects) => {
  const project = projects.find(p => p.id === projectId);
  return project?.name || 'Unknown';
};

// Calculate stats
export const calculateTaskStats = (tasks) => {
  const now = new Date();
  return {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => 
      t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < now
    ).length,
    highPriority: tasks.filter(t => t.priority === 'high').length
  };
};

// Filter tasks
export const filterTasks = (tasks, filter, searchQuery) => {
  let result = tasks;

  // Status filter
  if (filter !== 'all') {
    result = result.filter(task => task.status === filter);
  }

  // Search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    result = result.filter(task =>
      task.title?.toLowerCase().includes(query) ||
      task.projectName?.toLowerCase().includes(query) ||
      task.assigneeName?.toLowerCase().includes(query) ||
      task.priority?.toLowerCase().includes(query) ||
      task.status?.toLowerCase().includes(query)
    );
  }

  return result;
};

// Main loader - Return promises directly for instant navigation
export function tasksLoader() {
  return {
    tasks: getTasks(),
    projects: getProjects()
  };
}