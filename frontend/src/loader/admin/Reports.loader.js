// src/loader/admin/Reports.loader.js
import { getUsers } from "../../services/usersService";
import { getProjects } from "../../services/projectsService";
import { getTeams } from "../../services/teamsService";
import { getTasks } from "../../services/tasksService";
import { queryClient } from "../../services/apiClient";

export const usersQuery = () => ({
  queryKey: ["users"],
  queryFn: getUsers,
  staleTime: 1000 * 60 * 5,
  cacheTime: 1000 * 60 * 10,
});

export const projectsQuery = () => ({
  queryKey: ["projects"],
  queryFn: getProjects,
  staleTime: 1000 * 60 * 5,
  cacheTime: 1000 * 60 * 10,
});

export const teamsQuery = () => ({
  queryKey: ["teams"],
  queryFn: getTeams,
  staleTime: 1000 * 60 * 5,
  cacheTime: 1000 * 60 * 10,
});

export const tasksQuery = () => ({
  queryKey: ["tasks"],
  queryFn: getTasks,
  staleTime: 1000 * 60 * 5,
  cacheTime: 1000 * 60 * 10,
});

// Calculate stats from data
export const calculateStats = (users, projects, teams, tasks) => {
  const totalUsers = users.length;
  const totalTeams = teams.length;
  const totalProjects = projects.length;
  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (t) => t.status === "completed" || t.status === "done",
  ).length;

  const inProgressTasks = tasks.filter(
    (t) => t.status === "in-progress" || t.status === "in_progress",
  ).length;

  const pendingTasks = tasks.filter((t) => t.status === "pending").length;

  const overdueTasks = tasks.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate) < new Date() &&
      t.status !== "completed" &&
      t.status !== "done",
  ).length;

  const projectManagers = users.filter(
    (u) => u.role === "project-manager" || u.role === "project_manager",
  ).length;

  const teamMembers = users.filter(
    (u) => u.role === "team-member" || u.role === "team_member",
  ).length;

  // Project status breakdown
  const projectStatus = {
    planned: projects.filter((p) => p.status === "planned").length,
    active: projects.filter(
      (p) => p.status === "active" || p.status === "in_progress",
    ).length,
    completed: projects.filter((p) => p.status === "completed").length,
    onHold: projects.filter((p) => p.status === "on-hold").length,
  };

  // Task priority breakdown
  const taskPriority = {
    high: tasks.filter((t) => t.priority === "high" || t.priority === "HIGH")
      .length,
    medium: tasks.filter(
      (t) => t.priority === "medium" || t.priority === "MEDIUM",
    ).length,
    low: tasks.filter((t) => t.priority === "low" || t.priority === "LOW")
      .length,
  };

  // User role breakdown
  const userRoles = {
    admins: users.filter((u) => u.role === "admin").length,
    projectManagers: users.filter(
      (u) => u.role === "project-manager" || u.role === "project_manager",
    ).length,
    teamMembers: users.filter(
      (u) => u.role === "team-member" || u.role === "team_member",
    ).length,
  };

  return {
    totalUsers,
    totalTeams,
    totalProjects,
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    overdueTasks,
    projectManagers,
    teamMembers,
    completionRate:
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    projectStatus,
    taskPriority,
    userRoles,
  };
};

// Prefetch queries into React Query cache and return resolved data
export async function reportsLoader() {
  const [usersData, projectsData, teamsData, tasksData] = await Promise.all([
    queryClient.ensureQueryData(usersQuery()),
    queryClient.ensureQueryData(projectsQuery()),
    queryClient.ensureQueryData(teamsQuery()),
    queryClient.ensureQueryData(tasksQuery()),
  ]);

  return {
    users: usersData,
    projects: projectsData,
    teams: teamsData,
    tasks: tasksData,
  };
}
