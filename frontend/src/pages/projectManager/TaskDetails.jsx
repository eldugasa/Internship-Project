// src/components/projectManager/TaskDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Clock, User, MessageSquare, FolderKanban } from 'lucide-react';
import { getTaskById, updateTask, deleteTask } from '../../services/tasksService';
import { getTaskComments, addTaskComment } from '../../services/tasksService'; // You'll need to add these

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const taskData = await getTaskById(id);
      setTask(taskData);

      // Fetch comments if you have this endpoint
      try {
        const commentsData = await getTaskComments(id);
        setComments(commentsData.reverse());
      } catch (err) {
        console.log('Comments not available');
        setComments([]);
      }
    } catch (err) {
      console.error('Error fetching task:', err);
      if (err.message?.includes('404')) {
        alert('Task not found');
      }
      navigate('/manager/tasks');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (newProgress) => {
    if (!task) return;
    setUpdating(true);
    const newStatus = newProgress === 100 ? 'completed' : 'in-progress';

    const prevTask = task;

    // Optimistic update
    setTask({
      ...task,
      progress: newProgress,
      status: newStatus
    });

    try {
      const updated = await updateTask(id, {
        progress: newProgress,
        status: newStatus
      });
      // Update state with server result to keep fields in sync
      setTask(updated);
    } catch (err) {
      console.error('Error updating progress:', err);
      // Revert on error
      setTask(prevTask);
      alert('Failed to update progress');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const comment = {
      content: newComment,
      taskId: parseInt(id)
    };

    try {
      const newCommentData = await addTaskComment(id, comment);
      setComments([newCommentData, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment');
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await deleteTask(id);
      navigate('/manager/tasks');
    } catch (err) {
      console.error('Error deleting task:', err);
      alert(err.message || 'Failed to delete task');
    }
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

  if (loading || !task) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading task details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/manager/tasks')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tasks
        </button>
        <div className="flex space-x-2">
          <button 
            onClick={() => navigate(`/manager/tasks/edit/${id}`)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
            disabled={updating}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Task
          </button>
          <button 
            onClick={handleDeleteTask}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center"
            disabled={updating}
          >
            Delete
          </button>
        </div>
      </div>

   

{/* Task Info */}
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
  <div className="flex justify-between items-start mb-6">
    <div>
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

  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
        {task.dueDate || 'No deadline'}
      </div>
    </div>
    
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center text-sm text-gray-500 mb-1">
        <Clock className="w-4 h-4 mr-2" />
        Time Spent
      </div>
      <div className="font-medium text-gray-900">
        {task.actualHours || 0}/{task.estimatedHours || 0} hrs
      </div>
    </div>
  </div>

  {/* Progress */}
  <div>
    <div className="flex justify-between items-center mb-2">
      <span className="font-medium text-gray-900">Progress: {task.progress || 0}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-3">
      <div 
        className="bg-[#4DA5AD] h-3 rounded-full transition-all duration-300"
        style={{ width: `${task.progress || 0}%` }}
      ></div>
    </div>
    
    <div className="flex justify-between mt-4">
      {[0, 25, 50, 75, 100].map(percent => (
        <button
          key={percent}
          onClick={() => updateProgress(percent)}
          disabled={updating}
          className={`px-3 py-1 rounded text-sm ${
            task.progress === percent 
              ? 'bg-[#4DA5AD] text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } disabled:opacity-50`}
        >
          {percent}%
        </button>
      ))}
    </div>
  </div>
</div>

{/* Comments */}
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
    <MessageSquare className="w-5 h-5 mr-2" />
    Comments ({comments.length})
  </h2>
  
  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
    {comments.length === 0 ? (
      <p className="text-gray-500 text-center py-4">No comments yet</p>
    ) : (
      comments.map(comment => (
        <div key={comment.id} className="border-l-4 border-[#4DA5AD] pl-4 py-2">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center">
              <span className="font-medium text-gray-900">{comment.user?.name || 'User'}</span>
            </div>
            <span className="text-sm text-gray-500">
              {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
            </span>
          </div>
          <p className="text-gray-700 mt-1">{comment.content}</p>
        </div>
      ))
    )}
  </div>

  <div className="flex">
    <input
      type="text"
      value={newComment}
      onChange={(e) => setNewComment(e.target.value)}
      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
      placeholder="Add a comment..."
      className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
    />
    <button 
      onClick={handleAddComment}
      className="px-4 py-2 bg-[#4DA5AD] text-white rounded-r-lg hover:bg-[#3D8B93] transition-colors"
    >
      Post
    </button>
  </div>
</div>
      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {task.tags.map((tag, index) => (
              <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      )}
      
    </div>
  );
};

export default TaskDetails;