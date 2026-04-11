// src/services/teamsService.js
import { apiClient } from './apiClient';
 
// Helper to safely get a number from any value
const safeNumber = (value, defaultValue = 0) => {
  const num = parseInt(value);
  return isNaN(num) ? defaultValue : Math.max(0, num);
};
 
// Helper to safely get a string from any value
const safeString = (value, defaultValue = '') => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return defaultValue;
  return String(value);
};
 
// Helper to normalize team data - NO AUTO-ASSIGNMENT
const normalizeTeam = (team) => {
  let memberCount = 0;
  if (team.memberCount !== undefined) {
    memberCount = safeNumber(team.memberCount);
  } else if (team.members && Array.isArray(team.members)) {
    memberCount = team.members.length;
  } else if (team.users && Array.isArray(team.users)) {
    memberCount = team.users.length;
  }
  
  let projectCount = 0;
  if (team.projectCount !== undefined) {
    projectCount = safeNumber(team.projectCount);
  } else if (team.projects && Array.isArray(team.projects)) {
    projectCount = team.projects.length;
  }
  
  let leadName = 'Unassigned';
  
  if (team.leadName && typeof team.leadName === 'string' && team.leadName !== 'Unassigned') {
    leadName = team.leadName;
  } else if (team.lead && typeof team.lead === 'string' && team.lead !== 'Unassigned') {
    leadName = team.lead;
  } else if (team.lead && typeof team.lead === 'object' && team.lead.name) {
    leadName = safeString(team.lead.name, 'Unassigned');
  }
  
  return {
    id: safeNumber(team.id),
    name: safeString(team.name, 'Unnamed Team'),
    description: safeString(team.description),
    lead: leadName,
    leadId: team.leadId ? safeNumber(team.leadId) : null,
    leadName: leadName,
    memberCount: memberCount,
    projectCount: projectCount,
    members: Array.isArray(team.members) ? team.members : [],
    projects: Array.isArray(team.projects) ? team.projects : []
  };
};
 
// Get all teams
export const getTeams = async ({ signal } = {}) => {
  const response = await apiClient('/teams', { signal });
  const teams = Array.isArray(response) ? response : (response.teams || []);
  return teams.map(normalizeTeam);
};
 
// Get team by ID
export const getTeamById = async (teamId, { signal } = {}) => {
  const response = await apiClient(`/teams/${teamId}`, { signal });
  const team = response.team || response;
  return normalizeTeam(team);
};
 
// Create new team
export const createTeam = async (teamData, { signal } = {}) => {
  try {
    const payload = {
      name: teamData.name,
      description: teamData.description,
      ...(teamData.leadId && { leadId: safeNumber(teamData.leadId) }),
      ...(teamData.selectedMembers?.length > 0 && { 
        memberIds: teamData.selectedMembers.map(id => safeNumber(id)) 
      })
    };
 
    const response = await apiClient('/teams', {
      method: 'POST',
      body: JSON.stringify(payload),
      signal
    });
    
    const createdTeam = response.team || response;
    
    if (!createdTeam || !createdTeam.id) {
      throw new Error('Invalid response from server');
    }
    
    return normalizeTeam(createdTeam);
  } catch (error) {
    console.error('Error creating team:', error);
    throw error;
  }
};
 
// Update team
export const updateTeam = async (teamId, teamData, { signal } = {}) => {
  const response = await apiClient(`/teams/${teamId}`, {
    method: 'PUT',
    body: JSON.stringify(teamData),
    signal
  });
  const team = response.team || response;
  return normalizeTeam(team);
};
 
// Delete team
export const deleteTeam = async (teamId, { signal } = {}) => {
  return apiClient(`/teams/${teamId}`, {
    method: 'DELETE',
    signal
  });
};
 
// Add member to team
export const addMemberToTeam = async (teamId, userId, { signal } = {}) => {
  const response = await apiClient(`/teams/${teamId}/add-member`, {
    method: 'PUT',
    body: JSON.stringify({ userId: safeNumber(userId) }),
    signal
  });
  const team = response.team || response;
  return normalizeTeam(team);
};
 
// Remove member from team
export const removeMemberFromTeam = async (teamId, userId, { signal } = {}) => {
  const response = await apiClient(`/teams/${teamId}/remove-member`, {
    method: 'PUT',
    body: JSON.stringify({ userId: safeNumber(userId) }),
    signal
  });
  const team = response.team || response;
  return normalizeTeam(team);
};
 
// Get team members
export const getTeamMembers = async (teamId, { signal } = {}) => {
  const team = await getTeamById(teamId, { signal });
  return team.members || [];
};