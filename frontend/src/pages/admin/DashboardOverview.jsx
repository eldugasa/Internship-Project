// src/pages/admin/DashboardOverview.jsx
import { useState, useEffect } from "react";
import { getProjects } from "../../services/projectsService";
import { getUsers } from "../../services/usersService";
import { getTeams } from "../../services/teamsService";
import { getTasks } from "../../services/tasksService";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';

const DashboardOverview = () => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);
  const [mobileView, setMobileView] = useState(false);

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalTeams: 0,
    totalProjectManagers: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
  });

  // Chart data
  const [projectStatusData, setProjectStatusData] = useState([]);
  const [taskStatusData, setTaskStatusData] = useState([]);
  const [userRoleData, setUserRoleData] = useState([]);
  const [monthlyActivityData, setMonthlyActivityData] = useState([]);
  const [teamPerformanceData, setTeamPerformanceData] = useState([]);

  const COLORS = {
    planned: '#94A3B8',
    active: '#0f5841',
    completed: '#10B981',
    'on-hold': '#F59E0B',
    pending: '#94A3B8',
    in_progress: '#194f87',
    done: '#10B981',
    admin: '#8B5CF6',
    'project-manager': '#3B82F6',
    'team-member': '#10B981',
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        const [projectsData, usersData, teamsData, tasksData] = await Promise.all([
          getProjects(),
          getUsers(),
          getTeams(),
          getTasks()
        ]);

        setProjects(projectsData);
        setUsers(usersData);
        setTeams(teamsData);
        setTasks(tasksData);

        const projectManagers = usersData.filter(
          u => u.role === 'project-manager' || u.role === 'project_manager'
        ).length;

        const completedTasks = tasksData.filter(t => t.status === 'completed' || t.status === 'done').length;
        const pendingTasks = tasksData.filter(t => t.status === 'pending' || t.status === 'todo').length;
        const inProgressTasks = tasksData.filter(t => t.status === 'in-progress' || t.status === 'in_progress').length;

        setStats({
          totalUsers: usersData.length,
          totalProjects: projectsData.length,
          totalTeams: teamsData.length,
          totalProjectManagers: projectManagers,
          activeProjects: projectsData.filter(p => p.status === 'active' || p.status === 'in_progress').length,
          completedProjects: projectsData.filter(p => p.status === 'completed').length,
          totalTasks: tasksData.length,
          completedTasks,
          pendingTasks,
          inProgressTasks,
        });

        const statusCounts = {
          planned: projectsData.filter(p => p.status === 'planned').length,
          active: projectsData.filter(p => p.status === 'active' || p.status === 'in_progress').length,
          completed: projectsData.filter(p => p.status === 'completed').length,
          'on-hold': projectsData.filter(p => p.status === 'on-hold').length,
        };
        setProjectStatusData([
          { name: 'Planned', value: statusCounts.planned, color: COLORS.planned },
          { name: 'Active', value: statusCounts.active, color: COLORS.active },
          { name: 'Completed', value: statusCounts.completed, color: COLORS.completed },
          { name: 'On Hold', value: statusCounts['on-hold'], color: COLORS['on-hold'] },
        ].filter(item => item.value > 0));

        setTaskStatusData([
          { name: 'Pending', value: pendingTasks, color: COLORS.pending },
          { name: 'In Progress', value: inProgressTasks, color: COLORS.in_progress },
          { name: 'Completed', value: completedTasks, color: COLORS.completed },
        ].filter(item => item.value > 0));

        const adminCount = usersData.filter(u => u.role === 'admin').length;
        const pmCount = usersData.filter(u => u.role === 'project-manager' || u.role === 'project_manager').length;
        const tmCount = usersData.filter(u => u.role === 'team-member' || u.role === 'team_member').length;
        setUserRoleData([
          { name: 'Admins', value: adminCount, color: COLORS.admin },
          { name: 'Project Managers', value: pmCount, color: COLORS['project-manager'] },
          { name: 'Team Members', value: tmCount, color: COLORS['team-member'] },
        ].filter(item => item.value > 0));

        const getMonthlyActivity = () => {
          const months = [];
          const now = new Date();
          
          for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();
            const month = date.getMonth();
            
            const tasksInMonth = tasksData.filter(task => {
              const taskDate = new Date(task.createdAt);
              return taskDate.getMonth() === month && taskDate.getFullYear() === year;
            }).length;
            
            const projectsInMonth = projectsData.filter(project => {
              const projectDate = new Date(project.createdAt || project.startDate || new Date());
              return projectDate.getMonth() === month && projectDate.getFullYear() === year;
            }).length;
            
            months.push({
              month: monthName,
              tasks: tasksInMonth,
              projects: projectsInMonth,
            });
          }
          
          return months;
        };

        setMonthlyActivityData(getMonthlyActivity());

        const getTeamPerformance = () => {
          return teamsData.map(team => {
            const teamProjects = projectsData.filter(p => p.teamId === team.id || p.team === team.name);
            const teamProjectIds = teamProjects.map(p => p.id);
            const teamTasks = tasksData.filter(t => teamProjectIds.includes(t.projectId));
            
            const completedTasks = teamTasks.filter(t => t.status === 'completed' || t.status === 'done').length;
            const totalTasks = teamTasks.length;
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            return {
              name: team.name,
              progress: completionRate,
              tasks: totalTasks,
            };
          }).slice(0, 5);
        };

        setTeamPerformanceData(getTeamPerformance());

      } catch (err) {
        console.error("Fetch error:", err);
        setError("Something went wrong while loading dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusConfig = (status) => {
    const configs = {
      planned: {
        label: "Planned",
        color: "bg-gray-100 text-gray-800",
        icon: "📋",
      },
      active: {
        label: "In Progress",
        color: "bg-green-100 text-green-800",
        icon: "🚀",
      },
      completed: {
        label: "Completed",
        color: "bg-blue-100 text-blue-800",
        icon: "✅",
      },
      "on-hold": {
        label: "On Hold",
        color: "bg-yellow-100 text-yellow-800",
        icon: "⏸️",
      },
    };
    return configs[status] || configs.planned;
  };

  const getCompletionPercentage = (project) => {
    if (project.tasks?.total > 0) {
      return Math.round(
        ((project.tasks.completed || 0) / project.tasks.total) * 100
      );
    }
    return project.status === "completed" ? 100 : 0;
  };

  const filteredProjects =
    filter === "all"
      ? projects
      : projects.filter((p) => p.status === filter);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f5841]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-10">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 text-white rounded-lg hover:opacity-90 transition"
          style={{ background: `linear-gradient(to right, #0f5841, #194f87)` }}
        >
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: "👥",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Total Projects",
      value: stats.totalProjects,
      icon: "📊",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "Total Tasks",
      value: stats.totalTasks,
      icon: "✅",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Active Projects",
      value: stats.activeProjects,
      icon: "🚀",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
    {
      title: "Completed Tasks",
      value: stats.completedTasks,
      icon: "🎉",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      title: "Project Managers",
      value: stats.totalProjectManagers,
      icon: "👔",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm sm:text-base text-gray-600">Welcome back! Here's what's happening with your projects today.</p>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`${stat.bgColor} rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-lg sm:text-xl lg:text-2xl">{stat.icon}</span>
              <span className={`text-xl sm:text-2xl lg:text-3xl font-bold ${stat.textColor}`}>{stat.value}</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
     

{/* Project Status Pie Chart */}
{projectStatusData.length > 0 && (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h2 className="text-lg font-bold text-gray-900 mb-4">Project Status Distribution</h2>
    <div className="h-64 w-full relative">
      {projectStatusData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%" debounce={1}>
          <PieChart>
            <Pie
              data={projectStatusData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              isAnimationActive={false}
            >
              {projectStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400">
          No data available
        </div>
      )}
    </div>
  </div>
)}

{/* Task Status Bar Chart */}
{taskStatusData.length > 0 && (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h2 className="text-lg font-bold text-gray-900 mb-4">Task Status Overview</h2>
    <div className="h-64 w-full relative">
      {taskStatusData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%" debounce={1}>
          <BarChart data={taskStatusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#4DA5AD">
              {taskStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400">
          No data available
        </div>
      )}
    </div>
  </div>
)}

{/* User Role Distribution */}
{userRoleData.length > 0 && (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h2 className="text-lg font-bold text-gray-900 mb-4">User Role Distribution</h2>
    <div className="h-64 w-full relative">
      {userRoleData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%" debounce={1}>
          <PieChart>
            <Pie
              data={userRoleData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              isAnimationActive={false}
            >
              {userRoleData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400">
          No data available
        </div>
      )}
    </div>
  </div>
)}

{/* Monthly Activity Line Chart */}
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <h2 className="text-lg font-bold text-gray-900 mb-4">Monthly Activity (Last 6 Months)</h2>
  <div className="h-64 w-full relative">
    {monthlyActivityData.length > 0 ? (
      <ResponsiveContainer width="100%" height="100%" debounce={1}>
        <LineChart data={monthlyActivityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="projects" stroke="#4DA5AD" strokeWidth={2} name="Projects" />
          <Line yAxisId="right" type="monotone" dataKey="tasks" stroke="#F59E0B" strokeWidth={2} name="Tasks" />
        </LineChart>
      </ResponsiveContainer>
    ) : (
      <div className="flex items-center justify-center h-full text-gray-400">
        No activity data available
      </div>
    )}
  </div>
</div>

{/* Team Performance Area Chart */}
{teamPerformanceData.length > 0 && (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
    <h2 className="text-lg font-bold text-gray-900 mb-4">Team Performance (Completion Rate)</h2>
    <div className="h-64 w-full relative">
      {teamPerformanceData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%" debounce={1}>
          <AreaChart data={teamPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="progress" stackId="1" stroke="#4DA5AD" fill="#4DA5AD" fillOpacity={0.3} name="Completion %" />
            <Area type="monotone" dataKey="tasks" stackId="2" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} name="Total Tasks" />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400">
          No team data available
        </div>
      )}
    </div>
  </div>
)}
      </div>

      {/* Projects Overview Section */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
          <div>
            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">
              All Projects Overview
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              View and manage project status across all teams
            </p>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="planned">Planned</option>
            <option value="active">In Progress</option>
            <option value="completed">Completed</option>
            <option value="on-hold">On Hold</option>
          </select>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
            <p className="text-sm sm:text-base text-gray-500">No projects found</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Team
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Manager
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Status
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                      Timeline
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProjects.map((project) => {
                    const statusConfig = getStatusConfig(project.status);
                    const completion = getCompletionPercentage(project);

                    return (
                      <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 sm:px-4 lg:px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900 text-sm sm:text-base">{project.name}</div>
                            {project.description && (
                              <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-xs">
                                {project.description}
                              </div>
                            )}
                            {/* Mobile-only team info */}
                            <div className="sm:hidden text-xs text-gray-500 mt-1">
                              Team: {project.teamName || project.team || "N/A"}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-4 hidden sm:table-cell whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded-full">
                            {project.teamName || project.team || "N/A"}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-4 hidden md:table-cell whitespace-nowrap text-sm">
                          {project.managerName || project.manager || "N/A"}
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-12 sm:w-16 bg-gray-200 rounded-full h-1.5 sm:h-2">
                              <div 
                                className="bg-[#0f5841] h-1.5 sm:h-2 rounded-full transition-all duration-500" 
                                style={{ width: `${completion}%` }}
                              ></div>
                            </div>
                            <span className="text-xs sm:text-sm text-gray-600">{completion}%</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-4 hidden lg:table-cell whitespace-nowrap">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                            {statusConfig.icon} {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-4 hidden xl:table-cell whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          {project.startDate} → {project.dueDate || project.endDate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;