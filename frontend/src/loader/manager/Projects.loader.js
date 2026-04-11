// src/loader/manager/Projects.loader.js
import { getProjects, updateProject } from '../../services/projectsService';
import { getTeams } from '../../services/teamsService';
import { queryClient } from '../../services/apiClient';

// Date parsing helper for multiple formats
export const parseDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    // Handle ISO format (YYYY-MM-DD)
    if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(dateStr);
    }
    // Handle DD/MM/YYYY format
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return new Date(`${year}-${month}-${day}`);
    }
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

// Format date for display
export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const date = parseDate(dateStr);
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return 'N/A';
  }
};

// Check if project is overdue
export const isOverdue = (project) => {
  if (!project || project.status === 'completed' || project.status === 'cancelled') return false;
  const deadlineStr = project.dueDate || project.endDate;
  if (!deadlineStr) return false;
  const deadlineDate = parseDate(deadlineStr);
  if (!deadlineDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);
  return deadlineDate < today;
};

// Check if project is at risk
export const isAtRisk = (project) => {
  if (!project || project.status === 'completed' || project.status === 'cancelled') return false;
  const deadlineStr = project.dueDate || project.endDate;
  if (!deadlineStr) return false;
  const deadlineDate = parseDate(deadlineStr);
  if (!deadlineDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);
  const daysUntilDeadline = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
  const progress = project.progress || 0;
  return daysUntilDeadline < 7 && progress < 50;
};

// Calculate statistics with more metrics
export const calculateStats = (projects) => {
  const active = projects.filter(p => p.status === 'active' || p.status === 'in-progress').length;
  const completed = projects.filter(p => p.status === 'completed').length;
  const planned = projects.filter(p => p.status === 'planned').length;
  const onHold = projects.filter(p => p.status === 'on-hold').length;
  const cancelled = projects.filter(p => p.status === 'cancelled').length;
  const overdue = projects.filter(p => isOverdue(p)).length;
  const atRisk = projects.filter(p => isAtRisk(p)).length;
  
  const totalProgress = projects.reduce((sum, p) => sum + (p.progress || 0), 0);
  const avgProgress = projects.length > 0 ? Math.round(totalProgress / projects.length) : 0;
  
  return {
    total: projects.length,
    active,
    completed,
    planned,
    onHold,
    cancelled,
    overdue,
    atRisk,
    avgProgress,
    completionRate: projects.length > 0 ? Math.round((completed / projects.length) * 100) : 0
  };
};

// Auto-activation function - runs in background after load
export const activateProjectsInBackground = async (projectsList, onComplete) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let activatedCount = 0;
  const activatedProjects = [];
  
  const updatePromises = projectsList.map(async (project) => {
    if (project.status !== 'planned') return null;
    
    const startDate = parseDate(project.startDate);
    if (!startDate) return null;
    startDate.setHours(0, 0, 0, 0);
    
    if (startDate <= today) {
      try {
        await updateProject(project.id, { status: 'IN_PROGRESS' });
        activatedCount++;
        activatedProjects.push(project.id);
        console.log(`✅ Auto-activated project: ${project.name} (ID: ${project.id})`);
        
        // Invalidate project queries
        await queryClient.invalidateQueries({ queryKey: ['projects'] });
        await queryClient.invalidateQueries({ queryKey: ['project', project.id] });
        
        return { ...project, status: 'active' };
      } catch (err) {
        console.error(`❌ Error activating project ${project.name}:`, err);
        return null;
      }
    }
    return null;
  });
  
  await Promise.all(updatePromises);
  
  if (activatedCount > 0) {
    console.log(`📊 Auto-activated ${activatedCount} project(s) successfully`);
    if (onComplete) onComplete(activatedCount, activatedProjects);
  }
  
  return { activatedCount, activatedProjects };
};

