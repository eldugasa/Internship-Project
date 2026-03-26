// src/pages/manager/ManagerDashboard.jsx
import React, { useMemo, Suspense } from 'react';
import { useNavigate, useLoaderData, Await } from 'react-router-dom';
import { 
  FolderKanban, TrendingUp, CheckCircle, AlertCircle,
  Calendar, Clock, Users, Plus, Eye,
  BarChart3, PieChart, Activity, Target,
  RefreshCw, FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  managerDashboardLoader, 
  calculateMetrics, 
  calculateChartData, 
  formatDate 
} from '../../loader/manager/ManagerDashboard.loader';

// Re-export the loader for the route
export { managerDashboardLoader as loader };

// Chart imports
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

// Loading skeleton component
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
          <div key={i} className="bg-gray-100 rounded-xl p-4">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
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
const KPICard = ({ title, value, icon: Icon, color, bgColor, trend }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className={`${bgColor} p-3 rounded-lg`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <span className="text-xs text-gray-500">{trend}</span>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
    <p className="text-sm text-gray-600">{title}</p>
  </div>
);

const HealthCard = ({ title, value, icon: Icon, color, bgColor, total }) => (
  <div className={`${bgColor} rounded-xl p-4 border border-gray-200/50`}>
    <div className="flex items-center justify-between mb-2">
      <Icon className={`w-5 h-5 ${color}`} />
      <span className="text-xs text-gray-600">{total ? Math.round((value / total) * 100) : 0}%</span>
    </div>
    <h3 className="text-xl font-bold text-gray-900">{value}</h3>
    <p className="text-xs text-gray-600 mt-1">{title}</p>
  </div>
);

const ChartCard = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h2 className="font-bold text-gray-900">{title}</h2>
    </div>
    {children}
  </div>
);

