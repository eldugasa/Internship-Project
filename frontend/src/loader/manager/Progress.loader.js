// src/loader/manager/Progress.loader.js
import { getProjects } from '../../services/projectsService';
import { getTasks } from '../../services/tasksService';
import { getTeams } from '../../services/teamsService';
import { queryClient } from '../../services/apiClient';

// ============================================
// 1. QUERY DEFINITIONS
// ============================================

export const progressProjectsQuery = () => ({
  queryKey: ['progress', 'projects'],
  queryFn: async ({ signal }) => {
    const projects = await getProjects({ signal });
    return Array.isArray(projects) ? projects : [];
  },
  staleTime: 1000 * 60 * 3,
  gcTime: 1000 * 60 * 10,
});

export const progressTasksQuery = () => ({
  queryKey: ['progress', 'tasks'],
  queryFn: async ({ signal }) => {
    const tasks = await getTasks({ signal });
    return Array.isArray(tasks) ? tasks : [];
  },
  staleTime: 1000 * 60 * 3,
  gcTime: 1000 * 60 * 10,
});

export const progressTeamsQuery = () => ({
  queryKey: ['progress', 'teams'],
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

const parseDate = (dateStr) => {
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

// Calculate overall stats
export const calculateStats = (projects, tasks, teams) => {
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => 
    p.status === 'active' || p.status === 'in_progress' || p.status === 'in-progress'
  ).length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  
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
      today.setHours(0, 0, 0, 0);
      const deadline = parseDate(endDate);
      if (deadline) {
        deadline.setHours(0, 0, 0, 0);
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
      teamName: project.teamName || project.team?.name || 'Unassigned',
      startDate: project.startDate,
      endDate,
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
    const inProgressTasks = teamTasks.filter(t => t.status === 'in-progress' || t.status === 'in_progress').length;
    const overdueTasks = teamTasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
    ).length;
    
    const performanceRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return {
      teamId: team.id,
      teamName: team.name,
      memberCount: team.memberCount || team.members?.length || 0,
      projects: teamProjects.length,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      performance: performanceRate
    };
  });

  return performance.sort((a, b) => b.performance - a.performance);
};

// Calculate member workload
export const calculateMemberWorkload = (tasks, teams, projects) => {
  const assigneeMap = new Map();
  
  tasks.forEach(task => {
    const assigneeId = task.assigneeId || task.assignedTo;
    const assigneeName = task.assigneeName || task.assignee?.name;
    
    if (assigneeId && assigneeName) {
      if (!assigneeMap.has(assigneeId)) {
        assigneeMap.set(assigneeId, {
          id: assigneeId,
          name: assigneeName,
          avatar: assigneeName?.charAt(0).toUpperCase() || 'U',
          role: 'Team Member',
          team: task.teamName || 'Unassigned',
          activeTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          totalTasks: 0
        });
      }
      
      const member = assigneeMap.get(assigneeId);
      member.totalTasks++;
      
      if (task.status === 'completed') {
        member.completedTasks++;
      } else if (task.status === 'in-progress' || task.status === 'in_progress' || task.status === 'pending') {
        member.activeTasks++;
      }
      
      if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed') {
        member.overdueTasks++;
      }
    }
  });

  const workload = Array.from(assigneeMap.values()).map(member => ({
    ...member,
    efficiency: member.totalTasks > 0 
      ? Math.round((member.completedTasks / member.totalTasks) * 100)
      : 0
  }));

  return workload.sort((a, b) => (b.activeTasks + b.overdueTasks) - (a.activeTasks + a.overdueTasks));
};

// ============================================
// 3. LOADER (React Router)
// ============================================

export async function progressLoader() {
  console.log('🔄 Loading progress data...');
  
  try {
    const [projects, tasks, teams] = await Promise.all([
      queryClient.ensureQueryData(progressProjectsQuery()),
      queryClient.ensureQueryData(progressTasksQuery()),
      queryClient.ensureQueryData(progressTeamsQuery())
    ]);
    
    console.log(`📦 Loaded: ${projects.length} projects, ${tasks.length} tasks, ${teams.length} teams`);
    
    return {
      projects,
      tasks,
      teams
    };
  } catch (error) {
    console.error('❌ Error loading progress data:', error);
    return {
      projects: [],
      tasks: [],
      teams: []
    };
  }
}

export default progressLoader;
