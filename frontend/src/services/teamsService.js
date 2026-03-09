// src/services/teamsService.js
import { apiClient } from './apiClient';

// Helper to normalize team data
const normalizeTeam = (team) => ({
  ...team,
  id: team.id,
  name: team.name || '',
  description: team.description || '',
  lead: team.lead || null,
  leadName: team.lead?.name || team.leadName || 'Unassigned',
  memberCount: team.members?.length || team.memberCount || 0,
  members: team.members || [],
  projects: team.projects || [],
  createdAt: team.createdAt ? new Date(team.createdAt).toLocaleDateString() : null,
});

// Get all teams
export const getTeams = async () => {
  const response = await apiClient('/teams');
  const teams = Array.isArray(response) ? response : (response.teams || []);
  return teams.map(normalizeTeam);
};

// Get team by ID
export const getTeamById = async (teamId) => {
  const response = await apiClient(`/teams/${teamId}`);
  // Handle both { team } and direct team object responses
  const team = response.team || response;
  return normalizeTeam(team);
};

// Create new team - UPDATED to handle memberIds
export const createTeam = async (teamData) => {
  try {
    // Prepare the payload including member IDs if they exist
    const payload = {
      name: teamData.name,
      description: teamData.description,
      ...(teamData.leadId && { leadId: teamData.leadId }),
      // Include member IDs if they were selected
      ...(teamData.selectedMembers?.length > 0 && { 
        memberIds: teamData.selectedMembers.map(id => parseInt(id)) 
      })
    };

    console.log('Sending to backend:', payload);

    const response = await apiClient('/teams', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    console.log('Raw createTeam response:', response);
    
    // Handle different response shapes
    const createdTeam = response.team || response;
    
    if (!createdTeam || !createdTeam.id) {
      console.error('Unexpected response format:', response);
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

// Add member to team (keep for backward compatibility)
export const addMemberToTeam = async (teamId, userId) => {
  const response = await apiClient(`/teams/${teamId}/add-member`, {
    method: 'PUT',
    body: JSON.stringify({ userId })
  });
  const team = response.team || response;
  return normalizeTeam(team);
};

// Remove member from team
export const removeMemberFromTeam = async (teamId, userId) => {
  const response = await apiClient(`/teams/${teamId}/remove-member`, {
    method: 'PUT',
    body: JSON.stringify({ userId })
  });
  const team = response.team || response;
  return normalizeTeam(team);
};

// Get team members
export const getTeamMembers = async (teamId) => {
  const team = await getTeamById(teamId);
  return team.members || [];
};