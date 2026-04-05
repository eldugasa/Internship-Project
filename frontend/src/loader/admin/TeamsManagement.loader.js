// src/loader/admin/TeamsManagement.loader.js
import { getTeams } from '../../services/teamsService';
import { getUsers } from '../../services/usersService';

// In React Router v7, just return the promises directly - no defer needed!
export async function teamsLoader() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || 'guest';
  return {
    role: userRole,
    teams: getTeams(),  
    users: getUsers()   
  };
}

// Helper functions
export const safeNumber = (value, defaultValue = 0) => {
  const num = parseInt(value);
  return isNaN(num) ? defaultValue : Math.max(0, num);
};

export const safeString = (value, defaultValue = '') => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return defaultValue;
  return String(value);
};

// Team display preparation helper
export const prepareTeamForDisplay = (team, users = []) => {
  const displayTeam = {
    id: safeNumber(team?.id),
    name: safeString(team?.name, 'Unnamed Team'),
    lead: 'Unassigned',
    memberCount: 0,
    projectCount: 0
  };

  // Set member count
  if (team?.memberCount !== undefined) {
    displayTeam.memberCount = safeNumber(team.memberCount);
  } else if (team?.members && Array.isArray(team.members)) {
    displayTeam.memberCount = team.members.length;
  } else if (team?.users && Array.isArray(team.users)) {
    displayTeam.memberCount = team.users.length;
  }

  // Set project count
  if (team?.projectCount !== undefined) {
    displayTeam.projectCount = safeNumber(team.projectCount);
  } else if (team?.projects && Array.isArray(team.projects)) {
    displayTeam.projectCount = team.projects.length;
  }

  // Set lead if explicitly assigned
  if (team?.leadName && typeof team.leadName === 'string' && team.leadName !== 'Unassigned') {
    displayTeam.lead = team.leadName;
  } else if (team?.lead && typeof team.lead === 'string' && team.lead !== 'Unassigned') {
    displayTeam.lead = team.lead;
  } else if (team?.lead && typeof team.lead === 'object' && team.lead.name) {
    displayTeam.lead = safeString(team.lead.name, 'Unassigned');
  } else if (team?.leadId) {
    const leadUser = users.find(u => u.id === safeNumber(team.leadId));
    if (leadUser && leadUser.name) {
      displayTeam.lead = leadUser.name;
    }
  }

  return displayTeam;
};