const QuickActionCard = ({ title, desc, icon: Icon, color, bgColor, onClick }) => (
  <button
    onClick={onClick}
    className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all flex items-center gap-4 group"
  >
    <div className={`${bgColor} p-4 rounded-xl group-hover:scale-110 transition-transform`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <div className="text-left">
      <h3 className="font-bold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </div>
  </button>
);

// Main Dashboard Component
const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const loaderData = useLoaderData();

  const handleRetry = () => {
    window.location.reload();
  };

  const getTeamName = (project) => {
    return project.teamName || 
           project.team?.name || 
           project.team?.teamName || 
           'Unassigned';
  };

  const getRecentActivities = (tasks, projects) => {
    const activities = [];
    
    // Add recent tasks (last 5)
    tasks.slice(0, 5).forEach(task => {
      activities.push({
        id: `task-${task.id}`,
        type: 'task',
        title: task.status === 'completed' ? 'Task Completed' : 'Task Updated',
        message: `${task.title} - ${task.projectName || 'No project'}`,
        time: task.updatedAt ? formatDate(task.updatedAt) : 'Recently',
        status: task.status
      });
    });

    // Add recent projects (last 3)
    projects.slice(0, 3).forEach(project => {
      activities.push({
        id: `project-${project.id}`,
        type: 'project',
        title: 'Project Updated',
        message: `${project.name} - ${project.progress || 0}% complete`,
        time: project.updatedAt ? formatDate(project.updatedAt) : 'Recently',
        status: project.status
      });
    });

    // Sort by date (most recent first) and limit to 5
    return activities.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);
  };

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Await 
        resolve={Promise.all([loaderData.projects, loaderData.tasks, loaderData.teams])}
        errorElement={<DashboardError error={{ message: 'Failed to load dashboard data' }} onRetry={handleRetry} />}
      >
        {([projects, tasks, teams]) => {
          const safeProjects = Array.isArray(projects) ? projects : [];
          const safeTasks = Array.isArray(tasks) ? tasks : [];
          const safeTeams = Array.isArray(teams) ? teams : [];
          
          const metrics = calculateMetrics(safeProjects, safeTasks, safeTeams);
          const chartData = calculateChartData(metrics, safeTasks, safeProjects);
          const recentActivities = getRecentActivities(safeTasks, safeProjects);
          
          const activeProjects = safeProjects.filter(p => p.status !== 'completed');

          return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="p-6 max-w-7xl mx-auto">
                {/* Welcome Header */}
                <div className="mb-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        Welcome back, {user?.name || 'Project Manager'}! 👋
                      </h1>
                      <p className="text-gray-600 mt-1">
                        You have {metrics.projects.active} active projects and {metrics.tasks.inProgress} tasks in progress.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleRetry}
                        className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Refresh"
                      >
                        <RefreshCw className="w-5 h-5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => navigate('/manager/projects/create')}
                        className="px-4 py-2 bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        <span>New Project</span>
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
                    color="bg-[#0f5841]"
                    bgColor="bg-green-50"
                    trend={`${metrics.projects.active} active, ${metrics.projects.completed} completed`}
                  />
                  <KPICard
                    title="Total Tasks"
                    value={metrics.tasks.total}
                    icon={CheckCircle}
                    color="bg-blue-600"
                    bgColor="bg-blue-50"
                    trend={`${metrics.tasks.completed} done, ${metrics.tasks.overdue} overdue`}
                  />
                  <KPICard
                    title="Team Members"
                    value={metrics.teams.members}
                    icon={Users}
                    color="bg-purple-600"
                    bgColor="bg-purple-50"
                    trend={`${metrics.teams.total} teams`}
                  />
                  <KPICard
                    title="Completion Rate"
                    value={`${metrics.performance.taskCompletionRate}%`}
                    icon={Target}
                    color="bg-orange-600"
                    bgColor="bg-orange-50"
                    trend={`${metrics.performance.onTimeDelivery}% on time`}
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
                    />
                    <HealthCard
                      title="Projects At Risk"
                      value={metrics.projects.atRisk}
                      icon={AlertCircle}
                      color="text-yellow-600"
                      bgColor="bg-yellow-50"
                      total={metrics.projects.total}
                    />
                    <HealthCard
                      title="Overdue Tasks"
                      value={metrics.tasks.overdue}
                      icon={Clock}
                      color="text-red-600"
                      bgColor="bg-red-50"
                      total={metrics.tasks.total}
                    />
                  </div>
                )}

                {/* Charts Section */}
                {(chartData.statusData.length > 0 || chartData.taskData.length > 0) && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Project Status Chart */}
                    {chartData.statusData.length > 0 && (
                      <ChartCard title="Project Status" icon={<PieChart className="w-4 h-4" />}>
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
                            >
                              {chartData.statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </RePieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-4 mt-4">
                          {chartData.statusData.map((item, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                              <span className="text-xs text-gray-600">{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </ChartCard>
                    )}

                    {/* Task Distribution */}
                    {chartData.taskData.length > 0 && (
                      <ChartCard title="Task Distribution" icon={<BarChart3 className="w-4 h-4" />}>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={chartData.taskData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value">
                              {chartData.taskData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartCard>
                    )}

                    {/* Weekly Activity */}
                    {chartData.weeklyData.some(d => d.tasks > 0) && (
                      <ChartCard title="Weekly Activity" icon={<Activity className="w-4 h-4" />}>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={chartData.weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="tasks" stroke="#0f5841" strokeWidth={2} />
                            <Line type="monotone" dataKey="completed" stroke="#194f87" strokeWidth={2} />
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
                        <FolderKanban className="w-5 h-5 text-[#0f5841]" />
                        Active Projects
                      </h2>
                      <button
                        onClick={() => navigate('/manager/projects')}
                        className="text-sm text-[#0f5841] hover:underline"
                      >
                        View All
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
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {getTeamName(project)}
                              </span>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(project.dueDate || project.endDate)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-[#0f5841]">{project.progress || 0}%</div>
                            <div className="w-20 bg-gray-200 h-1.5 rounded-full mt-1">
                              <div 
                                className="bg-gradient-to-r from-[#0f5841] to-[#194f87] h-1.5 rounded-full"
                                style={{ width: `${project.progress || 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Activities */}
                {recentActivities.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                      <Activity className="w-5 h-5 text-[#0f5841]" />
                      Recent Activities
                    </h2>
                    <div className="space-y-4">
                      {recentActivities.map(activity => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`p-2 rounded-lg ${
                            activity.status === 'completed' ? 'bg-green-50' :
                            activity.status === 'in-progress' ? 'bg-blue-50' : 'bg-gray-50'
                          }`}>
                            {activity.type === 'task' ? (
                              <CheckCircle className={`w-4 h-4 ${
                                activity.status === 'completed' ? 'text-green-600' : 'text-blue-600'
                              }`} />
                            ) : (
                              <FolderKanban className="w-4 h-4 text-[#0f5841]" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{activity.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Tasks Table */}
                {safeTasks.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-[#0f5841]" />
                        Recent Tasks
                      </h2>
                      <button
                        onClick={() => navigate('/manager/tasks')}
                        className="text-sm text-[#0f5841] hover:underline"
                      >
                        View All
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
                            <tr key={task.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-900">{task.title}</td>
                              <td className="px-4 py-3 text-gray-600">{task.projectName || 'N/A'}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {task.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-600">{formatDate(task.dueDate)}</td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => navigate(`/manager/tasks/${task.id}`)}
                                  className="p-1 text-[#0f5841] hover:bg-[#0f5841]/10 rounded"
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

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
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
              </div>
            </div>
          );
        }}
      </Await>
    </Suspense>
  );
};

export default ManagerDashboard;