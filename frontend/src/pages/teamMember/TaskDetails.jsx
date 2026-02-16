import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Flag,
  CheckCircle,
  MessageSquare,
  Edit,
} from "lucide-react";
import DataService from "../../services/dataservices";

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
  return new Date(date).toLocaleString();
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
  const [updateNotes, setUpdateNotes] = useState("");

  // Load Task from Backend
  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true);
        const data = await DataService.getTaskById(id);
        setTask(data);
      } catch (err) {
        console.error("Failed to fetch task:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [id]);

  const isOverdue = useMemo(() => {
    if (!task?.deadline || task?.status === "completed") return false;
    return new Date(task.deadline) < new Date();
  }, [task]);

  const handleProgressUpdate = async (value) => {
    try {
      const newProgress = clampProgress(value);

      const updatedTask = await DataService.updateTask(task.id, {
        progress: newProgress,
        status:
          newProgress === 100
            ? "completed"
            : newProgress > 0
            ? "in-progress"
            : "pending",
        updatedAt: new Date().toISOString(),
      });

      setTask(updatedTask);
    } catch (err) {
      console.error("Progress update failed:", err);
    }
  };

  const handleCustomUpdate = async () => {
    if (customProgress === "") return;

    const value = clampProgress(Number(customProgress));

    try {
      const updatedTask = await DataService.updateTask(task.id, {
        progress: value,
        status:
          value === 100
            ? "completed"
            : value > 0
            ? "in-progress"
            : "pending",
        notes: updateNotes,
        updatedAt: new Date().toISOString(),
      });

      setTask(updatedTask);
      setCustomProgress("");
      setUpdateNotes("");
    } catch (err) {
      console.error("Custom update failed:", err);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      const newComment = {
        text: commentText,
        author: "You",
        createdAt: new Date().toISOString(),
      };

      const updatedTask = await DataService.addComment(task.id, newComment);
      setTask(updatedTask);
      setCommentText("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-gray-500 text-sm">Loading task details...</div>
    );
  }

  if (!task) {
    return (
      <div className="p-6 text-red-500 text-sm">
        Task not found.
      </div>
    );
  }

  const progressSteps = [25, 50, 75, 100];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
      </div>

      {/* Main Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        {/* Status + Priority */}
        <div className="flex gap-3 flex-wrap">
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${
              PRIORITY_MAP[task.priority] || ""
            }`}
          >
            {task.priority}
          </span>

          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${
              STATUS_MAP[task.status] || ""
            }`}
          >
            {task.status}
          </span>

          {isOverdue && (
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
              Overdue
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-700">{task.description}</p>

        {/* Task Meta */}
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <User size={16} /> {task.assignee || "Unassigned"}
          </div>
          <div className="flex items-center gap-2">
            <Flag size={16} /> {task.project || "No Project"}
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} /> Due: {formatDate(task.deadline)}
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} /> Est: {task.estimatedHours || 0}h
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-[#4DA5AD] h-3 rounded-full transition-all"
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
              className="px-3 py-1 text-xs bg-gray-100 rounded-lg hover:bg-gray-200"
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

          <input
            type="number"
            placeholder="Enter progress (0–100)"
            value={customProgress}
            onChange={(e) => setCustomProgress(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />

          <textarea
            placeholder="Update notes..."
            value={updateNotes}
            onChange={(e) => setUpdateNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />

          <button
            onClick={handleCustomUpdate}
            className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg text-sm hover:opacity-90"
          >
            Update Task
          </button>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare size={18} /> Comments
        </h2>

        {task.comments?.length ? (
          task.comments.map((c, i) => (
            <div key={i} className="text-sm border-b pb-2">
              <div className="font-semibold">{c.author}</div>
              <div className="text-gray-600">{c.text}</div>
              <div className="text-xs text-gray-400">
                {formatDate(c.createdAt)}
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-500 text-sm">No comments yet.</div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={handleAddComment}
            className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg text-sm"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
