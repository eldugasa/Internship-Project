// src/pages/admin/DashboardOverview.jsx
import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  DASHBOARD_COLORS,
  getStatusConfig,
  getCompletionPercentage,
} from "../../loader/admin/DashboardOverview.loader";
import { getProjects } from "../../services/projectsService";
import { getUsers } from "../../services/usersService";
import { getTeams } from "../../services/teamsService";
import { getTasks } from "../../services/tasksService";

// Skeleton loader component
const DashboardSkeleton = () => (
  <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-4 lg:p-6">
    <div>
      <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 w-96 bg-gray-200 rounded mt-2 animate-pulse"></div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
          <div className="flex justify-between items-center mb-2">
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            <div className="h-8 w-12 bg-gray-200 rounded"></div>
          </div>
          <div className="h-4 w-20 bg-gray-200 rounded mt-2"></div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="h-6 w-48 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  </div>
);

// Main Dashboard Content Component - Moved outside to prevent recreation
const DashboardContent = ({ projects, users, teams, tasks, isSuperAdmin = false }) => {
  const [filter, setFilter] = useState("all");
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1280,
  );
  const [userRoleChartWidth, setUserRoleChartWidth] = useState(0);
  const userRoleChartRef = useRef(null);
  const isMobile = viewportWidth < 640;
  const isLargeScreen = viewportWidth > 1024;

  const normalizeValue = (value = "") =>
    value.toString().trim().toUpperCase().replace(/-/g, "_");

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const element = userRoleChartRef.current;
    if (!element) return;

    const updateWidth = () => {
      setUserRoleChartWidth(element.offsetWidth || 0);
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  // Memoized stats calculation
  const stats = useMemo(() => {
    const projectManagers = users.filter(
      (u) => normalizeValue(u.role) === "PROJECT_MANAGER",
    ).length;

    const completedTasks = tasks.filter(
      (t) => ["COMPLETED", "DONE"].includes(normalizeValue(t.status)),
    ).length;
    const pendingTasks = tasks.filter(
      (t) => ["PENDING", "TODO"].includes(normalizeValue(t.status)),
    ).length;
    const inProgressTasks = tasks.filter(
      (t) => normalizeValue(t.status) === "IN_PROGRESS",
    ).length;
    const overdueProjects = projects.filter(
      (p) => normalizeValue(p.status) === "OVERDUE",
    ).length;

    return {
      totalUsers: users.length,
      totalProjects: projects.length,
      totalTeams: teams.length,
      totalProjectManagers: projectManagers,
      activeProjects: projects.filter(
        (p) => ["ACTIVE", "IN_PROGRESS"].includes(normalizeValue(p.status)),
      ).length,
      completedProjects: projects.filter(
        (p) => normalizeValue(p.status) === "COMPLETED",
      ).length,
      totalTasks: tasks.length,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueProjects,
    };
  }, [projects, users, teams, tasks]);

  // Memoized project status data
  const projectStatusData = useMemo(() => {
    const statusCounts = {
      planned: projects.filter((p) => normalizeValue(p.status) === "PLANNED").length,
      active: projects.filter(
        (p) => ["ACTIVE", "IN_PROGRESS"].includes(normalizeValue(p.status)),
      ).length,
      completed: projects.filter(
        (p) => normalizeValue(p.status) === "COMPLETED",
      ).length,
      overdue: projects.filter((p) => normalizeValue(p.status) === "OVERDUE").length,
      "on-hold": projects.filter(
        (p) => normalizeValue(p.status) === "ON_HOLD",
      ).length,
    };

    return [
      {
        name: "Planned",
        value: statusCounts.planned,
        color: DASHBOARD_COLORS.planned,
      },
      {
        name: "Active",
        value: statusCounts.active,
        color: DASHBOARD_COLORS.active,
      },
      {
        name: "Completed",
        value: statusCounts.completed,
        color: DASHBOARD_COLORS.completed,
      },
      {
        name: "overdue",
        value: statusCounts.overdue,
        color: DASHBOARD_COLORS.overdue,
      },
      {
        name: "On Hold",
        value: statusCounts["on-hold"],
        color: DASHBOARD_COLORS["on-hold"],
      },
    ].filter((item) => item.value > 0);
  }, [projects]);

  // Memoized task status data
  const taskStatusData = useMemo(() => {
    if (isSuperAdmin) return [];

    const completedTasks = tasks.filter(
      (t) => ["COMPLETED", "DONE"].includes(normalizeValue(t.status)),
    ).length;
    const pendingTasks = tasks.filter(
      (t) => ["PENDING", "TODO"].includes(normalizeValue(t.status)),
    ).length;
    const inProgressTasks = tasks.filter(
      (t) => normalizeValue(t.status) === "IN_PROGRESS",
    ).length;

    return [
      { name: "Pending", value: pendingTasks, color: DASHBOARD_COLORS.pending },
      {
        name: "In Progress",
        value: inProgressTasks,
        color: DASHBOARD_COLORS.in_progress,
      },
      {
        name: "Completed",
        value: completedTasks,
        color: DASHBOARD_COLORS.completed,
      },
    ].filter((item) => item.value > 0);
  }, [isSuperAdmin, tasks]);

  // Memoized user role data
  const userRoleData = useMemo(() => {
    const adminCount = users.filter((u) => normalizeValue(u.role) === "ADMIN").length;
    const pmCount = users.filter(
      (u) => normalizeValue(u.role) === "PROJECT_MANAGER",
    ).length;
    const qaCount = users.filter(
      (u) => normalizeValue(u.role) === "QA_TESTER",
    ).length;
    const tmCount = users.filter(
      (u) => normalizeValue(u.role) === "TEAM_MEMBER",
    ).length;

    return [
      { name: "Admins", value: adminCount, color: DASHBOARD_COLORS.admin },
      {
        name: "Project Managers",
        value: pmCount,
        color: DASHBOARD_COLORS["project-manager"],
      },
      {
        name: "Team Members",
        value: tmCount,
        color: DASHBOARD_COLORS["team-member"],
      },
      {
        name: "QA Testers",
        value: qaCount,
        color: DASHBOARD_COLORS["qa-tester"] || "#F59E0B",
      },
    ].filter((item) => item.value > 0);
  }, [users]);

  // Memoized monthly activity
  const monthlyActivityData = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();
      const month = date.getMonth();

      const tasksInMonth = isSuperAdmin
        ? 0
        : tasks.filter((task) => {
            const taskDate = new Date(task.createdAt);
            return taskDate.getMonth() === month && taskDate.getFullYear() === year;
          }).length;

      const projectsInMonth = projects.filter((project) => {
        const projectDate = new Date(
          project.createdAt || project.startDate || new Date(),
        );
        return (
          projectDate.getMonth() === month && projectDate.getFullYear() === year
        );
      }).length;

      months.push({
        month: monthName,
        tasks: tasksInMonth,
        projects: projectsInMonth,
      });
    }

    return months;
  }, [isSuperAdmin, projects, tasks]);

  // Memoized team performance data
  const teamPerformanceData = useMemo(() => {
    if (isSuperAdmin) return [];

    return teams
      .map((team) => {
        const teamProjects = projects.filter(
          (p) => p.teamId === team.id || p.team === team.name,
        );
        const teamProjectIds = teamProjects.map((p) => p.id);
        const teamTasks = tasks.filter((t) =>
          teamProjectIds.includes(t.projectId),
        );

        const completedTeamTasks = teamTasks.filter(
          (t) => ["COMPLETED", "DONE"].includes(normalizeValue(t.status)),
        ).length;
        const totalTeamTasks = teamTasks.length;
        const completionRate =
          totalTeamTasks > 0
            ? Math.round((completedTeamTasks / totalTeamTasks) * 100)
            : 0;

        return {
          name: team.name,
          progress: completionRate,
          tasks: totalTeamTasks,
        };
      })
      .slice(0, 5);
  }, [isSuperAdmin, projects, teams, tasks]);

  // Memoized filtered projects (only recalculates when filter or projects change)
  const filteredProjects = useMemo(() => {
    if (filter === "all") return projects;
    if (filter === "active") {
      return projects.filter((p) =>
        ["ACTIVE", "IN_PROGRESS"].includes(normalizeValue(p.status)),
      );
    }
    return projects.filter((p) => normalizeValue(p.status) === normalizeValue(filter));
  }, [projects, filter]);

  const renderWrappedLegend = ({ payload }) => {
    if (!payload?.length) return null;

    return (
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 px-2 text-center">
        {payload.map((entry, index) => (
          <div
            key={`${entry.value}-${index}`}
            className="flex max-w-[120px] items-start gap-2 break-words sm:max-w-[140px]"
          >
            <span
              className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="whitespace-normal break-words leading-tight text-gray-600">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderResponsivePieLabel = ({ name, percent, x, y, textAnchor, fill }) => {
    const labelText = `${name} ${(percent * 100).toFixed(0)}%`;
    const maxCharsPerLine =
      userRoleChartWidth > 430 ? 18 : userRoleChartWidth > 360 ? 14 : 10;
    const words = labelText.split(" ");
    const lines = [];
    let currentLine = "";

    words.forEach((word) => {
      const nextLine = currentLine ? `${currentLine} ${word}` : word;
      if (nextLine.length <= maxCharsPerLine) {
        currentLine = nextLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) lines.push(currentLine);

    return (
        <text
          x={x}
          y={y}
          fill={fill || "#374151"}
          textAnchor={textAnchor}
          fontSize={isLargeScreen ? 12 : 14}
        >
        {lines.map((line, index) => (
          <tspan
            key={`${labelText}-${index}`}
            x={x}
            dy={index === 0 ? 0 : "1.1em"}
          >
            {line}
          </tspan>
        ))}
      </text>
    );
  };

  // Memoized stat cards
  const statCards = useMemo(
    () => [
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
        title: "Completed Projects",
        value: stats.completedProjects,
        icon: "🎉",
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-600",
      },
      {
        title: "Total Tasks",
        value: stats.totalTasks,
        icon: "✅",
        bgColor: "bg-green-50",
        textColor: "text-green-600",
      },
     
      {
        title: "overdue Projects",
        value: stats.overdueProjects,
        icon: "⏰",
        bgColor: "bg-red-50",
        textColor: "text-red-600",
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
      },
    ],
    [stats],
  );

  const visibleStatCards = useMemo(() => {
    if (!isSuperAdmin) return statCards;

    return statCards
      .filter(
        (stat) => stat.title !== "Total Tasks" && stat.title !== "Completed Tasks",
      )
      .map((stat) =>
        stat.title === "Project Managers"
          ? {
              ...stat,
              title: "Total Teams",
              value: stats.totalTeams,
              icon: "ðŸ‘¨",
              bgColor: "bg-cyan-50",
              textColor: "text-cyan-600",
            }
          : stat,
      );
  }, [isSuperAdmin, statCards, stats.totalTeams]);

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
        {visibleStatCards.map((stat, index) => (
          <div
    key={stat.title}  // Better than index
    className={`${stat.bgColor} rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 shadow-sm hover:shadow-md transition-shadow`}
  >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-lg sm:text-xl lg:text-2xl">
                {stat.icon}
              </span>
              <span
                className={`text-xl sm:text-2xl lg:text-3xl font-bold ${stat.textColor}`}
              >
                {stat.value}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
              {stat.title}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4">
        {projectStatusData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Project Status Distribution
            </h2>
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <div className="ml-4">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
                </div>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {!isSuperAdmin && taskStatusData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Task Status Overview
            </h2>
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={taskStatusData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value">
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {userRoleData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg  font-bold text-gray-900 mb-4">
              User Role Distribution
            </h2>
              <div
                ref={userRoleChartRef}
                className={`h-72 sm:h-64 w-full relative p-0.5 ${isLargeScreen ? "text-xs" : "text-base"}`}
              >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userRoleData}
                    cx="50%"
                    cy={isMobile ? "42%" : "50%"}
                    outerRadius={isMobile ? 70 : 60}
                    dataKey="value"
                    labelLine={false}
                    label={
                      isMobile
                        ? false
                        : renderResponsivePieLabel
                    }
                  >
                    {userRoleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconSize={10}
                    content={renderWrappedLegend}
                    wrapperStyle={{
                      fontSize: isLargeScreen ? "12px" : "16px",
                      paddingTop: "12px",
                      textAlign: "center",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {isSuperAdmin ? "Monthly Platform Growth (Last 6 Months)" : "Monthly Activity (Last 6 Months)"}
          </h2>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyActivityData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                {!isSuperAdmin && <YAxis yAxisId="right" orientation="right" />}
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="projects"
                  stroke="#4DA5AD"
                  strokeWidth={2}
                  name="Projects"
                />
                {!isSuperAdmin && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="tasks"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    name="Tasks"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
{!isSuperAdmin && teamPerformanceData.length > 0 && (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
    <h2 className="text-lg font-bold text-gray-900 mb-4">
      Team Performance (Completion Rate)
    </h2>
    <div className="h-80 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={teamPerformanceData}
          margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 12 }}
            interval={0}
          />
          <YAxis 
            domain={[0, 100]} 
            label={{ value: 'Completion Rate (%)', angle: -90, position: 'insideLeft' , offset: -5, fontSize: 12, fill: '#555', bottom: 0}}
          />
          <Tooltip 
            formatter={(value, name) => {
              if (name === 'Completion Rate') return `${value}%`;
              return value;
            }}
          />
          <Legend />
          <Bar 
            dataKey="progress" 
            name="Completion Rate"
            fill="#4DA5AD" 
            radius={[4, 4, 0, 0]}
          >
            {teamPerformanceData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.progress >= 80 ? '#10B981' : entry.progress >= 50 ? '#F59E0B' : '#EF4444'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    {/* Summary stats */}
    <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm pt-4 border-t border-gray-100">
      <div>
        <div className="font-semibold text-gray-900">
          {teamPerformanceData.filter(t => t.progress >= 80).length}
        </div>
        <div className="text-gray-500">High Performing Teams</div>
      </div>
      <div>
        <div className="font-semibold text-gray-900">
          {Math.round(teamPerformanceData.reduce((sum, t) => sum + t.progress, 0) / teamPerformanceData.length)}%
        </div>
        <div className="text-gray-500">Average Completion</div>
      </div>
      <div>
        <div className="font-semibold text-gray-900">
          {teamPerformanceData.reduce((sum, t) => sum + t.tasks, 0)}
        </div>
        <div className="text-gray-500">Total Tasks</div>
      </div>
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
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#194f87]"
          >
            <option value="all">All Status</option>
            <option value="planned">Planned</option>
            <option value="active">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
            <p className="text-sm sm:text-base text-gray-500">
              No projects found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500">
                    Project
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 hidden sm:table-cell">
                    Team
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500">
                    Progress
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 hidden lg:table-cell">
                    Status
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 hidden xl:table-cell">
                    Timeline
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map((project) => {
                  const statusConfig = getStatusConfig(project.status);
                  const completion = getCompletionPercentage(project);
                  return (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-4 lg:px-6 py-4">
                        <div className="font-medium text-gray-900 text-sm">
                          {project.name}
                        </div>
                        {project.description && (
                          <div className="text-xs text-gray-500 truncate max-w-30">
                            {project.description}
                          </div>
                        )}
                        <div className="sm:hidden text-xs text-gray-500 mt-1">
                          Team: {project.teamName || project.team || "N/A"}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 hidden sm:table-cell">
                        <span className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                          {project.teamName || project.team || "N/A"}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-12 sm:w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-[#0f5841] h-1.5 rounded-full"
                              style={{ width: `${completion}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">
                            {completion}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 hidden lg:table-cell">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${statusConfig.color}`}
                        >
                          {statusConfig.icon} {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 hidden xl:table-cell text-xs text-gray-500">
                        {project.startDate} →{" "}
                        {project.dueDate || project.endDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

const DashboardOverview = () => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = user?.role === "super-admin";

  const {
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
  } = useQuery({ queryKey: ["projects"], queryFn: getProjects });

  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({ queryKey: ["users"], queryFn: getUsers });

  const {
    data: teams,
    isLoading: teamsLoading,
    error: teamsError,
  } = useQuery({ queryKey: ["teams"], queryFn: getTeams });

  const {
    data: tasks,
    isLoading: tasksLoading,
    error: tasksError,
  } = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
    enabled: !isSuperAdmin,
  });

  const isLoading =
    projectsLoading || usersLoading || teamsLoading || tasksLoading;
  const error = projectsError || usersError || teamsError || tasksError;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading dashboard data</div>;
  }

  return (
    <DashboardContent
      projects={projects}
      users={users}
      teams={teams}
      tasks={tasks || []}
      isSuperAdmin={isSuperAdmin}
    />
  );
};

export default DashboardOverview;
