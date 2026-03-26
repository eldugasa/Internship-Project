// src/loader/manager/Progress.loader.js
import { getProjects } from '../../services/projectsService';
import { getTasks } from '../../services/tasksService';
import { getTeams } from '../../services/teamsService';

// Calculate overall stats
export const calculateStats = (projects, tasks, teams) => {
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => 
    p.status === 'active' || p.status === 'in_progress'
  ).length;
  const completedProjects = projects.filter(p => 
    p.status === 'completed'
  ).length;
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => 
    t.status === 'completed' || t.status === 'done'
  ).length;
  
  const overdueTasks = tasks.filter(t => 
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
  ).length;

  const totalProgress = projects.reduce((sum, p) => sum + (p.progress || 0), 0);
  const overallProgress = projects.length ? Math.round(totalProgress / projects.length) : 0;

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    completedTasks,
    overdueTasks,
    overallProgress,
    totalTeams: teams.length
  };
};

// Calculate project timeline
export const calculateProjectTimeline = (projects, tasks) => {
  const timeline = projects.map(project => {
    const endDate = project.endDate || project.dueDate;
    let daysRemaining = 'N/A';
    let overdue = false;
    
    if (endDate) {
      const today = new Date();
      const deadline = new Date(endDate);
      const diffTime = deadline - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        daysRemaining = `${Math.abs(diffDays)} days overdue`;
        overdue = true;
      } else if (diffDays === 0) {
        daysRemaining = 'Due today';
      } else if (diffDays === 1) {
        daysRemaining = '1 day left';
      } else {
        daysRemaining = `${diffDays} days left`;
      }
    }

    const projectTasks = tasks.filter(t => t.projectId === project.id);
    const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
    const totalTasks = projectTasks.length;
    
    let progress = project.progress || 0;
    if (totalTasks > 0 && progress === 0) {
      progress = Math.round((completedTasks / totalTasks) * 100);
    }

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      progress,
      daysRemaining,
      overdue,
      teamName: project.teamName,
      startDate: project.startDate,
      endDate: project.endDate || project.dueDate,
      tasks: {
        total: totalTasks,
        completed: completedTasks
      }
    };
  });

  return timeline.sort((a, b) => {
    if (!a.endDate) return 1;
    if (!b.endDate) return -1;
    return new Date(a.endDate) - new Date(b.endDate);
  });
};

// Calculate team performance
export const calculateTeamPerformance = (teams, projects, tasks) => {
  const performance = teams.map(team => {
    const teamProjects = projects.filter(p => p.teamId === team.id || p.teamName === team.name);
    const teamProjectIds = teamProjects.map(p => p.id);
    const teamTasks = tasks.filter(t => teamProjectIds.includes(t.projectId));
    
    const totalTasks = teamTasks.length;
    const completedTasks = teamTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = teamTasks.filter(t => t.status === 'in-progress').length;
    const overdueTasks = teamTasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
    ).length;
    
    const performanceRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return {
      teamId: team.id,
      teamName: team.name,
      memberCount: team.memberCount || team.users?.length || 0,
      projects: teamProjects.length,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      performance: performanceRate
    };
  });

  return performance;
};

// Calculate member workload
export const calculateMemberWorkload = (tasks, teams, projects) => {
  const assigneeMap = new Map();
  
  tasks.forEach(task => {
    if (task.assigneeId && task.assigneeName) {
      if (!assigneeMap.has(task.assigneeId)) {
        assigneeMap.set(task.assigneeId, {
          id: task.assigneeId,
          name: task.assigneeName,
          avatar: task.assigneeName?.charAt(0).toUpperCase() || 'U',
          role: 'Team Member',
          team: task.teamName || 'Unassigned',
          activeTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          totalTasks: 0,
          totalHours: 0,
          estimatedHours: 0
        });
      }
      
      const member = assigneeMap.get(task.assigneeId);
      member.totalTasks++;
      member.totalHours += task.actualHours || 0;
      member.estimatedHours += task.estimatedHours || 0;
      
      if (task.status === 'completed') {
        member.completedTasks++;
      } else if (task.status === 'in-progress' || task.status === 'pending') {
        member.activeTasks++;
      }
      
      if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed') {
        member.overdueTasks++;
      }
    }
  });

  const workload = Array.from(assigneeMap.values()).map(member => ({
    ...member,
    efficiency: member.estimatedHours > 0 
      ? Math.round((member.totalHours / member.estimatedHours) * 100) 
      : 100
  }));

  return workload.sort((a, b) => (b.activeTasks + b.overdueTasks) - (a.activeTasks + a.overdueTasks));
};

// Main loader - Return promises directly for instant navigation
export function progressLoader() {
  return {
    projects: getProjects(),
    tasks: getTasks(),
    teams: getTeams()
  };
}