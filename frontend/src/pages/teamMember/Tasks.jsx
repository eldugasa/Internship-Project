// src/pages/teamMember/Tasks.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, Filter, Eye, Clock, Flag, Calendar,
  PlayCircle, CheckCircle, MoreVertical, ChevronDown,
  SortAsc, SortDesc, Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TeamMemberTasks = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tasks from backend
  useEffect(() => {
    if (!user) return setIsLoading(false);

    const fetchTasks = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/tasks');
        const userTasks = res.data.filter(task => task.assigneeId === user.id);
        setTasks(userTasks);
        setFilteredTasks(userTasks);

        // Fetch projects
        const projectRes = await axios.get('http://localhost:5000/api/projects');
        setProjects(projectRes.data.filter(p => userTasks.some(t => t.projectId === p.id)));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  // Filter & sort tasks
  useEffect(() => {
    let result = [...tasks];

    if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter);
    if (priorityFilter !== 'all') result = result.filter(t => t.priority === priorityFilter);
    if (projectFilter !== 'all') result = result.filter(t => t.projectId === parseInt(projectFilter));

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task => 
        task.title.toLowerCase().includes(query) ||
        (task.project || task.projectName || '').toLowerCase().includes(query) ||
        (task.description || '').toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
        case 'deadline':
          comparison = new Date(a.deadline) - new Date(b.deadline);
          break;
        case 'progress':
          comparison = b.progress - a.progress;
          break;
        default:
          comparison = new Date(a.deadline) - new Date(b.deadline);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredTasks(result);
  }, [tasks, statusFilter, priorityFilter, projectFilter, searchQuery, sortBy, sortOrder]);

  // Update progress on backend
  const handleUpdateProgress = async (taskId, progress) => {
    const status = progress === 100 ? 'completed' : 'in-progress';
    try {
      await axios.put(`http://localhost:5000/api/tasks/${taskId}`, { progress, status });
      const updatedTasks = tasks.map(t =>
        t.id === taskId ? { ...t, progress, status, actualHours: (t.actualHours || 0) + 1 } : t
      );
      setTasks(updatedTasks);
    } catch (err) {
      console.error(err);
      alert('Failed to update task progress');
    }
  };

  const handleStartTask = (taskId) => handleUpdateProgress(taskId, 0);
  const handleViewTask = (task) => navigate(`/team-member/tasks/${task.id}`, { state: { task } });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <Flag className="w-3 h-3 text-red-500" />;
      case 'medium': return <Flag className="w-3 h-3 text-yellow-500" />;
      default: return <Flag className="w-3 h-3 text-green-500" />;
    }
  };

  const isOverdue = (task) => new Date(task.deadline) < new Date() && task.status !== 'completed';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-600">Manage and update your assigned tasks</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
            <Download className="w-4 h-4 mr-2" /> Export
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title, description, or project..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
            >
              <option value="deadline">Deadline</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
              <option value="progress">Progress</option>
            </select>
            <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
              <select
                value={projectFilter}
                onChange={e => setProjectFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
              >
                <option value="all">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Task Count */}
      <div className="text-sm text-gray-600">Showing {filteredTasks.length} of {tasks.length} tasks</div>

      {/* Tasks Grid */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTasks.map(task => (
            <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{task.title}</h3>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <span className="text-[#4DA5AD] font-medium">{task.project || task.projectName}</span>
                    {task.projectId && <span className="mx-2">•</span>}
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" /> Due: {task.deadline}
                    </span>
                  </div>
                  {task.description && <p className="text-gray-600 text-sm line-clamp-2">{task.description}</p>}
                </div>
                <button onClick={() => handleViewTask(task)} className="text-gray-400 hover:text-gray-600 p-1">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>{task.status}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${getPriorityColor(task.priority)}`}>
                  {getPriorityIcon(task.priority)}<span className="ml-1">{task.priority}</span>
                </span>
                {isOverdue(task) && <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Overdue</span>}
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress: {task.progress}%</span>
                  <span className="text-sm text-gray-500"><Clock className="w-3 h-3 inline mr-1" /> {task.actualHours || 0}/{task.estimatedHours || 0} hrs</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${task.progress === 100 ? 'bg-green-500' : task.progress >= 75 ? 'bg-blue-500' : task.progress >= 50 ? 'bg-yellow-500' : 'bg-orange-500'}`} style={{ width: `${task.progress}%` }}></div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button onClick={() => handleViewTask(task)} className="text-[#4DA5AD] hover:text-[#3D8B93] text-sm font-medium flex items-center">
                  <Eye className="w-4 h-4 mr-1" /> View Details
                </button>
                <div className="flex gap-2">
                  {task.status === 'pending' && (
                    <button onClick={() => handleStartTask(task.id)} className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 flex items-center transition-colors">
                      <PlayCircle className="w-4 h-4 mr-1" /> Start
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-gray-400 text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500">{searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all' ? 'No tasks match your filters' : 'You have no assigned tasks yet'}</p>
          {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all') && (
            <button onClick={() => {setSearchQuery(''); setStatusFilter('all'); setPriorityFilter('all'); setProjectFilter('all');}} className="mt-4 px-4 py-2 text-[#4DA5AD] hover:underline">Clear filters</button>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamMemberTasks;
