// src/pages/manager/Tasks.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, Filter, Eye, X, ChevronDown, ChevronUp } from 'lucide-react';
import { getTasks, deleteTask } from '../../services/tasksService';
import { getProjects } from '../../services/projectsService';

const Tasks = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const queryParams = new URLSearchParams(location.search);
  const searchFromUrl = queryParams.get('q') || '';
  
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [localSearch, setLocalSearch] = useState(searchFromUrl);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch tasks and projects
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tasksData, projectsData] = await Promise.all([
          getTasks(),
          getProjects()
        ]);
        setTasks(tasksData);
        setProjects(projectsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.message?.includes('401')) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Filter tasks
  useEffect(() => {
    let result = tasks;

    // Status filter
    if (filter !== 'all') {
      result = result.filter(task => task.status === filter);
    }

    // Search filter
    if (localSearch.trim()) {
      const query = localSearch.toLowerCase();
      result = result.filter(task =>
        task.title?.toLowerCase().includes(query) ||
        task.projectName?.toLowerCase().includes(query) ||
        task.assigneeName?.toLowerCase().includes(query) ||
        task.priority?.toLowerCase().includes(query) ||
        task.status?.toLowerCase().includes(query)
      );
    }

    setFilteredTasks(result);
  }, [tasks, filter, localSearch]);

  // Update search from URL
  useEffect(() => {
    setLocalSearch(searchFromUrl);
  }, [searchFromUrl]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearch(value);
    
    const params = new URLSearchParams();
    if (value.trim()) params.set('q', value);
    navigate({ search: params.toString() }, { replace: true });
  };

  const clearSearch = () => {
    setLocalSearch('');
    navigate({ search: '' }, { replace: true });
  };

  const handleViewTask = (task) => {
    navigate(`/manager/tasks/${task.id}`);
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      console.error('Failed to delete task:', err);
      alert(err.message || 'Failed to delete task');
    }
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown';
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

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Create and assign tasks to team members</p>
          {localSearch && filteredTasks.length > 0 && (
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Found {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} for "{localSearch}"
              <button 
                onClick={clearSearch}
                className="ml-2 text-[#4DA5AD] hover:underline"
              >
                Clear search
              </button>
            </p>
          )}
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/manager/tasks/create')}
            className="px-3 py-2 sm:px-4 sm:py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] flex items-center text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">New Task</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Mobile Filters Toggle */}
      <div className="sm:hidden mb-4">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex items-center justify-between w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm"
        >
          <span className="flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filters & Search
          </span>
          {showMobileFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Filters & Search */}
      <div className={`${showMobileFilters ? 'block' : 'hidden'} sm:block mb-6`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          {/* Status Filters */}
          <div className="order-2 sm:order-1">
            <div className="text-xs text-gray-500 mb-2 sm:hidden">Filter by Status</div>
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'in-progress', 'completed'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition text-sm ${
                    filter === status
                      ? 'bg-[#4DA5AD] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="order-1 sm:order-2 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={handleSearchChange}
                  placeholder="Search tasks..."
                  className="pl-10 pr-10 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent w-full text-sm sm:text-base"
                />
                {localSearch && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Summary */}
      <div className="sm:hidden grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
          <div className="text-lg font-bold text-gray-900">{filteredTasks.length}</div>
          <div className="text-xs text-gray-500">Total Tasks</div>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
          <div className="text-lg font-bold text-[#4DA5AD]">
            {filteredTasks.filter(t => t.status === 'completed').length}
          </div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
          <div className="text-lg font-bold text-[#FF6B6B]">
            {filteredTasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date()).length}
          </div>
          <div className="text-xs text-gray-500">Overdue</div>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
          <div className="text-lg font-bold text-[#FF922B]">
            {filteredTasks.filter(t => t.priority === 'high').length}
          </div>
          <div className="text-xs text-gray-500">High Priority</div>
        </div>
      </div>

      {/* Tasks Table / Cards */}
      {filteredTasks.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTasks.map(task => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{task.title}</div>
                          <div className="text-xs text-gray-500 capitalize">{task.status}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">{getProjectName(task.projectId)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium mr-2">
                            {task.assigneeName?.charAt(0) || 'U'}
                          </div>
                          <span className="text-sm">{task.assigneeName || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority || 'medium'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                        <div className={`text-xs ${
                          task.status === 'completed' ? 'text-green-600' :
                          task.dueDate && new Date(task.dueDate) < new Date() ? 'text-red-600' :
                          'text-gray-500'
                        }`}>
                          {task.status === 'completed' ? 'Completed' :
                           task.dueDate && new Date(task.dueDate) < new Date() ? 'Overdue' : 'Active'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="w-20 sm:w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-[#4DA5AD] h-2 rounded-full" style={{ width: `${task.progress || 0}%` }}></div>
                          </div>
                          <span className="text-xs sm:text-sm text-gray-600">{task.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewTask(task)}
                            className="text-[#4DA5AD] hover:text-[#3D8B93] p-1 hover:bg-blue-50 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                            title="Delete Task"
                          >
                            <span className="text-lg font-bold">&times;</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-4">
            {filteredTasks.map(task => (
              <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm mb-1">{task.title}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(task.status)}`}>
                        {task.status || 'pending'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority || 'medium'}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewTask(task)}
                      className="text-[#4DA5AD] hover:text-[#3D8B93] p-1"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete Task"
                    >
                      <span className="text-lg font-bold">&times;</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Assignee & Project */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] rounded-full flex items-center justify-center text-white text-sm font-medium mr-2">
                        {task.assigneeName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Assignee</div>
                        <div className="text-sm font-medium">{task.assigneeName || 'Unassigned'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Project</div>
                      <div className="text-sm font-medium text-[#4DA5AD]">{getProjectName(task.projectId)}</div>
                    </div>
                  </div>

                  {/* Deadline & Progress */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500">Deadline</div>
                      <div className={`text-sm font-medium ${
                        task.status === 'completed' ? 'text-green-600' :
                        task.dueDate && new Date(task.dueDate) < new Date() ? 'text-red-600' :
                        'text-gray-900'
                      }`}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                        <span className="ml-2 text-xs">
                          {task.status === 'completed' ? '✓' :
                          task.dueDate && new Date(task.dueDate) < new Date() ? 'Overdue' : 'Active'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Progress</div>
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                          <div className="bg-[#4DA5AD] h-1.5 rounded-full" style={{ width: `${task.progress || 0}%` }}></div>
                        </div>
                        <span className="text-sm font-medium">{task.progress || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8 sm:py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          {localSearch ? (
            <>
              <div className="text-gray-400 text-3xl sm:text-4xl mb-3 sm:mb-4">🔍</div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-sm sm:text-base text-gray-500">No tasks match "{localSearch}"</p>
              <button
                onClick={clearSearch}
                className="mt-4 px-4 py-2 text-[#4DA5AD] hover:underline text-sm sm:text-base"
              >
                Clear search to see all tasks
              </button>
            </>
          ) : (
            <>
              <div className="text-gray-400 text-3xl sm:text-4xl mb-3 sm:mb-4">📝</div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-sm sm:text-base text-gray-500 mb-4">Create your first task to get started</p>
              <button
                onClick={() => navigate('/manager/tasks/create')}
                className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] flex items-center mx-auto text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Task
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Tasks;