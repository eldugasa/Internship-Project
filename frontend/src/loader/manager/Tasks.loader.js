// src/loader/manager/Tasks.loader.js
import { getTasks } from '../../services/tasksService';
import { getProjects } from '../../services/projectsService';
import { queryClient } from '../../services/apiClient';
import {
  calculateTaskStats,
  filterTasks,
  formatDate,
  getPriorityColor,
  getProjectName,
  getStatusColor,
  isTaskOverdue,
  parseDate,
} from "../../features/tasks/taskShared";

export {
  calculateTaskStats,
  filterTasks,
  formatDate,
  getPriorityColor,
  getProjectName,
  getStatusColor,
  isTaskOverdue,
  parseDate,
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
