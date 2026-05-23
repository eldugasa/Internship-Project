import { PERMISSIONS } from "../../config/permissions";

export const TASK_MODES = {
  MANAGER: "manager",
  QA: "qa",
  TEAM: "team",
};

export const getTaskBasePath = (mode = TASK_MODES.MANAGER) => {
  switch (mode) {
    case TASK_MODES.QA:
      return "/qa-tester/tasks";
    case TASK_MODES.TEAM:
      return "/team-member/tasks";
    case TASK_MODES.MANAGER:
    default:
      return "/manager/tasks";
  }
};

export const getTaskDetailsPath = (mode, taskId) =>
  `${getTaskBasePath(mode)}/${taskId}`;

export const getTaskCreatePath = (mode = TASK_MODES.MANAGER, projectId) => {
  const basePath = `${getTaskBasePath(mode)}/create`;
  return projectId ? `${basePath}?projectId=${projectId}` : basePath;
};

export const getTaskEditPath = (mode = TASK_MODES.MANAGER, taskId) =>
  `${getTaskBasePath(mode)}/edit/${taskId}`;

export const resolveCanAssignTasks = (hasPermission) =>
  typeof hasPermission === "function" &&
  hasPermission(PERMISSIONS.ASSIGN_TASKS);

export const resolveCanTestTasks = (hasPermission) =>
  typeof hasPermission === "function" &&
  hasPermission(PERMISSIONS.TEST_TASKS);
