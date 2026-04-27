// src/admin/TeamDetailsPage.loader.js
import { getTeamById } from "../../services/teamsService";
import { getCurrentUserProfile, getUsers } from "../../services/usersService";

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

export async function teamDetailsLoader({ params }) {
  let user = {};
  try {
    const { teamId } = params;
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
    
    // Fetch both in parallel
    const [team, users] = await Promise.all([
      getTeamById(teamId),
      canManageTeams ? getUsers() : Promise.resolve([]),
    ]);
    
    return {
      team: team || null,
      users: users || [],
      role: user.role || 'guest',
      canManageTeams,
    };
  } catch (error) {
    console.error('Error loading team details:', error);
    if (!user || Object.keys(user).length === 0) {
      const fallbackUser = JSON.parse(localStorage.getItem('user') || '{}');
      const fallbackRole = normalizeRole(fallbackUser.role || "guest");
      user =
        fallbackRole === "admin" || fallbackRole === "super-admin"
          ? { role: fallbackUser.role || "guest", permissions: [], effectivePermissions: [] }
          : fallbackUser;
    }
    const canManageTeams = resolveCanManageTeams(user);
    return {
      team: null,
      users: [],
      role: user.role || 'guest',
      canManageTeams,
      error: error.message || 'Failed to load team details'
    };
  }
}
