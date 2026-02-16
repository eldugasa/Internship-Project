// src/components/projectManager/TaskDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Clock, User, MessageSquare, FolderKanban } from 'lucide-react';
import axios from 'axios';

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token'); // assume JWT auth

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setLoading(true);
        const taskRes = await axios.get(`http://localhost:5000/api/tasks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTask(taskRes.data);

        const commentsRes = await axios.get(`http://localhost:5000/api/tasks/${id}/comments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setComments(commentsRes.data.reverse()); // latest first
      } catch (err) {
        console.error(err);
        navigate('/manager/tasks'); // fallback
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [id, navigate, token]);

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

  const updateProgress = async (newProgress) => {
    const updatedTask = {
      ...task,
      progress: newProgress,
      status: newProgress === 100 ? 'completed' : 'in-progress',
    };
    setTask(updatedTask);

    try {
      await axios.put(`http://localhost:5000/api/tasks/${id}`, updatedTask, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error(err);
      alert('Failed to update progress');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const commentObj = { text: newComment };
    try {
      const res = await axios.post(
        `http://localhost:5000/api/tasks/${id}/comments`,
        commentObj,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments([res.data, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error(err);
      alert('Failed to post comment');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

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
        <button 
          onClick={() => navigate(`/manager/tasks/edit/${id}`)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Task
        </button>
      </div>

      {/* Task Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            <p className="text-gray-600 mt-2">{task.description || 'No description provided.'}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority} priority
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center text-sm text-gray-500 mb-1">
              <User className="w-4 h-4 mr-2" />
              Assignee
            </div>
            <div className="font-medium text-gray-900">{task.assignee}</div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center text-sm text-gray-500 mb-1">
              <FolderKanban className="w-4 h-4 mr-2" />
              Project
            </div>
            <div className="font-medium text-gray-900">{task.project}</div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center text-sm text-gray-500 mb-1">
              <Clock className="w-4 h-4 mr-2" />
              Deadline
            </div>
            <div className="font-medium text-gray-900">{task.deadline}</div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center text-sm text-gray-500 mb-1">
              <Clock className="w-4 h-4 mr-2" />
              Time Spent
            </div>
            <div className="font-medium text-gray-900">{task.actualHours || 0}/{task.estimatedHours || 0} hrs</div>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-900">Progress: {task.progress}%</span>
            <span className={`px-2 py-1 rounded text-xs ${
              task.status === 'completed' ? 'bg-green-100 text-green-800' :
              task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {task.status}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-[#4DA5AD] h-3 rounded-full transition-all duration-300"
              style={{ width: `${task.progress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between mt-4">
            {[0, 25, 50, 75, 100].map(percent => (
              <button
                key={percent}
                onClick={() => updateProgress(percent)}
                className={`px-3 py-1 rounded text-sm ${
                  task.progress === percent 
                    ? 'bg-[#4DA5AD] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {percent}%
              </button>
            ))}
          </div>
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

      {/* Comments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" />
          Comments ({comments.length})
        </h2>
        
        <div className="space-y-4 mb-6">
          {comments.map(comment => (
            <div key={comment.id} className="border-l-4 border-[#4DA5AD] pl-4 py-2">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <span className="font-medium text-gray-900">{comment.user}</span>
                  {comment.user === 'You' && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">You</span>
                  )}
                </div>
                <span className="text-sm text-gray-500">{comment.time}</span>
              </div>
              <p className="text-gray-700 mt-1">{comment.text}</p>
            </div>
          ))}
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
    </div>
  );
};

export default TaskDetails;
