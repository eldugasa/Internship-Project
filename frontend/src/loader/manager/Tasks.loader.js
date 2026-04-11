// src/loader/manager/Tasks.loader.js
import { getTasks } from '../../services/tasksService';
import { getProjects } from '../../services/projectsService';
import { queryClient } from '../../services/apiClient';

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

export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return 'N/A';
  }
};

export const parseDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return new Date(year, month - 1, day);
    }
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

export const isTaskOverdue = (task) => {
  if (!task || task.status === 'completed') return false;
  if (!task.dueDate) return false;
  
  const dueDate = parseDate(task.dueDate);
  if (!dueDate) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  
  return dueDate < today;
};

export const calculateTaskStats = (tasks) => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const overdue = tasks.filter(t => isTaskOverdue(t)).length;
  const highPriority = tasks.filter(t => t.priority === 'high' || t.priority === 'critical').length;
  
  return {
    total,
    completed,
    overdue,
    highPriority
  };
};

export const filterTasks = (tasks, filter, searchQuery) => {
  let result = tasks;
  if (filter !== 'all') {
    result = result.filter(task => task.status === filter);
  }
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    result = result.filter(task =>
      task.title?.toLowerCase().includes(query) ||
      task.projectName?.toLowerCase().includes(query) ||
      task.assigneeName?.toLowerCase().includes(query)
    );
  }
  return result;
};

// React Query keys
export const tasksQueryKeys = {
  all: ['tasks'],
  projects: ['projects']
};

// React Query configs - FIXED: Return data directly, not a promise that resolves to a promise
export const tasksQuery = () => ({
  queryKey: tasksQueryKeys.all,
  queryFn: async ({ signal }) => {
    const tasks = await getTasks({ signal });
    return Array.isArray(tasks) ? tasks : [];
  },
  staleTime: 1000 * 60 * 3,
  gcTime: 1000 * 60 * 10,
});

export const projectsQuery = () => ({
  queryKey: tasksQueryKeys.projects,
  queryFn: async ({ signal }) => {
    const projects = await getProjects({ signal });
    return Array.isArray(projects) ? projects : [];
  },
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
});

// FIXED: Loader - Return plain promises, not wrapped in another promise
export async function tasksLoader() {
  try {
    const [tasks, projects] = await Promise.all([
      queryClient.ensureQueryData(tasksQuery()),
      queryClient.ensureQueryData(projectsQuery())
    ]);
    
    return {
      tasks,
      projects
    };
  } catch (error) {
    console.error('Error in tasksLoader:', error);
    return {
      tasks: [],
      projects: []
    };
  }
}

// Helper to invalidate queries
export const invalidateTasksQueries = async () => {
  await queryClient.invalidateQueries({ queryKey: tasksQueryKeys.all });
};