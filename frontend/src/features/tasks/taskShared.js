import { getMyTasks } from "../../services/tasksService";

export const MY_TASKS_QUERY_KEY = ["team-member", "tasks"];

export const myTasksQuery = () => ({
  queryKey: MY_TASKS_QUERY_KEY,
  queryFn: async ({ signal }) => {
    const tasks = await getMyTasks({ signal });
    return Array.isArray(tasks) ? tasks : [];
  },
  staleTime: 1000 * 60 * 3,
  gcTime: 1000 * 60 * 10,
});

export const TEAM_MEMBER_ACTIVE_STATUSES = new Set([
  "in-progress",
  "in-test",
  "pending-retest",
  "failed",
]);

export const TEAM_MEMBER_DONE_STATUSES = new Set(["completed", "passed"]);

export const isTeamMemberTaskDone = (task) =>
  TEAM_MEMBER_DONE_STATUSES.has(task?.status);

export const getTeamMemberTaskProgress = (task) => {
  if (isTeamMemberTaskDone(task)) {
    return 100;
  }

  const progress = Number(task?.progress);

  if (!Number.isFinite(progress)) {
    return 0;
  }

  if (progress < 0) return 0;
  if (progress > 100) return 100;
  return progress;
};

export const getNextTeamMemberStatus = (
  task,
  progress,
  isStartAction = false,
) => {
  if (progress >= 100) {
    return task?.qaTesterId ? "in-test" : "completed";
  }

  if (isStartAction || progress > 0 || task?.status === "in-progress") {
    return "in-progress";
  }

  return "pending";
};

export const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "low":
      return "bg-green-100 text-green-800";
    case "critical":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
    case "passed":
      return "bg-green-100 text-green-800";
    case "in-progress":
      return "bg-blue-100 text-blue-800";
    case "in-test":
      return "bg-cyan-100 text-cyan-800";
    case "pending-retest":
      return "bg-amber-100 text-amber-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getProjectName = (projectId, projects = []) => {
  const project = projects.find((item) => item.id === projectId);
  return project?.name || "Unknown";
};

export const getTaskProjectLabel = (task) => {
  if (typeof task?.projectName === "string" && task.projectName.trim()) {
    return task.projectName;
  }

  if (typeof task?.project === "string" && task.project.trim()) {
    return task.project;
  }

  if (task?.project && typeof task.project === "object") {
    if (typeof task.project.name === "string" && task.project.name.trim()) {
      return task.project.name;
    }
  }

  return "Unknown Project";
};

export const formatDate = (dateStr, fallback = "N/A") => {
  if (!dateStr) return fallback;
  try {
    if (typeof dateStr === "string" && dateStr.includes("/")) {
      return dateStr;
    }
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return fallback;
  }
};

export const formatDateTime = (dateStr, fallback = "N/A") => {
  if (!dateStr) return fallback;
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return fallback;
  }
};

export const parseDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    if (typeof dateStr === "string" && dateStr.includes("/")) {
      const [day, month, year] = dateStr.split("/");
      return new Date(year, month - 1, day);
    }
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

export const isTaskOverdue = (task) => {
  if (!task || TEAM_MEMBER_DONE_STATUSES.has(task.status)) return false;

  const dueDate = parseDate(task.rawDueDate || task.dueDate || task.deadline);
  if (!dueDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
};

export const isTaskDueWithinDays = (task, days) => {
  if (!task || TEAM_MEMBER_DONE_STATUSES.has(task.status)) return false;

  const dueDate = parseDate(task.rawDueDate || task.dueDate || task.deadline);
  if (!dueDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upperBound = new Date(today);
  upperBound.setDate(upperBound.getDate() + days);
  upperBound.setHours(23, 59, 59, 999);

  dueDate.setHours(0, 0, 0, 0);

  return dueDate >= today && dueDate <= upperBound;
};

export const calculateTeamMemberTaskStats = (tasks = [], efficiency = 95) => {
  const completedTasks = tasks.filter((task) => isTeamMemberTaskDone(task)).length;
  const inProgressTasks = tasks.filter((task) =>
    TEAM_MEMBER_ACTIVE_STATUSES.has(task.status),
  ).length;
  const pendingTasks = tasks.filter((task) => task.status === "pending").length;
  const overdueTasks = tasks.filter((task) => isTaskOverdue(task)).length;

  return {
    totalTasks: tasks.length,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    overdueTasks,
    efficiency,
    completionRate:
      tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
  };
};

export const calculateTaskStats = (tasks = []) => {
  const total = tasks.length;
  const completed = tasks.filter((task) =>
    TEAM_MEMBER_DONE_STATUSES.has(task.status),
  ).length;
  const overdue = tasks.filter((task) => isTaskOverdue(task)).length;
  const highPriority = tasks.filter((task) =>
    ["high", "critical"].includes(task.priority),
  ).length;

  return {
    total,
    completed,
    overdue,
    highPriority,
  };
};

export const filterTasks = (tasks = [], filter, searchQuery) => {
  let result = tasks;

  if (filter && filter !== "all") {
    result = result.filter((task) => task.status === filter);
  }

  if (searchQuery?.trim()) {
    const query = searchQuery.toLowerCase();
    result = result.filter(
      (task) =>
        task.title?.toLowerCase().includes(query) ||
        getTaskProjectLabel(task).toLowerCase().includes(query) ||
        task.assigneeName?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query),
    );
  }

  return result;
};

export const formatRoleLabel = (role) => {
  if (!role) return "Team";
  return role
    .toString()
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};
