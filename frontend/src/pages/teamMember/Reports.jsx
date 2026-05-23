import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  Download,
  FileText,
  Printer,
  Share2,
  TrendingUp,
} from "lucide-react";
import ReactDOMServer from "react-dom/server";
import PrintReport from "../../Component/teamMember/PrintReport";
import { useAuth } from "../../context/AuthContext";
import { myTasksQuery } from "../../features/tasks/taskShared";

const getTaskActivityDate = (task) =>
  parseDate(
    task?.rawUpdatedAt ||
      task?.rawCreatedAt ||
      task?.rawDueDate ||
      task?.updatedAt ||
      task?.createdAt ||
      task?.dueDate,
  );

const parseDate = (value) => {
  if (!value) return null;

  try {
    if (typeof value === "string" && value.includes("/")) {
      const parts = value.split("/");
      if (parts.length === 3) {
        const [first, second, third] = parts.map((part) => Number(part));
        if ([first, second, third].every(Number.isFinite)) {
          // Support both locale-style MM/DD/YYYY and DD/MM/YYYY inputs.
          const mmdd = new Date(third, first - 1, second);
          if (!Number.isNaN(mmdd.getTime())) return mmdd;

          const ddmm = new Date(third, second - 1, first);
          if (!Number.isNaN(ddmm.getTime())) return ddmm;
        }
      }
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

const isTaskCompleted = (task) =>
  ["completed", "passed"].includes(task?.status);

const TeamMemberReports = () => {
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState("month");

  const {
    data: tasks = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...myTasksQuery(),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { filteredTasks, reportData, weeklyPerformance, monthlyPerformance, projects } =
    useMemo(() => {
      const now = new Date();
      const filtered = tasks.filter((task) => {
        const taskDate = getTaskActivityDate(task);
        if (!taskDate) return true;

        if (timePeriod === "week") {
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          return taskDate >= weekAgo;
        }

        if (timePeriod === "month") {
          const monthAgo = new Date(now);
          monthAgo.setMonth(now.getMonth() - 1);
          return taskDate >= monthAgo;
        }

        if (timePeriod === "year") {
          const yearAgo = new Date(now);
          yearAgo.setFullYear(now.getFullYear() - 1);
          return taskDate >= yearAgo;
        }

        return true;
      });

      const completed = filtered.filter((task) => isTaskCompleted(task));
      const inProgress = filtered.filter((task) =>
        ["in-progress", "in-test", "pending-retest", "failed"].includes(
          task.status,
        ),
      );
      const pending = filtered.filter((task) => task.status === "pending");

      const overdueCount = filtered.filter((task) => {
        if (isTaskCompleted(task)) return false;

        const dueDate = parseDate(task.rawDueDate || task.dueDate);
        if (!dueDate) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      }).length;

      const onTimeCompleted = completed.filter((task) => {
        const dueDate = parseDate(task.rawDueDate || task.dueDate);
        const finishedDate = parseDate(task.rawUpdatedAt || task.updatedAt);
        if (!dueDate || !finishedDate) return true;
        return finishedDate <= dueDate;
      }).length;

      const weekly = [];
      for (let i = 0; i < 4; i += 1) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() - 7 * i);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const weekTasks = filtered.filter((task) => {
          const taskDate = getTaskActivityDate(task);
          return taskDate && taskDate >= weekStart && taskDate <= weekEnd;
        });

        const weekCompleted = weekTasks.filter((task) => isTaskCompleted(task)).length;
        weekly.push({
          week: `Week ${4 - i}`,
          tasks: weekTasks.length,
          completed: weekCompleted,
          efficiency: weekTasks.length
            ? Math.round((weekCompleted / weekTasks.length) * 100)
            : 0,
        });
      }

      const monthly = Array.from({ length: 12 }, (_, index) => {
        const monthTasks = filtered.filter((task) => {
          const taskDate = getTaskActivityDate(task);
          return (
            taskDate &&
            taskDate.getMonth() === index &&
            taskDate.getFullYear() === now.getFullYear()
          );
        });

        return {
          month: new Date(now.getFullYear(), index, 1).toLocaleString("en-US", {
            month: "short",
          }),
          tasks: monthTasks.length,
          completed: monthTasks.filter((task) => isTaskCompleted(task)).length,
        };
      }).filter((month) => month.tasks > 0);

      const projectMap = filtered.reduce((accumulator, task) => {
        const name = task.projectName || task.project?.name || "Individual Tasks";

        if (!accumulator[name]) {
          accumulator[name] = {
            name,
            total: 0,
            completed: 0,
            inProgress: 0,
            pending: 0,
          };
        }

        accumulator[name].total += 1;
        if (isTaskCompleted(task)) {
          accumulator[name].completed += 1;
        } else if (task.status === "in-progress") {
          accumulator[name].inProgress += 1;
        } else {
          accumulator[name].pending += 1;
        }

        return accumulator;
      }, {});

      const projectList = Object.values(projectMap)
        .map((project) => ({
          ...project,
          rate: project.total
            ? Math.round((project.completed / project.total) * 100)
            : 0,
        }))
        .sort((a, b) => b.total - a.total);

      return {
        filteredTasks: filtered,
        reportData: {
          totalTasks: filtered.length,
          completedCount: completed.length,
          pendingCount: pending.length,
          inProgressCount: inProgress.length,
          overdueCount,
          efficiency: filtered.length
            ? Math.round((completed.length / filtered.length) * 100)
            : 0,
          onTimeDelivery: completed.length
            ? Math.round((onTimeCompleted / completed.length) * 100)
            : 0,
        },
        weeklyPerformance: weekly.reverse().filter((week) => week.tasks > 0),
        monthlyPerformance: monthly,
        projects: projectList,
      };
    }, [tasks, timePeriod]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const printContent = ReactDOMServer.renderToString(
      <PrintReport
        reportData={reportData}
        weeklyPerformance={weeklyPerformance}
        projects={projects}
        timePeriod={timePeriod}
      />,
    );

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const exportToExcel = () => {
    const rows = [
      ["TASK PERFORMANCE REPORT"],
      [`Generated: ${new Date().toLocaleString()}`],
      [
        `Time Period: Last ${
          timePeriod === "week"
            ? "7 Days"
            : timePeriod === "month"
              ? "30 Days"
              : "12 Months"
        }`,
      ],
      [""],
      ["KEY METRICS"],
      ["Metric", "Value", "Target", "Status"],
      ["Total Tasks", reportData.totalTasks, "-", "-"],
      ["Completed", reportData.completedCount, "-", "-"],
      ["In Progress", reportData.inProgressCount, "-", "-"],
      ["Overdue", reportData.overdueCount, "-", "-"],
      [
        "Completion Rate",
        `${reportData.efficiency}%`,
        "80%",
        reportData.efficiency >= 80 ? "On Track" : "Behind",
      ],
      [
        "On-time Delivery",
        `${reportData.onTimeDelivery}%`,
        "90%",
        reportData.onTimeDelivery >= 90 ? "Excellent" : "Needs Work",
      ],
      [""],
      ["WEEKLY PERFORMANCE"],
      ["Week", "Tasks", "Completed", "Efficiency"],
      ...weeklyPerformance.map((week) => [
        week.week,
        week.tasks,
        week.completed,
        `${week.efficiency}%`,
      ]),
      [""],
      ["PROJECT BREAKDOWN"],
      ["Project", "Total Tasks", "Completed", "In Progress", "Pending", "Completion Rate"],
      ...projects.map((project) => [
        project.name,
        project.total,
        project.completed,
        project.inProgress,
        project.pending,
        `${project.rate}%`,
      ]),
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `task-report-${timePeriod}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-500 mb-4">
          {error?.message || "Failed to fetch tasks"}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            My Performance Reports
          </h1>
          <p className="text-gray-500">
            Real-time analytics from your actual task data
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={timePeriod}
            onChange={(event) => setTimePeriod(event.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-[#4DA5AD]"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last 12 Months</option>
          </select>
          <button
            onClick={handlePrint}
            className="bg-[#4DA5AD] text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-[#3e868d] transition-colors"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={exportToExcel}
            className="border border-gray-300 bg-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks"
          value={reportData.totalTasks}
          icon={FileText}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          title="Completed"
          value={reportData.completedCount}
          icon={CheckCircle}
          color="text-green-600"
          bg="bg-green-50"
        />
        <StatCard
          title="In Progress"
          value={reportData.inProgressCount}
          icon={TrendingUp}
          color="text-yellow-600"
          bg="bg-yellow-50"
        />
        <StatCard
          title="Overdue"
          value={reportData.overdueCount}
          icon={AlertCircle}
          color="text-red-600"
          bg="bg-red-50"
        />
      </div>

      {!filteredTasks.length ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center shadow-sm">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No report data yet
          </h2>
          <p className="text-gray-500">
            Your reports will appear here once you have assigned tasks.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReportCard
              title="Weekly Performance"
              icon={<Calendar className="w-4 h-4 text-gray-400" />}
            >
              {weeklyPerformance.length > 0 ? (
                weeklyPerformance.map((week) => (
                  <div
                    key={week.week}
                    className="p-4 border border-gray-100 rounded-xl mb-2 hover:shadow-sm transition"
                  >
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-bold">{week.week}</span>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          week.efficiency >= 75
                            ? "bg-green-100 text-green-700"
                            : week.efficiency >= 50
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {week.efficiency}% efficiency
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500 mb-3">
                      <span>
                        Tasks: <b className="text-gray-900">{week.tasks}</b>
                      </span>
                      <span>
                        Completed:{" "}
                        <b className="text-gray-900">{week.completed}</b>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#4DA5AD] h-full transition-all duration-500"
                        style={{
                          width: `${(week.completed / (week.tasks || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No weekly data available
                </p>
              )}
            </ReportCard>

            <ReportCard title="Project Breakdown">
              {projects.length > 0 ? (
                projects.slice(0, 5).map((project) => (
                  <div key={project.name} className="space-y-2 mb-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {project.name}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                          <span className="text-green-600">
                            Done: {project.completed}
                          </span>
                          <span className="text-blue-600">
                            Active: {project.inProgress}
                          </span>
                          <span className="text-yellow-600">
                            Pending: {project.pending}
                          </span>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-[#4DA5AD]">
                        {project.rate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#4DA5AD] h-full transition-all duration-1000 rounded-full"
                        style={{ width: `${project.rate}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No project data available
                </p>
              )}
            </ReportCard>
          </div>

          {monthlyPerformance.length > 0 && (
            <ReportCard title="Monthly Performance">
              <div className="grid grid-cols-6 gap-2 mt-4">
                {monthlyPerformance.map((month) => (
                  <div key={month.month} className="text-center">
                    <div className="text-xs font-medium text-gray-500 mb-2">
                      {month.month}
                    </div>
                    <div className="flex flex-col items-center">
                      <div
                        className="w-full bg-[#4DA5AD] rounded-t-lg transition-all duration-500 hover:bg-[#2D4A6B] relative group"
                        style={{
                          height: `${Math.max(
                            (month.tasks /
                              Math.max(
                                ...monthlyPerformance.map((item) => item.tasks),
                              )) *
                              100,
                            4,
                          )}px`,
                          minHeight: "20px",
                        }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                          {month.tasks} tasks
                        </div>
                      </div>
                      <div className="text-xs font-bold mt-2">{month.tasks}</div>
                      <div className="text-xs text-gray-400">tasks</div>
                    </div>
                  </div>
                ))}
              </div>
            </ReportCard>
          )}

          <ReportCard
            title="Performance Metrics"
            actions={[
              <button
                key="share"
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                title="Share"
                onClick={() =>
                  navigator.clipboard
                    .writeText(window.location.href)
                    .then(() => alert("Link copied!"))
                }
              >
                <Share2 className="w-4 h-4" />
              </button>,
            ]}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Metric</th>
                    <th className="px-6 py-4 font-semibold">Your Value</th>
                    <th className="px-6 py-4 font-semibold">Target</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  <TableRow
                    label="Task Completion Rate"
                    value={`${reportData.efficiency}%`}
                    target="80%"
                    status={
                      reportData.efficiency >= 80 ? "On Track" : "Behind"
                    }
                    isPositive={reportData.efficiency >= 80}
                  />
                  <TableRow
                    label="On-time Delivery"
                    value={`${reportData.onTimeDelivery}%`}
                    target="90%"
                    status={
                      reportData.onTimeDelivery >= 90
                        ? "Excellent"
                        : "Needs Work"
                    }
                    isPositive={reportData.onTimeDelivery >= 90}
                  />
                </tbody>
              </table>
            </div>
          </ReportCard>

         
        </>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
    <div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
    <div className={`p-3 rounded-lg ${bg}`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
  </div>
);

const TableRow = ({ label, value, target, status, isPositive }) => (
  <tr className="hover:bg-gray-50/50 transition">
    <td className="px-6 py-4 font-medium text-gray-900">{label}</td>
    <td className="px-6 py-4 font-medium">{value}</td>
    <td className="px-6 py-4 text-gray-400">{target}</td>
    <td className="px-6 py-4">
      <span
        className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
          isPositive
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
        }`}
      >
        {status}
      </span>
    </td>
  </tr>
);

const ExportCard = ({ title, desc, icon: Icon, color, onClick }) => (
  <button
    onClick={onClick}
    className="p-6 border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all flex flex-col items-center text-center group"
  >
    <Icon
      className={`w-10 h-10 ${color} mb-3 group-hover:scale-110 transition-transform`}
    />
    <span className="font-bold text-gray-900">{title}</span>
    <span className="text-xs text-gray-500 mt-1">{desc}</span>
  </button>
);

const ReportCard = ({ title, children, icon, actions }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
    <div className="flex justify-between items-center mb-4">
      <h2 className="font-bold text-gray-900 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <div className="flex gap-2">{actions}</div>
    </div>
    {children}
  </div>
);

export default TeamMemberReports;
