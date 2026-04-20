// src/pages/teamMember/Dashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { getMyTasks, updateTaskStatus } from '../../services/tasksService';
import { 
  CheckSquare, Clock, AlertCircle, TrendingUp, 
  Calendar, FileText, ChevronRight,
  PlayCircle, CheckCircle, Users, Target,
  Award, Zap, CalendarDays, BellRing,
  BarChart3, Filter, Search, User, Eye, Loader2
} from 'lucide-react';

// 1. QUERY DEFINITIONS


export const myTasksQuery = () => ({
  queryKey: ['team-member', 'my-tasks'],
  queryFn: async ({ signal }) => {
    const tasks = await getMyTasks({ signal });
    return Array.isArray(tasks) ? tasks : [];
  },
  staleTime: 1000 * 60 * 3, // 3 minutes
  gcTime: 1000 * 60 * 10,
});

// 2. HELPER FUNCTIONS

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
  try {
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    }
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

const isOverdue = (dateStr, status) => {
  if (status === 'completed' || !dateStr) return false;
  const dueDate = parseDate(dateStr);
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
};

const isInNextWeek = (dateStr, status) => {
  if (status === 'completed' || !dateStr) return false;
  const dueDate = parseDate(dateStr);
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(23, 59, 59, 999);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate >= today && dueDate <= nextWeek;
};

const isUrgent = (dateStr, priority, status) => {
  if (status === 'completed' || priority !== 'high' || !dateStr) return false;
  const dueDate = parseDate(dateStr);
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const threeDays = new Date();
  threeDays.setDate(threeDays.getDate() + 3);
  threeDays.setHours(23, 59, 59, 999);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate >= today && dueDate <= threeDays;
};

const calculateStats = (tasks, efficiency = 95) => {
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const overdueTasks = tasks.filter(t => isOverdue(t.dueDate, t.status)).length;
  const totalHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
  const estimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

  return {
    totalTasks: tasks.length,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    overdueTasks,
    efficiency,
    completionRate: tasks.length > 0 
      ? Math.round((completedTasks / tasks.length) * 100) 
      : 0,
    totalHours,
    estimatedHours,
    utilization: estimatedHours > 0 
      ? Math.round((totalHours / estimatedHours) * 100) 
      : 0
  };
};

// 3. LOADER (React Router v7)


export async function teamMemberDashboardLoader() {
  console.log('🔄 Loading team member dashboard...');
  
  try {
    const tasks = await getMyTasks();
    return { tasks: Array.isArray(tasks) ? tasks : [] };
  } catch (error) {
    console.error('Error loading dashboard:', error);
    return { tasks: [], error: error.message };
  }
}

// 4. SKELETON COMPONENT (Shows immediately)


