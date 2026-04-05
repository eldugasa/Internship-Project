// src/loader/manager/Projects.loader.js
import { getProjects, updateProject } from '../../services/projectsService';
import { getTeams } from '../../services/teamsService';

// Date parsing helper for DD/MM/YYYY format
export const parseDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return new Date(`${year}-${month}-${day}`);
    }
    return new Date(dateStr);
  } catch {
    return null;
  }
};

// Check if project is overdue
export const isOverdue = (project) => {
  if (project.status === 'completed') return false;
  const deadlineStr = project.dueDate || project.endDate;
  if (!deadlineStr) return false;
  const deadlineDate = parseDate(deadlineStr);
  if (!deadlineDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);
  return deadlineDate < today;
};

// Calculate statistics
export const calculateStats = (projects) => {
  const overdue = projects.filter(p => isOverdue(p)).length;
  return {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    planned: projects.filter(p => p.status === 'planned').length,
    overdue: overdue
  };
};

// Auto-activation function - runs in background after load
export const activateProjectsInBackground = async (projectsList) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let hasChanges = false;
  let activatedCount = 0;
  
  const updatedProjects = await Promise.all(projectsList.map(async (project) => {
    if (project.status !== 'planned') return project;
    
    const startDate = parseDate(project.startDate);
    if (!startDate) return project;
    startDate.setHours(0, 0, 0, 0);
    
    if (startDate <= today) {
      try {
        await updateProject(project.id, { status: 'IN_PROGRESS' });
        hasChanges = true;
        activatedCount++;
        console.log(`✅ Activated project: ${project.name} (ID: ${project.id})`);
        return { ...project, status: 'active' };
      } catch (err) {
        console.error(`❌ Error activating project ${project.name}:`, err);
        return project;
      }
    }
    return project;
  }));
  
  if (activatedCount > 0) {
    console.log(`📊 Auto-activated ${activatedCount} project(s) successfully`);
  }
  return { updatedProjects, hasChanges };
};

// Helper to map team names
export const mapTeamNames = (projects, teams) => {
  const teamMap = {};
  teams.forEach(team => {
    const teamId = team.id || team._id;
    if (teamId) {
      teamMap[teamId] = team.name;
    }
  });
  
  return projects.map(project => {
    let teamName = 'Unassigned';
    if (project.teamName) {
      teamName = project.teamName;
    } else if (project.team && project.team.name) {
      teamName = project.team.name;
    } else {
      const possibleTeamIds = [
        project.teamId,
        project.team_id,
        project.team?._id,
        project.team?.id
      ].filter(id => id != null);
      for (const tid of possibleTeamIds) {
        if (teamMap[tid]) {
          teamName = teamMap[tid];
          break;
        }
      }
    }
    return { ...project, teamName };
  });
};

// ✅ FIXED: Return promises directly for instant navigation
export function projectsLoader() {
  console.log('🔄 Loading projects data...');
  
  // Return promises directly - NO AWAIT!
  const projectsPromise = getProjects();
  const teamsPromise = getTeams();
  
  // Process and return the promise that resolves to the final data
  const processedPromise = Promise.all([projectsPromise, teamsPromise])
    .then(async ([projects, teams]) => {
      console.log(`📦 Fetched ${projects.length} projects and ${teams.length} teams`);
      
      // Map team names to projects
      const projectsWithTeams = mapTeamNames(projects, teams);
      
      // Run auto-activation in background (don't wait for it to complete)
      activateProjectsInBackground(projectsWithTeams).catch(err => {
        console.error('Background activation error:', err);
      });
      
      // Return projects immediately without waiting for activation
      return projectsWithTeams;
    })
    .catch(error => {
      console.error('❌ Error loading projects:', error);
      throw error;
    });
  
  return {
    projects: processedPromise,
    teams: teamsPromise
  };
}