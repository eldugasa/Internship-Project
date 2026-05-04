// src/pages/manager/ManagerDashboard.jsx
import React, { useState } from 'react';
import { useNavigate, useLoaderData } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {motion, AnimatePresence} from 'framer-motion';
import { 
  FolderKanban, TrendingUp, CheckCircle, AlertCircle,
  Calendar, Clock, Users, Plus, Eye,
  BarChart3, PieChart, Activity, Target,
  RefreshCw, FileText, ChevronRight, Award,
  Rocket, Briefcase, Star, Zap, Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  managerDashboardLoader,
  managerProjectsQuery,
  managerTasksQuery,
  managerTeamsQuery,
  formatDate,
  invalidateManagerQueries
} from '../../loader/manager/ManagerDashboard.loader';

// Re-export the loader for the route
export { managerDashboardLoader as loader };

// Loading skeleton component - shows IMMEDIATELY
const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-96 bg-gray-200 rounded mt-2 animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-48 bg-gray-100 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Error component
const DashboardError = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to load dashboard</h2>
      <p className="text-gray-600 mb-6">{error?.message || 'Unable to load dashboard data'}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-[#0f5841] text-white rounded-lg hover:bg-[#0a4030] transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
);

// Helper Components
const KPICard = ({ title, value, icon: Icon, color, bgColor, trend, loading }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className={`${bgColor} p-3 rounded-lg`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      {trend && <span className="text-xs text-gray-500">{trend}</span>}
    </div>
    {loading ? (
      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
    ) : (
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
    )}
    <p className="text-sm text-gray-600">{title}</p>
  </div>
);

const HealthCard = ({ title, value, icon: Icon, color, bgColor, total, loading }) => (
  <div className={`${bgColor} rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-all`}>
    <div className="flex items-center justify-between mb-2">
      <Icon className={`w-5 h-5 ${color}`} />
      {!loading && total && (
        <span className="text-xs text-gray-600">{Math.round((value / total) * 100)}%</span>
      )}
    </div>
    {loading ? (
      <div className="h-7 w-12 bg-gray-200 rounded animate-pulse"></div>
    ) : (
      <h3 className="text-xl font-bold text-gray-900">{value}</h3>
    )}
    <p className="text-xs text-gray-600 mt-1">{title}</p>
  </div>
);

const ChartCard = ({ title, icon, children, loading }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h2 className="font-bold text-gray-900">{title}</h2>
    </div>
    {loading ? (
      <div className="h-48 bg-gray-100 rounded animate-pulse"></div>
    ) : (
      children
    )}
  </div>
);

const QuickActionCard = ({ title, desc, icon: Icon, color, bgColor, onClick }) => (
  <button
    onClick={onClick}
    className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all flex items-center gap-4 group text-left w-full"
  >
    <div className={`${bgColor} p-4 rounded-xl group-hover:scale-110 transition-transform`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <div className="flex-1">
      <h3 className="font-bold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </div>
    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#0f5841] transition-colors" />
  </button>
);

const ActivityItem = ({ activity, onClick }) => (
  <div 
    onClick={() => onClick(activity)}
    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
  >
    <div className={`p-2 rounded-lg ${
      activity.status === 'completed' ? 'bg-green-50' :
      activity.status === 'in-progress' ? 'bg-blue-50' : 'bg-gray-100'
    }`}>
      {activity.type === 'task' ? (
        <CheckCircle className={`w-4 h-4 ${
          activity.status === 'completed' ? 'text-green-600' : 
          activity.status === 'in-progress' ? 'text-blue-600' : 'text-gray-600'
        }`} />
      ) : (
        <FolderKanban className="w-4 h-4 text-[#0f5841]" />
      )}
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{activity.message}</p>
      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
    </div>
  </div>
);

// Main Dashboard Component
const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const loaderData = useLoaderData();
  const [refreshing, setRefreshing] = useState(false);

  // Use React Query with initial data from loader
  const { 
    data: projects = [], 
    isLoading: projectsLoading,
    refetch: refetchProjects
  } = useQuery({
    ...managerProjectsQuery(),
    initialData: loaderData?.projects,
  });

  const { 
    data: tasks = [], 
    isLoading: tasksLoading,
    refetch: refetchTasks
  } = useQuery({
    ...managerTasksQuery(),
    initialData: loaderData?.tasks,
  });

  const { 
    data: teams = [], 
    isLoading: teamsLoading,
    refetch: refetchTeams
  } = useQuery({
    ...managerTeamsQuery(),
    initialData: loaderData?.teams,
  });

  const isLoading = projectsLoading || tasksLoading || teamsLoading;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchProjects(),
        refetchTasks(),
        refetchTeams(),
      ]);
      await invalidateManagerQueries();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleActivityClick = (activity) => {
    if (activity.type === 'task' && activity.taskId) {
      navigate(`/manager/tasks/${activity.taskId}`);
    } else if (activity.type === 'project' && activity.projectId) {
      navigate(`/manager/projects/${activity.projectId}`);
    }
  };

  // Use loader data - already calculated
  const metrics = loaderData?.metrics || {
    projects: { total: 0, active: 0, completed: 0, planned: 0, atRisk: 0, onTrack: 0 },
    tasks: { total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0, completionRate: 0 },
    teams: { total: 0, members: 0 },
    performance: { projectSuccessRate: 0, taskCompletionRate: 0, onTimeDelivery: 0 }
  };

  const chartData = loaderData?.chartData || { statusData: [], taskData: [], weeklyData: [] };
  const recentActivities = loaderData?.recentActivities || [];

  const getTeamName = (project) => {
    return project.teamName || project.team?.name || project.team?.teamName || 'Unassigned';
  };

  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const activeProjects = safeProjects.filter(p => p.status !== 'completed');

  // Show skeleton on initial load
  if (isLoading && (!loaderData || Object.keys(loaderData).length === 0)) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                Welcome back, {user?.name || 'Project Manager'}! 👋
                {metrics.performance.projectSuccessRate >= 80 && (
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                )}
              </h1>
              <p className="text-gray-600 mt-1">
                You have {metrics.projects.active} active projects and {metrics.tasks.inProgress} tasks in progress.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Refresh"
              >
                {refreshing ? (
                  <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5 text-gray-600" />
                )}
              </button>
             
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Projects"
            value={metrics.projects.total}
            icon={FolderKanban}
            color="text-[#0f5841]"
            bgColor="bg-green-50"
            trend={`${metrics.projects.active} active, ${metrics.projects.completed} completed`}
            loading={isLoading}
          />
          <KPICard
            title="Total Tasks"
            value={metrics.tasks.total}
            icon={CheckCircle}
            color="text-blue-600"
            bgColor="bg-blue-50"
            trend={`${metrics.tasks.completed} done, ${metrics.tasks.overdue} overdue`}
            loading={isLoading}
          />
          <KPICard
            title="Team Members"
            value={metrics.teams.members}
            icon={Users}
            color="text-purple-600"
            bgColor="bg-purple-50"
            trend={`${metrics.teams.total} teams`}
            loading={isLoading}
          />
          <KPICard
            title="Completion Rate"
            value={`${metrics.performance.taskCompletionRate}%`}
            icon={Target}
            color="text-orange-600"
            bgColor="bg-orange-50"
            trend={`${metrics.performance.onTimeDelivery}% on time`}
            loading={isLoading}
          />
        </div>

        {/* Project Health Cards */}
        {metrics.projects.total > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <HealthCard
              title="Projects On Track"
              value={metrics.projects.onTrack}
              icon={TrendingUp}
              color="text-green-600"
              bgColor="bg-green-50"
              total={metrics.projects.total}
              loading={isLoading}
            />
            <HealthCard
              title="Projects At Risk"
              value={metrics.projects.atRisk}
              icon={AlertCircle}
              color="text-yellow-600"
              bgColor="bg-yellow-50"
              total={metrics.projects.total}
              loading={isLoading}
            />
            <HealthCard
              title="Overdue Tasks"
              value={metrics.tasks.overdue}
              icon={Clock}
              color="text-red-600"
              bgColor="bg-red-50"
              total={metrics.tasks.total}
              loading={isLoading}
            />
          </div>
        )}

        {/* Charts Section */}
        {(chartData.statusData.length > 0 || chartData.taskData.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {chartData.statusData.length > 0 && (
              <ChartCard 
                title="Project Status" 
                icon={<PieChart className="w-4 h-4 text-[#0f5841]" />}
                loading={isLoading}
              >
                <ResponsiveContainer width="100%" height={200}>
                  <RePieChart>
                    <Pie
                      data={chartData.statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {chartData.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4 flex-wrap">
                  {chartData.statusData.map((item, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-xs text-gray-600">{item.name}</span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            )}

            {chartData.taskData.length > 0 && (
              <ChartCard 
                title="Task Distribution" 
                icon={<BarChart3 className="w-4 h-4 text-[#0f5841]" />}
                loading={isLoading}
              >
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData.taskData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.taskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {chartData.weeklyData.some(d => d.tasks > 0) && (
              <ChartCard 
                title="Weekly Activity" 
                icon={<Activity className="w-4 h-4 text-[#0f5841]" />}
                loading={isLoading}
              >
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="tasks" 
                      stroke="#0f5841" 
                      strokeWidth={2} 
                      dot={{ fill: '#0f5841', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="#194f87" 
                      strokeWidth={2}
                      dot={{ fill: '#194f87', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>
        )}

        {/* Active Projects */}
        {activeProjects.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-[#0f5841]" />
                Active Projects
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {activeProjects.length}
                </span>
              </h2>
              <button
                onClick={() => navigate('/manager/projects')}
                className="text-sm text-[#0f5841] hover:underline flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {activeProjects.slice(0, 5).map(project => (
                <div 
                  key={project.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  onClick={() => navigate(`/manager/projects/${project.id}`)}
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{project.name}</h3>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {getTeamName(project)}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(project.dueDate || project.endDate)}
                      </span>
                      {project.progress === 100 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Complete
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-[#0f5841]">{project.progress || 0}%</div>
                    <div className="w-24 bg-gray-200 h-2 rounded-full mt-1">
                      <div 
                        className="bg-gradient-to-r from-[#0f5841] to-[#194f87] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two Column Layout for Recent Activities and Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {recentActivities.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-[#0f5841]" />
                Recent Activities
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full ml-auto">
                  Latest updates
                </span>
              </h2>
              <div className="space-y-3">
                {recentActivities.slice(0, 5).map(activity => (
                  <ActivityItem 
                    key={activity.id} 
                    activity={activity} 
                    onClick={handleActivityClick}
                  />
                ))}
              </div>
            </div>
          )}

          {safeTasks.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#0f5841]" />
                  Recent Tasks
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {safeTasks.length} total
                  </span>
                </h2>
                <button
                  onClick={() => navigate('/manager/tasks')}
                  className="text-sm text-[#0f5841] hover:underline flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {safeTasks.slice(0, 5).map(task => (
                      <tr key={task.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{task.title}</div>
                          {task.assigneeName && task.assigneeName !== 'Unassigned' && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              Assigned to: {task.assigneeName}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{task.projectName || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.status === 'completed' ? 'bg-green-100 text-green-700' :
                            task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                            task.status === 'review' ? 'bg-purple-100 text-purple-700' :
                            task.status === 'blocked' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${
                            task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
                              ? 'text-red-600 font-medium'
                              : 'text-gray-600'
                          }`}>
                            {formatDate(task.dueDate)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate(`/manager/tasks/${task.id}`)}
                            className="p-1.5 text-[#0f5841] hover:bg-[#0f5841]/10 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            title="Create Project"
            desc="Start a new project"
            icon={FolderKanban}
            color="text-[#0f5841]"
            bgColor="bg-green-50"
            onClick={() => navigate('/manager/projects/create')}
          />
          <QuickActionCard
            title="Create Task"
            desc="Assign new tasks"
            icon={CheckCircle}
            color="text-blue-600"
            bgColor="bg-blue-50"
            onClick={() => navigate('/manager/tasks/create')}
          />
          <QuickActionCard
            title="Manage Teams"
            desc="View and edit teams"
            icon={Users}
            color="text-purple-600"
            bgColor="bg-purple-50"
            onClick={() => navigate('/manager/teams')}
          />
          <QuickActionCard
            title="View Reports"
            desc="Generate project reports"
            icon={FileText}
            color="text-orange-600"
            bgColor="bg-orange-50"
            onClick={() => navigate('/manager/reports')}
          />
        </div>

        {/* Achievement Banner */}
        {metrics.performance.projectSuccessRate >= 75 && (
          <div className="mt-8 bg-gradient-to-r from-[#0f5841] to-[#194f87] rounded-xl p-6 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8" />
                <div>
                  <h3 className="font-bold text-lg">Great Performance!</h3>
                  <p className="text-white/80 text-sm">
                    {metrics.performance.projectSuccessRate}% project success rate - You're exceeding expectations!
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/manager/reports')}
                className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
              >
                View Detailed Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Import chart components
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export default ManagerDashboard;