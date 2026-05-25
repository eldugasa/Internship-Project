import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useLoaderData, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Download,
  Edit,
  Eye,
  Filter,
  FolderKanban,
  Grid3x3,
  List,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  SortAsc,
  SortDesc,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { deleteProject } from "../../services/projectsService";
import { useAuth } from "../../context/AuthContext";
import {
  getProjectCreatePath,
  getProjectDetailsPath,
  getProjectEditPath,
  isAdminProjectsView,
  resolveCanManageProjects,
} from "./projectAccess";
import {
  calculateStats,
  formatDate,
  invalidateProjectsQueries,
  isAtRisk,
  isOverdue,
  parseDate,
  projectsQuery,
} from "../../loader/manager/Projects.loader";

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  onClick,
  loading,
}) => (
  <div
    onClick={onClick}
    className={`${bgColor} rounded-xl border border-gray-200/50 p-4 transition-all ${onClick ? "cursor-pointer hover:scale-105 hover:shadow-md" : ""}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {loading ? (
          <div className="mt-1 h-8 w-16 animate-pulse rounded bg-gray-200" />
        ) : (
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        )}
      </div>
      <div className={`${color} rounded-lg p-3 text-white shadow-lg`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const ProjectsSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="rounded-xl bg-white p-4">
            <div className="mb-2 h-12 w-12 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-6 w-12 animate-pulse rounded bg-gray-200" />
            <div className="mt-1 h-4 w-20 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="h-10 flex-1 animate-pulse rounded bg-gray-200" />
          <div className="flex gap-3">
            <div className="h-10 w-32 animate-pulse rounded bg-gray-200" />
            <div className="h-10 w-32 animate-pulse rounded bg-gray-200" />
            <div className="h-10 w-24 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-3 h-6 w-32 animate-pulse rounded bg-gray-200" />
            <div className="mb-4 h-4 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-2 w-full animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ProjectsError = ({ error, onRetry }) => {
  const message = error?.message || error || "Unable to load projects";
  const isAuthError =
    message.toLowerCase().includes("auth") ||
    message.toLowerCase().includes("login") ||
    message.toLowerCase().includes("401");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <h3 className="mb-2 text-lg font-semibold text-red-800">
          {isAuthError ? "Authentication Required" : "Failed to Load Projects"}
        </h3>
        <p className="mb-6 text-red-600">{message}</p>
        <button
          onClick={onRetry}
          className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
        >
          {isAuthError ? "Go to Login" : "Retry"}
        </button>
      </div>
    </div>
  );
};

const ProjectCard = ({
  canManageProjects,
  getStatusBadge,
  index,
  onDelete,
  onEdit,
  onView,
  project,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const overdue = isOverdue(project);
  const atRisk = isAtRisk(project);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest(".project-menu-container")) {
        setShowMenu(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showMenu]);

  const getProgressColor = (progress) => {
    if (progress >= 80) return "from-green-500 to-emerald-600";
    if (progress >= 50) return "from-[#0f5841] to-[#194f87]";
    if (progress >= 20) return "from-yellow-500 to-orange-600";
    return "from-red-500 to-red-600";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.28, delay: index * 0.08, ease: "easeOut" }}
      className="group rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg"
    >
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-[#0f5841]" />
              <h3 className="line-clamp-1 text-lg font-bold text-gray-900">
                {project.name}
              </h3>
            </div>
            {project.description && (
              <p className="line-clamp-2 text-sm text-gray-500">
                {project.description}
              </p>
            )}
          </div>

          {canManageProjects && (
            <div className="project-menu-container relative">
              <button
                onClick={() => setShowMenu((value) => !value)}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100"
              >
                <MoreVertical className="h-5 w-5 text-gray-500" />
              </button>
              {showMenu && (
                <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <button
                    onClick={() => {
                      onView();
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4" /> View Details
                  </button>
                  <button
                    onClick={() => {
                      onEdit();
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4" /> Edit Project
                  </button>
                  <button
                    onClick={() => {
                      onDelete(project.id);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" /> Delete Project
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {getStatusBadge(project.status)}
          {overdue && (
            <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" /> Overdue
            </span>
          )}
          {atRisk && !overdue && (
            <span className="flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-xs text-yellow-600">
              <AlertTriangle className="h-3 w-3" /> At Risk
            </span>
          )}
        </div>

        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-semibold text-[#0f5841]">
              {project.progress || 0}%
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-2.5 rounded-full bg-gradient-to-r ${getProgressColor(project.progress || 0)} transition-all duration-500`}
              style={{ width: `${project.progress || 0}%` }}
            />
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-gray-50 p-3">
            <CheckCircle className="mb-1 h-4 w-4 text-gray-400" />
            <div className="text-xs text-gray-500">Tasks</div>
            <div className="font-semibold text-gray-900">
              {project.tasks?.completed || 0}/{project.tasks?.total || 0}
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <Users className="mb-1 h-4 w-4 text-gray-400" />
            <div className="text-xs text-gray-500">Team</div>
            <div
              className="truncate font-semibold text-gray-900"
              title={project.teamName}
            >
              {project.teamName || "Unassigned"}
            </div>
          </div>
        </div>

        <div className="space-y-1 border-t border-gray-100 pt-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>Start: {formatDate(project.startDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className={overdue ? "font-medium text-red-600" : ""}>
              Deadline: {formatDate(project.dueDate || project.endDate)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onView}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0f5841]/10 px-4 py-2.5 text-sm font-medium text-[#0f5841] transition-all duration-300 hover:bg-[#0f5841] hover:text-white"
          >
            <Eye className="h-4 w-4" /> View Details
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const EmptyState = ({
  canManageProjects,
  hasFilters,
  onClear,
  onCreate,
  searchQuery,
}) => (
  <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
    {searchQuery || hasFilters ? (
      <>
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
          <Search className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-gray-900">
          No results found
        </h3>
        <p className="mb-6 text-gray-500">
          {searchQuery
            ? `No projects match "${searchQuery}"`
            : "No projects match the selected filters"}
        </p>
        <button
          onClick={onClear}
          className="rounded-lg bg-[#0f5841] px-6 py-2.5 font-medium text-white transition-colors hover:bg-[#0a4030]"
        >
          Clear {searchQuery ? "Search" : "Filters"}
        </button>
      </>
    ) : (
      <>
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#0f5841]/20 to-[#194f87]/20">
          <FolderKanban className="h-12 w-12 text-[#0f5841]" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-gray-900">
          No projects yet
        </h3>
        <p className="mb-6 text-gray-500">
          {canManageProjects
            ? "Get started by creating your first project"
            : "No projects are available to view right now."}
        </p>
        {canManageProjects && (
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0f5841] to-[#194f87] px-6 py-2.5 font-medium text-white transition-all hover:shadow-lg"
          >
            <Plus className="h-5 w-5" /> Create Project
          </button>
        )}
      </>
    )}
  </div>
);

const SharedProjectsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loaderData = useLoaderData();
  const { user } = useAuth();
  const isAdminView = isAdminProjectsView(location.pathname);
  const canManageProjects = resolveCanManageProjects(user, location.pathname);
  const createProjectPath = getProjectCreatePath(location.pathname);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("projectsViewMode") || "grid",
  );
  const [sortBy, setSortBy] = useState("deadline");
  const [sortOrder, setSortOrder] = useState("asc");
  const [deletingId, setDeletingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem("projectsViewMode", viewMode);
  }, [viewMode]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const initialProjects = Array.isArray(loaderData?.projects)
    ? loaderData.projects
    : undefined;
  const {
    data: projectsData = [],
    isLoading,
    error,
    isFetching,
    refetch,
  } = useQuery({
    ...projectsQuery(),
    initialData: initialProjects,
    refetchInterval: 30000,
    staleTime: 5000,
  });

  const safeProjects = Array.isArray(projectsData) ? projectsData : [];
  const stats = useMemo(() => calculateStats(safeProjects), [safeProjects]);

  const resolveTeamName = (project) => {
    if (!project) return "Unassigned";
    if (typeof project.teamName === "string") return project.teamName;
    if (project.teamName && typeof project.teamName === "object")
      return project.teamName.name || "Unassigned";
    if (typeof project.team === "string") return project.team;
    if (project.team && typeof project.team === "object")
      return project.team.name || "Unassigned";
    return "Unassigned";
  };

  const filteredProjects = useMemo(() => {
    let filtered = safeProjects.filter((project) => {
      const matchesSearch =
        searchQuery === "" ||
        project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    filtered = [...filtered].sort((left, right) => {
      let comparison = 0;

      switch (sortBy) {
        case "deadline": {
          const leftDate = parseDate(left.dueDate || left.endDate);
          const rightDate = parseDate(right.dueDate || right.endDate);
          if (!leftDate && !rightDate) comparison = 0;
          else if (!leftDate) comparison = 1;
          else if (!rightDate) comparison = -1;
          else comparison = leftDate - rightDate;
          break;
        }
        case "progress":
          comparison = (right.progress || 0) - (left.progress || 0);
          break;
        case "name":
          comparison = (left.name || "").localeCompare(right.name || "");
          break;
        case "tasks":
          comparison = (right.tasks?.total || 0) - (left.tasks?.total || 0);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [safeProjects, searchQuery, sortBy, sortOrder, statusFilter]);

  const handleDeleteProject = async (projectId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this project? This action cannot be undone.",
      )
    ) {
      return;
    }

    setDeletingId(projectId);
    try {
      await deleteProject(projectId);
      await invalidateProjectsQueries();
      await refetch();
      showToast("Project deleted successfully", "success");
    } catch (deleteError) {
      showToast(deleteError.message || "Failed to delete project", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      active: {
        color: "bg-green-100 text-green-800",
        icon: TrendingUp,
        label: "Active",
      },
      "in-progress": {
        color: "bg-blue-100 text-blue-800",
        icon: TrendingUp,
        label: "In Progress",
      },
      completed: {
        color: "bg-emerald-100 text-emerald-800",
        icon: CheckCircle,
        label: "Completed",
      },
      planned: {
        color: "bg-purple-100 text-purple-800",
        icon: Calendar,
        label: "Planned",
      },
      "on-hold": {
        color: "bg-yellow-100 text-yellow-800",
        icon: AlertCircle,
        label: "On Hold",
      },
      cancelled: {
        color: "bg-red-100 text-red-800",
        icon: X,
        label: "Cancelled",
      },
    };
    const statusConfig = config[status] || config.planned;
    const Icon = statusConfig.icon;

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.color}`}
      >
        <Icon className="mr-1 h-3 w-3" /> {statusConfig.label}
      </span>
    );
  };

  const handleExport = () => {
    if (!filteredProjects.length) {
      showToast("No projects to export", "error");
      return;
    }

    const csvData = filteredProjects.map((project) => ({
      "Project Name": project.name,
      Description: project.description || "",
      Status: project.status,
      Progress: `${project.progress || 0}%`,
      Team: resolveTeamName(project),
      "Start Date": project.startDate || "N/A",
      Deadline: project.dueDate || project.endDate || "N/A",
      "Tasks Completed": `${project.tasks?.completed || 0}/${project.tasks?.total || 0}`,
    }));

    const headers = Object.keys(csvData[0]);
    const csv = [
      headers.join(","),
      ...csvData.map((row) =>
        headers.map((header) => JSON.stringify(row[header] || "")).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `projects_export_${new Date().toISOString().split("T")[0]}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("Projects exported successfully", "success");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortBy("deadline");
    setSortOrder("asc");
  };

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all";

  if (isLoading && !initialProjects) {
    return <ProjectsSkeleton />;
  }

  if (error && !initialProjects) {
    return (
      <ProjectsError error={error} onRetry={() => window.location.reload()} />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {toast && (
        <div className="fixed right-4 top-4 z-50">
          <div
            className={`rounded-lg p-4 text-white shadow-lg ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Projects Dashboard
              </h1>
              <p className="mt-1 text-gray-600">
                {canManageProjects
                  ? "Manage and monitor all your projects in one place"
                  : "Review project progress, timelines, and delivery health"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="rounded-lg border border-gray-200 bg-white p-2 transition-colors hover:bg-gray-50 disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw
                  className={`h-5 w-5 text-gray-600 ${isFetching ? "animate-spin" : ""}`}
                />
              </button>
              {canManageProjects && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(createProjectPath)}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0f5841] to-[#194f87] px-4 py-2 text-white transition-all hover:shadow-lg"
                >
                  <Plus className="h-5 w-5" /> New Project
                </motion.button>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
            <StatCard
              title="Total Projects"
              value={stats.total}
              icon={FolderKanban}
              color="bg-blue-500"
              bgColor="bg-blue-50"
              onClick={() => setStatusFilter("all")}
              loading={isLoading}
            />
            <StatCard
              title="Active"
              value={stats.active}
              icon={TrendingUp}
              color="bg-green-500"
              bgColor="bg-green-50"
              onClick={() => setStatusFilter("active")}
              loading={isLoading}
            />
            <StatCard
              title="Completed"
              value={stats.completed}
              icon={CheckCircle}
              color="bg-emerald-500"
              bgColor="bg-emerald-50"
              onClick={() => setStatusFilter("completed")}
              loading={isLoading}
            />
            <StatCard
              title="Planned"
              value={stats.planned}
              icon={Calendar}
              color="bg-purple-500"
              bgColor="bg-purple-50"
              onClick={() => setStatusFilter("planned")}
              loading={isLoading}
            />
            <StatCard
              title="Overdue"
              value={stats.overdue}
              icon={AlertCircle}
              color="bg-red-500"
              bgColor="bg-red-50"
              onClick={() => setStatusFilter("active")}
              loading={isLoading}
            />
          </div>
        </div>

        {!canManageProjects && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {isAdminView
              ? "View-only mode. Admins can still see existing projects, but project-management actions are hidden unless the "
              : "View-only mode. Project managers can still see existing projects, but project-management actions are hidden because the "}
            <span className="font-semibold">manage_projects</span>
            {isAdminView
              ? " permission is granted."
              : " permission has been revoked for this account."}
          </div>
        )}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search projects by name or description..."
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0f5841]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 rounded p-1 hover:bg-gray-100"
                >
                  <X className="h-4 w-4 -translate-y-1/2 text-gray-400" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters((value) => !value)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 lg:hidden"
              >
                <Filter className="h-4 w-4" /> Filters
              </button>

              <div
                className={`${showFilters ? "flex" : "hidden"} flex-wrap gap-3 lg:flex`}
              >
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0f5841]"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="planned">Planned</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0f5841]"
                >
                  <option value="deadline">Sort by Deadline</option>
                  <option value="progress">Sort by Progress</option>
                  <option value="name">Sort by Name</option>
                  <option value="tasks">Sort by Task Count</option>
                </select>

                <button
                  onClick={() =>
                    setSortOrder((value) => (value === "asc" ? "desc" : "asc"))
                  }
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 hover:bg-gray-50"
                >
                  {sortOrder === "asc" ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                  {sortOrder === "asc" ? "Ascending" : "Descending"}
                </button>
              </div>

              <div className="flex items-center overflow-hidden rounded-lg border border-gray-200">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-[#0f5841] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  <Grid3x3 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-[#0f5841] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-gray-600">
            Showing {filteredProjects.length} of {safeProjects.length} projects
            {isFetching && (
              <Loader2 className="ml-2 inline h-4 w-4 animate-spin" />
            )}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-[#0f5841] hover:underline"
            >
              <X className="h-3 w-3" /> Clear all filters
            </button>
          )}
        </div>

        {filteredProjects.length > 0 ? (
          viewMode === "grid" ? (
            <motion.div
              layout
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence>
                {filteredProjects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                    canManageProjects={canManageProjects}
                    getStatusBadge={getStatusBadge}
                    onDelete={handleDeleteProject}
                    onEdit={() =>
                      navigate(
                        getProjectEditPath(location.pathname, project.id),
                      )
                    }
                    onView={() =>
                      navigate(
                        getProjectDetailsPath(location.pathname, project.id),
                      )
                    }
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Project
                      </th>
                      <th className="hidden px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:table-cell">
                        Team
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Progress
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Deadline
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Tasks
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <motion.tbody
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    className="divide-y divide-gray-200"
                  >
                    {filteredProjects.map((project) => (
                      <tr
                        key={project.id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {project.name}
                          </div>
                          {project.description && (
                            <div className="max-w-xs truncate text-sm text-gray-500">
                              {project.description}
                            </div>
                          )}
                        </td>
                        <td className="hidden px-6 py-4 sm:table-cell">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                            {resolveTeamName(project)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(project.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-[#0f5841] to-[#194f87] transition-all duration-300"
                                style={{ width: `${project.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">
                              {project.progress || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span
                              className={`text-sm ${isOverdue(project) ? "font-bold text-red-600" : "text-gray-600"}`}
                            >
                              {formatDate(project.dueDate || project.endDate)}
                              {isOverdue(project) ? " (Overdue)" : ""}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {project.tasks?.completed || 0}/
                              {project.tasks?.total || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                navigate(
                                  getProjectDetailsPath(
                                    location.pathname,
                                    project.id,
                                  ),
                                )
                              }
                              className="rounded-lg p-2 text-[#0f5841] hover:bg-[#0f5841]/10"
                              title="View Details"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            {canManageProjects && (
                              <>
                                <button
                                  onClick={() =>
                                    navigate(
                                      getProjectEditPath(
                                        location.pathname,
                                        project.id,
                                      ),
                                    )
                                  }
                                  className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                                  title="Edit Project"
                                >
                                  <Edit className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteProject(project.id)
                                  }
                                  disabled={deletingId === project.id}
                                  className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                                  title="Delete Project"
                                >
                                  {deletingId === project.id ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-5 w-5" />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </motion.tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <EmptyState
            searchQuery={searchQuery}
            onClear={clearFilters}
            onCreate={() => navigate(createProjectPath)}
            hasFilters={statusFilter !== "all"}
            canManageProjects={canManageProjects}
          />
        )}
      </div>
    </div>
  );
};

export default SharedProjectsPage;
