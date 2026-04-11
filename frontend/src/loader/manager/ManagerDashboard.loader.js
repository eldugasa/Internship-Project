// src/loader/manager/ManagerDashboard.loader.js
import { queryClient } from "../../services/apiClient";
import { getProjects } from "../../services/projectsService";
import { getTasks } from "../../services/tasksService";
import { getTeams } from "../../services/teamsService";

// Query configurations with proper typing and error handling
export const managerProjectsQuery = () => ({
  queryKey: ["manager", "projects"],
  queryFn: async ({ signal }) => {
    try {
      const projects = await getProjects({ signal });
      return Array.isArray(projects) ? projects : [];
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      return [];
    }
  },
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
  retry: 1,
});

export const managerTasksQuery = () => ({
  queryKey: ["manager", "tasks"],
  queryFn: async ({ signal }) => {
    try {
      const tasks = await getTasks({ signal });
      return Array.isArray(tasks) ? tasks : [];
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      return [];
    }
  },
  staleTime: 1000 * 60 * 3,
  gcTime: 1000 * 60 * 8,
  retry: 1,
});

export const managerTeamsQuery = () => ({
  queryKey: ["manager", "teams"],
  queryFn: async ({ signal }) => {
    try {
      const teams = await getTeams({ signal });
      return Array.isArray(teams) ? teams : [];
    } catch (error) {
      console.error("Failed to fetch teams:", error);
      return [];
    }
  },
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
  retry: 1,
});

// Helper functions for date parsing
export const parseDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    if (typeof dateStr === "string") {
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
        return new Date(dateStr);
      }
      if (dateStr.includes("/")) {
        const [day, month, year] = dateStr.split("/");
        return new Date(`${year}-${month}-${day}`);
      }
    }
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    const date = parseDate(dateStr);
    if (!date) return "N/A";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
};

// Calculate dashboard metrics from data
export const calculateMetrics = (projects, tasks, teams) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const activeProjects = projects.filter((p) => {
    const status = p.status?.toLowerCase();
    return status === "active" || status === "in-progress" || status === "in_progress";
  }).length;

  const completedProjects = projects.filter((p) => {
    const status = p.status?.toLowerCase();
    return status === "completed";
  }).length;

  const plannedProjects = projects.filter((p) => {
    const status = p.status?.toLowerCase();
    return status === "planned" || status === "pending";
  }).length;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;

  const overdueTasks = tasks.filter((t) => {
    if (t.status === "completed" || !t.dueDate) return false;
    const dueDate = parseDate(t.dueDate);
    return dueDate && dueDate < now;
  }).length;

  const totalTeamMembers = teams.reduce((sum, team) => {
    const memberCount = team.members?.length || team.memberCount || 0;
    return sum + memberCount;
  }, 0);

  const projectsAtRisk = projects.filter((p) => {
    if (p.status === "completed") return false;
    const deadline = parseDate(p.dueDate || p.endDate);
    if (!deadline) return false;
    const progress = p.progress || 0;
    const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return (daysUntilDeadline < 7 && progress < 50) || (deadline < now && progress < 100);
  }).length;

  const projectsOnTrack = projects.filter((p) => {
    if (p.status === "completed") return true;
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
      onTrack: projectsOnTrack,
    },
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      inProgress: inProgressTasks,
      pending: pendingTasks,
      overdue: overdueTasks,
      completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
    },
    teams: {
      total: teams.length,
      members: totalTeamMembers,
    },
    performance: {
      projectSuccessRate: projects.length ? Math.round((completedProjects / projects.length) * 100) : 0,
      taskCompletionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      onTimeDelivery: completedTasks ? Math.round(((completedTasks - overdueTasks) / completedTasks) * 100) : 0,
    },
  };
};

// Calculate chart data
export const calculateChartData = (metrics, tasks) => {
  const statusData = [
    { name: "Active", value: metrics.projects.active, color: "#0f5841" },
    { name: "Completed", value: metrics.projects.completed, color: "#10b981" },
    { name: "Planned", value: metrics.projects.planned, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  const taskData = [
    { name: "Completed", value: metrics.tasks.completed, color: "#10b981" },
    { name: "In Progress", value: metrics.tasks.inProgress, color: "#3b82f6" },
    { name: "Pending", value: metrics.tasks.pending, color: "#f59e0b" },
    { name: "Overdue", value: metrics.tasks.overdue, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const weeklyData = [];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const dayTasks = tasks.filter((t) => {
      const taskDate = parseDate(t.updatedAt || t.createdAt);
      return taskDate && taskDate.toDateString() === date.toDateString();
    });

    weeklyData.push({
      day: days[date.getDay()],
      tasks: dayTasks.length,
      completed: dayTasks.filter((t) => t.status === "completed").length,
    });
  }

  return { statusData, taskData, weeklyData };
};

// Get recent activities
export const getRecentActivities = (tasks, projects) => {
  const activities = [];

  tasks.slice(0, 5).forEach((task) => {
    activities.push({
      id: `task-${task.id}`,
      type: "task",
      title: task.status === "completed" ? "Task Completed" : "Task Updated",
      message: `${task.title} - ${task.projectName || "No project"}`,
      time: task.updatedAt ? formatDate(task.updatedAt) : "Recently",
      status: task.status,
      taskId: task.id,
    });
  });

  projects.slice(0, 3).forEach((project) => {
    activities.push({
      id: `project-${project.id}`,
      type: "project",
      title: "Project Updated",
      message: `${project.name} - ${project.progress || 0}% complete`,
      time: project.updatedAt ? formatDate(project.updatedAt) : "Recently",
      status: project.status,
      projectId: project.id,
    });
  });

  return activities
    .sort((a, b) => {
      const dateA = parseDate(a.time);
      const dateB = parseDate(b.time);
      if (!dateA || !dateB) return 0;
      return dateB - dateA;
    })
    .slice(0, 5);
};

// ============================================
// LOADER (React Router v7 - Returns data directly)
// ============================================

export async function managerDashboardLoader() {
  console.log('🔄 Loading manager dashboard data...');
  
  try {
    // Fetch all data in parallel
    const [projects, tasks, teams] = await Promise.all([
      queryClient.ensureQueryData(managerProjectsQuery()),
      queryClient.ensureQueryData(managerTasksQuery()),
      queryClient.ensureQueryData(managerTeamsQuery()),
    ]);

    // Calculate metrics and chart data
    const metrics = calculateMetrics(projects, tasks, teams);
    const chartData = calculateChartData(metrics, tasks);
    const recentActivities = getRecentActivities(tasks, projects);

    return {
      projects,
      tasks,
      teams,
      metrics,
      chartData,
      recentActivities,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Manager dashboard loader error:", error);
    return {
      projects: [],
      tasks: [],
      teams: [],
      metrics: {
        projects: { total: 0, active: 0, completed: 0, planned: 0, atRisk: 0, onTrack: 0 },
        tasks: { total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0, completionRate: 0 },
        teams: { total: 0, members: 0 },
        performance: { projectSuccessRate: 0, taskCompletionRate: 0, onTimeDelivery: 0 },
      },
      chartData: { statusData: [], taskData: [], weeklyData: [] },
      recentActivities: [],
      error: error.message,
    };
  }
}

// Invalidating queries helper
export const invalidateManagerQueries = async () => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["manager", "projects"] }),
    queryClient.invalidateQueries({ queryKey: ["manager", "tasks"] }),
    queryClient.invalidateQueries({ queryKey: ["manager", "teams"] }),
  ]);
};