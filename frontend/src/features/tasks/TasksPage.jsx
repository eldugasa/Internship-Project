import { useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Edit,
  Eye,
  Filter,
  Flag,
  Loader2,
  MoreVertical,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  SortAsc,
  SortDesc,
  Trash2,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  deleteTask,
  updateTaskStatus,
} from "../../services/tasksService";
import {
  TASK_MODES,
  getTaskCreatePath,
  getTaskDetailsPath,
  getTaskEditPath,
  resolveCanAssignTasks,
} from "./taskAccess";
import {
  MY_TASKS_QUERY_KEY,
  calculateTaskStats,
  filterTasks,
  formatDate,
  getNextTeamMemberStatus,
  getPriorityColor,
  getProjectName,
  getStatusColor,
  getTaskProjectLabel,
  getTeamMemberTaskProgress,
  isTaskOverdue,
  isTeamMemberTaskDone,
  myTasksQuery,
  parseDate,
} from "./taskShared";
import {
  invalidateTasksQueries,
  tasksQuery,
} from "../../loader/manager/Tasks.loader";

const getPriorityIcon = (priority) => {
  switch (priority) {
    case "high":
      return <Flag className="w-3 h-3 text-red-500" />;
    case "medium":
      return <Flag className="w-3 h-3 text-yellow-500" />;
    case "low":
      return <Flag className="w-3 h-3 text-green-500" />;
    default:
      return <Flag className="w-3 h-3 text-gray-500" />;
  }
};

const extractProjects = (tasks) => {
  const uniqueProjects = [];
  const projectIds = new Set();

  tasks.forEach((task) => {
    if (task.projectId && !projectIds.has(task.projectId)) {
      projectIds.add(task.projectId);
      uniqueProjects.push({
        id: task.projectId,
        name: getTaskProjectLabel(task),
      });
    }
  });

  return uniqueProjects;
};

const getQaStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
    case "passed":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "in-test":
      return <PlayCircle className="w-4 h-4 text-blue-500" />;
    case "failed":
    case "pending-retest":
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case "in-progress":
      return <RefreshCw className="w-4 h-4 text-[#4DA5AD]" />;
    default:
      return <RefreshCw className="w-4 h-4 text-gray-500" />;
  }
};

const TEAM_PROGRESS_STEPS = [25, 50, 75, 100];
const TEAM_PROGRESS_UPDATE_STATUSES = ["in-progress", "pending-retest", "failed"];
const EMPTY_TASKS = [];
const EMPTY_PROJECTS = [];

const getTaskDueDate = (task) => task.rawDueDate || task.dueDate || task.deadline;

const formatTaskStatus = (status) => status?.replace(/-/g, " ") || "unknown";

