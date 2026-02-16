// src/services/projectsService.js
import { apiClient } from './apiClient';

// Status mapping helper
const statusMap = {
  'PLANNED': 'planned',
  'IN_PROGRESS': 'active',
  'COMPLETED': 'completed',
  'ON_HOLD': 'on-hold',
  'CANCELLED': 'cancelled'
};

// Helper to normalize project data
const normalizeProject = (project) => ({
  ...project,
  id: project.id,
  name: project.name,
  description: project.description || '',
  status: statusMap[project.status] || project.status?.toLowerCase() || 'planned',
  progress: project.progress || 0,
  startDate: project.startDate ? new Date(project.startDate).toLocaleDateString() : null,
  endDate: project.endDate ? new Date(project.endDate).toLocaleDateString() : null,
  dueDate: project.endDate ? new Date(project.endDate).toLocaleDateString() : null, // For UI compatibility
  teamId: project.teamId,
  teamName: project.team?.name || project.teamName || 'Unassigned',
  teamMembers: project.teamMembers || project.members || [],
  tasks: project.tasks || {
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0
  },
  budget: project.budget || 0,
  spent: project.spent || 0,
  manager: project.manager || project.lead || null,
  managerName: project.manager?.name || project.leadName || 'Unassigned',
  createdAt: project.createdAt ? new Date(project.createdAt).toLocaleDateString() : null,
  updatedAt: project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : null
});

// Get all projects
export const getProjects = async () => {
  const projects = await apiClient('/projects');
  return projects.map(normalizeProject);
};

// Get project by ID
export const getProjectById = async (id) => {
  const project = await apiClient(`/projects/${id}`);
  return normalizeProject(project);
};

// Create new project
export const createProject = async (projectData) => {
  // Convert UI status to backend status
  const backendStatus = {
    'planned': 'PLANNED',
    'active': 'IN_PROGRESS',
    'completed': 'COMPLETED',
    'on-hold': 'ON_HOLD',
    'cancelled': 'CANCELLED'
  }[projectData.status] || 'PLANNED';

  const project = await apiClient('/projects', {
    method: 'POST',
    body: JSON.stringify({
      ...projectData,
      status: backendStatus
    })
  });
  return normalizeProject(project);
};

// Update project
export const updateProject = async (id, projectData) => {
  const backendStatus = {
    'planned': 'PLANNED',
    'active': 'IN_PROGRESS',
    'completed': 'COMPLETED',
    'on-hold': 'ON_HOLD',
    'cancelled': 'CANCELLED'
  }[projectData.status] || 'PLANNED';

  const project = await apiClient(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...projectData,
      status: backendStatus
    })
  });
  return normalizeProject(project);
};

// Delete project
export const deleteProject = async (id) => {
  return apiClient(`/projects/${id}`, {
    method: 'DELETE'
  });
};

// Get project members
export const getProjectMembers = async (projectId) => {
  const members = await apiClient(`/projects/${projectId}/members`);
  return members;
};

// Add member to project
export const addMemberToProject = async (projectId, userId) => {
  return apiClient(`/projects/${projectId}/members`, {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
};

// Remove member from project
export const removeMemberFromProject = async (projectId, userId) => {
  return apiClient(`/projects/${projectId}/members/${userId}`, {
    method: 'DELETE'
  });
};

// Get projects by team
export const getProjectsByTeam = async (teamId) => {
  const projects = await getProjects();
  return projects.filter(p => p.teamId === teamId);
};

// Get projects by user
export const getProjectsByUser = async (userId) => {
  const projects = await getProjects();
  return projects.filter(p => 
    p.teamMembers?.some(m => m.id === userId || m === userId) ||
    p.manager?.id === userId
  );
};