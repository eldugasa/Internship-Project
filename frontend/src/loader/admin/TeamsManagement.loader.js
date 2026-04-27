// src/loader/admin/TeamsManagement.loader.js
import { getTeams } from '../../services/teamsService';
import { getCurrentUserProfile, getUsers } from '../../services/usersService';

const normalizeRole = (role = "") => role.toLowerCase().replace(/_/g, "-");

const resolveCanManageTeams = (user = {}) => {
  const normalizedRole = normalizeRole(user.role || "guest");
  const effectivePermissions = Array.isArray(user.effectivePermissions)
    ? user.effectivePermissions
    : [];
  const permissionOverrides = Array.isArray(user.permissionOverrides)
    ? user.permissionOverrides
    : [];
  const hasExplicitManageTeamsGrant = permissionOverrides.includes("manage_teams");
  const hasExplicitManageTeamsRevoke = permissionOverrides.includes("!manage_teams");

  if (effectivePermissions.includes("*")) {
    return true;
  }

  if (normalizedRole === "project-manager") {
    return !hasExplicitManageTeamsRevoke;
  }

  if (normalizedRole === "admin") {
    return hasExplicitManageTeamsGrant;
  }

  return effectivePermissions.includes("manage_teams");
};

// Define Query Keys and Functions
export const teamsQuery = () => ({
  queryKey: ['teams'],
  queryFn: getTeams,
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
});

export const usersQuery = () => ({
  queryKey: ['users'],
  queryFn: getUsers,
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
});

export const teamsLoader = (queryClient) => async () => {
  let user = {};
  try {
    user = await getCurrentUserProfile();
  } catch {
    const fallbackUser = JSON.parse(localStorage.getItem('user') || '{}');
    const fallbackRole = normalizeRole(fallbackUser.role || "guest");
    user =
      fallbackRole === "admin" || fallbackRole === "super-admin"
        ? { role: fallbackUser.role || "guest", permissions: [], effectivePermissions: [] }
        : fallbackUser;
  }
  const canManageTeams = resolveCanManageTeams(user);
  
  // Prefetch both teams and users into the cache
  await Promise.all([
    queryClient.ensureQueryData(teamsQuery()),
    ...(canManageTeams ? [queryClient.ensureQueryData(usersQuery())] : []),
  ]);

  return {
    role: user.role || 'guest',
    canManageTeams,
  };
};

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
