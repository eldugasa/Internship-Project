// src/admin/TeamDetailsPage.loader.js
import { getTeamById } from "../../services/teamsService";
import { getUsers } from "../../services/usersService";

export async function teamDetailsLoader({ params }) {
  try {
    const { teamId } = params;
    
    // Fetch both in parallel
    const [team, users] = await Promise.all([
      getTeamById(teamId),
      getUsers()
    ]);
    
    return {
      team: team || null,
      users: users || []
    };
  } catch (error) {
    console.error('Error loading team details:', error);
    return {
      team: null,
      users: [],
      error: error.message || 'Failed to load team details'
    };
  }
}