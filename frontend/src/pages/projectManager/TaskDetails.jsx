// src/pages/projectManager/TaskDetails.jsx
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLoaderData, useParams, useNavigate, useSubmit, useActionData } from 'react-router-dom';
import { ArrowLeft, Edit, Clock, User, MessageSquare, FolderKanban, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getTaskById, updateTask, deleteTask, getTaskComments, addTaskComment, deleteTaskComment } from '../../services/tasksService';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../config/permissions';

const formatRoleLabel = (role) => {
  if (!role) return 'Team';
  return role.toString().replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

export const taskQuery = (id) => ({
  queryKey: ['tasks', id],
  queryFn: ({ signal }) => getTaskById(id, { signal }),
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
});

export const taskCommentsQuery = (taskId) => ({
  queryKey: ['tasks', taskId, 'comments'],
  queryFn: async ({ signal }) => {
    try {
      const comments = await getTaskComments(taskId, { signal });
      return comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } catch (err) {
      return [];
    }
  },
  staleTime: 1000 * 60 * 1,
});

// LOADER (Fetches all data)
export const loader = (queryClient) => async ({ params }) => {
  const { id } = params;
  
  const [task, comments] = await Promise.all([
    queryClient.fetchQuery(taskQuery(id)),
    queryClient.fetchQuery(taskCommentsQuery(id))
  ]);
  
  return { task, comments };
};

// SINGLE ACTION - Returns proper Response
export const action = (queryClient) => async ({ request, params }) => {
  const { id } = params;
  const formData = await request.formData();
  const intent = formData.get('intent');
  
  try {
    switch (intent) {
      case 'update-progress': {
        const progress = parseInt(formData.get('progress'));
        const newStatus = progress === 100 ? 'completed' : 'in-progress';
        await updateTask(id, { progress, status: newStatus });
        
        await queryClient.invalidateQueries({ queryKey: ['tasks', id] });
        await queryClient.invalidateQueries({ queryKey: ['tasks'] });
        
        return new Response(
          JSON.stringify({ success: true, message: 'Progress updated!', intent }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      case 'add-comment': {
        const content = formData.get('content');
        if (!content?.trim()) {
          return new Response(
            JSON.stringify({ error: 'Comment cannot be empty', intent }),
            { headers: { 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        await addTaskComment(id, { content, taskId: parseInt(id) });
        
        await queryClient.invalidateQueries({ queryKey: ['tasks', id, 'comments'] });
        
        return new Response(
          JSON.stringify({ success: true, message: 'Comment added!', intent }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      case 'delete-comment': {
        const commentId = parseInt(formData.get('commentId'));
        await deleteTaskComment(id, commentId);
        
        await queryClient.invalidateQueries({ queryKey: ['tasks', id, 'comments'] });
        
        return new Response(
          JSON.stringify({ success: true, message: 'Comment deleted!', intent }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      case 'delete-task': {
        await deleteTask(id);
        
        await queryClient.invalidateQueries({ queryKey: ['tasks'] });
        await queryClient.invalidateQueries({ queryKey: ['tasks', id] });
        
        return new Response(
          JSON.stringify({ success: true, redirect: '/manager/tasks', message: 'Task deleted!', intent }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action', intent }),
          { headers: { 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    console.error('Action error:', error);
    return new Response(
      JSON.stringify({ error: error.message, intent }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
};

// COMPONENT with useSubmit
const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const submit = useSubmit();
  const actionData = useActionData(); // This can be null initially
  const { task: initialTask, comments: initialComments } = useLoaderData();
  const { hasPermission } = useAuth();
  const canAssignTasks = hasPermission(PERMISSIONS.ASSIGN_TASKS);
  
  const [newComment, setNewComment] = useState('');
  const [pendingIntent, setPendingIntent] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);
  
  // Use React Query for real-time updates
  const { data: task, refetch: refetchTask } = useQuery({
    ...taskQuery(id),
    initialData: initialTask,
  });
  
  const { data: comments = [], refetch: refetchComments } = useQuery({
    ...taskCommentsQuery(id),
    initialData: initialComments,
  });
  
  // Handle action response - FIXED: Check if actionData exists
  useEffect(() => {
    const handleActionResponse = async () => {
      // If no actionData, do nothing
      if (!actionData) return;
      
      try {
        let data;
        
        // Check if actionData is a Response object
        if (actionData instanceof Response) {
          data = await actionData.json();
        } else {
          data = actionData;
        }
        
        if (data.success) {
          // Show success message
          setActionMessage(data.message);
          setActionError(null);
          
          // Refetch data to ensure UI is in sync
          await refetchTask();
          await refetchComments();
          
          // Clear form if comment was added
          if (data.intent === 'add-comment') {
            setNewComment('');
          }
          
          // Handle redirect
          if (data.redirect) {
            setTimeout(() => navigate(data.redirect), 1500);
          }
          
          // Clear success message after 3 seconds
          setTimeout(() => setActionMessage(null), 3000);
        } else if (data.error) {
          // Show error message
          setActionError(data.error);
          setActionMessage(null);
          
          // Clear error message after 3 seconds
          setTimeout(() => setActionError(null), 3000);
        }
      } catch (error) {
        console.error('Error parsing action response:', error);
        setActionError('An unexpected error occurred');
        setTimeout(() => setActionError(null), 3000);
      } finally {
        // Clear pending state
        setTimeout(() => setPendingIntent(null), 500);
      }
    };
    
    handleActionResponse();
  }, [actionData, navigate, refetchTask, refetchComments]);
  
  const handleProgressUpdate = (progress) => {
    const formData = new FormData();
    formData.append('intent', 'update-progress');
    formData.append('progress', progress);
    setPendingIntent('update-progress');
    submit(formData, { method: 'post' });
  };
  
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    const formData = new FormData();
    formData.append('intent', 'add-comment');
    formData.append('content', newComment);
    setPendingIntent('add-comment');
    submit(formData, { method: 'post' });
  };
  
  const handleDeleteComment = (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    const formData = new FormData();
    formData.append('intent', 'delete-comment');
    formData.append('commentId', commentId);
    setPendingIntent('delete-comment');
    submit(formData, { method: 'post' });
  };
  
  const handleDeleteTask = () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    const formData = new FormData();
    formData.append('intent', 'delete-task');
    setPendingIntent('delete-task');
    submit(formData, { method: 'post' });
  };
  
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };
  
  const isLoading = pendingIntent !== null;
  
  if (!task) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f5841] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading task details...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/manager/tasks')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </button>
          {canAssignTasks && (
            <div className="flex space-x-2">
              <button 
                onClick={() => navigate(`/manager/tasks/edit/${id}`)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                disabled={isLoading}
              >
                <Edit className="w-4 h-4" />
                Edit Task
              </button>
              <button 
                onClick={handleDeleteTask}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                disabled={isLoading}
              >
                {pendingIntent === 'delete-task' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          )}
        </div>
        
        {/* Messages */}
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
        
        {/* Task Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
              <p className="text-gray-600 mt-2">{task.description || 'No description provided.'}</p>
            </div>
            <div className="flex flex-col gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority || 'medium'} priority
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                {task.status || 'pending'}
              </span>
            </div>
          </div>
          
          {/* Task Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <User className="w-4 h-4 mr-2" />
                Assignee
              </div>
              <div className="font-medium text-gray-900">
                {task.assignee?.name || task.assigneeName || 'Unassigned'}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <User className="w-4 h-4 mr-2" />
                QA Tester
              </div>
              <div className="font-medium text-gray-900">
                {task.qaTester?.name || task.qaTesterName || 'Unassigned'}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <FolderKanban className="w-4 h-4 mr-2" />
                Project
              </div>
              <div className="font-medium text-gray-900">
                {task.project?.name || task.projectName || 'Unknown'}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <Clock className="w-4 h-4 mr-2" />
                Deadline
              </div>
              <div className="font-medium text-gray-900">
                {formatDate(task.dueDate)}
              </div>
            </div>
            
          </div>
          
          {/* Progress Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-900">Progress: {task.progress || 0}%</span>
              <div className="flex gap-2">
                {[0, 25, 50, 75, 100].map(percent => (
                  <button
                    key={percent}
                    onClick={() => handleProgressUpdate(percent)}
                    disabled={isLoading}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                      task.progress === percent
                        ? 'bg-[#0f5841] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } ${isLoading && pendingIntent === 'update-progress' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {pendingIntent === 'update-progress' && percent === task.progress ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      `${percent}%`
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#0f5841] to-[#194f87] h-3 rounded-full transition-all duration-300"
                style={{ width: `${task.progress || 0}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Tags Section */}
        {task.tags && task.tags.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Comments Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Task Communication ({comments.length})
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Coordinate task assignment and delivery here with the team member and QA tester.
          </p>
          
          {/* Comments List */}
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="border-l-4 border-[#0f5841] pl-4 py-2 group hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{comment.user?.name || 'User'}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {formatRoleLabel(comment.user?.role)}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={isLoading}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-500 rounded disabled:opacity-50"
                      title="Delete comment"
                    >
                      {pendingIntent === 'delete-comment' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-gray-700 mt-1">{comment.content}</p>
                </div>
              ))
            )}
          </div>
          
          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="flex">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a message for the team member or QA tester..."
              disabled={isLoading}
              className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f5841] focus:border-transparent disabled:bg-gray-50"
            />
            <button 
              type="submit"
              disabled={!newComment.trim() || isLoading}
              className="px-4 py-2 bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white rounded-r-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {pendingIntent === 'add-comment' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Post'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