const downloadTasksCsv = (tasks) => {
  const csvData = tasks.map((task) => ({
    "Task Title": task.title,
    Project: getTaskProjectLabel(task),
    Status: task.status,
    Priority: task.priority,
    "Due Date": formatDate(getTaskDueDate(task), "N/A"),
    Progress: `${getTeamMemberTaskProgress(task)}%`,
  }));

  const headers = Object.keys(csvData[0]);
  const escapeCsvValue = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [
    headers.join(","),
    ...csvData.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `my-tasks-${new Date().toISOString().split("T")[0]}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
};

const TasksSkeleton = () => (
  <div className="p-4 sm:p-6">
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="h-24 bg-gray-100 rounded-xl"></div>
        ))}
      </div>
      <div className="h-64 bg-gray-100 rounded-xl"></div>
    </div>
  </div>
);

const TasksError = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
      <h3 className="text-lg font-semibold text-red-800 mb-2">
        Failed to Load Tasks
      </h3>
      <p className="text-red-600 mb-4">
        {error?.message || "Unable to load tasks"}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-lg"
      >
        Retry
      </button>
    </div>
  </div>
);

const ManagerTaskRow = ({
  task,
  projects,
  onView,
  onDelete,
  canAssignTasks,
}) => {
  const overdue = isTaskOverdue(task);

  return (
    <tr className="hover:bg-gray-50 border-t border-gray-200">
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">{task.title}</div>
        <div className="text-xs text-gray-500 capitalize">{task.status}</div>
      </td>
      <td className="px-4 py-3 text-sm">
        {getProjectName(task.projectId, projects)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-[#0f5841] to-[#194f87] rounded-full flex items-center justify-center text-white text-sm font-medium mr-2">
            {task.assigneeName?.charAt(0) || "U"}
          </div>
          <span className="text-sm">{task.assigneeName || "Unassigned"}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
          {task.priority || "medium"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div
          className={`text-sm ${overdue ? "text-red-600 font-bold" : "text-gray-600"}`}
        >
          {formatDate(getTaskDueDate(task))}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-20 bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#0f5841] h-2 rounded-full"
              style={{ width: `${task.progress || 0}%` }}
            />
          </div>
          <span className="text-xs">{task.progress || 0}%</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex space-x-1">
          <button
            onClick={() => onView(task)}
            className="p-1 text-[#0f5841] hover:bg-[#0f5841]/10 rounded"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          {canAssignTasks && (
            <button
              onClick={() => onDelete(task.id)}
              className="p-1 text-red-500 hover:bg-red-50 rounded"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

const ManagerMobileTaskCard = ({
  task,
  projects,
  onView,
  onEdit,
  onDelete,
  canAssignTasks,
}) => {
  const overdue = isTaskOverdue(task);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{task.title}</h3>
          <div className="flex gap-2 mt-1 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(task.status)}`}>
              {task.status || "pending"}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
              {task.priority || "medium"}
            </span>
            {overdue && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-600">
                Overdue
              </span>
            )}
          </div>
        </div>
        <div className="flex space-x-1">
          <button onClick={() => onView(task)} className="p-1 text-[#0f5841]">
            <Eye className="w-4 h-4" />
          </button>
          {canAssignTasks && (
            <>
              <button onClick={() => onEdit(task)} className="p-1 text-blue-600">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => onDelete(task.id)} className="p-1 text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Project:</span>
          <span className="font-medium">
            {getProjectName(task.projectId, projects)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Assignee:</span>
          <span>{task.assigneeName || "Unassigned"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Deadline:</span>
          <span className={overdue ? "text-red-600 font-bold" : "text-gray-900"}>
            {formatDate(getTaskDueDate(task))}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Progress:</span>
          <div className="flex items-center gap-2">
            <div className="w-20 bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-[#0f5841] h-1.5 rounded-full"
                style={{ width: `${task.progress || 0}%` }}
              />
            </div>
            <span>{task.progress || 0}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ManagerEmptyState = ({
  searchQuery,
  onClearSearch,
  onCreateTask,
  canAssignTasks,
}) => (
  <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
    <div className="text-4xl mb-4">{searchQuery ? "Search" : "Tasks"}</div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      {searchQuery ? "No tasks found" : "No tasks yet"}
    </h3>
    <p className="text-gray-500 mb-4">
      {searchQuery
        ? `No tasks match "${searchQuery}"`
        : canAssignTasks
          ? "Create your first task to get started"
          : "No tasks are available to manage right now"}
    </p>
    {searchQuery ? (
      <button onClick={onClearSearch} className="text-[#0f5841] hover:underline">
        Clear search
      </button>
    ) : canAssignTasks ? (
      <button
        onClick={onCreateTask}
        className="px-4 py-2 bg-[#0f5841] text-white rounded-lg hover:bg-[#0a4030] inline-flex items-center gap-2"
      >
        <Plus className="w-4 h-4" /> Create Task
      </button>
    ) : null}
  </div>
);

const TasksPage = ({ mode = TASK_MODES.MANAGER, loaderData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const canAssignTasks = resolveCanAssignTasks(hasPermission);

  const managerQueryParams = new URLSearchParams(location.search);
  const [managerFilter, setManagerFilter] = useState("all");
  const [managerSearchQuery, setManagerSearchQuery] = useState(
    managerQueryParams.get("q") || "",
  );
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [qaSearchTerm, setQaSearchTerm] = useState(
    managerQueryParams.get("search") || "",
  );
  const [qaStatusFilter, setQaStatusFilter] = useState("ALL");

  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [teamStatusFilter, setTeamStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [sortBy, setSortBy] = useState("deadline");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const safeTasks = Array.isArray(loaderData?.tasks) ? loaderData.tasks : EMPTY_TASKS;
  const safeProjects = Array.isArray(loaderData?.projects)
    ? loaderData.projects
    : EMPTY_PROJECTS;

  const managerTasksQuery = useQuery({
    ...tasksQuery(),
    initialData: safeTasks,
    enabled: mode === TASK_MODES.MANAGER,
    refetchInterval: mode === TASK_MODES.MANAGER ? 30000 : false,
    staleTime: 5000,
  });

  const memberTasksQuery = useQuery({
    ...myTasksQuery(),
    enabled: mode !== TASK_MODES.MANAGER && !!user,
    refetchInterval: mode !== TASK_MODES.MANAGER ? 30000 : false,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, progress, status }) =>
      updateTaskStatus(taskId, status, progress),
    onMutate: async ({ taskId, progress, status }) => {
      await queryClient.cancelQueries({ queryKey: MY_TASKS_QUERY_KEY });

      const previousTasks = queryClient.getQueryData(MY_TASKS_QUERY_KEY);

      queryClient.setQueryData(MY_TASKS_QUERY_KEY, (old) =>
        Array.isArray(old)
          ? old.map((task) =>
              task.id === taskId ? { ...task, progress, status } : task,
            )
          : old,
      );

      return { previousTasks };
    },
    onError: (error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(MY_TASKS_QUERY_KEY, context.previousTasks);
      }
      alert(error.message || "Failed to update task");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MY_TASKS_QUERY_KEY });
      setUpdatingTaskId(null);
    },
  });

  const managerDisplayTasks = managerTasksQuery.data || safeTasks;
  const teamTasks = Array.isArray(memberTasksQuery.data)
    ? memberTasksQuery.data
    : EMPTY_TASKS;
  const isLoading = mode === TASK_MODES.MANAGER
    ? managerTasksQuery.isLoading && safeTasks.length === 0
    : memberTasksQuery.isLoading && teamTasks.length === 0;
  const queryError =
    mode === TASK_MODES.MANAGER ? managerTasksQuery.error : memberTasksQuery.error;

  const managerFilteredTasks = useMemo(
    () => filterTasks(managerDisplayTasks, managerFilter, managerSearchQuery),
    [managerDisplayTasks, managerFilter, managerSearchQuery],
  );
  const managerStats = useMemo(
    () => calculateTaskStats(managerFilteredTasks),
    [managerFilteredTasks],
  );

  const teamProjects = useMemo(() => extractProjects(teamTasks), [teamTasks]);

  const qaFilteredTasks = useMemo(
    () =>
      teamTasks.filter((task) => {
        const matchesSearch =
          task.title.toLowerCase().includes(qaSearchTerm.toLowerCase()) ||
          getTaskProjectLabel(task)
            .toLowerCase()
            .includes(qaSearchTerm.toLowerCase());

        if (qaStatusFilter === "ALL") return matchesSearch;
        return (
          matchesSearch &&
          task.status?.toLowerCase() === qaStatusFilter.toLowerCase()
        );
      }),
    [qaSearchTerm, qaStatusFilter, teamTasks],
  );

  const teamFilteredTasks = useMemo(() => {
    let result = [...teamTasks];

    if (teamStatusFilter !== "all") {
      result = result.filter((task) => task.status === teamStatusFilter);
    }

    if (priorityFilter !== "all") {
      result = result.filter((task) => task.priority === priorityFilter);
    }

    if (projectFilter !== "all") {
      result = result.filter((task) => task.projectId === Number(projectFilter));
    }

    if (teamSearchQuery.trim()) {
      const query = teamSearchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          getTaskProjectLabel(task).toLowerCase().includes(query) ||
          (task.description || "").toLowerCase().includes(query),
      );
    }

    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "priority": {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison =
            (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
          break;
        }
        case "progress":
          comparison =
            getTeamMemberTaskProgress(b) - getTeamMemberTaskProgress(a);
          break;
        case "deadline":
        default: {
          const dateA = parseDate(a.rawDueDate || a.dueDate || a.deadline);
          const dateB = parseDate(b.rawDueDate || b.dueDate || b.deadline);
          comparison = (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
          break;
        }
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [
    priorityFilter,
    projectFilter,
    sortBy,
    sortOrder,
    teamSearchQuery,
    teamStatusFilter,
    teamTasks,
  ]);

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    setDeletingId(taskId);
    try {
      await deleteTask(taskId);
      await invalidateTasksQueries();
      await managerTasksQuery.refetch();
    } catch (error) {
      alert(error.message || "Failed to delete task");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateProgress = (taskId, progress) => {
    const task = teamTasks.find((item) => item.id === taskId);
    if (!task) return;

    const status = getNextTeamMemberStatus(task, progress);
    setUpdatingTaskId(taskId);
    updateTaskMutation.mutate({ taskId, progress, status });
  };

  const handleStartTask = (taskId) => {
    const task = teamTasks.find((item) => item.id === taskId);
    if (!task) return;

    const status = getNextTeamMemberStatus(task, task.progress || 0, true);
    setUpdatingTaskId(taskId);
    updateTaskMutation.mutate({
      taskId,
      progress: task.progress || 0,
      status,
    });
  };

  const clearManagerSearch = () => {
    setManagerSearchQuery("");
    navigate({ search: "" }, { replace: true });
  };

  if (isLoading) {
    return <TasksSkeleton />;
  }

  if (queryError && (mode !== TASK_MODES.MANAGER || teamTasks.length === 0)) {
    return (
      <TasksError
        error={queryError}
        onRetry={() =>
          mode === TASK_MODES.MANAGER
            ? managerTasksQuery.refetch()
            : memberTasksQuery.refetch()
        }
      />
    );
  }

  if (mode === TASK_MODES.QA) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">My QA Tasks</h1>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={qaSearchTerm}
              onChange={(event) => setQaSearchTerm(event.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA5AD]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={qaStatusFilter}
              onChange={(event) => setQaStatusFilter(event.target.value)}
              className="border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-[#4DA5AD] bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="in-progress">In Progress</option>
              <option value="in-test">In Test</option>
              <option value="completed">Completed</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="pending-retest">Pending Retest</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {qaFilteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-8 text-center text-gray-500"
            >
              No tasks found matching your criteria.
            </motion.div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                      Task Name
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                      Project
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                      Progress
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                      Due Date
                    </th>
                  </tr>
                </thead>
                <motion.tbody
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                 className="divide-y divide-gray-100">
                  {qaFilteredTasks.map((task) => {
                    const taskProgress = getTeamMemberTaskProgress(task);

                    return (
                      <tr
                        key={task.id}
                        onClick={() =>
                          navigate(getTaskDetailsPath(TASK_MODES.QA, task.id))
                        }
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {task.title}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">
                            {task.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {getTaskProjectLabel(task)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getQaStatusIcon(task.status)}
                            <span className="text-sm uppercase font-medium text-gray-700">
                              {formatTaskStatus(task.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div
                                className={`h-2 rounded-full ${taskProgress === 100 ? "bg-green-500" : "bg-[#4DA5AD]"}`}
                                style={{ width: `${taskProgress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {taskProgress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(getTaskDueDate(task), "No date")}
                        </td>
                      </tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (mode === TASK_MODES.TEAM) {
    if (!user) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#4DA5AD] animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      );
    }

    const hasActiveFilters =
      teamSearchQuery !== "" ||
      teamStatusFilter !== "all" ||
      priorityFilter !== "all" ||
      projectFilter !== "all";

    const handleExport = () => {
      if (teamFilteredTasks.length === 0) {
        alert("No tasks to export");
        return;
      }

      downloadTasksCsv(teamFilteredTasks);
    };

    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-gray-600">
              Manage and update your assigned tasks
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExport}
              disabled={teamFilteredTasks.length === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2" /> Export
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={teamSearchQuery}
                onChange={(event) => setTeamSearchQuery(event.target.value)}
                placeholder="Search tasks by title, description, or project..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
              />
              {teamSearchQuery && (
                <button
                  onClick={() => setTeamSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              <ChevronDown
                className={`w-4 h-4 ml-2 transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
              >
                <option value="deadline">Deadline</option>
                <option value="priority">Priority</option>
                <option value="title">Title</option>
                <option value="progress">Progress</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title={sortOrder === "asc" ? "Ascending" : "Descending"}
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={teamStatusFilter}
                  onChange={(event) => setTeamStatusFilter(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="in-test">In Test</option>
              
                  <option value="failed">Failed</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project
                </label>
                <select
                  value={projectFilter}
                  onChange={(event) => setProjectFilter(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                >
                  <option value="all">All Projects</option>
                  {teamProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="text-sm text-gray-600">
            Showing {teamFilteredTasks.length} of {teamTasks.length} tasks
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setTeamSearchQuery("");
                setTeamStatusFilter("all");
                setPriorityFilter("all");
                setProjectFilter("all");
              }}
              className="text-sm text-[#4DA5AD] hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
        <AnimatePresence>
        {teamFilteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {teamFilteredTasks.map((task) => {
              const isTaskUpdating = updatingTaskId === task.id;
              const overdue = isTaskOverdue(task);
              const taskProgress = getTeamMemberTaskProgress(task);
              const isTaskDone = isTeamMemberTaskDone(task);

              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow ${isTaskUpdating ? "opacity-75" : ""}`}
                >
                  {task.status === "pending-retest" && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                      <AlertCircle className="w-4 h-4" />
                      Failed
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">
                        {task.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mb-2 flex-wrap gap-y-1">
                        <span className="text-[#4DA5AD] font-medium">
                          {getTaskProjectLabel(task)}
                        </span>
                        {task.projectId && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Due: {formatDate(getTaskDueDate(task))}
                            </span>
                          </>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        navigate(getTaskDetailsPath(TASK_MODES.TEAM, task.id))
                      }
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                      title="View details"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${getPriorityColor(task.priority)}`}>
                      {getPriorityIcon(task.priority)}
                      <span className="ml-1 capitalize">{task.priority}</span>
                    </span>
                    {overdue && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Overdue
                      </span>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Progress: {taskProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${taskProgress === 100 ? "bg-green-500" : taskProgress >= 75 ? "bg-blue-500" : taskProgress >= 50 ? "bg-yellow-500" : "bg-orange-500"}`}
                        style={{ width: `${taskProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      onClick={() =>
                        navigate(getTaskDetailsPath(TASK_MODES.TEAM, task.id))
                      }
                      className="text-[#4DA5AD] hover:text-[#3D8B93] text-sm font-medium flex items-center transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" /> View Details
                    </button>
                    <div className="flex gap-2">
                      {task.status === "pending" && (
                        <button
                          onClick={() => handleStartTask(task.id)}
                          disabled={isTaskUpdating}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 flex items-center transition-colors disabled:opacity-50"
                        >
                          {isTaskUpdating ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <PlayCircle className="w-4 h-4 mr-1" />
                          )}
                          Start
                        </button>
                      )}
                      {TEAM_PROGRESS_UPDATE_STATUSES.includes(task.status) &&
                        taskProgress !== 100 && (
                          <div className="flex gap-1">
                            {TEAM_PROGRESS_STEPS.map((percent) => (
                              <button
                                key={percent}
                                onClick={() =>
                                  handleUpdateProgress(task.id, percent)
                                }
                                disabled={isTaskUpdating}
                                className={`px-2 py-1 text-xs rounded ${taskProgress === percent ? "bg-[#4DA5AD] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} disabled:opacity-50`}
                              >
                                {percent}%
                              </button>
                            ))}
                          </div>
                        )}
                      {(task.status === "in-test" ||
                        (taskProgress === 100 && !isTaskDone)) && (
                        <button
                          disabled
                          className="px-3 py-1.5 bg-cyan-100 text-cyan-700 text-sm rounded-lg flex items-center"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Sent to QA
                        </button>
                      )}
                      {isTaskDone && (
                        <button
                          disabled
                          className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-lg flex items-center"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-gray-400 text-4xl mb-4">Tasks</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tasks found
            </h3>
            <p className="text-gray-500">
              {hasActiveFilters
                ? "No tasks match your filters"
                : "You have no assigned tasks yet"}
            </p>
          </div>
        )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600">Create and assign tasks to team members</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => managerTasksQuery.refetch()}
            disabled={managerTasksQuery.isFetching}
            className="p-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              className={`w-5 h-5 text-gray-600 ${managerTasksQuery.isFetching ? "animate-spin" : ""}`}
            />
          </button>
          {canAssignTasks && (
            <button
              onClick={() => navigate(getTaskCreatePath(TASK_MODES.MANAGER))}
              className="px-4 py-2 bg-[#0f5841] text-white rounded-lg hover:bg-[#0a4030] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Task
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border">
          <div className="text-2xl font-bold">{managerStats.total}</div>
          <div className="text-sm text-gray-500">Total Tasks</div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="text-2xl font-bold text-green-600">
            {managerStats.completed}
          </div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="text-2xl font-bold text-red-600">
            {managerStats.overdue}
          </div>
          <div className="text-sm text-gray-500">Overdue</div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="text-2xl font-bold text-orange-600">
            {managerStats.highPriority}
          </div>
          <div className="text-sm text-gray-500">High Priority</div>
        </div>
      </div>

      <button
        onClick={() => setShowMobileFilters(!showMobileFilters)}
        className="sm:hidden flex items-center justify-between w-full px-4 py-2 bg-white border rounded-lg mb-4"
      >
        <span className="flex items-center gap-2">
          <Filter className="w-4 h-4" /> Filters
        </span>
        {showMobileFilters ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      <div className={`${showMobileFilters ? "block" : "hidden"} sm:block mb-6`}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 overflow-x-auto">
            {["all", "pending", "in-progress", "completed"].map((status) => (
              <button
                key={status}
                onClick={() => setManagerFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${managerFilter === status ? "bg-[#0f5841] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={managerSearchQuery}
              onChange={(event) => {
                const value = event.target.value;
                setManagerSearchQuery(value);
                const params = new URLSearchParams();
                if (value.trim()) params.set("q", value);
                navigate({ search: params.toString() }, { replace: true });
              }}
              placeholder="Search tasks..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5841]"
            />
            {managerSearchQuery && (
              <button
                onClick={clearManagerSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {managerSearchQuery && managerFilteredTasks.length > 0 && (
        <p className="text-sm text-gray-500 mb-4">
          Found {managerFilteredTasks.length} task
          {managerFilteredTasks.length !== 1 ? "s" : ""} for "
          {managerSearchQuery}"
        </p>
      )}
      <AnimatePresence mode="wait">
      {managerFilteredTasks.length > 0 ? (
        <div key="task-list">
          <div className="hidden sm:block bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      Task
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      Project
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      Assignee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      Deadline
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      Progress
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <motion.tbody
                layout
                mode="wait"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {managerFilteredTasks.map((task) => (
                    <ManagerTaskRow
                      key={task.id}
                      task={task}
                      projects={safeProjects}
                      onView={(item) =>
                        navigate(getTaskDetailsPath(TASK_MODES.MANAGER, item.id))
                      }
                      onDelete={handleDeleteTask}
                      canAssignTasks={canAssignTasks && deletingId !== task.id}
                    />
                  ))}
                </motion.tbody>
              </table>
            </div>
          </div>

          <div className="sm:hidden space-y-4">
            {managerFilteredTasks.map((task) => (
              <ManagerMobileTaskCard
                key={task.id}
                task={task}
                projects={safeProjects}
                onView={(item) =>
                  navigate(getTaskDetailsPath(TASK_MODES.MANAGER, item.id))
                }
                onEdit={(item) =>
                  navigate(getTaskEditPath(TASK_MODES.MANAGER, item.id))
                }
                onDelete={handleDeleteTask}
                canAssignTasks={canAssignTasks}
              />
            ))}
          </div>
        </div>
      ) : (
        <div key="empty-state">
          <ManagerEmptyState
            searchQuery={managerSearchQuery}
            onClearSearch={clearManagerSearch}
            onCreateTask={() => navigate(getTaskCreatePath(TASK_MODES.MANAGER))}
            canAssignTasks={canAssignTasks}
          />
        </div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default TasksPage;
