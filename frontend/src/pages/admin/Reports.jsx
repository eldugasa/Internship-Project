// src/pages/admin/Reports.jsx
import React, { useState } from "react";
import { useLoaderData } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { 
  Download, Users, UsersRound, FolderKanban, 
  CheckSquare, TrendingUp, AlertCircle, Calendar,
  Eye, FileText, Target, Loader2, PieChart,
  BarChart3, Filter, ChevronDown, Printer,
  Share2, DownloadCloud
} from "lucide-react";
import { calculateStats, usersQuery, projectsQuery, teamsQuery, tasksQuery } from "../../loader/admin/Reports.loader";

// Loading skeleton component
const ReportsSkeleton = () => (
  <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
    <div>
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse"></div>
    </div>
    
    <div className="flex flex-wrap gap-3">
      <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse"></div>
      <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-6 rounded-xl border-2 border-gray-200">
          <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4 animate-pulse"></div>
          <div className="h-5 w-32 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
    
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="h-6 w-48 bg-gray-200 rounded mb-4 animate-pulse"></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-4">
            <div className="h-4 w-20 bg-gray-200 rounded mb-2 animate-pulse"></div>
            <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Error component
const ReportsError = ({ error, onRetry }) => (
  <div className="flex justify-center items-center min-h-100">
    <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Reports</h3>
      <p className="text-red-600 mb-4">{error?.message || 'An error occurred while loading reports'}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
      >
        Retry
      </button>
    </div>
  </div>
);

// Helper Components
const MetricCard = ({ label, value }) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

const BreakdownCard = ({ title, children }) => (
  <div className="border border-gray-200 rounded-lg p-4">
    <h4 className="font-medium text-gray-900 mb-3">{title}</h4>
    <div className="space-y-3">{children}</div>
  </div>
);

const BreakdownRow = ({ label, value, total, color }) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  const colors = {
    gray: 'bg-gray-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{value} ({percentage}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div className={`${colors[color]} h-1.5 rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

const Reports = () => {
  const loaderData = useLoaderData();
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });
  const [selectedReport, setSelectedReport] = useState('overview');
  const [mobileView, setMobileView] = useState(false);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    ...usersQuery(),
    initialData: loaderData?.users,
  });
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    ...projectsQuery(),
    initialData: loaderData?.projects,
  });
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    ...teamsQuery(),
    initialData: loaderData?.teams,
  });
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    ...tasksQuery(),
    initialData: loaderData?.tasks,
  });

  const isLoading = usersLoading || projectsLoading || teamsLoading || tasksLoading;

  // Detect mobile view
  React.useEffect(() => {
    const checkMobile = () => {
      setMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isLoading) {
    return <ReportsSkeleton />;
  }

  const exportReport = (format, stats, users) => {
    if (!stats) return;

    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange,
      stats,
      users: users.map(u => ({
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status || 'active'
      }))
    };

    if (format === 'csv') {
      const csvContent = [
        ['Report Generated', new Date().toLocaleString()],
        ['Date Range', `${dateRange.start} to ${dateRange.end}`],
        [],
        ['OVERVIEW STATISTICS'],
        ['Metric', 'Value'],
        ['Total Users', stats.totalUsers],
        ['Total Teams', stats.totalTeams],
        ['Total Projects', stats.totalProjects],
        ['Total Tasks', stats.totalTasks],
        ['Completed Tasks', stats.completedTasks],
        ['In Progress Tasks', stats.inProgressTasks],
        ['Pending Tasks', stats.pendingTasks],
        ['Overdue Tasks', stats.overdueTasks],
        ['Completion Rate', `${stats.completionRate}%`],
        [],
        ['PROJECT STATUS BREAKDOWN'],
        ['Status', 'Count'],
        ['Planned', stats.projectStatus.planned],
        ['Active', stats.projectStatus.active],
        ['Completed', stats.projectStatus.completed],
        ['On Hold', stats.projectStatus.onHold],
        [],
        ['TASK PRIORITY BREAKDOWN'],
        ['Priority', 'Count'],
        ['High', stats.taskPriority.high],
        ['Medium', stats.taskPriority.medium],
        ['Low', stats.taskPriority.low],
        [],
        ['USER ROLE BREAKDOWN'],
        ['Role', 'Count'],
        ['Admins', stats.userRoles.admins],
        ['Project Managers', stats.userRoles.projectManagers],
        ['Team Members', stats.userRoles.teamMembers]
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const printReport = () => {
    window.print();
  };

  const reports = [
    {
      id: 'overview',
      name: 'Executive Summary',
      icon: FileText,
      description: 'High-level overview of system metrics'
    },
    {
      id: 'users',
      name: 'User Activity Report',
      icon: Users,
      description: 'User roles, status, and activity'
    },
    {
      id: 'projects',
      name: 'Project Progress Report',
      icon: FolderKanban,
      description: 'Project status and completion rates'
    },
  ];

  const safeUsers = Array.isArray(users) ? users : [];
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeTeams = Array.isArray(teams) ? teams : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const stats = calculateStats(safeUsers, safeProjects, safeTeams, safeTasks);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Reports</h1>
                  <p className="text-gray-600 mt-1">Generate and export system analytics reports</p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {/* Date Range Selector */}
                  <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
                    <button
                      onClick={() => setDateRange({ 
                        start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], 
                        end: new Date().toISOString().split('T')[0] 
                      })}
                      className="px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 transition"
                    >
                      Last 30 Days
                    </button>
                    <button
                      onClick={() => setDateRange({ 
                        start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0], 
                        end: new Date().toISOString().split('T')[0] 
                      })}
                      className="px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 transition"
                    >
                      Last Quarter
                    </button>
                    <button
                      onClick={() => setDateRange({ 
                        start: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0], 
                        end: new Date().toISOString().split('T')[0] 
                      })}
                      className="px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 transition"
                    >
                      Last Year
                    </button>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportReport('csv', stats, safeUsers)}
                      className="px-4 py-2 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2 text-sm"
                      style={{ background: `linear-gradient(to right, #0f5841, #194f87)` }}
                    >
                      <Download className="w-4 h-4" />
                      {mobileView ? 'CSV' : 'Export CSV'}
                    </button>
                    <button
                      onClick={printReport}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm"
                    >
                      <Printer className="w-4 h-4" />
                      {!mobileView && 'Print'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Report Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.map((report) => {
                  const Icon = report.icon;
                  return (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report.id)}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        selectedReport === report.id
                          ? 'border-[#194f87] bg-[#194f87]/5'
                          : 'border-gray-200 hover:border-[#194f87]/30 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                        selectedReport === report.id
                          ? 'text-white'
                          : 'text-gray-600 bg-gray-100'
                      }`}
                      style={selectedReport === report.id ? { background: `linear-gradient(to right, #0f5841, #194f87)` } : {}}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{report.name}</h3>
                      <p className="text-sm text-gray-500">{report.description}</p>
                    </button>
                  );
                })}
              </div>

              {/* Report Content */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {/* Report Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {reports.find(r => r.id === selectedReport)?.name}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Generated for period: {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition">
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition">
                      <DownloadCloud className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Report Content based on selection */}
                {selectedReport === 'overview' && (
                  <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <MetricCard label="Total Users" value={stats.totalUsers} />
                      <MetricCard label="Total Teams" value={stats.totalTeams} />
                      <MetricCard label="Total Projects" value={stats.totalProjects} />
                      <MetricCard label="Total Tasks" value={stats.totalTasks} />
                    </div>

                    {/* Breakdown Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Project Status */}
                      <BreakdownCard title="Project Status">
                        <BreakdownRow 
                          label="Planned" 
                          value={stats.projectStatus.planned} 
                          total={stats.totalProjects}
                          color="gray"
                        />
                        <BreakdownRow 
                          label="Active" 
                          value={stats.projectStatus.active} 
                          total={stats.totalProjects}
                          color="blue"
                        />
                        <BreakdownRow 
                          label="Completed" 
                          value={stats.projectStatus.completed} 
                          total={stats.totalProjects}
                          color="green"
                        />
                        <BreakdownRow 
                          label="On Hold" 
                          value={stats.projectStatus.onHold} 
                          total={stats.totalProjects}
                          color="yellow"
                        />
                      </BreakdownCard>

                      {/* User Roles */}
                      <BreakdownCard title="User Roles">
                        <BreakdownRow 
                          label="Admins" 
                          value={stats.userRoles.admins} 
                          total={stats.totalUsers}
                          color="purple"
                        />
                        <BreakdownRow 
                          label="Project Managers" 
                          value={stats.userRoles.projectManagers} 
                          total={stats.totalUsers}
                          color="blue"
                        />
                        <BreakdownRow 
                          label="Team Members" 
                          value={stats.userRoles.teamMembers} 
                          total={stats.totalUsers}
                          color="green"
                        />
                      </BreakdownCard>

                      {/* Task Priority */}
                      <BreakdownCard title="Task Priority">
                        <BreakdownRow 
                          label="High" 
                          value={stats.taskPriority.high} 
                          total={stats.totalTasks}
                          color="red"
                        />
                        <BreakdownRow 
                          label="Medium" 
                          value={stats.taskPriority.medium} 
                          total={stats.totalTasks}
                          color="yellow"
                        />
                        <BreakdownRow 
                          label="Low" 
                          value={stats.taskPriority.low} 
                          total={stats.totalTasks}
                          color="green"
                        />
                      </BreakdownCard>
                    </div>
                  </div>
                )}

                {selectedReport === 'users' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 mb-4">User List</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {safeUsers.map(user => (
                            <tr key={user.id}>
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
                                       style={{ background: `linear-gradient(to bottom right, #0f5841, #194f87)` }}>
                                    {user.name?.charAt(0)}
                                  </div>
                                  <span className="font-medium">{user.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm">{user.email}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                  user.role === 'project-manager' || user.role === 'project_manager' ? 'bg-blue-100 text-blue-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {user.role?.replace(/[_-]/g, ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {user.status || 'active'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Projects Report */}
                {selectedReport === 'projects' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Projects List</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {safeProjects.map(project => (
                            <tr key={project.id}>
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">{project.name}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  project.status === 'active' || project.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                                  project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                  project.status === 'planned' ? 'bg-gray-100 text-gray-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {project.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-20 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-[#0f5841] h-2 rounded-full"
                                      style={{ width: `${project.progress || 0}%` }}
                                    />
                                  </div>
                                  <span className="text-sm">{project.progress || 0}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm">{project.endDate || project.dueDate || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer note */}
              <p className="text-xs text-gray-400 text-center">
                Report generated on {new Date().toLocaleString()}
              </p>
            </div>
          );
};

export default Reports;