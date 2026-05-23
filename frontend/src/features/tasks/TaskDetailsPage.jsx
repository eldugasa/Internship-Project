import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  Flag,
  FolderKanban,
  Link as LinkIcon,
  Loader2,
  MessageSquare,
  PlayCircle,
  RefreshCw,
  Trash2,
  User,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  useNavigate,
  useParams,
  useSubmit,
} from "react-router-dom";
import {
  addTaskComment,
  deleteTask,
  deleteTaskComment,
  getTaskById,
  getTaskComments,
  updateTask,
  updateTaskStatus,
} from "../../services/tasksService";
import {
  TASK_MODES,
  getTaskBasePath,
  getTaskEditPath,
  resolveCanAssignTasks,
  resolveCanTestTasks,
} from "./taskAccess";
import {
  MY_TASKS_QUERY_KEY,
  formatDate,
  formatDateTime,
  formatRoleLabel,
  getNextTeamMemberStatus,
  getPriorityColor,
  getStatusColor,
  getTeamMemberTaskProgress,
  isTaskOverdue,
  isTeamMemberTaskDone,
} from "./taskShared";
import { useAuth } from "../../context/AuthContext";

const COMMENT_TABS = {
  "project-manager": {
    label: "Project Manager",
    prefix: "[To Project Manager]",
    emptyMessage: "No messages with the project manager yet.",
    placeholder: "Write a message for the project manager...",
  },
  "qa-tester": {
    label: "QA Tester",
    prefix: "[To QA Tester]",
    emptyMessage: "No messages with the QA tester yet.",
    placeholder: "Write a message for the QA tester...",
  },
};

const normalizeRole = (role) =>
  role?.toString().trim().toLowerCase().replace(/_/g, "-") || "";

const getCommentTargetTab = (content = "") => {
  const trimmed = content.trim();
  if (trimmed.startsWith(COMMENT_TABS["qa-tester"].prefix)) return "qa-tester";
  if (trimmed.startsWith(COMMENT_TABS["project-manager"].prefix)) {
    return "project-manager";
  }
  return null;
};

const stripCommentTargetPrefix = (content = "") =>
  content
    .replace(COMMENT_TABS["qa-tester"].prefix, "")
    .replace(COMMENT_TABS["project-manager"].prefix, "")
    .trim();

const getCommentConversationTab = (comment) => {
  const role = normalizeRole(comment?.user?.role);
  const explicitTarget = getCommentTargetTab(comment?.content || "");

  if (role === "qa-tester") return "qa-tester";
  if (role === "project-manager") return "project-manager";
  if (role === "team-member") return explicitTarget;
  return explicitTarget || "project-manager";
};

export const taskQuery = (id, queryKeyPrefix = ["tasks"]) => ({
  queryKey: [...queryKeyPrefix, id],
  queryFn: ({ signal }) => getTaskById(id, { signal }),
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
});

export const taskCommentsQuery = (taskId) => ({
  queryKey: ["tasks", taskId, "comments"],
  queryFn: async ({ signal }) => {
    try {
      const comments = await getTaskComments(taskId, { signal });
      return comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } catch {
      return [];
    }
  },
  staleTime: 1000 * 60 * 1,
});

export const loader = (queryClient) => async ({ params }) => {
  const { id } = params;

  const [task, comments] = await Promise.all([
    queryClient.fetchQuery(taskQuery(id)),
    queryClient.fetchQuery(taskCommentsQuery(id)),
  ]);

  return { task, comments };
};

export const action = (queryClient) => async ({ request, params }) => {
  const { id } = params;
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    switch (intent) {
      case "update-progress": {
        const progress = Number.parseInt(formData.get("progress"), 10);
        const newStatus = progress === 100 ? "completed" : "in-progress";
        await updateTask(id, { progress, status: newStatus });

        await queryClient.invalidateQueries({ queryKey: ["tasks", id] });
        await queryClient.invalidateQueries({ queryKey: ["tasks"] });

        return {
          success: true,
          message: "Progress updated!",
          intent,
        };
      }

      case "add-comment": {
        const content = formData.get("content");
        if (!content?.trim()) {
          return { error: "Comment cannot be empty", intent };
        }

        await addTaskComment(id, { content, taskId: Number.parseInt(id, 10) });
        await queryClient.invalidateQueries({
          queryKey: ["tasks", id, "comments"],
        });

        return {
          success: true,
          message: "Comment added!",
          intent,
        };
      }

      case "delete-comment": {
        const commentId = Number.parseInt(formData.get("commentId"), 10);
        await deleteTaskComment(id, commentId);
        await queryClient.invalidateQueries({
          queryKey: ["tasks", id, "comments"],
        });

        return {
          success: true,
          message: "Comment deleted!",
          intent,
        };
      }

      case "delete-task": {
        await deleteTask(id);
        await queryClient.invalidateQueries({ queryKey: ["tasks"] });
        await queryClient.invalidateQueries({ queryKey: ["tasks", id] });

        return {
          success: true,
          redirect: "/manager/tasks",
          message: "Task deleted!",
          intent,
        };
      }

      default:
        return { error: "Invalid action", intent };
    }
  } catch (error) {
    return { error: error.message, intent };
  }
};

