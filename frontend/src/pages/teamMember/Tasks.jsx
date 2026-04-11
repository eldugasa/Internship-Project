// src/pages/teamMember/Tasks.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Filter, Eye, Clock, Flag, Calendar,
  PlayCircle, CheckCircle, MoreVertical, ChevronDown,
  SortAsc, SortDesc, Download, Loader2, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMyTasks, updateTask } from '../../services/tasksService';

// ============================================
// 1. QUERY DEFINITIONS
// ============================================

export const myTasksQuery = () => ({
  queryKey: ['team-member', 'tasks'],
  queryFn: async ({ signal }) => {
    const tasks = await getMyTasks({ signal });
    return Array.isArray(tasks) ? tasks : [];
  },
  staleTime: 1000 * 60 * 3,
  gcTime: 1000 * 60 * 10,
});

// ============================================
// 2. HELPER FUNCTIONS
// ============================================

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return new Date(`${year}-${month}-${day}`);
    }
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'No deadline';
  return dateStr;
};

const isOverdue = (task) => {
  const dueDate = task.dueDate || task.deadline;
  if (!dueDate || task.status === 'completed') return false;
  const parsedDate = parseDate(dueDate);
  if (!parsedDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate < today;
};

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
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityIcon = (priority) => {
  switch (priority) {
    case 'high': return <Flag className="w-3 h-3 text-red-500" />;
    case 'medium': return <Flag className="w-3 h-3 text-yellow-500" />;
    case 'low': return <Flag className="w-3 h-3 text-green-500" />;
    default: return <Flag className="w-3 h-3 text-gray-500" />;
  }
};

// Extract unique projects from tasks
const extractProjects = (tasks) => {
  const uniqueProjects = [];
  const projectIds = new Set();
  
  tasks.forEach(task => {
    if (task.projectId && !projectIds.has(task.projectId)) {
      projectIds.add(task.projectId);
      uniqueProjects.push({
        id: task.projectId,
        name: task.projectName || task.project || 'Unknown Project'
      });
    }
  });
  
  return uniqueProjects;
};

// ============================================
// 3. SKELETON COMPONENT
// ============================================

const TasksSkeleton = () => (
  <div className="space-y-6 p-6">
    {/* Header Skeleton */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-48 bg-gray-200 rounded mt-2 animate-pulse"></div>
      </div>
      <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
    </div>

    {/* Filters Skeleton */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>

    {/* Tasks Grid Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-2 mb-4">
            <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
          <div className="mb-4">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-2 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============================================
// 4. MAIN COMPONENT
// ============================================

const TeamMemberTasks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  // React Query for tasks
  const { 
    data: tasks = [], 
    isLoading,
    error,
    refetch: refetchTasks
  } = useQuery({
    ...myTasksQuery(),
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Extract unique projects from tasks
  const projects = useMemo(() => extractProjects(tasks), [tasks]);

  // Update task mutation with optimistic update
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, progress, status }) => 
      updateTask(taskId, { progress, status }),
    onMutate: async ({ taskId, progress, status }) => {
      await queryClient.cancelQueries({ queryKey: ['team-member', 'tasks'] });
      
      const previousTasks = queryClient.getQueryData(['team-member', 'tasks']);
      
      queryClient.setQueryData(['team-member', 'tasks'], (old) => {
        if (!old) return old;
        return old.map(task =>
          task.id === taskId 
            ? { ...task, progress, status, actualHours: (task.actualHours || 0) + 1 }
            : task
        );
      });
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['team-member', 'tasks'], context.previousTasks);
      }
      console.error('Error updating task:', err);
      alert('Failed to update task progress');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['team-member', 'tasks'] });
      setUpdatingTaskId(null);
    },
  });

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      result = result.filter(t => t.priority === priorityFilter);
    }
    
    // Apply project filter
    if (projectFilter !== 'all') {
      result = result.filter(t => t.projectId === parseInt(projectFilter));
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task => 
        task.title.toLowerCase().includes(query) ||
        (task.projectName || '').toLowerCase().includes(query) ||
        (task.description || '').toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'priority': {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
          break;
        }
        case 'deadline': {
          const dateA = new Date(a.dueDate || a.deadline);
          const dateB = new Date(b.dueDate || b.deadline);
          comparison = dateA - dateB;
          break;
        }
        case 'progress':
          comparison = (b.progress || 0) - (a.progress || 0);
          break;
        default:
          comparison = new Date(a.dueDate || a.deadline) - new Date(b.dueDate || b.deadline);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tasks, statusFilter, priorityFilter, projectFilter, searchQuery, sortBy, sortOrder]);

  // Handlers
  const handleUpdateProgress = (taskId, progress) => {
    const status = progress === 100 ? 'completed' : 'in-progress';
    setUpdatingTaskId(taskId);
    updateTaskMutation.mutate({ taskId, progress, status });
  };

  const handleStartTask = (taskId) => {
    handleUpdateProgress(taskId, 0);
  };

  const handleViewTask = (task) => {
    navigate(`/team-member/tasks/${task.id}`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setProjectFilter('all');
  };

  const handleExport = () => {
    if (filteredTasks.length === 0) {
      alert('No tasks to export');
      return;
    }

    const csvData = filteredTasks.map(task => ({
      'Task Title': task.title,
      'Project': task.projectName || 'Unknown',
      'Status': task.status,
      'Priority': task.priority,
      'Due Date': task.dueDate || task.deadline || 'N/A',
      'Progress': `${task.progress || 0}%`,
      'Hours': `${task.actualHours || 0}/${task.estimatedHours || 0}`
    }));

    const headers = Object.keys(csvData[0]);
    const csv = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-tasks-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Show loading state
  if (isLoading && tasks.length === 0) {
    return <TasksSkeleton />;
  }

  // Show error state
  if (error && tasks.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Failed to load tasks</p>
          <button 
            onClick={() => refetchTasks()}
            className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Check if user is logged in
  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#4DA5AD] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all';

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-600">Manage and update your assigned tasks</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleExport}
            disabled={filteredTasks.length === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
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
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <span className="text-lg">×</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
            <button 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
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

      {/* Task Count & Active Filters */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="text-sm text-gray-600">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>
        {hasActiveFilters && (
          <button 
            onClick={clearFilters}
            className="text-sm text-[#4DA5AD] hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Tasks Grid */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTasks.map(task => {
            const isTaskUpdating = updatingTaskId === task.id;
            const overdue = isOverdue(task);
            
            return (
              <div 
                key={task.id} 
                className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow ${
                  isTaskUpdating ? 'opacity-75' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{task.title}</h3>
                    <div className="flex items-center text-sm text-gray-500 mb-2 flex-wrap gap-y-1">
                      <span className="text-[#4DA5AD] font-medium">
                        {task.projectName || task.project || 'Unknown Project'}
                      </span>
                      {task.projectId && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" /> 
                            Due: {formatDate(task.dueDate || task.deadline)}
                          </span>
                        </>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">{task.description}</p>
                    )}
                  </div>
                  <button 
                    onClick={() => handleViewTask(task)} 
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    title="View details"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${getPriorityColor(task.priority)}`}>
                    {getPriorityIcon(task.priority)}
                    <span className="ml-1 capitalize">{task.priority}</span>
                  </span>
                  {overdue && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Overdue
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Progress: {task.progress || 0}%
                    </span>
                    <span className="text-sm text-gray-500">
                      <Clock className="w-3 h-3 inline mr-1" /> 
                      {task.actualHours || 0}/{task.estimatedHours || 0} hrs
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        task.progress === 100 ? 'bg-green-500' : 
                        task.progress >= 75 ? 'bg-blue-500' : 
                        task.progress >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
                      }`} 
                      style={{ width: `${task.progress || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => handleViewTask(task)} 
                    className="text-[#4DA5AD] hover:text-[#3D8B93] text-sm font-medium flex items-center transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-1" /> View Details
                  </button>
                  <div className="flex gap-2">
                    {task.status === 'pending' && (
                      <button 
                        onClick={() => handleStartTask(task.id)} 
                        disabled={isTaskUpdating}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 flex items-center transition-colors disabled:opacity-50"
                      >
                        {isTaskUpdating ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <PlayCircle className="w-4 h-4 mr-1" />
                        )}
                        Start
                      </button>
                    )}
                    {task.status === 'in-progress' && task.progress !== 100 && (
                      <div className="flex gap-1">
                        {[25, 50, 75, 100].map(percent => (
                          <button
                            key={percent}
                            onClick={() => handleUpdateProgress(task.id, percent)}
                            disabled={isTaskUpdating}
                            className={`px-2 py-1 text-xs rounded ${
                              task.progress === percent 
                                ? 'bg-[#4DA5AD] text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } disabled:opacity-50`}
                          >
                            {percent}%
                          </button>
                        ))}
                      </div>
                    )}
                    {task.progress === 100 && (
                      <button 
                        disabled
                        className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-lg flex items-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-gray-400 text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500">
            {hasActiveFilters 
              ? 'No tasks match your filters' 
              : 'You have no assigned tasks yet'}
          </p>
          {hasActiveFilters && (
            <button 
              onClick={clearFilters} 
              className="mt-4 px-4 py-2 text-[#4DA5AD] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamMemberTasks;