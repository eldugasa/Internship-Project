// src/services/projectsService.js
import { apiClient } from "./apiClient";

// Status mapping helper
const statusMap = {
  PLANNED: "planned",
  IN_PROGRESS: "active",
  COMPLETED: "completed",
  ON_HOLD: "on-hold",
  CANCELLED: "cancelled",
};

const reverseStatusMap = {
  planned: "PLANNED",
  active: "IN_PROGRESS",
  completed: "COMPLETED",
  "on-hold": "ON_HOLD",
  cancelled: "CANCELLED",
};

const clampProgress = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return 0;
  if (numericValue < 0) return 0;
  if (numericValue > 100) return 100;

  return numericValue;
};

export const resolveProjectProgress = (project, tasks = null) => {
  const normalizedStatus =
    statusMap[project?.status] || project?.status?.toLowerCase() || "planned";

  if (normalizedStatus === "completed") {
    return 100;
  }

  if (Array.isArray(tasks) && tasks.length > 0) {
    const completedTasks = tasks.filter(
      (task) => task.status === "completed" || task.status === "passed",
    ).length;

    return Math.round((completedTasks / tasks.length) * 100);
  }

  const taskSummary = project?.tasks;
  const totalTasks = Number(taskSummary?.total ?? 0);
  const completedTasks = Number(taskSummary?.completed ?? 0);

  if (Number.isFinite(totalTasks) && totalTasks > 0) {
    return Math.round((completedTasks / totalTasks) * 100);
  }

  return clampProgress(project?.progress);
};

// Helper to normalize project data
const normalizeProject = (project) => ({
  ...project,
  id: project.id,
  name: project.name,
  description: project.description || "",
  status:
    statusMap[project.status] || project.status?.toLowerCase() || "planned",
  progress: resolveProjectProgress(project),
  startDate: project.startDate
    ? new Date(project.startDate).toLocaleDateString()
    : null,
  endDate: project.endDate
    ? new Date(project.endDate).toLocaleDateString()
    : null,
  dueDate: project.endDate
    ? new Date(project.endDate).toLocaleDateString()
    : null,
  teamId: project.teamId,
  team: project.team?.name || project.teamName || "Unassigned",
  teamName: project.team?.name || project.teamName || "Unassigned",
  teamMembers: project.teamMembers || project.members || [],
  tasks: project.tasks || {
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
  },
  budget: project.budget || 0,
  spent: project.spent || 0,
  manager: project.manager?.name || project.leadName || "Unassigned",
  managerName: project.manager?.name || project.leadName || "Unassigned",
  createdAt: project.createdAt
    ? new Date(project.createdAt).toLocaleDateString()
    : null,
  updatedAt: project.updatedAt
    ? new Date(project.updatedAt).toLocaleDateString()
    : null,
});

// Get all projects
export const getProjects = async ({ signal } = {}) => {
  const projects = await apiClient("/projects", { signal });
  return projects.map(normalizeProject);
};

// Get project by ID
export const getProjectById = async (id, { signal } = {}) => {
  const project = await apiClient(`/projects/${id}`, { signal });
  return normalizeProject(project);
};

// Create new project
export const createProject = async (projectData, { signal } = {}) => {
  const backendStatus = reverseStatusMap[projectData.status] || "PLANNED";

  const project = await apiClient("/projects", {
    method: "POST",
    body: JSON.stringify({
      ...projectData,
      status: backendStatus,
    }),
    signal,
  });
  return normalizeProject(project);
};

// Update project
export const updateProject = async (id, projectData, { signal } = {}) => {
  try {
    // If we're only updating status with a direct backend value
    if (
      Object.keys(projectData).length === 1 &&
      projectData.status === "IN_PROGRESS"
    ) {
      const payload = { status: "IN_PROGRESS" };

      const project = await apiClient(`/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        signal,
      });

      return normalizeProject(project);
    }

    const backendStatus = reverseStatusMap[projectData.status] || "PLANNED";

    const payload = {
      name: projectData.name,
      description: projectData.description,
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      status: backendStatus,
      teamId: projectData.teamId,
    };

    const project = await apiClient(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      signal,
    });

    return normalizeProject(project);
  } catch (error) {
    console.error("Error in updateProject:", error);
    throw error;
  }
};

// Delete project
export const deleteProject = async (id, { signal } = {}) => {
  return apiClient(`/projects/${id}`, {
    method: "DELETE",
    signal,
  });
};

// Get project members
export const getProjectMembers = async (projectId, { signal } = {}) => {
  const members = await apiClient(`/projects/${projectId}/members`, { signal });
  return members;
};

// Add member to project
export const addMemberToProject = async (
  projectId,
  userId,
  { signal } = {},
) => {
  return apiClient(`/projects/${projectId}/members`, {
    method: "POST",
    body: JSON.stringify({ userId }),
    signal,
  });
};

// Remove member from project
export const removeMemberFromProject = async (
  projectId,
  userId,
  { signal } = {},
) => {
  return apiClient(`/projects/${projectId}/members/${userId}`, {
    method: "DELETE",
    signal,
  });
};

// Get projects by team
export const getProjectsByTeam = async (teamId, { signal } = {}) => {
  const projects = await getProjects({ signal });
  return projects.filter((p) => p.teamId === teamId);
};

// Get projects by user
export const getProjectsByUser = async (userId, { signal } = {}) => {
  const projects = await getProjects({ signal });
  return projects.filter(
    (p) =>
      p.teamMembers?.some((m) => m.id === userId || m === userId) ||
      p.manager?.id === userId,
  );
};
