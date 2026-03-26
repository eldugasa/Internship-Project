// src/admin/DashboardOverview.loader.js
import { getProjects } from "../../services/projectsService";
import { getUsers } from "../../services/usersService";
import { getTeams } from "../../services/teamsService";
import { getTasks } from "../../services/tasksService";

export async function dashboardLoader() {
  // 2. Just return the object. 
  // Because we are NOT using 'await' here, these stay as Promises.
  // React Router 7 will treat these as deferred automatically.
  return {
    projects: getProjects(),
    users: getUsers(),
    teams: getTeams(),
    tasks: getTasks()
  };
}

// Shared constants
export const DASHBOARD_COLORS = {
  planned: '#94A3B8',
  active: '#0f5841',
  completed: '#10B981',
  'on-hold': '#F59E0B',
  pending: '#94A3B8',
  in_progress: '#194f87',
  done: '#10B981',
  admin: '#8B5CF6',
  'project-manager': '#3B82F6',
  'team-member': '#10B981',
};

// Shared helper functions
export const getStatusConfig = (status) => {
  const configs = {
    planned: { label: "Planned", color: "bg-gray-100 text-gray-800", icon: "📋" },
    active: { label: "In Progress", color: "bg-green-100 text-green-800", icon: "🚀" },
    completed: { label: "Completed", color: "bg-blue-100 text-blue-800", icon: "✅" },
    "on-hold": { label: "On Hold", color: "bg-yellow-100 text-yellow-800", icon: "⏸️" },
  };
  return configs[status] || configs.planned;
};

export const getCompletionPercentage = (project) => {
  if (project.tasks?.total > 0) {
    return Math.round(((project.tasks.completed || 0) / project.tasks.total) * 100);
  }
  return project.status === "completed" ? 100 : 0;
};