// Helper to map team names
export const mapTeamNames = (projects, teams) => {
  const teamMap = new Map();
  
  teams.forEach(team => {
    const teamId = team.id || team._id;
    if (teamId) {
      teamMap.set(teamId, {
        name: team.name,
        id: teamId,
        members: team.members?.length || team.memberCount || 0
      });
    }
  });
  
  return projects.map(project => {
    let teamInfo = { name: 'Unassigned', id: null, members: 0 };
    
    if (project.teamName && project.teamName !== 'Unassigned') {
      teamInfo.name = project.teamName;
    } else if (project.team?.name) {
      teamInfo.name = project.team.name;
      teamInfo.id = project.team.id || project.team._id;
    } else if (project.teamId && teamMap.has(project.teamId)) {
      teamInfo = teamMap.get(project.teamId);
    } else if (project.team_id && teamMap.has(project.team_id)) {
      teamInfo = teamMap.get(project.team_id);
    } else {
      const possibleIds = [
        project.teamId,
        project.team_id,
        project.team?.id,
        project.team?._id
      ].filter(id => id != null);
      
      for (const id of possibleIds) {
        if (teamMap.has(id)) {
          teamInfo = teamMap.get(id);
          break;
        }
      }
    }
    
    return {
      ...project,
      teamName: teamInfo.name,
      teamId: teamInfo.id || project.teamId,
      teamMembers: teamInfo.members
    };
  });
};

// Query keys for React Query
export const projectsQueryKeys = {
  all: ['projects'],
  detail: (id) => ['projects', id],
  stats: () => ['projects', 'stats'],
  teams: () => ['teams']
};

// React Query configuration
export const projectsQuery = () => ({
  queryKey: projectsQueryKeys.all,
  queryFn: async ({ signal }) => {
    const projects = await getProjects({ signal });
    return Array.isArray(projects) ? projects : [];
  },
  staleTime: 1000 * 60 * 3,
  gcTime: 1000 * 60 * 10,
  retry: 2,
});

// Enhanced loader
export async function projectsLoader() {
  console.log('🔄 Loading projects data...');
  
  try {
    const cachedProjects = queryClient.getQueryData(projectsQueryKeys.all);
    const cachedTeams = queryClient.getQueryData(projectsQueryKeys.teams());
    
    let projectsPromise, teamsPromise;
    
    if (cachedProjects && cachedTeams) {
      console.log('📦 Using cached data');
      projectsPromise = Promise.resolve(cachedProjects);
      teamsPromise = Promise.resolve(cachedTeams);
    } else {
      projectsPromise = queryClient.ensureQueryData(projectsQuery());
      teamsPromise = queryClient.ensureQueryData({
        queryKey: projectsQueryKeys.teams(),
        queryFn: async ({ signal }) => {
          const teams = await getTeams({ signal });
          return Array.isArray(teams) ? teams : [];
        },
      });
    }
    
    const processedPromise = Promise.all([projectsPromise, teamsPromise])
      .then(async ([projects, teams]) => {
        console.log(`📦 Fetched ${projects.length} projects and ${teams.length} teams`);
        
        const projectsWithTeams = mapTeamNames(projects, teams);
        const stats = calculateStats(projectsWithTeams);
        
        queryClient.setQueryData(projectsQueryKeys.stats(), stats);
        
        // Run auto-activation in background
        activateProjectsInBackground(projectsWithTeams, (count) => {
          console.log(`Background activation complete: ${count} projects activated`);
          queryClient.invalidateQueries({ queryKey: projectsQueryKeys.all });
        }).catch(err => {
          console.error('Background activation error:', err);
        });
        
        return projectsWithTeams;
      })
      .catch(error => {
        console.error('❌ Error loading projects:', error);
        return [];
      });
    
    return {
      projects: processedPromise,
      teams: teamsPromise
    };
  } catch (error) {
    console.error('❌ Loader error:', error);
    return {
      projects: Promise.resolve([]),
      teams: Promise.resolve([])
    };
  }
}

// Helper to invalidate queries
export const invalidateProjectsQueries = async () => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: projectsQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: projectsQueryKeys.stats() }),
    queryClient.invalidateQueries({ queryKey: projectsQueryKeys.teams() }),
  ]);
};

export default projectsLoader;