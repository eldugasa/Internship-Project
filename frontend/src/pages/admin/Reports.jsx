// src/pages/admin/Reports.jsx
import React, { useState, useEffect } from "react";
import { 
  Download, Users, UsersRound, FolderKanban, 
  CheckSquare, TrendingUp, AlertCircle, Calendar,
  Eye, FileText, Target, Loader2, PieChart,
  BarChart3, Filter, ChevronDown, Printer,
  Share2, DownloadCloud
} from "lucide-react";
import { getUsers } from "../../services/usersService";
import { getProjects } from "../../services/projectsService";
import { getTeams } from "../../services/teamsService";
import { getTasks } from "../../services/tasksService";

const Reports = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });
  const [selectedReport, setSelectedReport] = useState('overview');
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

  // Fetch real data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [usersData, projectsData, teamsData, tasksData] = await Promise.all([
          getUsers(),
          getProjects(),
          getTeams(),
          getTasks()
        ]);

        setUsers(usersData);
        setProjects(projectsData);
        setTeams(teamsData);
        setTasks(tasksData);

        // Calculate stats
        const totalUsers = usersData.length;
        const totalTeams = teamsData.length;
        const totalProjects = projectsData.length;
        const totalTasks = tasksData.length;
        
        const completedTasks = tasksData.filter(t => 
          t.status === 'completed' || t.status === 'done'
        ).length;
        
        const inProgressTasks = tasksData.filter(t => 
          t.status === 'in-progress' || t.status === 'in_progress'
        ).length;
        
        const pendingTasks = tasksData.filter(t => 
          t.status === 'pending'
        ).length;
        
        const overdueTasks = tasksData.filter(t => 
          t.dueDate && new Date(t.dueDate) < new Date() && 
          t.status !== 'completed' && t.status !== 'done'
        ).length;

        const projectManagers = usersData.filter(u => 
          u.role === 'project-manager' || u.role === 'project_manager'
        ).length;
        
        const teamMembers = usersData.filter(u => 
          u.role === 'team-member' || u.role === 'team_member'
        ).length;

        // Project status breakdown
        const projectStatus = {
          planned: projectsData.filter(p => p.status === 'planned').length,
          active: projectsData.filter(p => p.status === 'active' || p.status === 'in_progress').length,
          completed: projectsData.filter(p => p.status === 'completed').length,
          onHold: projectsData.filter(p => p.status === 'on-hold').length
        };

        // Task priority breakdown
        const taskPriority = {
          high: tasksData.filter(t => t.priority === 'high' || t.priority === 'HIGH').length,
          medium: tasksData.filter(t => t.priority === 'medium' || t.priority === 'MEDIUM').length,
          low: tasksData.filter(t => t.priority === 'low' || t.priority === 'LOW').length
        };

        // User role breakdown
        const userRoles = {
          admins: usersData.filter(u => u.role === 'admin').length,
          projectManagers: usersData.filter(u => u.role === 'project-manager' || u.role === 'project_manager').length,
          teamMembers: usersData.filter(u => u.role === 'team-member' || u.role === 'team_member').length
        };

        setDashboardStats({
          totalUsers,
          totalTeams,
          totalProjects,
          totalTasks,
          completedTasks,
          inProgressTasks,
          pendingTasks,
          overdueTasks,
          projectManagers,
          teamMembers,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          projectStatus,
          taskPriority,
          userRoles
        });

      } catch (err) {
        console.error("Reports fetch error:", err);
        setError(err.message || "Something went wrong while loading reports.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const completionRate = dashboardStats?.completionRate || 0;

  const exportReport = (format) => {
    if (!dashboardStats) return;

    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange,
      stats: dashboardStats,
      users: users.map(u => ({
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status || 'active'
      }))
    };

    if (format === 'csv') {
      // Generate CSV
      const csvContent = [
        ['Report Generated', new Date().toLocaleString()],
        ['Date Range', `${dateRange.start} to ${dateRange.end}`],
        [],
        ['OVERVIEW STATISTICS'],
        ['Metric', 'Value'],
        ['Total Users', dashboardStats.totalUsers],
        ['Total Teams', dashboardStats.totalTeams],
        ['Total Projects', dashboardStats.totalProjects],
        ['Total Tasks', dashboardStats.totalTasks],
        ['Completed Tasks', dashboardStats.completedTasks],
        ['In Progress Tasks', dashboardStats.inProgressTasks],
        ['Pending Tasks', dashboardStats.pendingTasks],
        ['Overdue Tasks', dashboardStats.overdueTasks],
        ['Completion Rate', `${completionRate}%`],
        [],
        ['PROJECT STATUS BREAKDOWN'],
        ['Status', 'Count'],
        ['Planned', dashboardStats.projectStatus.planned],
        ['Active', dashboardStats.projectStatus.active],
        ['Completed', dashboardStats.projectStatus.completed],
        ['On Hold', dashboardStats.projectStatus.onHold],
        [],
        ['TASK PRIORITY BREAKDOWN'],
        ['Priority', 'Count'],
        ['High', dashboardStats.taskPriority.high],
        ['Medium', dashboardStats.taskPriority.medium],
        ['Low', dashboardStats.taskPriority.low],
        [],
        ['USER ROLE BREAKDOWN'],
        ['Role', 'Count'],
        ['Admins', dashboardStats.userRoles.admins],
        ['Project Managers', dashboardStats.userRoles.projectManagers],
        ['Team Members', dashboardStats.userRoles.teamMembers]
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      // JSON export
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0f5841' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-10">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <p className="mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition"
          style={{ background: `linear-gradient(to right, #0f5841, #194f87)` }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!dashboardStats) {
    return (
      <div className="text-center text-gray-500 py-10">
        No data available
      </div>
    );
  }

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
    {
      id: 'tasks',
      name: 'Task Completion Report',
      icon: CheckSquare,
      description: 'Task distribution and priority analysis'
    }
  ];

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
              onClick={() => exportReport('csv')}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <MetricCard label="Total Users" value={dashboardStats.totalUsers} />
              <MetricCard label="Total Teams" value={dashboardStats.totalTeams} />
              <MetricCard label="Total Projects" value={dashboardStats.totalProjects} />
              <MetricCard label="Total Tasks" value={dashboardStats.totalTasks} />
            </div>

            {/* Task Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SummaryCard
                title="Task Completion"
                value={dashboardStats.completedTasks}
                total={dashboardStats.totalTasks}
                color="green"
                label="Completed"
              />
              <SummaryCard
                title="In Progress"
                value={dashboardStats.inProgressTasks}
                total={dashboardStats.totalTasks}
                color="blue"
                label="In Progress"
              />
              <SummaryCard
                title="Pending & Overdue"
                value={dashboardStats.pendingTasks + dashboardStats.overdueTasks}
                total={dashboardStats.totalTasks}
                color="yellow"
                label="Pending"
              />
            </div>

            {/* Breakdown Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Project Status */}
              <BreakdownCard title="Project Status">
                <BreakdownRow 
                  label="Planned" 
                  value={dashboardStats.projectStatus.planned} 
                  total={dashboardStats.totalProjects}
                  color="gray"
                />
                <BreakdownRow 
                  label="Active" 
                  value={dashboardStats.projectStatus.active} 
                  total={dashboardStats.totalProjects}
                  color="blue"
                />
                <BreakdownRow 
                  label="Completed" 
                  value={dashboardStats.projectStatus.completed} 
                  total={dashboardStats.totalProjects}
                  color="green"
                />
                <BreakdownRow 
                  label="On Hold" 
                  value={dashboardStats.projectStatus.onHold} 
                  total={dashboardStats.totalProjects}
                  color="yellow"
                />
              </BreakdownCard>

              {/* Task Priority */}
              <BreakdownCard title="Task Priority">
                <BreakdownRow 
                  label="High" 
                  value={dashboardStats.taskPriority.high} 
                  total={dashboardStats.totalTasks}
                  color="red"
                />
                <BreakdownRow 
                  label="Medium" 
                  value={dashboardStats.taskPriority.medium} 
                  total={dashboardStats.totalTasks}
                  color="yellow"
                />
                <BreakdownRow 
                  label="Low" 
                  value={dashboardStats.taskPriority.low} 
                  total={dashboardStats.totalTasks}
                  color="green"
                />
              </BreakdownCard>

              {/* User Roles */}
              <BreakdownCard title="User Roles">
                <BreakdownRow 
                  label="Admins" 
                  value={dashboardStats.userRoles.admins} 
                  total={dashboardStats.totalUsers}
                  color="purple"
                />
                <BreakdownRow 
                  label="Project Managers" 
                  value={dashboardStats.userRoles.projectManagers} 
                  total={dashboardStats.totalUsers}
                  color="blue"
                />
                <BreakdownRow 
                  label="Team Members" 
                  value={dashboardStats.userRoles.teamMembers} 
                  total={dashboardStats.totalUsers}
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
                  {users.map(user => (
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

        {/* Similar sections for projects and tasks reports */}
        {(selectedReport === 'projects' || selectedReport === 'tasks') && (
          <div className="text-center py-12 text-gray-500">
            Detailed {selectedReport} report coming soon...
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

// Helper Components
const MetricCard = ({ label, value }) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

const SummaryCard = ({ title, value, total, color, label }) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  const colors = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <p className="text-sm text-gray-500 mb-2">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div className={`${colors[color]} h-2 rounded-full`} style={{ width: `${percentage}%` }} />
        </div>
        <span className="text-xs text-gray-500">{percentage}%</span>
      </div>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
};

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

export default Reports;