const DashboardSkeleton = () => (
  <div className="space-y-6 p-6">
    {/* Welcome Banner Skeleton */}
    <div className="bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] rounded-2xl p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between">
        <div className="mb-6 lg:mb-0">
          <div className="h-8 w-64 bg-white/20 rounded animate-pulse mb-2"></div>
          <div className="flex items-center space-x-4">
            <div className="h-4 w-32 bg-white/20 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-white/20 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-16 h-16 bg-white/20 rounded-full mr-4 animate-pulse"></div>
          <div>
            <div className="h-4 w-24 bg-white/20 rounded animate-pulse mb-1"></div>
            <div className="h-8 w-32 bg-white/20 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    {/* Filters Skeleton */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
      <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse"></div>
    </div>

    {/* Stats Cards Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>

    {/* Main Content Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-3"></div>
                <div className="h-2 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

//  5. MAIN COMPONENT


const TeamMemberDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  // Use React Query for tasks
  const { 
    data: tasks = [], 
    isLoading,
    error,
    refetch: refetchTasks
  } = useQuery({
    ...myTasksQuery(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mutation for updating task status
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status, progress }) => 
      updateTaskStatus(taskId, status, progress),
    onMutate: async ({ taskId, progress, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['team-member', 'my-tasks'] });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(['team-member', 'my-tasks']);
      
      // Optimistically update
      queryClient.setQueryData(['team-member', 'my-tasks'], (old) => {
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
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(['team-member', 'my-tasks'], context.previousTasks);
      }
      console.error('Error updating task:', err);
      alert('Failed to update task progress');
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['team-member', 'my-tasks'] });
      setUpdatingTaskId(null);
    },
  });

  // Employee data from auth context
  const employee = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      avatar: user.name?.[0] || "U",
      teamId: user.teamId,
      team: user.team || "Engineering Team",
      email: user.email,
      joinDate: user.joinDate,
      efficiency: 95
    };
  }, [user]);

  // Calculate stats
  const stats = useMemo(() => calculateStats(tasks, employee?.efficiency || 95), [tasks, employee]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (statusFilter !== 'all') {
      result = result.filter(task => task.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task => 
        task.title.toLowerCase().includes(query) ||
        (task.projectName || '').toLowerCase().includes(query)
      );
    }

    return result;
  }, [tasks, searchQuery, statusFilter]);

  // Helper functions using filtered tasks
  const getUpcomingDeadlines = () => {
    return filteredTasks
      .filter(task => isInNextWeek(task.dueDate, task.status))
      .slice(0, 3);
  };

  const handleUpdateProgress = async (taskId, progress) => {
    const status = progress === 100 ? 'completed' : 'in-progress';
    setUpdatingTaskId(taskId);
    updateTaskMutation.mutate({ taskId, status, progress });
  };

  const handleStartTask = (taskId) => {
    handleUpdateProgress(taskId, 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-700 bg-green-50';
      case 'in-progress': return 'text-blue-700 bg-blue-50';
      case 'pending': return 'text-yellow-700 bg-yellow-50';
      default: return 'text-gray-700 bg-gray-50';
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

  // Show skeleton immediately while loading
  if (isLoading && tasks.length === 0) {
    return <DashboardSkeleton />;
  }

  // Show error state
  if (error && tasks.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load dashboard</p>
          <button 
            onClick={() => refetchTasks()}
            className="mt-4 px-4 py-2 bg-[#4DA5AD] text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#4DA5AD] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] rounded-2xl p-6 lg:p-8 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">Welcome back, {employee.name}!</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 opacity-80" />
                <span className="text-sm">{employee.team}</span>
              </div>
              <div className="flex items-center">
                <Award className="w-4 h-4 mr-2 opacity-80" />
                <span className="text-sm">Efficiency: {stats.efficiency}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mr-4">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <div className="text-sm opacity-90">Tasks Completed</div>
              <div className="text-3xl font-bold">{stats.completedTasks}/{stats.totalTasks}</div>
              <div className="text-sm opacity-80 mt-1">{stats.completionRate}% completion rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'in-progress', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg transition ${
                statusFilter === status
                  ? 'bg-[#4DA5AD] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent w-full sm:w-64"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalTasks}</div>
              <div className="text-sm text-gray-500">Assigned Tasks</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <CheckSquare className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.inProgressTasks}</div>
              <div className="text-sm text-gray-500">In Progress</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <PlayCircle className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-600">{stats.overdueTasks}</div>
              <div className="text-sm text-gray-500">Overdue</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">My Tasks ({filteredTasks.length})</h2>
            </div>
            
            <div className="space-y-4">
              {filteredTasks.length > 0 ? (
                filteredTasks.map(task => {
                  const isUpdating = updatingTaskId === task.id;
                  
                  return (
                    <div key={task.id} className={`border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow ${isUpdating ? 'opacity-75' : ''}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{task.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{task.projectName || 'No Project'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Due: {formatDate(task.dueDate)}
                          {isOverdue(task.dueDate, task.status) && (
                            <span className="ml-2 text-red-600 font-medium">(Overdue!)</span>
                          )}
                        </div>
                        
                        
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No tasks found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Info */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Deadlines</h2>
            <div className="space-y-3">
              {getUpcomingDeadlines().map(task => (
                <div key={task.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Due: {formatDate(task.dueDate)}</span>
                    <span>{task.progress || 0}%</span>
                  </div>
                </div>
              ))}
              
              {getUpcomingDeadlines().length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No upcoming deadlines</p>
              )}
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Performance Summary</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Task Completion Rate</span>
                  <span className="font-medium">{stats.completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.completionRate}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Time Utilization</span>
                  <span className="font-medium">{stats.utilization}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.utilization}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span>Total Hours Worked</span>
                  <span className="font-medium">{stats.totalHours} hrs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-[#4DA5AD]/10 to-[#2D4A6B]/10 rounded-xl border border-[#4DA5AD]/20 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => navigate('/team-member/tasks')}
                className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center"
              >
                <CheckSquare className="w-5 h-5 text-[#4DA5AD] mb-1" />
                <span className="text-xs font-medium">View Tasks</span>
              </button>
              <button 
                onClick={() => navigate('/team-member/progress')}
                className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center"
              >
                <TrendingUp className="w-5 h-5 text-[#4DA5AD] mb-1" />
                <span className="text-xs font-medium">Progress</span>
              </button>
              <button 
                onClick={() => navigate('/team-member/reports')}
                className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center"
              >
                <FileText className="w-5 h-5 text-[#4DA5AD] mb-1" />
                <span className="text-xs font-medium">Reports</span>
              </button>
              <button 
                onClick={() => navigate('/team-member/profile')}
                className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center"
              >
                <User className="w-5 h-5 text-[#4DA5AD] mb-1" />
                <span className="text-xs font-medium">Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberDashboard;
