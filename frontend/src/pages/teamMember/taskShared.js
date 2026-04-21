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
