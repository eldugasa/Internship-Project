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
  // Safely extract member count
  let memberCount = 0;
  if (team.memberCount !== undefined) {
    memberCount = safeNumber(team.memberCount);
  } else if (team.members && Array.isArray(team.members)) {
    memberCount = team.members.length;
  } else if (team.users && Array.isArray(team.users)) {
    memberCount = team.users.length;
  }
  
  // Safely extract project count
  let projectCount = 0;
  if (team.projectCount !== undefined) {
    projectCount = safeNumber(team.projectCount);
  } else if (team.projects && Array.isArray(team.projects)) {
    projectCount = team.projects.length;
  }
  
  // Safely extract lead name - ONLY from explicit lead fields
  let leadName = 'Unassigned';
  
  if (team.leadName && typeof team.leadName === 'string' && team.leadName !== 'Unassigned') {
    leadName = team.leadName;
  } else if (team.lead && typeof team.lead === 'string' && team.lead !== 'Unassigned') {
    leadName = team.lead;
  } else if (team.lead && typeof team.lead === 'object' && team.lead.name) {
    leadName = safeString(team.lead.name, 'Unassigned');
  }
  // ❌ REMOVED: No auto-assignment from members
  
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
export const getTeams = async () => {
  const response = await apiClient('/teams');
  const teams = Array.isArray(response) ? response : (response.teams || []);
  return teams.map(normalizeTeam);
};

// Get team by ID
export const getTeamById = async (teamId) => {
  const response = await apiClient(`/teams/${teamId}`);
  const team = response.team || response;
  return normalizeTeam(team);
};

// Create new team
export const createTeam = async (teamData) => {
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
      body: JSON.stringify(payload)
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
export const updateTeam = async (teamId, teamData) => {
  const response = await apiClient(`/teams/${teamId}`, {
    method: 'PUT',
    body: JSON.stringify(teamData)
  });
  const team = response.team || response;
  return normalizeTeam(team);
};

// Delete team
export const deleteTeam = async (teamId) => {
  return apiClient(`/teams/${teamId}`, {
    method: 'DELETE'
  });
};

// Add member to team
export const addMemberToTeam = async (teamId, userId) => {
  const response = await apiClient(`/teams/${teamId}/add-member`, {
    method: 'PUT',
    body: JSON.stringify({ userId: safeNumber(userId) })
  });
  const team = response.team || response;
  return normalizeTeam(team);
};

// Remove member from team
export const removeMemberFromTeam = async (teamId, userId) => {
  const response = await apiClient(`/teams/${teamId}/remove-member`, {
    method: 'PUT',
    body: JSON.stringify({ userId: safeNumber(userId) })
  });
  const team = response.team || response;
  return normalizeTeam(team);
};

// Get team members
export const getTeamMembers = async (teamId) => {
  const team = await getTeamById(teamId);
  return team.members || [];
};