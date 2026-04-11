// src/loader/manager/Reports.loader.js
import { getProjects } from '../../services/projectsService';
import { getTasks } from '../../services/tasksService';
import { getTeams } from '../../services/teamsService';
import { queryClient } from '../../services/apiClient';

// ============================================
// 1. QUERY DEFINITIONS
// ============================================

export const reportsProjectsQuery = () => ({
  queryKey: ['reports', 'projects'],
  queryFn: async ({ signal }) => {
    const projects = await getProjects({ signal });
    return Array.isArray(projects) ? projects : [];
  },
  staleTime: 1000 * 60 * 3,
  gcTime: 1000 * 60 * 10,
});

export const reportsTasksQuery = () => ({
  queryKey: ['reports', 'tasks'],
  queryFn: async ({ signal }) => {
    const tasks = await getTasks({ signal });
    return Array.isArray(tasks) ? tasks : [];
  },
  staleTime: 1000 * 60 * 3,
  gcTime: 1000 * 60 * 10,
});

export const reportsTeamsQuery = () => ({
  queryKey: ['reports', 'teams'],
  queryFn: async ({ signal }) => {
    const teams = await getTeams({ signal });
    return Array.isArray(teams) ? teams : [];
  },
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
});

// ============================================
// 2. HELPER FUNCTIONS
// ============================================

// Parse dates in various formats
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(dateStr);
    }
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

// Filter data by date range
export const filterDataByDate = (projects, tasks, dateRange) => {
  const startDate = dateRange.start ? new Date(dateRange.start) : null;
  const endDate = dateRange.end ? new Date(dateRange.end) : null;
  
  if (startDate) startDate.setHours(0, 0, 0, 0);
  if (endDate) endDate.setHours(23, 59, 59, 999);
  
  const filteredProjects = projects.filter(project => {
    if (!startDate && !endDate) return true;
    const projectDate = parseDate(project.createdAt || project.startDate);
    if (!projectDate) return true;
    if (startDate && projectDate < startDate) return false;
    if (endDate && projectDate > endDate) return false;
    return true;
  });
  
  const filteredTasks = tasks.filter(task => {
    if (!startDate && !endDate) return true;
    const taskDate = parseDate(task.createdAt || task.updatedAt);
    if (!taskDate) return true;
    if (startDate && taskDate < startDate) return false;
    if (endDate && taskDate > endDate) return false;
    return true;
  });
  
  const taskStats = {
    total: filteredTasks.length,
    completed: filteredTasks.filter(t => t.status === 'completed').length,
    inProgress: filteredTasks.filter(t => t.status === 'in-progress').length,
    pending: filteredTasks.filter(t => t.status === 'pending').length,
  };
  
  return {
    projects: filteredProjects,
    tasks: filteredTasks,
    taskStats
  };
};

// Calculate statistics
export const calculateStats = (projects, tasks, teams) => {
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'in-progress').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length;
  
  const upcomingDeadlines = tasks.filter(t => {
    if (!t.dueDate || t.status === 'completed') return false;
    const dueDate = new Date(t.dueDate);
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    return dueDate >= today && dueDate <= sevenDaysFromNow;
  }).length;
  
  const totalProgress = projects.reduce((sum, p) => sum + (p.progress || 0), 0);
  const overallProgress = projects.length ? Math.round(totalProgress / projects.length) : 0;
  
  return {
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    overdueTasks,
    upcomingDeadlines,
    overallProgress,
    totalTeams: teams.length
  };
};

// Calculate team performance
export const calculateTeamPerformance = (teams, projects, tasks) => {
  return teams.map(team => {
    const teamProjects = projects.filter(p => p.teamId === team.id || p.teamName === team.name);
    const teamProjectIds = teamProjects.map(p => p.id);
    const teamTasks = tasks.filter(t => teamProjectIds.includes(t.projectId));
    const completedTasks = teamTasks.filter(t => t.status === 'completed').length;
    const completionRate = teamTasks.length ? Math.round((completedTasks / teamTasks.length) * 100) : 0;
    
    return {
      id: team.id,
      name: team.name,
      lead: team.leadName || team.lead?.name || 'Unassigned',
      memberCount: team.memberCount || team.members?.length || 0,
      projects: teamProjects.length,
      totalTasks: teamTasks.length,
      completedTasks,
      completionRate
    };
  });
};

// ============================================
// 3. LOADER (React Router)
// ============================================

export async function reportsLoader() {
  console.log('🔄 Loading reports data...');
  
  try {
    const [projects, tasks, teams] = await Promise.all([
      queryClient.ensureQueryData(reportsProjectsQuery()),
      queryClient.ensureQueryData(reportsTasksQuery()),
      queryClient.ensureQueryData(reportsTeamsQuery())
    ]);
    
    console.log(`📦 Loaded: ${projects.length} projects, ${tasks.length} tasks, ${teams.length} teams`);
    
    return {
      projects,
      tasks,
      teams
    };
  } catch (error) {
    console.error('❌ Error loading reports data:', error);
    return {
      projects: [],
      tasks: [],
      teams: []
    };
  }
}

export default reportsLoader;