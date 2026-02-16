// src/services/enhancedDataService.js
import DataService from './dataservices';

class EnhancedDataService extends DataService {
  // Advanced statistics
  static getDashboardStats() {
    const teamMembers = this.getTeamMembers();
    const projects = this.getProjects();
    const tasks = this.getTasks();
    const teams = this.getTeams();

    const activeProjects = projects.filter(p => p.status === 'active');
    const completedProjects = projects.filter(p => p.status === 'completed');
    
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const overdueTasks = tasks.filter(t => {
      const deadline = new Date(t.deadline);
      const today = new Date();
      return deadline < today && t.status !== 'completed';
    });

    const upcomingDeadlines = projects.filter(p => {
      const deadline = new Date(p.deadline);
      const today = new Date();
      const diffTime = deadline - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays >= 0 && p.status === 'active';
    }).length;

    const overallProgress = activeProjects.length > 0 
      ? Math.round(activeProjects.reduce((sum, p) => sum + p.progress, 0) / activeProjects.length)
      : 0;

    return {
      totalTeamMembers: teamMembers.length,
      activeProjects: activeProjects.length,
      completedProjects: completedProjects.length,
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      teamsCount: teams.length,
      overallProgress,
      upcomingDeadlines,
      totalProjects: projects.length
    };
  }

  // Team performance analytics
  static getTeamPerformanceAnalytics() {
    const teams = this.getTeams();
    const teamMembers = this.getTeamMembers();
    const tasks = this.getTasks();
    const projects = this.getProjects();

    return teams.map(team => {
      const members = teamMembers.filter(m => team.members.includes(m.id));
      const teamTasks = tasks.filter(t => t.teamId === team.id);
      const teamProjects = projects.filter(p => p.teamId === team.id);

      const completedTasks = teamTasks.filter(t => t.status === 'completed');
      const inProgressTasks = teamTasks.filter(t => t.status === 'in-progress');
      const overdueTasks = teamTasks.filter(t => {
        const deadline = new Date(t.deadline);
        const today = new Date();
        return deadline < today && t.status !== 'completed';
      });

      const averageEfficiency = members.length > 0
        ? Math.round(members.reduce((sum, m) => sum + (m.efficiency || 0), 0) / members.length)
        : 0;

      // Calculate team performance based on multiple factors
      const taskCompletionRate = teamTasks.length > 0 
        ? Math.round((completedTasks.length / teamTasks.length) * 100) 
        : 0;
      
      const memberEfficiency = members.length > 0
        ? Math.round(members.reduce((sum, m) => sum + (m.efficiency || 0), 0) / members.length)
        : 0;
      
      const projectProgress = teamProjects.length > 0
        ? Math.round(teamProjects.reduce((sum, p) => sum + p.progress, 0) / teamProjects.length)
        : 0;

      const overallPerformance = Math.round(
        (taskCompletionRate * 0.4) + 
        (memberEfficiency * 0.3) + 
        (projectProgress * 0.3)
      );

      return {
        teamId: team.id,
        teamName: team.name,
        performance: overallPerformance,
        memberCount: members.length,
        activeProjects: teamProjects.filter(p => p.status === 'active').length,
        tasks: {
          total: teamTasks.length,
          completed: completedTasks.length,
          inProgress: inProgressTasks.length,
          overdue: overdueTasks.length
        },
        averageEfficiency,
        skills: [...new Set(members.flatMap(m => m.skills || []))].slice(0, 5)
      };
    });
  }

  // Project timeline analysis
  static getProjectTimelineData() {
    const projects = this.getProjects();
    
    return projects.map(project => {
      const tasks = this.getTasks().filter(t => t.projectId === project.id);
      const criticalTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed');
      
      const deadline = new Date(project.deadline);
      const today = new Date();
      const diffTime = deadline - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const teamMembers = this.getTeamMembersForProject(project.id);
      
      return {
        id: project.id,
        name: project.name,
        startDate: project.startDate,
        deadline: project.deadline,
        progress: project.progress,
        status: project.status,
        criticalTasksCount: criticalTasks.length,
        teamSize: teamMembers.length,
        daysRemaining: diffDays
      };
    }).sort((a, b) => a.daysRemaining - b.daysRemaining);
  }

