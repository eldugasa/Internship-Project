// src/pages/teamMember/TaskDetails.jsx
import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Flag,
  MessageSquare,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  getTaskById,
  updateTaskStatus,
  addTaskComment,
  deleteTaskComment,
} from "../../services/tasksService";

//  1. QUERY DEFINITIONS

const taskQuery = (id) => ({
  queryKey: ["team-member", "task", id],
  queryFn: async ({ signal }) => {
    const task = await getTaskById(id, { signal });
    return task;
  },
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
});

// ============================================
// 2. HELPER FUNCTIONS
// ============================================

const PRIORITY_MAP = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

const STATUS_MAP = {
  completed: "bg-green-100 text-green-800",
  "in-progress": "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  "in-test": "bg-cyan-100 text-cyan-800",
  failed: "bg-red-100 text-red-800",
  "pending-retest": "bg-amber-100 text-amber-800",
};

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

const formatRoleLabel = (role) => {
  if (!role) return "Team";
  return role
    .toString()
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getCommentTargetTab = (content = "") => {
  const trimmed = content.trim();
  if (trimmed.startsWith(COMMENT_TABS["qa-tester"].prefix)) return "qa-tester";
  if (trimmed.startsWith(COMMENT_TABS["project-manager"].prefix))
    return "project-manager";
  return null;
};

const stripCommentTargetPrefix = (content = "") => {
  return content
    .replace(COMMENT_TABS["qa-tester"].prefix, "")
    .replace(COMMENT_TABS["project-manager"].prefix, "")
    .trim();
};

const getCommentConversationTab = (comment) => {
  const role = normalizeRole(comment?.user?.role);
  const explicitTarget = getCommentTargetTab(comment?.content || "");

  if (role === "qa-tester") return "qa-tester";
  if (role === "project-manager") return "project-manager";
  if (role === "team-member") return explicitTarget;
  return explicitTarget || "project-manager";
};

const formatDate = (date) => {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleString();
  } catch {
    return "Invalid date";
  }
};

const clampProgress = (value) => {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
};

const getNextTeamMemberStatus = (task, progress, isStartAction = false) => {
  if (progress >= 100) {
    return task?.qaTesterId ? "in-test" : "completed";
  }

  if (isStartAction || progress > 0 || task?.status === "in-progress") {
    return "in-progress";
  }

  return "pending";
};

// ============================================
// 3. SKELETON COMPONENT
// ============================================

const TaskDetailsSkeleton = () => (
  <div className="p-6 max-w-5xl mx-auto space-y-6">
    {/* Header Skeleton */}
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
      <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
    </div>

    {/* Main Card Skeleton */}
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
      <div className="flex gap-3">
        <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse"></div>
      </div>

      <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>

      <div className="grid sm:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-5 w-32 bg-gray-200 rounded animate-pulse"
          ></div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="h-3 w-full bg-gray-200 rounded-full animate-pulse"></div>
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-8 w-16 bg-gray-200 rounded animate-pulse"
          ></div>
        ))}
      </div>
    </div>

    {/* Comments Section Skeleton */}
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-20 h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  </div>
);

// ============================================
// 4. ERROR COMPONENT
// ============================================

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

