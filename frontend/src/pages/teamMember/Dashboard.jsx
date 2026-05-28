// src/pages/teamMember/Dashboard.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { getMyTasks } from "../../services/tasksService";
import {
  CheckSquare,
  AlertCircle,
  TrendingUp,
  FileText,
  PlayCircle,
  CheckCircle,
  Users,
  Award,
  Search,
  User,
  Loader2,
} from "lucide-react";
import {
  calculateTeamMemberTaskStats,
  formatDate,
  getTeamMemberTaskProgress,
  getPriorityColor,
  getStatusColor,
  isTaskDueWithinDays,
  isTaskOverdue,
  myTasksQuery,
} from "./taskShared";
import DashboardWelcomeBanner from "../../Component/dashboard/DashboardWelcomeBanner";
import DashboardSkeleton from "../../Component/dashboard/DashboardSkeleton";
import DashboardError from "../../Component/dashboard/DashboardError";
import DashboardStatCard from "../../Component/dashboard/DashboardStatCard";

// 3. LOADER (React Router v7)

export async function teamMemberDashboardLoader() {
  console.log("🔄 Loading team member dashboard...");

  try {
    const tasks = await getMyTasks();
    return { tasks: Array.isArray(tasks) ? tasks : [] };
  } catch (error) {
    console.error("Error loading dashboard:", error);
    return { tasks: [], error: error.message };
  }
}

//  5. MAIN COMPONENT

const TeamMemberDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Use React Query for tasks
  const {
    data: tasks = [],
    isLoading,
    error,
    refetch: refetchTasks,
  } = useQuery({
    ...myTasksQuery(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Employee data from auth context
  const employee = useMemo(() => {
    if (!user) return null;
    const teamName =
      typeof user.team === "object" && user.team !== null
        ? user.team.name
        : user.team;

    return {
      id: user.id,
      name: user.name,
      role: user.role,
      avatar: user.name?.[0] || "U",
      teamId: user.teamId,
      team: teamName || "Engineering Team",
      email: user.email,
      joinDate: user.joinDate,
      efficiency: 95,
    };
  }, [user]);

  // Calculate stats
  const stats = useMemo(
    () => calculateTeamMemberTaskStats(tasks, employee?.efficiency || 95),
    [tasks, employee],
  );

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (statusFilter !== "all") {
      result = result.filter((task) => task.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          (task.projectName || "").toLowerCase().includes(query),
      );
    }

    return result;
  }, [tasks, searchQuery, statusFilter]);

  // Helper functions using filtered tasks
  const getUpcomingDeadlines = () => {
    return filteredTasks
      .filter((task) => isTaskDueWithinDays(task, 7))
      .slice(0, 3);
  };

  // Show skeleton immediately while loading
  if (isLoading && tasks.length === 0) {
    return <DashboardSkeleton />;
  }

  // Show error state
  if (error && tasks.length === 0) {
    return <DashboardError error={error} onRetry={refetchTasks} />;
  }

  if (!employee) {
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
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <DashboardWelcomeBanner
        title={`Welcome back, ${employee.name}!`}
        subtitle="Your personal task overview and productivity metrics"
        metaItems={[
          { icon: Users, label: employee.team },
          { icon: Award, label: `Efficiency: ${stats.efficiency}%` },
        ]}
        summaryTitle="Tasks Completed"
        summaryValue={`${stats.completedTasks}/${stats.totalTasks}`}
        summarySubtitle={`${stats.completionRate}% completion rate`}
        accentIcon={TrendingUp}
      />

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "in-progress", "completed"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg transition ${
                statusFilter === status
                  ? "bg-[#4DA5AD] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent w-full sm:w-64"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          title="Assigned Tasks"
          value={stats.totalTasks}
          icon={CheckSquare}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />
        <DashboardStatCard
          title="Completed"
          value={stats.completedTasks}
          icon={CheckCircle}
          iconBg="bg-green-50"
          iconColor="text-green-500"
        />
        <DashboardStatCard
          title="In Progress"
          value={stats.inProgressTasks}
          icon={PlayCircle}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />
        <DashboardStatCard
          title="Overdue"
          value={stats.overdueTasks}
          icon={AlertCircle}
          iconBg="bg-red-50"
          iconColor="text-red-500"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                My Tasks ({filteredTasks.length})
              </h2>
            </div>

            <div className="space-y-4">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  return (
                    <div
                      key={task.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {task.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {task.projectName || "No Project"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}
                          >
                            {task.status}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Due:{" "}
                          {formatDate(
                            task.dueDate || task.deadline,
                            "No deadline",
                          )}
                          {isTaskOverdue(task) && (
                            <span className="ml-2 text-red-600 font-medium">
                              (Overdue!)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No tasks found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Info */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Upcoming Deadlines
            </h2>
            <div className="space-y-3">
              {getUpcomingDeadlines().map((task) => (
                <div
                  key={task.id}
                  className="p-3 border border-gray-200 rounded-lg"
                >
                  {(() => {
                    const taskProgress = getTeamMemberTaskProgress(task);
                    return (
                      <>
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {task.title}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span>
                            Due:{" "}
                            {formatDate(
                              task.dueDate || task.deadline,
                              "No deadline",
                            )}
                          </span>
                          <span>{taskProgress}%</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ))}

              {getUpcomingDeadlines().length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No upcoming deadlines
                </p>
              )}
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Performance Summary
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Task Completion Rate</span>
                  <span className="font-medium">{stats.completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.completionRate}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Tasks In Progress</span>
                  <span className="font-medium">{stats.inProgressTasks}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${stats.totalTasks ? Math.round((stats.inProgressTasks / stats.totalTasks) * 100) : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span>Pending Tasks</span>
                  <span className="font-medium">{stats.pendingTasks}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-[#4DA5AD]/10 to-[#2D4A6B]/10 rounded-xl border border-[#4DA5AD]/20 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate("/team-member/tasks")}
                className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center"
              >
                <CheckSquare className="w-5 h-5 text-[#4DA5AD] mb-1" />
                <span className="text-xs font-medium">View Tasks</span>
              </button>
              <button
                onClick={() => navigate("/team-member/progress")}
                className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center"
              >
                <TrendingUp className="w-5 h-5 text-[#4DA5AD] mb-1" />
                <span className="text-xs font-medium">Progress</span>
              </button>
              <button
                onClick={() => navigate("/team-member/reports")}
                className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center"
              >
                <FileText className="w-5 h-5 text-[#4DA5AD] mb-1" />
                <span className="text-xs font-medium">Reports</span>
              </button>
              <button
                onClick={() => navigate("/team-member/profile")}
                className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center"
              >
                <User className="w-5 h-5 text-[#4DA5AD] mb-1" />
                <span className="text-xs font-medium">Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberDashboard;