  // Member workload analysis
  static getMemberWorkload() {
    const teamMembers = this.getTeamMembers();
    const tasks = this.getTasks();
    const projects = this.getProjects();

    return teamMembers.map(member => {
      const memberTasks = tasks.filter(t => t.assigneeId === member.id);
      const memberProjects = projects.filter(p => 
        p.teamMembers && p.teamMembers.includes(member.id)
      );

      const completedTasks = memberTasks.filter(t => t.status === 'completed');
      const activeTasks = memberTasks.filter(t => t.status !== 'completed');
      const overdueTasks = memberTasks.filter(t => {
        const deadline = new Date(t.deadline);
        const today = new Date();
        return deadline < today && t.status !== 'completed';
      });

      const estimatedHours = memberTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
      const actualHours = memberTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
      
      const efficiency = completedTasks.length > 0
        ? Math.round((completedTasks.length / memberTasks.length) * 100)
        : member.efficiency || 0;

      return {
        id: member.id,
        name: member.name,
        role: member.role,
        team: member.team,
        avatar: member.avatar,
        totalTasks: memberTasks.length,
        activeTasks: activeTasks.length,
        completedTasks: completedTasks.length,
        projectsInvolved: memberProjects.length,
        efficiency,
        overdueTasks: overdueTasks.length,
        estimatedHours,
        actualHours,
        workloadPercentage: Math.round((activeTasks.length / Math.max(memberTasks.length, 1)) * 100)
      };
    }).sort((a, b) => b.workloadPercentage - a.workloadPercentage);
  }

  // Budget tracking
  static getBudgetAnalytics() {
    const projects = this.getProjects();
    
    const activeProjects = projects.filter(p => p.status === 'active');
    
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + (p.spent || 0), 0);
    const remainingBudget = totalBudget - totalSpent;
    
    const budgetUtilization = projects.map(p => ({
      id: p.id,
      name: p.name,
      budget: p.budget || 0,
      spent: p.spent || 0,
      utilization: p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0,
      status: p.status,
      remaining: (p.budget || 0) - (p.spent || 0)
    }));
    
    const activeBudgetUtilization = budgetUtilization.filter(p => p.status === 'active');
    const avgUtilization = activeBudgetUtilization.length > 0
      ? Math.round(activeBudgetUtilization.reduce((sum, p) => sum + p.utilization, 0) / activeBudgetUtilization.length)
      : 0;

