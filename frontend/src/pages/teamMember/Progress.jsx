// src/pages/teamMember/Progress.jsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, Target, Award, Clock, 
  CheckCircle, Download, AlertCircle,
  BarChart3, PieChart, Zap, Calendar, Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TEAM_MEMBER_ACTIVE_STATUSES, myTasksQuery } from './taskShared';

//  2. HELPER COMPONENTS


const StatCard = ({ title, value, subtext, icon: Icon, colorClass, loading }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
    <div className="flex items-center justify-between">
      <div>
        {loading ? (
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
        ) : (
          <div className="text-2xl font-bold text-gray-900">{value}</div>
        )}
        <div className="text-sm text-gray-500 mt-1">{title}</div>
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    <div className="mt-3 pt-3 border-t border-gray-100">
      {loading ? (
        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
      ) : (
        <div className="text-xs text-gray-500">{subtext}</div>
      )}
    </div>
  </div>
);

const ProgressRow = ({ label, current, total, percentage, unit = "tasks", color = "bg-[#4DA5AD]", loading }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-sm">
      {loading ? (
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
      ) : (
        <>
          <span className="font-medium text-gray-900">{label}</span>
          <span className="text-gray-500">{current}/{total} {unit}</span>
        </>
      )}
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
      {loading ? (
        <div className="w-full h-2.5 bg-gray-200 rounded-full animate-pulse"></div>
      ) : (
        <div 
          className={`${color} h-2.5 rounded-full transition-all duration-700 ease-out`} 
          style={{ width: `${percentage}%` }}
        />
      )}
    </div>
  </div>
);

const MetricGroup = ({ title, items, loading }) => (
  <div className="space-y-3">
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
    <div className="space-y-2">
      {loading ? (
        <>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </>
      ) : (
        items.map(i => (
          <div key={i.label} className="flex justify-between text-sm border-b border-gray-50 pb-1">
            <span className="text-gray-600">{i.label}</span>
            <span className="font-semibold text-gray-900">{i.val}</span>
          </div>
        ))
      )}
    </div>
  </div>
);

//  3. SKELETON COMPONENT


