// src/pages/manager/Reports.jsx
import React, { useState, useMemo, useCallback } from "react";
import { useLoaderData } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Download,
  Calendar,
  BarChart3,
  Users,
  CheckSquare,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  FolderOpen,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  reportsLoader,
  reportsProjectsQuery,
  reportsTasksQuery,
  reportsTeamsQuery,
  calculateStats,
  calculateTeamPerformance,
  filterDataByDate,
} from "../../loader/manager/Reports.loader";

export { reportsLoader as loader };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safe integer division — returns 0 instead of NaN when denominator is 0 */
const safeDivide = (numerator, denominator) =>
  denominator === 0 ? 0 : Math.round((numerator / denominator) * 100);

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const ReportsSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="space-y-3">
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded mt-2 animate-pulse" />
              </div>
              <div className="flex space-x-2">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="h-10 w-20 bg-gray-200 rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-50 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ReportsError = ({ error, onRetry }) => {
  const message =
    typeof error === "string"
      ? error
      : error?.message || "Unable to load reports data";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Failed to Load Reports
        </h3>
        <p className="text-red-600 mb-6">{message}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// PDF / CSV generation (pure functions, defined outside component)
// ---------------------------------------------------------------------------

const generatePDF = async (reportData) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(15, 88, 65);
  doc.text(reportData.reportName, 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${reportData.generatedAt}`, 14, 32);
  doc.text(
    `Period: ${reportData.dateRange.start} to ${reportData.dateRange.end}`,
    14,
    38,
  );

  // Metrics
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Key Metrics", 14, 48);

  const metricsBody = reportData.metrics.map((m) => [m.label, String(m.value)]);

  autoTable(doc, {
    startY: 52,
    head: [["Metric", "Value"]],
    body: metricsBody,
    theme: "grid",
    headStyles: { fillColor: [15, 88, 65] },
    styles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  });

  // Details — guard against missing lastAutoTable
  if (reportData.details.length > 0 && doc.lastAutoTable) {
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Detailed Breakdown", 14, doc.lastAutoTable.finalY + 10);

    const columnMap = {
      progress: {
        headers: ["Project", "Team", "Status", "Progress"],
        row: (item) => [
          item.name ?? "-",
          item.team ?? "-",
          item.status ?? "-",
          `${item.progress ?? 0}%`,
        ],
      },
      workload: {
        headers: ["Team", "Lead", "Members", "Projects", "Completion"],
        row: (item) => [
          item.name ?? "-",
          item.lead ?? "-",
          String(item.members ?? 0),
          String(item.projects ?? 0),
          `${item.completionRate ?? 0}%`,
        ],
      },
      deadlines: {
        headers: ["Task", "Project", "Due Date", "Status", "Priority"],
        row: (item) => [
          item.name ?? "-",
          item.project ?? "-",
          item.dueDate ?? "-",
          item.status ?? "-",
          item.priority ?? "-",
        ],
      },
      tasks: {
        headers: ["Priority", "Count"],
        row: (item) => [item.label ?? "-", String(item.value ?? 0)],
      },
    };

    const config = columnMap[reportData.reportType];
    if (config) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 14,
        head: [config.headers],
        body: reportData.details.map(config.row),
        theme: "grid",
        headStyles: { fillColor: [15, 88, 65] },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });
    }
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Generated by TaskFlow • Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10,
    );
  }

  doc.save(
    `${reportData.reportType}-report-${
      new Date().toISOString().split("T")[0]
    }.pdf`,
  );
};

const generateCSV = (reportData) => {
  const lines = [
    `Report: ${reportData.reportName}`,
    `Generated: ${reportData.generatedAt}`,
    `Period: ${reportData.dateRange.start} to ${reportData.dateRange.end}`,
    "",
    "METRICS",
    "Metric,Value",
    ...reportData.metrics.map((m) => `${m.label},${m.value}`),
  ];

  if (reportData.details.length > 0) {
    lines.push("", "DETAILED BREAKDOWN");

    // FIX: use reportType (same as PDF) instead of fragile duck-typing
    const csvDetailMap = {
      progress: {
        header: "Project,Team,Status,Progress",
        row: (item) =>
          `${item.name ?? "-"},${item.team ?? "-"},${item.status ?? "-"},${
            item.progress ?? 0
          }%`,
      },
      workload: {
        header:
          "Team,Lead,Members,Projects,Completion Rate,Total Tasks,Completed",
        row: (item) =>
          `${item.name ?? "-"},${item.lead ?? "-"},${item.members ?? 0},${
            item.projects ?? 0
          },${item.completionRate ?? 0}%,${item.totalTasks ?? 0},${
            item.completedTasks ?? 0
          }`,
      },
      deadlines: {
        header: "Task,Project,Due Date,Status,Priority",
        row: (item) =>
          `${item.name ?? "-"},${item.project ?? "-"},${item.dueDate ?? "-"},${
            item.status ?? "-"
          },${item.priority ?? "-"}`,
      },
      tasks: {
        header: "Priority,Count",
        row: (item) => `${item.label ?? "-"},${item.value ?? 0}`,
      },
    };

    const config = csvDetailMap[reportData.reportType];
    if (config) {
      lines.push(config.header);
      reportData.details.forEach((item) => lines.push(config.row(item)));
    }
  }

  return lines.join("\n");
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Expandable workload row
// ---------------------------------------------------------------------------

const WorkloadRow = ({ item, isExpanded, onToggle }) => {
  const completionColor =
    item.completionRate >= 75
      ? "bg-green-500"
      : item.completionRate >= 40
        ? "bg-yellow-400"
        : "bg-red-400";

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-[#0f5841]/10 shrink-0">
            <Users className="w-4 h-4 text-[#0f5841]" />
          </div>
          <div className="min-w-0">
            <span className="font-medium text-gray-800 block truncate">
              {item.name}
            </span>
            <span className="text-xs text-gray-500">
              Lead: {item.lead} &nbsp;·&nbsp; {item.members ?? 0} members
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 ml-3">
          <div className="hidden sm:flex flex-col items-end gap-1">
            <span className="text-xs text-gray-500">
              {item.completedTasks}/{item.totalTasks} tasks
            </span>
            <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${completionColor}`}
                style={{ width: `${item.completionRate}%` }}
              />
            </div>
          </div>
          <span className="font-bold text-[#0f5841] w-12 text-right">
            {item.completionRate}%
          </span>
          <div className="text-gray-400">
            {isExpanded ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-[#0f5841]">
                {item.projects}
              </div>
              <div className="text-xs text-gray-500">Projects</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-700">
                {item.totalTasks}
              </div>
              <div className="text-xs text-gray-500">Total Tasks</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {item.completedTasks}
              </div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
          </div>

          {item.projectBreakdown?.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Projects
              </p>
              <div className="space-y-2">
                {item.projectBreakdown.map((proj) => {
                  const projCompletion =
                    proj.totalTasks > 0
                      ? Math.round(
                          (proj.completedTasks / proj.totalTasks) * 100,
                        )
                      : proj.progress || 0;
                  const projColor =
                    projCompletion >= 75
                      ? "bg-green-500"
                      : projCompletion >= 40
                        ? "bg-yellow-400"
                        : "bg-red-400";
                  return (
                    <div
                      key={proj.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-gray-400 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-gray-700 truncate">
                            {proj.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                              proj.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : proj.status === "active" ||
                                    proj.status === "in-progress"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {proj.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${projColor}`}
                              style={{ width: `${projCompletion}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 shrink-0">
                            {proj.completedTasks}/{proj.totalTasks} tasks
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-2">
              No projects assigned to this team
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const Reports = () => {
  const loaderData = useLoaderData();
  const queryClient = useQueryClient();

  const [selectedReport, setSelectedReport] = useState("progress");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [downloading, setDownloading] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState(null);

  // React Query — seed with loader data so the page is never blank
  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsError,
  } = useQuery({
    ...reportsProjectsQuery(),
    initialData: loaderData?.projects,
  });

  const {
    data: tasksData,
    isLoading: tasksLoading,
    error: tasksError,
  } = useQuery({ ...reportsTasksQuery(), initialData: loaderData?.tasks });

  const {
    data: teamsData,
    isLoading: teamsLoading,
    error: teamsError,
  } = useQuery({ ...reportsTeamsQuery(), initialData: loaderData?.teams });

  const isLoading = projectsLoading || tasksLoading || teamsLoading;
  const hasError = projectsError || tasksError || teamsError;

  // FIX: invalidate queries instead of hard-reloading the page
  const handleRetry = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  const safeProjects = useMemo(
    () => (Array.isArray(projectsData) ? projectsData : []),
    [projectsData],
  );
  const safeTasks = useMemo(
    () => (Array.isArray(tasksData) ? tasksData : []),
    [tasksData],
  );
  const safeTeams = useMemo(
    () => (Array.isArray(teamsData) ? teamsData : []),
    [teamsData],
  );

  const stats = useMemo(
    () => calculateStats(safeProjects, safeTasks, safeTeams),
    [safeProjects, safeTasks, safeTeams],
  );
  const teamPerformance = useMemo(
    () => calculateTeamPerformance(safeTeams, safeProjects, safeTasks),
    [safeTeams, safeProjects, safeTasks],
  );
  const filteredData = useMemo(
    () => filterDataByDate(safeProjects, safeTasks, dateRange),
    [safeProjects, safeTasks, dateRange],
  );

  // FIX: memoize the reports array so getMetrics/getDetails don't recreate
  // on every render, and so they always close over the latest derived values.
  const reports = useMemo(
    () => [
      {
        id: "progress",
        name: "Project Progress Report",
        description: "Detailed progress of all projects",
        icon: <BarChart3 className="w-5 h-5" />,
        getMetrics: () => [
          { label: "Total Projects", value: stats.totalProjects },
          { label: "Active Projects", value: stats.activeProjects },
          { label: "Completed Projects", value: stats.completedProjects },
          { label: "Overall Progress", value: `${stats.overallProgress}%` },
        ],
        getDetails: () =>
          filteredData.projects
            .map((p) => ({
              name: p.name,
              team: p.teamName || p.team?.name || "Unassigned",
              status: p.status,
              progress: p.progress || 0,
              tasks: p.tasks?.total || 0,
            }))
            .slice(0, 10),
      },
      {
        id: "tasks",
        name: "Task Completion Report",
        description: "Task completion rates and performance",
        icon: <CheckSquare className="w-5 h-5" />,
        getMetrics: () => [
          { label: "Total Tasks", value: stats.totalTasks },
          { label: "Completed Tasks", value: stats.completedTasks },
          { label: "In Progress", value: stats.inProgressTasks },
          { label: "Pending", value: stats.pendingTasks },
        ],
        getDetails: () => {
          const priorityCounts = {
            high: filteredData.tasks.filter(
              (t) => t.priority === "high" || t.priority === "critical",
            ).length,
            medium: filteredData.tasks.filter((t) => t.priority === "medium")
              .length,
            low: filteredData.tasks.filter((t) => t.priority === "low").length,
          };
          return [
            {
              label: "High Priority",
              value: priorityCounts.high,
              color: "red",
            },
            {
              label: "Medium Priority",
              value: priorityCounts.medium,
              color: "yellow",
            },
            {
              label: "Low Priority",
              value: priorityCounts.low,
              color: "green",
            },
          ];
        },
      },
      {
        id: "workload",
        name: "Team Workload Report",
        description: "Team member workload and distribution",
        icon: <Users className="w-5 h-5" />,
        getMetrics: () => {
          const totalTeams = teamPerformance.length;
          const avgPerformance = totalTeams
            ? Math.round(
                teamPerformance.reduce(
                  (sum, t) => sum + (t.completionRate || 0),
                  0,
                ) / totalTeams,
              )
            : 0;
          const totalMembers = teamPerformance.reduce(
            (sum, t) => sum + (t.memberCount || 0),
            0,
          );
          const totalTeamProjects = teamPerformance.reduce(
            (sum, t) => sum + (t.projects || 0),
            0,
          );
          return [
            { label: "Total Teams", value: totalTeams },
            { label: "Avg Completion Rate", value: `${avgPerformance}%` },
            { label: "Team Members", value: totalMembers },
            { label: "Team Projects", value: totalTeamProjects },
          ];
        },
        // FIX: cap workload details to prevent unbounded list
        getDetails: () =>
          teamPerformance
            .map((t) => {
              // Build per-project breakdown for the expanded panel
              const teamProjects = safeProjects.filter(
                (p) => p.teamId === t.id || p.teamName === t.name,
              );
              const projectBreakdown = teamProjects.map((p) => {
                const projTasks = safeTasks.filter(
                  (tk) => tk.projectId === p.id,
                );
                const completedTasks = projTasks.filter(
                  (tk) => tk.status === "completed",
                ).length;
                return {
                  id: p.id,
                  name: p.name,
                  status: p.status,
                  progress: p.progress || 0,
                  totalTasks: projTasks.length,
                  completedTasks,
                };
              });

              return {
                id: t.id,
                name: t.name,
                lead: t.lead,
                members: t.memberCount,
                projects: t.projects,
                completionRate: t.completionRate,
                totalTasks: t.totalTasks,
                completedTasks: t.completedTasks,
                projectBreakdown,
              };
            })
            .slice(0, 10),
      },
      {
        id: "deadlines",
        name: "Deadline Overview",
        description: "Upcoming and overdue deadlines",
        icon: <Clock className="w-5 h-5" />,
        getMetrics: () => [
          { label: "Overdue Tasks", value: stats.overdueTasks },
          { label: "Upcoming Deadlines", value: stats.upcomingDeadlines },
          { label: "Total Tasks", value: stats.totalTasks },
          // FIX: use safeDivide to prevent NaN
          {
            label: "Completion Rate",
            value: `${safeDivide(stats.completedTasks, stats.totalTasks)}%`,
          },
        ],
        getDetails: () => {
          const now = new Date();
          return filteredData.tasks
            .filter(
              (t) => (t.rawDueDate || t.dueDate) && t.status !== "completed",
            )
            .map((t) => {
              const dueDateValue = t.rawDueDate ?? t.dueDate;
              const dueDate = dueDateValue ? new Date(dueDateValue) : null;
              return {
                name: t.title,
                project: t.projectName || t.project?.name || "Unknown",
                dueDate: dueDate
                  ? dueDate.toLocaleDateString()
                  : t.dueDate || "Unknown",
                status: dueDate && dueDate < now ? "overdue" : "upcoming",
                priority: t.priority || "medium",
              };
            })
            .sort((a, b) => {
              if (a.status === "overdue" && b.status !== "overdue") return -1;
              if (a.status !== "overdue" && b.status === "overdue") return 1;
              return 0;
            })
            .slice(0, 10);
        },
      },
    ],

    [stats, teamPerformance, filteredData, safeProjects, safeTasks],
  );

  const currentReport = reports.find((r) => r.id === selectedReport);
  const metrics = currentReport?.getMetrics() ?? [];
  const details = currentReport?.getDetails?.() ?? [];

  const handleDownload = useCallback(
    async (format) => {
      setDownloading(true);
      try {
        const reportData = {
          reportType: selectedReport,
          reportName: currentReport?.name ?? "",
          dateRange,
          generatedAt: new Date().toLocaleString(),
          metrics: currentReport?.getMetrics() ?? [],
          details: currentReport?.getDetails?.() ?? [],
        };

        const fmt = format.toLowerCase();

        if (fmt === "pdf") {
          await generatePDF(reportData);
        } else if (fmt === "csv" || fmt === "excel") {
          // FIX: wrapped in a block scope to avoid lexical-declaration error
          const csv = generateCSV(reportData);
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${selectedReport}-report-${
            new Date().toISOString().split("T")[0]
          }.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          // FIX: defer revoke so the browser has time to start the download
          setTimeout(() => URL.revokeObjectURL(url), 150);
        }
      } catch (err) {
        console.error("Error generating report:", err);
        alert("Failed to generate report. Please try again.");
      } finally {
        setDownloading(false);
      }
    },
    [selectedReport, currentReport, dateRange],
  );

  // Show skeleton only when there is truly no data at all
  if (isLoading && !loaderData?.projects && !loaderData?.tasks) {
    return <ReportsSkeleton />;
  }

  if (hasError && !loaderData?.projects && !loaderData?.tasks) {
    return (
      <ReportsError
        error={projectsError ?? tasksError ?? teamsError}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Reports &amp; Analytics
            </h1>
            <p className="text-gray-600">
              Generate and download project reports
            </p>
          </div>
          {filteredData.taskStats && (
            <div className="px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-600">
              {filteredData.taskStats.total} tasks in period
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="space-y-6">
            {/* Date Range */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-[#0f5841]" />
                Date Range
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#0f5841] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, end: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#0f5841] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Report Types */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Report Types</h3>
              <div className="space-y-2">
                {reports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedReport === report.id
                        ? "bg-[#0f5841]/10 border border-[#0f5841] shadow-sm"
                        : "border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`p-2 rounded-lg mr-3 ${
                          selectedReport === report.id
                            ? "bg-[#0f5841] text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {report.icon}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {report.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {report.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Report Header */}
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {currentReport?.name}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Generated: {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {["PDF", "CSV"].map((format) => (
                    <button
                      key={format}
                      onClick={() => handleDownload(format)}
                      disabled={downloading}
                      className="px-4 py-2 bg-[#0f5841] text-white rounded-lg hover:bg-[#0a4030] transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                      {downloading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {metrics.map((metric, i) => (
                  <div
                    key={i}
                    className="text-center p-4 bg-gray-50 rounded-lg hover:shadow-sm transition"
                  >
                    <div className="text-2xl font-bold text-[#0f5841]">
                      {metric.value}
                    </div>
                    <div className="text-sm text-gray-600">{metric.label}</div>
                  </div>
                ))}
              </div>

              {/* Detailed Breakdown */}
              {details.length > 0 ? (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Detailed Breakdown
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedReport === "workload"
                      ? details.map((item) => (
                          <WorkloadRow
                            key={item.id ?? item.name}
                            item={item}
                            isExpanded={
                              expandedTeamId === (item.id ?? item.name)
                            }
                            onToggle={() =>
                              setExpandedTeamId((prev) =>
                                prev === (item.id ?? item.name)
                                  ? null
                                  : (item.id ?? item.name),
                              )
                            }
                          />
                        ))
                      : details.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                          >
                            <div className="flex-1">
                              <span className="font-medium text-gray-700">
                                {item.name || item.label || item.title}
                              </span>
                              {item.team && (
                                <span className="text-sm text-gray-500 ml-2">
                                  ({item.team})
                                </span>
                              )}
                              {item.project && (
                                <span className="text-sm text-gray-500 ml-2">
                                  • {item.project}
                                </span>
                              )}
                              {item.dueDate && (
                                <span className="text-sm text-gray-500 ml-2">
                                  • Due: {item.dueDate}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {item.status && (
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    item.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : item.status === "active"
                                        ? "bg-blue-100 text-blue-800"
                                        : item.status === "overdue"
                                          ? "bg-red-100 text-red-800"
                                          : item.status === "upcoming"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              )}
                              {item.priority && (
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    item.priority === "high" ||
                                    item.priority === "critical"
                                      ? "bg-red-100 text-red-800"
                                      : item.priority === "medium"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {item.priority}
                                </span>
                              )}
                              <span className="font-bold text-[#0f5841]">
                                {item.progress !== undefined
                                  ? `${item.progress}%`
                                  : item.completionRate !== undefined
                                    ? `${item.completionRate}%`
                                    : item.value}
                              </span>
                            </div>
                          </div>
                        ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No data available for this report
                  </p>
                  <p className="text-sm text-gray-400">
                    Try adjusting the date range
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
