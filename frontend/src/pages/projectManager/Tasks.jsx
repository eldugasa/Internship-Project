// src/pages/manager/Tasks.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate, useLoaderData, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Eye, X, ChevronDown, ChevronUp, RefreshCw, Trash2, Edit, AlertCircle, Loader2 } from 'lucide-react';
import { deleteTask } from '../../services/tasksService';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../config/permissions';
import { 
  tasksLoader, 
  getPriorityColor, 
  getStatusColor, 
  getProjectName,
  calculateTaskStats,
  filterTasks,
  formatDate,
  isTaskOverdue,
  tasksQuery,
  invalidateTasksQueries
} from '../../loader/manager/Tasks.loader';

export { tasksLoader as loader };

// Loading skeleton
const TasksSkeleton = () => (
  <div className="p-4 sm:p-6">
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
        ))}
      </div>
      <div className="h-64 bg-gray-100 rounded-xl"></div>
    </div>
  </div>
);

// Error component
const TasksError = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
      <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Tasks</h3>
      <p className="text-red-600 mb-4">{error?.message || 'Unable to load tasks'}</p>
      <button onClick={onRetry} className="px-4 py-2 bg-red-600 text-white rounded-lg">Retry</button>
    </div>
  </div>
);

// Task Row Component
const TaskRow = ({ task, projects, onView, onDelete, canAssignTasks }) => {
  const overdue = isTaskOverdue(task);
  
  return (
    <tr className="hover:bg-gray-50 border-t border-gray-200">
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">{task.title}</div>
        <div className="text-xs text-gray-500 capitalize">{task.status}</div>
      </td>
      <td className="px-4 py-3 text-sm">{getProjectName(task.projectId, projects)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-[#0f5841] to-[#194f87] rounded-full flex items-center justify-center text-white text-sm font-medium mr-2">
            {task.assigneeName?.charAt(0) || 'U'}
          </div>
          <span className="text-sm">{task.assigneeName || 'Unassigned'}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
          {task.priority || 'medium'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className={`text-sm ${overdue ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
          {formatDate(task.dueDate)}
        </div>
        {overdue && (
          <div className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
            <AlertCircle className="w-3 h-3" /> Overdue
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-20 bg-gray-200 rounded-full h-2">
            <div className="bg-[#0f5841] h-2 rounded-full" style={{ width: `${task.progress || 0}%` }} />
          </div>
          <span className="text-xs">{task.progress || 0}%</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex space-x-1">
          <button onClick={() => onView(task)} className="p-1 text-[#0f5841] hover:bg-[#0f5841]/10 rounded" title="View">
            <Eye className="w-4 h-4" />
          </button>
          {canAssignTasks && (
            <button onClick={() => onDelete(task.id)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

// Mobile Task Card
const MobileTaskCard = ({ task, projects, onView, onEdit, onDelete, canAssignTasks }) => {
  const overdue = isTaskOverdue(task);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{task.title}</h3>
          <div className="flex gap-2 mt-1 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(task.status)}`}>
              {task.status || 'pending'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
              {task.priority || 'medium'}
            </span>
            {overdue && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-600">
                Overdue
              </span>
            )}
          </div>
        </div>
        <div className="flex space-x-1">
          <button onClick={() => onView(task)} className="p-1 text-[#0f5841]">
            <Eye className="w-4 h-4" />
          </button>
          {canAssignTasks && (
            <>
              <button onClick={() => onEdit(task)} className="p-1 text-blue-600">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => onDelete(task.id)} className="p-1 text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Project:</span>
          <span className="font-medium">{getProjectName(task.projectId, projects)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Assignee:</span>
          <span>{task.assigneeName || 'Unassigned'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Deadline:</span>
          <span className={overdue ? 'text-red-600 font-bold' : 'text-gray-900'}>
            {formatDate(task.dueDate)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Progress:</span>
          <div className="flex items-center gap-2">
            <div className="w-20 bg-gray-200 rounded-full h-1.5">
              <div className="bg-[#0f5841] h-1.5 rounded-full" style={{ width: `${task.progress || 0}%` }} />
            </div>
            <span>{task.progress || 0}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Empty State
const EmptyState = ({ searchQuery, onClearSearch, onCreateTask, canAssignTasks }) => (
  <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
    <div className="text-4xl mb-4">{searchQuery ? '🔍' : '📝'}</div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      {searchQuery ? 'No tasks found' : 'No tasks yet'}
    </h3>
    <p className="text-gray-500 mb-4">
      {searchQuery ? `No tasks match "${searchQuery}"` : canAssignTasks ? 'Create your first task to get started' : 'No tasks are available to manage right now'}
    </p>
    {searchQuery ? (
      <button onClick={onClearSearch} className="text-[#0f5841] hover:underline">Clear search</button>
    ) : canAssignTasks ? (
      <button onClick={onCreateTask} className="px-4 py-2 bg-[#0f5841] text-white rounded-lg hover:bg-[#0a4030] inline-flex items-center gap-2">
        <Plus className="w-4 h-4" /> Create Task
      </button>
    ) : null}
  </div>
);

// Main Tasks Component - FIXED: Removed Await wrapper
const Tasks = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loaderData = useLoaderData();
  const { hasPermission } = useAuth();
  const canAssignTasks = hasPermission(PERMISSIONS.ASSIGN_TASKS);
  
  const queryParams = new URLSearchParams(location.search);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState(queryParams.get('q') || '');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Use loader data directly - no Await needed
  const tasks = loaderData?.tasks || [];
  const projects = loaderData?.projects || [];
  
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeProjects = Array.isArray(projects) ? projects : [];

  // Optional: Use React Query for real-time updates
  const { data: freshTasks, isLoading, refetch, isFetching } = useQuery({
    ...tasksQuery(),
    initialData: safeTasks,
    refetchInterval: 30000,
    staleTime: 5000,
  });

  const displayTasks = freshTasks || safeTasks;
  const isLoading_data = isLoading && safeTasks.length === 0;

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    const params = new URLSearchParams();
    if (value.trim()) params.set('q', value);
    navigate({ search: params.toString() }, { replace: true });
  };

  const clearSearch = () => {
    setSearchQuery('');
    navigate({ search: '' }, { replace: true });
  };

  const handleViewTask = (task) => {
    navigate(`/manager/tasks/${task.id}`);
  };

 

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    setDeletingId(id);
    try {
      await deleteTask(id);
      await invalidateTasksQueries();
      refetch();
    } catch (err) {
      alert(err.message || 'Failed to delete task');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTasks = useMemo(() => {
    return filterTasks(displayTasks, filter, searchQuery);
  }, [displayTasks, filter, searchQuery]);

  const stats = useMemo(() => calculateTaskStats(filteredTasks), [filteredTasks]);

  if (isLoading_data) {
    return <TasksSkeleton />;
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600">Create and assign tasks to team members</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => refetch()} 
            disabled={isFetching}
            className="p-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          {canAssignTasks && (
            <button
              onClick={() => navigate('/manager/tasks/create')}
              className="px-4 py-2 bg-[#0f5841] text-white rounded-lg hover:bg-[#0a4030] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Task
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Tasks</div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-sm text-gray-500">Overdue</div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="text-2xl font-bold text-orange-600">{stats.highPriority}</div>
          <div className="text-sm text-gray-500">High Priority</div>
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <button
        onClick={() => setShowMobileFilters(!showMobileFilters)}
        className="sm:hidden flex items-center justify-between w-full px-4 py-2 bg-white border rounded-lg mb-4"
      >
        <span className="flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</span>
        {showMobileFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Filters */}
      <div className={`${showMobileFilters ? 'block' : 'hidden'} sm:block mb-6`}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 overflow-x-auto">
            {['all', 'pending', 'in-progress', 'completed'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${
                  filter === s ? 'bg-[#0f5841] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search tasks..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5841]"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search results info */}
      {searchQuery && filteredTasks.length > 0 && (
        <p className="text-sm text-gray-500 mb-4">
          Found {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} for "{searchQuery}"
        </p>
      )}

      {/* Task List */}
      {filteredTasks.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Task</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Assignee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Deadline</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      projects={safeProjects}
                      onView={handleViewTask}
                      onDelete={handleDeleteTask}
                      canAssignTasks={canAssignTasks}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-4">
            {filteredTasks.map(task => (
              <MobileTaskCard
                key={task.id}
                task={task}
                projects={safeProjects}
                onView={handleViewTask}
                onEdit={(task) => navigate(`/manager/tasks/edit/${task.id}`)}
                onDelete={handleDeleteTask}
                canAssignTasks={canAssignTasks}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyState 
          searchQuery={searchQuery} 
          onClearSearch={clearSearch}
          onCreateTask={() => navigate('/manager/tasks/create')}
          canAssignTasks={canAssignTasks}
        />
      )}
    </div>
  );
};

export default Tasks;
