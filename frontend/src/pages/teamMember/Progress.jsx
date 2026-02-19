// src/pages/teamMember/Progress.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Target, Award, Clock, 
  CheckCircle, Download, AlertCircle,
  BarChart3, PieChart, Zap, Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMyTasks } from '../../services/tasksService';

const StatCard = ({ title, value, subtext, icon: Icon, colorClass }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="text-xs text-gray-500">{subtext}</div>
    </div>
  </div>
);

const ProgressRow = ({ label, current, total, percentage, unit = "tasks", color = "bg-[#4DA5AD]" }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-sm">
      <span className="font-medium text-gray-900">{label}</span>
      <span className="text-gray-500">{current}/{total} {unit}</span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
      <div 
        className={`${color} h-2.5 rounded-full transition-all duration-700 ease-out`} 
        style={{ width: `${percentage}%` }}
      />
    </div>
  </div>
);

const MetricGroup = ({ title, items }) => (
  <div className="space-y-3">
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
    <div className="space-y-2">
      {items.map(i => (
        <div key={i.label} className="flex justify-between text-sm border-b border-gray-50 pb-1">
          <span className="text-gray-600">{i.label}</span>
          <span className="font-semibold text-gray-900">{i.val}</span>
        </div>
      ))}
    </div>
  </div>
);

const TeamMemberProgress = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [timePeriod, setTimePeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // ✅ Use getMyTasks instead of axios
        const userTasks = await getMyTasks();
        setTasks(userTasks);
      } catch (err) {
        console.error('Failed to load tasks:', err);
        setError(err.message || 'Failed to load tasks');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchTasks();
    }
  }, [user]);

  const { stats, projectBreakdown, timeStats, performanceMetrics } = useMemo(() => {
    const completed = tasks.filter(t => t.status === 'completed');
    const inProgress = tasks.filter(t => t.status === 'in-progress');
    const pending = tasks.filter(t => t.status === 'pending');
    const overdue = tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
    );

    const totalHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    const estHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    
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
      return Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)); // in days
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
          pending: 0,
          hours: 0 
        };
      }
      projectMap[name].total++;
      projectMap[name].hours += task.actualHours || 0;
      
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
        totalHours,
        utilization: estHours ? Math.round((totalHours / estHours) * 100) : 0,
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
        productivity: totalHours > 0 ? Math.round(completed.length / totalHours * 100) / 100 : 0
      }
    };
  }, [tasks]);

  const exportData = () => {
    const dataStr = JSON.stringify({ tasks, stats, generated: new Date() }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `progress-report-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your progress data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] transition"
        >
          Retry
        </button>
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
        />
        <StatCard 
          title="Tasks Completed" value={stats.completedCount} 
          subtext={`${stats.totalHours} hours logged`} 
          icon={CheckCircle} colorClass="bg-blue-50 text-blue-600" 
        />
        <StatCard 
          title="Avg. Completion" value={`${stats.avgTime} days`} 
          subtext="Per task average" 
          icon={Clock} colorClass="bg-orange-50 text-orange-600" 
        />
        <StatCard 
          title="On-Time Rate" value={`${stats.onTimeRate}%`} 
          subtext={`${stats.overdueCount} overdue tasks`} 
          icon={Target} colorClass="bg-purple-50 text-purple-600" 
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
              <div className="text-sm text-gray-500">Productivity</div>
              <div className="text-xl font-bold text-gray-900">{performanceMetrics.productivity} tasks/hr</div>
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
                  />
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>✅ {proj.completed} done</span>
                    <span>🔄 {proj.inProgress || 0} in progress</span>
                    <span>⏳ {proj.pending || 0} pending</span>
                    <span>⏱️ {proj.hours}h</span>
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
            <MetricGroup title="Task Status" items={[
              { label: "Completed", val: stats.completedCount },
              { label: "In Progress", val: stats.inProgressCount },
              { label: "Pending", val: stats.pendingCount },
              { label: "Overdue", val: stats.overdueCount },
            ]} />
            <MetricGroup title="Performance" items={[
              { label: "Efficiency Rate", val: `${stats.efficiency}%` },
              { label: "On-Time Rate", val: `${stats.onTimeRate}%` },
              { label: "Utilization", val: `${stats.utilization}%` },
              { label: "Avg. Completion", val: `${stats.avgTime} days` },
            ]} />
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
            />
          </div>
        </div>
      </div>

      {/* Task Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Task Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.completedCount}</div>
            <div className="text-sm text-gray-600">Completed Tasks</div>
            <div className="w-full bg-green-200 rounded-full h-1.5 mt-2">
              <div className="bg-green-600 h-1.5 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgressCount}</div>
            <div className="text-sm text-gray-600">In Progress</div>
            <div className="w-full bg-blue-200 rounded-full h-1.5 mt-2">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${(stats.inProgressCount / tasks.length) * 100}%` }}></div>
            </div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</div>
            <div className="text-sm text-gray-600">Pending</div>
            <div className="w-full bg-yellow-200 rounded-full h-1.5 mt-2">
              <div className="bg-yellow-600 h-1.5 rounded-full" style={{ width: `${(stats.pendingCount / tasks.length) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberProgress;