// src/loader/manager/ManagerDashboard.loader.js
import { getProjects } from '../../services/projectsService';
import { getTasks } from '../../services/tasksService';
import { getTeams } from '../../services/teamsService';

export async function managerDashboardLoader() {
  return {
    projects: getProjects(),
    tasks: getTasks(),
    teams: getTeams()
  };
}

// Helper functions for date parsing
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

export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      const date = new Date(`${year}-${month}-${day}`);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

// Calculate dashboard metrics from data
export const calculateMetrics = (projects, tasks, teams) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Project metrics
  const activeProjects = projects.filter(p => 
    p.status?.toLowerCase() === 'active' || p.status?.toLowerCase() === 'in-progress'
  ).length;
  
  const completedProjects = projects.filter(p => 
    p.status?.toLowerCase() === 'completed'
  ).length;
  
  const plannedProjects = projects.filter(p => 
    p.status?.toLowerCase() === 'planned' || p.status?.toLowerCase() === 'pending'
  ).length;

  // Task metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;

  // Overdue tasks
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'completed' || !t.dueDate) return false;
    const dueDate = parseDate(t.dueDate);
    return dueDate && dueDate < now;
  }).length;

  // Team metrics
  const totalTeamMembers = teams.reduce((sum, team) => sum + (team.members?.length || 0), 0);

  // Projects at risk (deadline approaching or passed with low progress)
  const projectsAtRisk = projects.filter(p => {
    if (p.status === 'completed') return false;
    const deadline = parseDate(p.dueDate || p.endDate);
    if (!deadline) return false;
    const progress = p.progress || 0;
    const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return (daysUntilDeadline < 7 && progress < 50) || (deadline < now && progress < 100);
  }).length;

  // Projects on track
  const projectsOnTrack = projects.filter(p => {
    if (p.status === 'completed') return true;
    const deadline = parseDate(p.dueDate || p.endDate);
    if (!deadline) return true;
    const progress = p.progress || 0;
    return deadline >= now && progress >= 50;
  }).length;

  return {
    projects: {
      total: projects.length,
      active: activeProjects,
      completed: completedProjects,
      planned: plannedProjects,
      atRisk: projectsAtRisk,
      onTrack: projectsOnTrack
    },
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      inProgress: inProgressTasks,
      pending: pendingTasks,
      overdue: overdueTasks,
      completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0
    },
    teams: {
      total: teams.length,
      members: totalTeamMembers
    },
    performance: {
      projectSuccessRate: projects.length ? Math.round((completedProjects / projects.length) * 100) : 0,
      taskCompletionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      onTimeDelivery: completedTasks ? Math.round(((completedTasks - overdueTasks) / completedTasks) * 100) : 0
    }
  };
};

// Calculate chart data
export const calculateChartData = (metrics, tasks) => {
  const parseDateLocal = (dateStr) => {
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

  // Project status distribution
  const statusData = [
    { name: 'Active', value: metrics.projects.active, color: '#0f5841' },
    { name: 'Completed', value: metrics.projects.completed, color: '#10b981' },
    { name: 'Planned', value: metrics.projects.planned, color: '#f59e0b' }
  ].filter(d => d.value > 0);

  // Task distribution
  const taskData = [
    { name: 'Completed', value: metrics.tasks.completed, color: '#10b981' },
    { name: 'In Progress', value: metrics.tasks.inProgress, color: '#3b82f6' },
    { name: 'Pending', value: metrics.tasks.pending, color: '#f59e0b' },
    { name: 'Overdue', value: metrics.tasks.overdue, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // Weekly activity from REAL tasks (last 7 days)
  const weeklyData = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const dayTasks = tasks.filter(t => {
      const taskDate = parseDateLocal(t.updatedAt || t.createdAt);
      return taskDate && taskDate.toDateString() === date.toDateString();
    });
    
    weeklyData.push({
      day: days[date.getDay()],
      tasks: dayTasks.length,
      completed: dayTasks.filter(t => t.status === 'completed').length
    });
  }

  return { statusData, taskData, weeklyData };
};