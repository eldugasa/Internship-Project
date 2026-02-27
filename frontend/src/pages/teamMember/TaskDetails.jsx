// src/pages/teamMember/TaskDetails.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Flag,
  MessageSquare,
  Edit,
} from "lucide-react";
import { getTaskById, updateTaskStatus, addTaskComment } from "../../services/tasksService";

const PRIORITY_MAP = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

const STATUS_MAP = {
  completed: "bg-green-100 text-green-800",
  "in-progress": "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
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

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [customProgress, setCustomProgress] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true);
        const data = await getTaskById(id);
        setTask(data);
      } catch (err) {
        console.error("Failed to fetch task:", err);
        alert("Failed to load task details");
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [id]);

  const isOverdue = useMemo(() => {
    if (!task?.dueDate || task?.status === "completed") return false;
    return new Date(task.dueDate) < new Date();
  }, [task]);

  const handleProgressUpdate = async (value) => {
    try {
      setUpdating(true);
      const newProgress = clampProgress(value);
      
      const newStatus = newProgress === 100
        ? "completed"
        : newProgress > 0
        ? "in-progress"
        : "pending";

      const updatedTask = await updateTaskStatus(task.id, newStatus, newProgress);
      setTask({ ...updatedTask });
    } catch (err) {
      console.error("Progress update failed:", err);
      alert("Failed to update progress");
    } finally {
      setUpdating(false);
    }
  };

  const handleCustomUpdate = async () => {
    if (customProgress === "") return;

    const value = clampProgress(Number(customProgress));
    
    try {
      setUpdating(true);
      
      const newStatus = value === 100
        ? "completed"
        : value > 0
        ? "in-progress"
        : "pending";

      const updatedTask = await updateTaskStatus(task.id, newStatus, value);
      setTask({ ...updatedTask });
      setCustomProgress("");
    } catch (err) {
      console.error("Custom update failed:", err);
      alert("Failed to update task");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      setUpdating(true);
      
      const newComment = await addTaskComment(id, {
        content: commentText
      });

      setTask(prev => ({
        ...prev,
        comments: [...(prev.comments || []), newComment]
      }));
      
      setCommentText("");
    } catch (err) {
      console.error("Failed to add comment:", err);
      alert("Failed to add comment");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD]"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Task not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-[#4DA5AD] text-white rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  const progressSteps = [25, 50, 75, 100];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            disabled={updating}
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
        </div>
        {/*  */}
      </div>

      {/* Main Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        {/* Status + Priority */}
        <div className="flex gap-3 flex-wrap">
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${
              PRIORITY_MAP[task.priority] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {task.priority || 'medium'}
          </span>

          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${
              STATUS_MAP[task.status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {task.status || 'pending'}
          </span>

          {isOverdue && (
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
              Overdue
            </span>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-gray-700">{task.description}</p>
        )}

        {/* Task Meta - SIMPLIFIED like Project Manager version */}
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <User size={16} /> {task.assigneeName || task.assignee?.name || "Unassigned"}
          </div>
          <div className="flex items-center gap-2">
            <Flag size={16} /> {task.projectName || task.project?.name || "No Project"}
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} /> 
            Due: {task.dueDate || "No deadline"}
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} /> Est: {task.estimatedHours || 0}h / Actual: {task.actualHours || 0}h
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-[#4DA5AD] h-3 rounded-full transition-all duration-300"
              style={{ width: `${task.progress || 0}%` }}
            />
          </div>
          <div className="text-sm text-gray-600">
            Progress: {task.progress || 0}%
          </div>
        </div>

        {/* Quick Progress Buttons */}
        <div className="flex flex-wrap gap-2">
          {progressSteps.map((step) => (
            <button
              key={step}
              onClick={() => handleProgressUpdate(step)}
              disabled={updating}
              className="px-3 py-1 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              {step}%
            </button>
          ))}
        </div>

        {/* Custom Update */}
        <div className="border-t pt-4 space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">
            Custom Update
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Enter progress (0–100)"
              value={customProgress}
              onChange={(e) => setCustomProgress(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              min="0"
              max="100"
              disabled={updating}
            />
          </div>

          <button
            onClick={handleCustomUpdate}
            disabled={updating || !customProgress}
            className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg text-sm hover:bg-[#3D8B93] transition disabled:opacity-50"
          >
            {updating ? 'Updating...' : 'Update Task'}
          </button>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare size={18} /> Comments ({task.comments?.length || 0})
        </h2>

        {task.comments?.length ? (
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {/* Sort comments by date (oldest first) */}
            {[...task.comments]
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              .map((comment) => {
                const uniqueKey = comment.id 
                  ? `comment-${comment.id}` 
                  : `comment-${Date.now()}-${Math.random()}`;
                
                return (
                  <div key={uniqueKey} className="text-sm border-b border-gray-100 pb-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{comment.user?.name || 'User'}</span>
                      <span className="text-xs text-gray-400">
                        {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
                      </span>
                    </div>
                    <div className="text-gray-600 mt-1">{comment.content}</div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-gray-500 text-sm py-4 text-center">No comments yet.</div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
            disabled={updating}
            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
          />
          <button
            onClick={handleAddComment}
            disabled={updating || !commentText.trim()}
            className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg text-sm hover:bg-[#3D8B93] transition disabled:opacity-50"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;