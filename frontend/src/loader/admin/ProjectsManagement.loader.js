// src/loader/admin/ProjectsManagement.loader.js
import { apiClient } from "../../services/apiClient";

// Normalize status from backend to frontend format
const normalizeStatus = (status) => {
  if (!status) return "active";
  if (status === "COMPLETED") return "completed";
  if (status === "IN_PROGRESS") return "active";
  if (status === "PLANNED") return "active";
  return status.toLowerCase();
};

// Helper function to map project data
const mapProject = (p) => {
  const totalTasks = Array.isArray(p.tasks) ? p.tasks.length : 0;
  const completedTasks = Array.isArray(p.tasks)
    ? p.tasks.filter((t) => t.status === "COMPLETED").length
    : 0;

  const progress = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : p.status === "COMPLETED"
    ? 100
    : 0;

  return {
    id: p.id,
    name: p.name,
    team: p.team?.name || "N/A",
    manager: p.managerName || `Manager #${p.managerId}` || "Unassigned",
    progress,
    status: normalizeStatus(p.status),
    dueDate: p.endDate ? new Date(p.endDate).toLocaleDateString() : "No deadline",
  };
};

// ✅ In React Router v7, just return the promise directly - no defer needed!
export function projectsLoader() {
  return {
    projects: apiClient('/projects').then(projects => projects.map(mapProject))
  };
}

// Helper function to calculate stats
export const calculateStats = (projects) => {
  return {
    total: projects.length,
    active: projects.filter((p) => p.status === "active").length,
    completed: projects.filter((p) => p.status === "completed").length,
    averageProgress: projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
      : 0,
  };
};