    return {
      totalBudget,
      totalSpent,
      remainingBudget,
      avgUtilization,
      budgetUtilization,
      activeBudgetUtilization,
      projectsOverBudget: budgetUtilization.filter(p => p.utilization > 100).length,
      projectsUnderBudget: budgetUtilization.filter(p => p.utilization < 80).length
    };
  }

  // Performance trends
  static getPerformanceTrends(days = 30) {
    const projects = this.getProjects();
    const tasks = this.getTasks();
    
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - days);
    
    const recentProjects = projects.filter(p => {
      const created = new Date(p.createdAt);
      return created >= pastDate;
    });
    
    const recentTasks = tasks.filter(t => {
      const created = new Date(t.createdAt);
      return created >= pastDate;
    });
    
    const completedTasks = recentTasks.filter(t => t.status === 'completed');
    const overdueTasks = recentTasks.filter(t => {
      const deadline = new Date(t.deadline);
      return deadline < today && t.status !== 'completed';
    });
    
    return {
      period: `${days} days`,
      newProjects: recentProjects.length,
      newTasks: recentTasks.length,
      completionRate: recentTasks.length > 0 
        ? Math.round((completedTasks.length / recentTasks.length) * 100) 
        : 0,
      overdueRate: recentTasks.length > 0 
        ? Math.round((overdueTasks.length / recentTasks.length) * 100) 
        : 0,
      avgTaskDuration: completedTasks.length > 0
        ? Math.round(completedTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0) / completedTasks.length)
        : 0
    };
  }

  // Search across all data
  static search(query) {
    const searchTerm = query.toLowerCase().trim();
    const results = {
      teamMembers: [],
      projects: [],
      tasks: [],
      teams: []
    };

    if (searchTerm.length < 2) return results;

    // Search team members
    results.teamMembers = this.getTeamMembers().filter(member =>
      member.name.toLowerCase().includes(searchTerm) ||
      member.role.toLowerCase().includes(searchTerm) ||
      member.email.toLowerCase().includes(searchTerm) ||
      (member.skills && member.skills.some(skill => 
        skill.toLowerCase().includes(searchTerm)
      ))
    );

    // Search projects
    results.projects = this.getProjects().filter(project =>
      project.name.toLowerCase().includes(searchTerm) ||
      project.description.toLowerCase().includes(searchTerm) ||
      project.teamName.toLowerCase().includes(searchTerm)
    );

    // Search tasks
    results.tasks = this.getTasks().filter(task =>
      task.title.toLowerCase().includes(searchTerm) ||
      task.description.toLowerCase().includes(searchTerm) ||
      task.assignee.toLowerCase().includes(searchTerm) ||
      (task.tags && task.tags.some(tag => 
        tag.toLowerCase().includes(searchTerm)
      ))
    );

    // Search teams
    results.teams = this.getTeams().filter(team =>
      team.name.toLowerCase().includes(searchTerm) ||
      team.description.toLowerCase().includes(searchTerm) ||
      team.lead.toLowerCase().includes(searchTerm)
    );

    return results;
  }

  // Get project health status
  static getProjectHealthStatus(projectId) {
    const project = this.getProjectWithTeam(projectId);
    if (!project) return null;
    
    const projectTasks = this.getTasks().filter(t => t.projectId === projectId);
    const completedTasks = projectTasks.filter(t => t.status === 'completed');
    const overdueTasks = projectTasks.filter(t => {
      const deadline = new Date(t.deadline);
      const today = new Date();
      return deadline < today && t.status !== 'completed';
    });
    
    const today = new Date();
    const deadline = new Date(project.deadline);
    const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    
    // Calculate health score (0-100)
    let healthScore = project.progress;
    
    // Adjust for overdue tasks
    if (overdueTasks.length > 0) {
      healthScore -= (overdueTasks.length * 5);
    }
    
    // Adjust for time remaining
    if (daysRemaining < 7 && project.progress < 80) {
      healthScore -= 20;
    } else if (daysRemaining < 14 && project.progress < 60) {
      healthScore -= 10;
    }
    
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    // Determine health status
    let status = 'healthy';
    let color = '#51CF66';
    
    if (healthScore < 50) {
      status = 'critical';
      color = '#FF6B6B';
    } else if (healthScore < 70) {
      status = 'warning';
      color = '#FF922B';
    } else if (healthScore < 85) {
      status = 'moderate';
      color = '#4DA5AD';
    }
    
    return {
      projectId,
      projectName: project.name,
      healthScore: Math.round(healthScore),
      status,
      color,
      progress: project.progress,
      daysRemaining,
      overdueTasks: overdueTasks.length,
      completedTasks: completedTasks.length,
      totalTasks: projectTasks.length,
      completionRate: projectTasks.length > 0 
        ? Math.round((completedTasks.length / projectTasks.length) * 100) 
        : 0
    };
  }

  // Get all project health statuses
  static getAllProjectHealthStatuses() {
    const projects = this.getProjects();
    return projects.map(project => this.getProjectHealthStatus(project.id)).filter(Boolean);
  }

  // Get resource allocation report
  static getResourceAllocationReport() {
    const teams = this.getTeams();
    const projects = this.getProjects();
    const teamMembers = this.getTeamMembers();
    
    return teams.map(team => {
      const teamProjects = projects.filter(p => p.teamId === team.id);
      const members = teamMembers.filter(m => team.members.includes(m.id));
      
      const totalProjectHours = teamProjects.reduce((sum, p) => {
        const projectTasks = this.getTasks().filter(t => t.projectId === p.id);
        return sum + projectTasks.reduce((taskSum, t) => taskSum + (t.estimatedHours || 0), 0);
      }, 0);
      
      const totalMemberCapacity = members.reduce((sum, m) => {
        // Assuming 8 hours per day, 5 days per week, 4 weeks per month
        const monthlyCapacity = 8 * 5 * 4;
        return sum + monthlyCapacity;
      }, 0);
      
      const utilizationRate = totalMemberCapacity > 0 
        ? Math.round((totalProjectHours / totalMemberCapacity) * 100) 
        : 0;
      
      return {
        teamId: team.id,
        teamName: team.name,
        memberCount: members.length,
        projectCount: teamProjects.length,
        totalProjectHours,
        totalMemberCapacity,
        utilizationRate,
        status: utilizationRate > 90 ? 'overloaded' : utilizationRate < 60 ? 'underutilized' : 'optimal',
        projects: teamProjects.map(p => ({
          id: p.id,
          name: p.name,
          progress: p.progress
        }))
      };
    });
  }
}

export default EnhancedDataService;