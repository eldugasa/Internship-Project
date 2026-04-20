import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  PlayCircle,
  CheckCircle2,
  RefreshCw,
  Link as LinkIcon
} from 'lucide-react';
import { 
  getTaskById, 
  updateTaskStatus, 
  addTaskComment, 
  deleteTaskComment 
} from '../../services/tasksService';

const formatRoleLabel = (role) => {
  if (!role) return "Team";
  return role.toString().replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const QATesterTaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [commentText, setCommentText] = useState("");
  const [evidenceLink, setEvidenceLink] = useState("");

  const { data: task, isLoading, error, refetch } = useQuery({
    queryKey: ['qa-task', id],
    queryFn: async ({ signal }) => {
      return await getTaskById(id, { signal });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status }) => {
      // For QA Tester, progress doesn't change, only status
      return await updateTaskStatus(id, status, task?.progress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qa-task', id] });
      queryClient.invalidateQueries({ queryKey: ['qa-tasks'] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content) => {
      return await addTaskComment(id, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qa-task', id] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      await deleteTaskComment(id, commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qa-task', id] });
    },
  });

  const handleStatusUpdate = (newStatus) => {
    updateStatusMutation.mutate({ status: newStatus });
  };

  const handleAddComment = () => {
    if (!commentText.trim() && !evidenceLink.trim()) return;
    
    let fullComment = commentText;
    if (evidenceLink.trim()) {
      fullComment += `\n\nEvidence Link: ${evidenceLink}`;
    }

    addCommentMutation.mutate(fullComment);
    setCommentText("");
    setEvidenceLink("");
  };

  const STATUS_COLORS = {
    'completed': "bg-green-100 text-green-800",
    "in-progress": "bg-blue-100 text-blue-800",
    'pending': "bg-gray-100 text-gray-800",
    'in-test': "bg-[#4DA5AD]/15 text-[#4DA5AD]",
    'passed': "bg-green-100 text-green-800",
    'failed': "bg-red-100 text-red-800",
    'pending-retest': "bg-yellow-100 text-yellow-800",
  };

  if (isLoading) return <div className="p-6">Loading task details...</div>;
  if (error) return <div className="p-6 text-red-500">Failed to load task details.</div>;

  const canTest = task?.progress === 100 || ['in-test', 'passed', 'failed', 'pending-retest'].includes(task?.status?.toLowerCase());

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <div className="flex gap-3 flex-wrap">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-gray-100`}>
            {task.priority || 'MEDIUM'}
          </span>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase ${STATUS_COLORS[task.status?.toLowerCase()] || 'bg-gray-100'}`}>
            {task.status?.replace('-', ' ')}
          </span>
        </div>

        <p className="text-gray-700">{task.description || 'No description provided.'}</p>

        <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <User size={16} /> Developer Assigned: {task.assigneeName || task.assignee?.name || "Unassigned"}
          </div>
          <div className="flex items-center gap-2">
            <Flag size={16} /> {task.projectName || task.project?.name || "No Project"}
          </div>
        </div>

        <div className="space-y-3">
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div 
              className={`bg-[#4DA5AD] h-3 rounded-full transition-all duration-300 ${task.progress === 100 ? 'bg-green-500' : ''}`}
              style={{ width: `${task.progress || 0}%` }} 
            />
          </div>
          <div className="text-sm text-gray-600">Developer Progress: {task.progress || 0}%</div>
        </div>

        {/* QA Action Buttons */}
        <div className="border-t pt-4 space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">QA Actions</h3>
          {!canTest ? (
            <p className="text-sm text-gray-500">Wait until progress reaches 100% to perform QA actions.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleStatusUpdate('in-test')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium"
              >
                <PlayCircle className="w-4 h-4" /> In Test
              </button>
              <button
                onClick={() => handleStatusUpdate('passed')}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium"
              >
                <CheckCircle2 className="w-4 h-4" /> Passed
              </button>
              <button
                onClick={() => handleStatusUpdate('failed')}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
              >
                <AlertCircle className="w-4 h-4" /> Failed
              </button>
              <button
                onClick={() => handleStatusUpdate('pending-retest')}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 font-medium"
              >
                <RefreshCw className="w-4 h-4" /> Request Retest
              </button>
            </div>
          )}
        </div>
      </div>

      {/* QA Reports / Comments Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare size={18} /> QA Communication ({task.comments?.length || 0})
        </h2>
        <p className="text-sm text-gray-500">
          Share bug reports, retest notes, and follow-up messages with the assigned team member here.
        </p>

        <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
          {task.comments && [...task.comments]
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .map((comment, index) => (
              <div key={comment.id || index} className="group text-sm border-b border-gray-100 pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800">{comment.user?.name || comment.userName || 'User'}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {formatRoleLabel(comment.user?.role)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="text-gray-600 mt-1 whitespace-pre-wrap">{comment.content}</div>
              </div>
            ))}
        </div>

        <div className="border-t pt-4 space-y-3">
          <h3 className="font-semibold text-sm">Add Feedback/Bug Report</h3>
          <textarea
            placeholder="Bug descriptions, test notes, reproduction steps, or a reply to the developer..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#4DA5AD] min-h-[100px]"
          />
          <div className="flex gap-2 items-center">
            <LinkIcon className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Evidence/Screenshot Link (URL)"
              value={evidenceLink}
              onChange={(e) => setEvidenceLink(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4DA5AD]"
            />
          </div>
          <button
            onClick={handleAddComment}
            disabled={(!commentText.trim() && !evidenceLink.trim()) || addCommentMutation.isPending}
            className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg text-sm hover:bg-[#3c8a91] disabled:opacity-50"
          >
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  );
};

export default QATesterTaskDetails;