const ProgressSkeleton = () => (
  <div className="p-6 space-y-6 max-w-7xl mx-auto">
    {/* Header Skeleton */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-48 bg-gray-200 rounded mt-2 animate-pulse"></div>
      </div>
      <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
    </div>

    {/* Stats Cards Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 rounded mt-1 animate-pulse"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>

    {/* Additional Stats Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-16 bg-gray-200 rounded mt-1 animate-pulse"></div>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Project & Metrics Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-2 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="space-y-2">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// 4. ERROR COMPONENT


const ProgressError = ({ error, onRetry }) => (
  <div className="p-6 flex justify-center items-center h-64">
    <div className="text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <p className="text-gray-600 mb-4">{error?.message || 'Failed to load progress data'}</p>
      <button 
        onClick={onRetry}
        className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93]"
      >
        Retry
      </button>
    </div>
  </div>
);

//  5. MAIN COMPONENT


const TeamMemberProgress = () => {
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState('month');

  // Fetch tasks using React Query
  const { 
    data: tasks = [], 
    isLoading,
    error,
    refetch: refetchTasks
  } = useQuery({
    ...myTasksQuery(),
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const taskDistribution = useMemo(() => {
    const total = tasks.length;

    const completed = tasks.filter((task) => task.status === 'completed').length;
    const inProgress = tasks.filter((task) => TEAM_MEMBER_ACTIVE_STATUSES.has(task.status)).length;
    const pending = tasks.filter((task) => task.status === 'pending').length;

    const toPercentage = (count) => (total ? Math.round((count / total) * 100) : 0);

    return {
      completed,
      inProgress,
      pending,
      completedPercentage: toPercentage(completed),
      inProgressPercentage: toPercentage(inProgress),
      pendingPercentage: toPercentage(pending),
    };
  }, [tasks]);

  // Calculate all statistics based on tasks
  const { stats, projectBreakdown, timeStats, performanceMetrics } = useMemo(() => {
    if (!tasks.length) {
      return {
        stats: {
          efficiency: 0,
          completedCount: 0,
          inProgressCount: 0,
          pendingCount: 0,
          overdueCount: 0,
          avgTime: 0,
          onTimeRate: 0,
        },
        projectBreakdown: [],
        timeStats: {
          thisWeek: 0,
          thisMonth: 0,
          weeklyAverage: 0,
        },
        performanceMetrics: {
          completionRate: 0,
          overdueRate: 0,
          activeRate: 0,
        },
      };
    }

    const completed = tasks.filter(t => t.status === 'completed');
    const inProgress = tasks.filter(t => TEAM_MEMBER_ACTIVE_STATUSES.has(t.status));
    const pending = tasks.filter(t => t.status === 'pending');
    const overdue = tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
    );

    // Calculate on-time completion
    const onTimeCompleted = completed.filter(t => {
      if (!t.dueDate) return true;
      const completedDate = t.completedDate ? new Date(t.completedDate) : new Date(t.updatedAt);
      const dueDate = new Date(t.dueDate);
      return completedDate <= dueDate;
    }).length;

    // Calculate completion time averages
    const completionTimes = completed.map(t => {
      const startDate = new Date(t.createdAt);
      const endDate = t.completedDate ? new Date(t.completedDate) : new Date(t.updatedAt);
      return Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
    }).filter(time => !isNaN(time));
    
    const avgCompletionTime = completionTimes.length > 0 
      ? (completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length).toFixed(1)
      : 0;

    // Project breakdown
    const projectMap = {};
    tasks.forEach(task => {
      const name = task.projectName || task.project || 'Unassigned';
      if (!projectMap[name]) {
        projectMap[name] = { 
          total: 0, 
          completed: 0, 
          inProgress: 0,
          pending: 0
        };
      }
      projectMap[name].total++;
      
      if (task.status === 'completed') {
        projectMap[name].completed++;
      } else if (task.status === 'in-progress') {
        projectMap[name].inProgress++;
      } else {
        projectMap[name].pending++;
      }
    });

    // Time-based statistics
    const now = new Date();
    const thisWeek = tasks.filter(t => {
      const taskDate = new Date(t.createdAt);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return taskDate >= weekAgo;
    });

    const thisMonth = tasks.filter(t => {
      const taskDate = new Date(t.createdAt);
      return taskDate.getMonth() === now.getMonth() && taskDate.getFullYear() === now.getFullYear();
    });

    return {
      stats: {
        efficiency: tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0,
        completedCount: completed.length,
        inProgressCount: inProgress.length,
        pendingCount: pending.length,
        overdueCount: overdue.length,
        avgTime: avgCompletionTime,
        onTimeRate: completed.length ? Math.round((onTimeCompleted / completed.length) * 100) : 0,
      },
      projectBreakdown: Object.entries(projectMap).map(([name, data]) => ({
        name,
        ...data,
        percentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        inProgressPercentage: data.total > 0 ? Math.round((data.inProgress / data.total) * 100) : 0
      })),
      timeStats: {
        thisWeek: thisWeek.length,
        thisMonth: thisMonth.length,
        weeklyAverage: Math.round(tasks.length / 4) || 0
      },
      performanceMetrics: {
        completionRate: tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0,
        overdueRate: tasks.length ? Math.round((overdue.length / tasks.length) * 100) : 0,
        activeRate: tasks.length ? Math.round((inProgress.length / tasks.length) * 100) : 0
      }
    };
  }, [tasks]);

  const exportData = () => {
    const dataStr = JSON.stringify({ 
      tasks, 
      stats, 
      generated: new Date(),
      period: timePeriod
    }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `progress-report-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Show loading state
  if (isLoading && tasks.length === 0) {
    return <ProgressSkeleton />;
  }

  // Show error state
  if (error && tasks.length === 0) {
    return <ProgressError error={error} onRetry={() => refetchTasks()} />;
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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Progress</h1>
          <p className="text-gray-600">Performance insights and task metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DA5AD] outline-none bg-white text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
          <button 
            onClick={exportData}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Efficiency Rate" value={`${stats.efficiency}%`} 
          subtext={`${stats.completedCount} of ${tasks.length} tasks completed`} 
          icon={TrendingUp} colorClass="bg-green-50 text-green-600" 
          loading={isLoading}
        />
        <StatCard 
          title="Tasks Completed" value={stats.completedCount} 
          subtext={`${stats.inProgressCount} tasks currently active`} 
          icon={CheckCircle} colorClass="bg-blue-50 text-blue-600" 
          loading={isLoading}
        />
        <StatCard 
          title="Avg. Completion" value={`${stats.avgTime} days`} 
          subtext="Per task average" 
          icon={Clock} colorClass="bg-orange-50 text-orange-600" 
          loading={isLoading}
        />
        <StatCard 
          title="On-Time Rate" value={`${stats.onTimeRate}%`} 
          subtext={`${stats.overdueCount} overdue tasks`} 
          icon={Target} colorClass="bg-purple-50 text-purple-600" 
          loading={isLoading}
        />
      </section>

      {/* Additional Stats Row */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-sm text-gray-500">This Week</div>
              <div className="text-xl font-bold text-gray-900">{timeStats.thisWeek} tasks</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Calendar className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className="text-sm text-gray-500">This Month</div>
              <div className="text-xl font-bold text-gray-900">{timeStats.thisMonth} tasks</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Zap className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Active Rate</div>
              <div className="text-xl font-bold text-gray-900">{performanceMetrics.activeRate}%</div>
            </div>
          </div>
        </div>
      </section>

      {/* Project & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#4DA5AD]" />
            Project Breakdown
          </h2>
          <div className="space-y-6">
            {projectBreakdown.length > 0 ? (
              projectBreakdown.map(proj => (
                <div key={proj.name} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{proj.name}</span>
                    <span className="text-sm text-gray-500">
                      {proj.completed}/{proj.total} completed
                    </span>
                  </div>
                  <ProgressRow 
                    label=""
                    current={proj.completed}
                    total={proj.total}
                    percentage={proj.percentage}
                    color="bg-[#4DA5AD]"
                    loading={isLoading}
                  />
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>✅ {proj.completed} done</span>
                    <span>🔄 {proj.inProgress || 0} in progress</span>
                    <span>⏳ {proj.pending || 0} pending</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No project data available</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#4DA5AD]" />
            Efficiency Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <MetricGroup 
              title="Task Status" 
              items={[
                { label: "Completed", val: stats.completedCount },
                { label: "In Progress", val: stats.inProgressCount },
                { label: "Pending", val: stats.pendingCount },
                { label: "Overdue", val: stats.overdueCount },
              ]}
              loading={isLoading}
            />
            <MetricGroup 
              title="Performance" 
              items={[
                { label: "Efficiency Rate", val: `${stats.efficiency}%` },
                { label: "On-Time Rate", val: `${stats.onTimeRate}%` },
                { label: "Active Rate", val: `${performanceMetrics.activeRate}%` },
                { label: "Avg. Completion", val: `${stats.avgTime} days` },
              ]}
              loading={isLoading}
            />
          </div>
          
          {/* Progress Overview */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Overall Progress</h3>
            <ProgressRow 
              label="Completion Rate"
              current={stats.completedCount}
              total={tasks.length}
              percentage={stats.efficiency}
              color="bg-green-500"
              loading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Task Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Task Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{taskDistribution.completed}</div>
            <div className="text-sm text-gray-600">Completed Tasks</div>
            <div className="w-full bg-green-200 rounded-full h-1.5 mt-2">
              <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${taskDistribution.completedPercentage}%` }}></div>
            </div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{taskDistribution.inProgress}</div>
            <div className="text-sm text-gray-600">In Progress</div>
            <div className="w-full bg-blue-200 rounded-full h-1.5 mt-2">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${taskDistribution.inProgressPercentage}%` }}></div>
            </div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{taskDistribution.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
            <div className="w-full bg-yellow-200 rounded-full h-1.5 mt-2">
              <div className="bg-yellow-600 h-1.5 rounded-full" style={{ width: `${taskDistribution.pendingPercentage}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberProgress;