// ============================================
// 5. MAIN COMPONENT
// ============================================

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [commentText, setCommentText] = useState("");
  const [customProgress, setCustomProgress] = useState("");
  const [activeCommentTab, setActiveCommentTab] = useState("project-manager");

  // Fetch task data
  const {
    data: task,
    isLoading,
    error,
    refetch: refetchTask,
  } = useQuery({
    ...taskQuery(id),
    retry: 1,
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ progress, status }) => {
      return await updateTaskStatus(id, status, progress);
    },
    onMutate: async ({ progress, status }) => {
      await queryClient.cancelQueries({
        queryKey: ["team-member", "task", id],
      });

      const previousTask = queryClient.getQueryData([
        "team-member",
        "task",
        id,
      ]);

      queryClient.setQueryData(["team-member", "task", id], (old) => ({
        ...old,
        progress,
        status,
      }));

      return { previousTask };
    },
    onError: (err, variables, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(
          ["team-member", "task", id],
          context.previousTask,
        );
      }
      console.error("Progress update failed:", err);
      alert(err.message || "Failed to update progress");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["team-member", "task", id] });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content) => {
      const response = await addTaskComment(id, { content });
      return response.comment || response;
    },
    onMutate: async (content) => {
      await queryClient.cancelQueries({
        queryKey: ["team-member", "task", id],
      });

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

      const previousTask = queryClient.getQueryData([
        "team-member",
        "task",
        id,
      ]);

      queryClient.setQueryData(["team-member", "task", id], (old) => ({
        ...old,
        comments: [...(old?.comments || []), optimisticComment],
      }));

      return { previousTask, optimisticComment };
    },
    onError: (err, variables, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(
          ["team-member", "task", id],
          context.previousTask,
        );
      }
      console.error("Failed to add comment:", err);
      alert("Failed to add comment: " + err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["team-member", "task", id] });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      await deleteTaskComment(id, commentId);
    },
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({
        queryKey: ["team-member", "task", id],
      });

      const previousTask = queryClient.getQueryData([
        "team-member",
        "task",
        id,
      ]);

      queryClient.setQueryData(["team-member", "task", id], (old) => ({
        ...old,
        comments: old?.comments?.filter((c) => c.id !== commentId) || [],
      }));

      return { previousTask };
    },
    onError: (err, variables, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(
          ["team-member", "task", id],
          context.previousTask,
        );
      }
      console.error("Failed to delete comment:", err);
      alert("Could not delete comment: " + err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["team-member", "task", id] });
    },
  });

  const isOverdue = useMemo(() => {
    if (!task?.dueDate || task?.status === "completed") return false;
    return new Date(task.dueDate) < new Date();
  }, [task]);

  const commentCounts = useMemo(() => {
    const comments = task?.comments || [];
    return comments.reduce(
      (counts, comment) => {
        const tab = getCommentConversationTab(comment);
        if (tab) counts[tab] += 1;
        return counts;
      },
      { "project-manager": 0, "qa-tester": 0 },
    );
  }, [task?.comments]);

  const filteredComments = useMemo(() => {
    return (task?.comments || [])
      .filter(
        (comment) => getCommentConversationTab(comment) === activeCommentTab,
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [activeCommentTab, task?.comments]);

  const handleProgressUpdate = (value) => {
    const newProgress = clampProgress(value);
    const newStatus = getNextTeamMemberStatus(task, newProgress);
    updateProgressMutation.mutate({ progress: newProgress, status: newStatus });
  };

  const handleCustomUpdate = () => {
    if (customProgress === "") return;
    const value = clampProgress(Number(customProgress));
    const newStatus = getNextTeamMemberStatus(task, value);
    updateProgressMutation.mutate({ progress: value, status: newStatus });
    setCustomProgress("");
  };

  const handleStartTask = () => {
    const status = getNextTeamMemberStatus(task, task?.progress || 0, true);
    updateProgressMutation.mutate({ progress: task?.progress || 0, status });
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const payload = `${COMMENT_TABS[activeCommentTab].prefix} ${commentText.trim()}`;
    addCommentMutation.mutate(payload);
    setCommentText("");
  };

  const handleDeleteComment = (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    deleteCommentMutation.mutate(commentId);
  };

  const isLoadingData = isLoading && !task;
  const isUpdating =
    updateProgressMutation.isPending ||
    addCommentMutation.isPending ||
    deleteCommentMutation.isPending;

  // Show skeleton while loading
  if (isLoadingData) {
    return <TaskDetailsSkeleton />;
  }

  // Show error if task not found
  if (error || !task) {
    return <TaskDetailsError error={error} onRetry={() => refetchTask()} />;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
      </div>

      {/* Main Info Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <div className="flex gap-3 flex-wrap">
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${PRIORITY_MAP[task.priority] || "bg-gray-100"}`}
          >
            {task.priority}
          </span>
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${STATUS_MAP[task.status] || "bg-gray-100"}`}
          >
            {task.status}
          </span>
          {isOverdue && (
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
              Overdue
            </span>
          )}
        </div>

        <p className="text-gray-700">
          {task.description || "No description provided."}
        </p>

        <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <User size={16} />{" "}
            {task.assigneeName || task.assignee?.name || "Unassigned"}
          </div>
          <div className="flex items-center gap-2">
            <Flag size={16} />{" "}
            {task.projectName || task.project?.name || "No Project"}
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} /> Due: {task.dueDate || "No deadline"}
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} /> Est: {task.estimatedHours || 0}h / Actual:{" "}
            {task.actualHours || 0}h
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] h-3 rounded-full transition-all duration-300"
              style={{ width: `${task.progress || 0}%` }}
            />
          </div>
          <div className="text-sm text-gray-600">
            Progress: {task.progress || 0}%
          </div>
        </div>

        {/* Quick Progress Buttons */}
        <div className="flex flex-wrap gap-2">
          {task.status === "pending" && (
            <button
              onClick={handleStartTask}
              disabled={isUpdating}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition disabled:opacity-50"
            >
              Start Task
            </button>
          )}
          {["in-progress", "pending-retest", "failed"].includes(task.status) &&
            [25, 50, 75, 100].map((step) => (
              <button
                key={step}
                onClick={() => handleProgressUpdate(step)}
                disabled={isUpdating}
                className="px-3 py-1 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                {updateProgressMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                ) : null}
                {step}%
              </button>
            ))}
        </div>
{/*  */}
      </div>

      {/* Comments Section */}
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
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeCommentTab === tabKey
                  ? "bg-[#4DA5AD] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
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
            <div
              key={comment.id}
              className="group text-sm border-b border-gray-100 pb-3"
            >
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
                    {formatDate(comment.createdAt)}
                  </span>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={deleteCommentMutation.isPending}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    {deleteCommentMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
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
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent outline-none"
            onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
            disabled={isUpdating}
          />
          <button
            onClick={handleAddComment}
            disabled={!commentText.trim() || isUpdating}
            className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg text-sm hover:bg-[#3D8B93] transition disabled:opacity-50 flex items-center gap-2"
          >
            {addCommentMutation.isPending && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