const TaskDetailsSkeleton = () => (
  <div className="p-6 max-w-5xl mx-auto space-y-6">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
      <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
    </div>

    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
      <div className="flex gap-3">
        <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
      <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
    </div>
  </div>
);

const TaskDetailsError = ({ error, onRetry }) => (
  <div className="p-6 flex justify-center items-center h-64">
    <div className="text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <p className="text-gray-600 mb-4">
        {error?.message || "Failed to load task"}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93]"
      >
        Retry
      </button>
    </div>
  </div>
);

const TaskDetailsPage = ({
  mode = TASK_MODES.MANAGER,
  initialData,
  actionData,
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const submit = useSubmit();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canAssignTasks = resolveCanAssignTasks(hasPermission);
  const canTestTasks = resolveCanTestTasks(hasPermission);

  const [newComment, setNewComment] = useState("");
  const [commentText, setCommentText] = useState("");
  const [evidenceLink, setEvidenceLink] = useState("");
  const [customProgress, setCustomProgress] = useState("");
  const [activeCommentTab, setActiveCommentTab] = useState("project-manager");
  const [pendingIntent, setPendingIntent] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  const managerTask = initialData?.task;
  const managerComments = initialData?.comments || [];

  const managerTaskQuery = useQuery({
    ...taskQuery(id),
    initialData: managerTask,
    enabled: mode === TASK_MODES.MANAGER,
  });

  const managerCommentsState = useQuery({
    ...taskCommentsQuery(id),
    initialData: managerComments,
    enabled: mode === TASK_MODES.MANAGER,
  });

  const qaTaskQuery = useQuery({
    ...taskQuery(id, ["qa-task"]),
    enabled: mode === TASK_MODES.QA,
  });

  const teamTaskQuery = useQuery({
    ...taskQuery(id, ["team-member", "task"]),
    enabled: mode === TASK_MODES.TEAM,
    retry: 1,
  });

  const qaTask = qaTaskQuery.data;
  const teamTask = teamTaskQuery.data;
  const managerTaskData = managerTaskQuery.data;
  const managerCommentsData = managerCommentsState.data || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, progress }) => updateTaskStatus(id, status, progress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qa-task", id] });
      queryClient.invalidateQueries({ queryKey: MY_TASKS_QUERY_KEY });
    },
  });

  const addQaCommentMutation = useMutation({
    mutationFn: (content) => addTaskComment(id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qa-task", id] });
    },
  });

  const deleteQaCommentMutation = useMutation({
    mutationFn: (commentId) => deleteTaskComment(id, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qa-task", id] });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: ({ progress, status }) => updateTaskStatus(id, status, progress),
    onMutate: async ({ progress, status }) => {
      await queryClient.cancelQueries({ queryKey: ["team-member", "task", id] });

      const previousTask = queryClient.getQueryData(["team-member", "task", id]);
      queryClient.setQueryData(["team-member", "task", id], (old) => ({
        ...old,
        progress,
        status,
      }));

      return { previousTask };
    },
    onError: (error, _variables, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(
          ["team-member", "task", id],
          context.previousTask,
        );
      }
      alert(error.message || "Failed to update progress");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["team-member", "task", id] });
      queryClient.invalidateQueries({ queryKey: MY_TASKS_QUERY_KEY });
    },
  });

  const addTeamCommentMutation = useMutation({
    mutationFn: async (content) => {
      const response = await addTaskComment(id, { content });
      return response.comment || response;
    },
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ["team-member", "task", id] });

      const currentUser = JSON.parse(localStorage.getItem("user"));
      const optimisticComment = {
        id: `temp-${Date.now()}`,
        content,
        createdAt: new Date().toISOString(),
        user: {
          name: currentUser?.name || "You",
          role: currentUser?.role || "team-member",
        },
      };

      const previousTask = queryClient.getQueryData(["team-member", "task", id]);
      queryClient.setQueryData(["team-member", "task", id], (old) => ({
        ...old,
        comments: [...(old?.comments || []), optimisticComment],
      }));

      return { previousTask };
    },
    onError: (error, _variables, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(
          ["team-member", "task", id],
          context.previousTask,
        );
      }
      alert(error.message || "Failed to add comment");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["team-member", "task", id] });
    },
  });

  const deleteTeamCommentMutation = useMutation({
    mutationFn: (commentId) => deleteTaskComment(id, commentId),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: ["team-member", "task", id] });

      const previousTask = queryClient.getQueryData(["team-member", "task", id]);
      queryClient.setQueryData(["team-member", "task", id], (old) => ({
        ...old,
        comments: old?.comments?.filter((comment) => comment.id !== commentId) || [],
      }));

      return { previousTask };
    },
    onError: (error, _variables, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(
          ["team-member", "task", id],
          context.previousTask,
        );
      }
      alert(error.message || "Could not delete comment");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["team-member", "task", id] });
    },
  });

  useEffect(() => {
    if (mode !== TASK_MODES.MANAGER || !actionData) return;

    const handleResponse = async () => {
      if (actionData?.success) {
        setActionMessage(actionData.message);
        setActionError(null);
        await managerTaskQuery.refetch();
        await managerCommentsState.refetch();

        if (actionData.intent === "add-comment") {
          setNewComment("");
        }

        if (actionData.redirect) {
          setTimeout(() => navigate(actionData.redirect), 1200);
        }

        setTimeout(() => setActionMessage(null), 3000);
      } else if (actionData?.error) {
        setActionError(actionData.error);
        setActionMessage(null);
        setTimeout(() => setActionError(null), 3000);
      }

      setTimeout(() => setPendingIntent(null), 400);
    };

    handleResponse();
  }, [actionData, managerCommentsState, managerTaskQuery, mode, navigate]);

  const isLoadingData =
    (mode === TASK_MODES.MANAGER && !managerTaskData && managerTaskQuery.isLoading) ||
    (mode === TASK_MODES.QA && qaTaskQuery.isLoading) ||
    (mode === TASK_MODES.TEAM && teamTaskQuery.isLoading);

  const currentTask =
    mode === TASK_MODES.MANAGER
      ? managerTaskData
      : mode === TASK_MODES.QA
        ? qaTask
        : teamTask;

  if (isLoadingData) {
    return <TaskDetailsSkeleton />;
  }

  if (
    !currentTask ||
    (mode === TASK_MODES.QA && qaTaskQuery.error) ||
    (mode === TASK_MODES.TEAM && teamTaskQuery.error)
  ) {
    return (
      <TaskDetailsError
        error={qaTaskQuery.error || teamTaskQuery.error}
        onRetry={() =>
          mode === TASK_MODES.QA ? qaTaskQuery.refetch() : teamTaskQuery.refetch()
        }
      />
    );
  }

  if (mode === TASK_MODES.QA) {
    const taskProgress = getTeamMemberTaskProgress(currentTask);
    const canTest =
      canTestTasks &&
      (taskProgress === 100 ||
        ["in-test", "passed", "failed", "pending-retest"].includes(
          currentTask?.status?.toLowerCase(),
        ));

    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(getTaskBasePath(TASK_MODES.QA))}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{currentTask.title}</h1>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
          <div className="flex gap-3 flex-wrap">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(currentTask.priority)}`}>
              {currentTask.priority || "medium"}
            </span>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase ${getStatusColor(currentTask.status)}`}>
              {currentTask.status?.replace("-", " ")}
            </span>
          </div>

          <p className="text-gray-700">
            {currentTask.description || "No description provided."}
          </p>
          {currentTask.attachmentUrl && (
            <a
              href={currentTask.attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-[#4DA5AD] hover:bg-gray-100"
            >
              <LinkIcon className="w-4 h-4" />
              <span>{currentTask.attachmentName || "Task attachment"}</span>
            </a>
          )}

          <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User size={16} /> Developer Assigned:{" "}
              {currentTask.assigneeName || currentTask.assignee?.name || "Unassigned"}
            </div>
            <div className="flex items-center gap-2">
              <Flag size={16} />{" "}
              {currentTask.projectName || currentTask.project?.name || "No Project"}
            </div>
          </div>

          <div className="space-y-3">
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${taskProgress === 100 ? "bg-green-500" : "bg-[#4DA5AD]"}`}
                style={{ width: `${taskProgress}%` }}
              />
            </div>
            <div className="text-sm text-gray-600">
              Developer Progress: {taskProgress}%
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">QA Actions</h3>
            {!canTest ? (
              <p className="text-sm text-gray-500">
                Wait until progress reaches 100% to perform QA actions.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    updateStatusMutation.mutate({ status: "in-test", progress: taskProgress })
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium"
                >
                  <PlayCircle className="w-4 h-4" /> In Test
                </button>
                <button
                  onClick={() =>
                    updateStatusMutation.mutate({ status: "passed", progress: taskProgress })
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium"
                >
                  <CheckCircle2 className="w-4 h-4" /> Passed
                </button>
                <button
                  onClick={() =>
                    updateStatusMutation.mutate({ status: "failed", progress: taskProgress })
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
                >
                  <AlertCircle className="w-4 h-4" /> Failed
                </button>
                <button
                  onClick={() =>
                    updateStatusMutation.mutate({
                      status: "pending-retest",
                      progress: taskProgress,
                    })
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 font-medium"
                >
                  <RefreshCw className="w-4 h-4" /> Request Retest
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare size={18} /> QA Communication (
            {currentTask.comments?.length || 0})
          </h2>
          <p className="text-sm text-gray-500">
            Share bug reports, retest notes, and follow-up messages with the
            assigned team member here.
          </p>

          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {(currentTask.comments || [])
              .slice()
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              .map((comment) => (
                <div
                  key={comment.id}
                  className="group text-sm border-b border-gray-100 pb-3"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">
                        {comment.user?.name || comment.userName || "User"}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {formatRoleLabel(comment.user?.role)}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteQaCommentMutation.mutate(comment.id)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="text-gray-600 mt-1 whitespace-pre-wrap">
                    {comment.content}
                  </div>
                </div>
              ))}
          </div>

          <div className="border-t pt-4 space-y-3">
            <h3 className="font-semibold text-sm">Add Feedback/Bug Report</h3>
            <textarea
              placeholder="Bug descriptions, test notes, reproduction steps, or a reply to the developer..."
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#4DA5AD] min-h-[100px]"
            />
            <div className="flex gap-2 items-center">
              <LinkIcon className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Evidence/Screenshot Link (URL)"
                value={evidenceLink}
                onChange={(event) => setEvidenceLink(event.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4DA5AD]"
              />
            </div>
            <button
              onClick={() => {
                if (!commentText.trim() && !evidenceLink.trim()) return;
                let fullComment = commentText;
                if (evidenceLink.trim()) {
                  fullComment += `\n\nEvidence Link: ${evidenceLink}`;
                }
                addQaCommentMutation.mutate(fullComment);
                setCommentText("");
                setEvidenceLink("");
              }}
              disabled={
                (!commentText.trim() && !evidenceLink.trim()) ||
                addQaCommentMutation.isPending
              }
              className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg text-sm hover:bg-[#3c8a91] disabled:opacity-50"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === TASK_MODES.TEAM) {
    const taskProgress = getTeamMemberTaskProgress(currentTask);
    const isOverdue = isTaskOverdue(currentTask);
    const isTaskDone = isTeamMemberTaskDone(currentTask);

    const commentCounts = (currentTask.comments || []).reduce(
      (counts, comment) => {
        const tab = getCommentConversationTab(comment);
        if (tab) counts[tab] += 1;
        return counts;
      },
      { "project-manager": 0, "qa-tester": 0 },
    );

    const filteredComments = (currentTask.comments || [])
      .filter((comment) => getCommentConversationTab(comment) === activeCommentTab)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(getTaskBasePath(TASK_MODES.TEAM))}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{currentTask.title}</h1>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
          <div className="flex gap-3 flex-wrap">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(currentTask.priority)}`}>
              {currentTask.priority}
            </span>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(currentTask.status)}`}>
              {currentTask.status}
            </span>
            {isOverdue && (
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                Overdue
              </span>
            )}
          </div>

          <p className="text-gray-700">
            {currentTask.description || "No description provided."}
          </p>
          {currentTask.attachmentUrl && (
            <a
              href={currentTask.attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-[#4DA5AD] hover:bg-gray-100"
            >
              <LinkIcon className="w-4 h-4" />
              <span>{currentTask.attachmentName || "Task attachment"}</span>
            </a>
          )}

          <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User size={16} />{" "}
              {currentTask.assigneeName || currentTask.assignee?.name || "Unassigned"}
            </div>
            <div className="flex items-center gap-2">
              <Flag size={16} />{" "}
              {currentTask.projectName || currentTask.project?.name || "No Project"}
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} /> Due:{" "}
              {formatDate(currentTask.rawDueDate || currentTask.dueDate, "No deadline")}
            </div>
          </div>

          <div className="space-y-3">
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] h-3 rounded-full transition-all duration-300"
                style={{ width: `${taskProgress}%` }}
              />
            </div>
            <div className="text-sm text-gray-600">Progress: {taskProgress}%</div>
          </div>

          <div className="flex flex-wrap gap-2">
            {currentTask.status === "pending" && (
              <button
                onClick={() => {
                  const status = getNextTeamMemberStatus(
                    currentTask,
                    currentTask.progress || 0,
                    true,
                  );
                  updateProgressMutation.mutate({
                    progress: currentTask.progress || 0,
                    status,
                  });
                }}
                disabled={updateProgressMutation.isPending}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition disabled:opacity-50"
              >
                Start Task
              </button>
            )}
            {["in-progress", "pending-retest", "failed"].includes(currentTask.status) &&
              [25, 50, 75, 100].map((step) => (
                <button
                  key={step}
                  onClick={() => {
                    const status = getNextTeamMemberStatus(currentTask, step);
                    updateProgressMutation.mutate({ progress: step, status });
                  }}
                  disabled={updateProgressMutation.isPending}
                  className="px-3 py-1 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                >
                  {step}%
                </button>
              ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare size={18} /> Task Communication
          </h2>
          <p className="text-sm text-gray-500">
            Choose who you want to talk to, then write your message in that
            conversation tab.
          </p>

          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
            {Object.entries(COMMENT_TABS).map(([tabKey, tab]) => (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveCommentTab(tabKey)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeCommentTab === tabKey ? "bg-[#4DA5AD] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                {tab.label} ({commentCounts[tabKey] || 0})
              </button>
            ))}
          </div>

          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Conversation with {COMMENT_TABS[activeCommentTab].label}
          </div>

          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {filteredComments.map((comment) => (
              <div key={comment.id} className="group text-sm border-b border-gray-100 pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800">
                      {comment.user?.name || "User"}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {formatRoleLabel(comment.user?.role)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {formatDateTime(comment.createdAt)}
                    </span>
                    <button
                      onClick={() => {
                        if (!window.confirm("Delete this comment?")) return;
                        deleteTeamCommentMutation.mutate(comment.id);
                      }}
                      disabled={deleteTeamCommentMutation.isPending}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="text-gray-600 mt-1 whitespace-pre-wrap">
                  {stripCommentTargetPrefix(comment.content)}
                </div>
              </div>
            ))}
            {!filteredComments.length && (
              <div className="text-center text-gray-400 py-4">
                {COMMENT_TABS[activeCommentTab].emptyMessage}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder={COMMENT_TABS[activeCommentTab].placeholder}
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent outline-none"
              disabled={addTeamCommentMutation.isPending}
            />
            <button
              onClick={() => {
                if (!commentText.trim()) return;
                const payload = `${COMMENT_TABS[activeCommentTab].prefix} ${commentText.trim()}`;
                addTeamCommentMutation.mutate(payload);
                setCommentText("");
              }}
              disabled={!commentText.trim() || addTeamCommentMutation.isPending}
              className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg text-sm hover:bg-[#3D8B93] transition disabled:opacity-50 flex items-center gap-2"
            >
              {addTeamCommentMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Post
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleManagerProgressUpdate = (progress) => {
    const formData = new FormData();
    formData.append("intent", "update-progress");
    formData.append("progress", progress);
    setPendingIntent("update-progress");
    submit(formData, { method: "post" });
  };

  const handleManagerAddComment = (event) => {
    event.preventDefault();
    if (!newComment.trim()) return;

    const formData = new FormData();
    formData.append("intent", "add-comment");
    formData.append("content", newComment);
    setPendingIntent("add-comment");
    submit(formData, { method: "post" });
  };

  const handleManagerDeleteComment = (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    const formData = new FormData();
    formData.append("intent", "delete-comment");
    formData.append("commentId", commentId);
    setPendingIntent("delete-comment");
    submit(formData, { method: "post" });
  };

  const handleManagerDeleteTask = () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    const formData = new FormData();
    formData.append("intent", "delete-task");
    setPendingIntent("delete-task");
    submit(formData, { method: "post" });
  };

  const isLoadingManagerAction = pendingIntent !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(getTaskBasePath(TASK_MODES.MANAGER))}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            disabled={isLoadingManagerAction}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </button>
          {canAssignTasks && (
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  navigate(getTaskEditPath(TASK_MODES.MANAGER, id))
                }
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                disabled={isLoadingManagerAction}
              >
                <Edit className="w-4 h-4" />
                Edit Task
              </button>
              <button
                onClick={handleManagerDeleteTask}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                disabled={isLoadingManagerAction}
              >
                {pendingIntent === "delete-task" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          )}
        </div>

        {actionMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{actionMessage}</p>
          </div>
        )}

        {actionError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{actionError}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{currentTask.title}</h1>
              <p className="text-gray-600 mt-2">
                {currentTask.description || "No description provided."}
              </p>
              {currentTask.attachmentUrl && (
                <a
                  href={currentTask.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-[#0f5841] hover:bg-gray-100"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>{currentTask.attachmentName || "Task attachment"}</span>
                </a>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(currentTask.priority)}`}>
                {currentTask.priority || "medium"} priority
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentTask.status)}`}>
                {currentTask.status || "pending"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <User className="w-4 h-4 mr-2" />
                Assignee
              </div>
              <div className="font-medium text-gray-900">
                {currentTask.assignee?.name || currentTask.assigneeName || "Unassigned"}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <User className="w-4 h-4 mr-2" />
                QA Tester
              </div>
              <div className="font-medium text-gray-900">
                {currentTask.qaTester?.name || currentTask.qaTesterName || "Unassigned"}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <FolderKanban className="w-4 h-4 mr-2" />
                Project
              </div>
              <div className="font-medium text-gray-900">
                {currentTask.project?.name || currentTask.projectName || "Unknown"}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <Clock className="w-4 h-4 mr-2" />
                Deadline
              </div>
              <div className="font-medium text-gray-900">
                {formatDateTime(currentTask.rawDueDate || currentTask.dueDate)}
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-900">
                Progress: {currentTask.progress || 0}%
              </span>
              <div className="flex gap-2">
                {[0, 25, 50, 75, 100].map((percent) => (
                  <button
                    key={percent}
                    onClick={() => handleManagerProgressUpdate(percent)}
                    disabled={isLoadingManagerAction}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${currentTask.progress === percent ? "bg-[#0f5841] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {percent}%
                  </button>
                ))}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#0f5841] to-[#194f87] h-3 rounded-full transition-all duration-300"
                style={{ width: `${currentTask.progress || 0}%` }}
              />
            </div>
          </div>
        </div>

        {currentTask.tags && currentTask.tags.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {currentTask.tags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Task Communication ({managerCommentsData.length})
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Coordinate task assignment and delivery here with the team member and
            QA tester.
          </p>

          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {managerCommentsData.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              managerCommentsData.map((comment) => (
                <div
                  key={comment.id}
                  className="border-l-4 border-[#0f5841] pl-4 py-2 group hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {comment.user?.name || "User"}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {formatRoleLabel(comment.user?.role)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDateTime(comment.createdAt)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleManagerDeleteComment(comment.id)}
                      disabled={isLoadingManagerAction}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-500 rounded disabled:opacity-50"
                      title="Delete comment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-700 mt-1">{comment.content}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleManagerAddComment} className="flex">
            <input
              type="text"
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              placeholder="Write a message for the team member or QA tester..."
              disabled={isLoadingManagerAction}
              className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f5841] focus:border-transparent disabled:bg-gray-50"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isLoadingManagerAction}
              className="px-4 py-2 bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white rounded-r-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {pendingIntent === "add-comment" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Post"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsPage;
