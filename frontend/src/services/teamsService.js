// src/services/teamsService.js
import { apiClient } from './apiClient';

// Helper to normalize team data
const normalizeTeam = (team) => ({
  ...team,
  memberCount: team.members?.length || team.memberCount || 0,
  members: team.members || [],
  createdAt: team.createdAt ? new Date(team.createdAt).toLocaleDateString() : null,
  leadName: team.lead?.name || team.leadName || 'Unassigned'
});

// Get all teams
export const getTeams = async () => {
  const teams = await apiClient('/teams');
  return teams.map(normalizeTeam);
};

// Get team by ID
export const getTeamById = async (teamId) => {
  const team = await apiClient(`/teams/${teamId}`);
  return normalizeTeam(team);
};

// Create new team
export const createTeam = async (teamData) => {
  const team = await apiClient('/teams', {
    method: 'POST',
    body: JSON.stringify(teamData)
  });
  return normalizeTeam(team);
};

// Update team
export const updateTeam = async (teamId, teamData) => {
  const team = await apiClient(`/teams/${teamId}`, {
    method: 'PUT',
    body: JSON.stringify(teamData)
  });
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
  const team = await apiClient(`/teams/${teamId}/add-member`, {
    method: 'PUT',
    body: JSON.stringify({ userId })
  });
  return normalizeTeam(team);
};

// Remove member from team
export const removeMemberFromTeam = async (teamId, userId) => {
  const team = await apiClient(`/teams/${teamId}/remove-member`, {
    method: 'PUT',
    body: JSON.stringify({ userId })
  });
  return normalizeTeam(team);
};

// Get team members
export const getTeamMembers = async (teamId) => {
  const team = await getTeamById(teamId);
  return team.members || [];
};