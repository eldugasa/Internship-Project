// src/loader/manager/Reports.loader.js
import { getProjects } from '../../services/projectsService';
import { getTasks } from '../../services/tasksService';
import { getTeams } from '../../services/teamsService';

// Calculate stats
export const calculateStats = (projects, tasks, teams) => {
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => 
    p.status === 'active' || p.status === 'in_progress'
  ).length;
  const completedProjects = projects.filter(p => 
    p.status === 'completed'
  ).length;
  const plannedProjects = projects.filter(p => 
    p.status === 'planned'
  ).length;
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => 
    t.status === 'completed' || t.status === 'done'
  ).length;
  const inProgressTasks = tasks.filter(t => 
    t.status === 'in-progress'
  ).length;
  const pendingTasks = tasks.filter(t => 
    t.status === 'pending'
  ).length;
  
  const overdueTasks = tasks.filter(t => 
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
  ).length;

  const totalProgress = projects.reduce((sum, p) => sum + (p.progress || 0), 0);
  const overallProgress = projects.length ? Math.round(totalProgress / projects.length) : 0;

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingDeadlines = tasks.filter(t => {
    if (!t.dueDate || t.status === 'completed') return false;
    const dueDate = new Date(t.dueDate);
    return dueDate >= now && dueDate <= nextWeek;
  }).length;

  const totalTeams = teams.length;
  
  const uniqueTeamMembers = new Set();
  projects.forEach(project => {
    if (project.teamMembers) {
      project.teamMembers.forEach(member => uniqueTeamMembers.add(member.id));
    }
  });

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    plannedProjects,
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    overdueTasks,
    overallProgress,
    upcomingDeadlines,
    totalTeams,
    estimatedTeamMembers: uniqueTeamMembers.size
  };
};

// Calculate team performance
export const calculateTeamPerformance = (teams, projects, tasks) => {
  return teams.map(team => {
    const teamProjects = projects.filter(p => p.teamId === team.id || p.teamName === team.name);
    const teamProjectIds = teamProjects.map(p => p.id);
    const teamTasks = tasks.filter(t => teamProjectIds.includes(t.projectId));
    
    const totalTasks = teamTasks.length;
    const completedTasks = teamTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = teamTasks.filter(t => t.status === 'in-progress').length;
    const pendingTasks = teamTasks.filter(t => t.status === 'pending').length;
    
    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const totalHours = teamTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    
    return {
      id: team.id,
      name: team.name,
      lead: team.lead || team.leadName || 'Unassigned',
      memberCount: team.memberCount || team.users?.length || 0,
      projects: teamProjects.length,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      completionRate,
      totalHours,
      performance: completionRate
    };
  });
};

// Filter data by date range
export const filterDataByDate = (projects, tasks, dateRange) => {
  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);
  end.setHours(23, 59, 59, 999);

  const filteredTasks = tasks.filter(t => {
    const taskDate = new Date(t.createdAt || t.updatedAt);
    return taskDate >= start && taskDate <= end;
  });

  const filteredProjects = projects.filter(p => {
    const projectDate = new Date(p.createdAt || p.startDate);
    return projectDate >= start && projectDate <= end;
  });

  const filteredTaskStats = {
    total: filteredTasks.length,
    completed: filteredTasks.filter(t => t.status === 'completed').length,
    inProgress: filteredTasks.filter(t => t.status === 'in-progress').length,
    pending: filteredTasks.filter(t => t.status === 'pending').length
  };

  return {
    tasks: filteredTasks,
    projects: filteredProjects,
    taskStats: filteredTaskStats
  };
};

// Main loader - Return promises directly for instant navigation
export function reportsLoader() {
  return {
    projects: getProjects(),
    tasks: getTasks(),
    teams: getTeams()
  };
}