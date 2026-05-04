// src/pages/admin/ProjectsManagement.jsx
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLoaderData, useNavigate } from "react-router-dom";
import ProjectCard from "../../Component/admin/ProjectCard";
import { projectsQuery } from "../../loader/admin/ProjectsManagement.loader";
import { useAuth } from "../../context/AuthContext";
import { PERMISSIONS } from "../../config/permissions";

// Helper function to calculate stats
const calculateStats = (projects) => ({
  total: projects.length,
  active: projects.filter((p) => p.status === "active").length,
  completed: projects.filter((p) => p.status === "completed").length,
  averageProgress:
    projects.length > 0
      ? Math.round(
          projects.reduce((sum, p) => sum + (p.progress || 0), 0) /
            projects.length,
        )
      : 0,
});

const FILTERS = ["all", "active", "completed"];

// Loading skeleton component
const ProjectsSkeleton = () => (
  <div className="space-y-6">
    <div>
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse"></div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ))}
    </div>

    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex space-x-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-10 w-20 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl p-6 animate-pulse">
            <div className="h-6 w-32 bg-gray-200 rounded mb-3"></div>
            <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-40 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Error component
const ProjectsError = ({ message, onRetry }) => (
  <div className="flex justify-center items-center min-h-100">
    <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-center">
      <h3 className="text-lg font-semibold text-red-800 mb-2">
        Failed to Load Projects
      </h3>
      <p className="text-red-600 mb-4">
        {message || "An error occurred while loading projects"}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
      >
        Retry
      </button>
    </div>
  </div>
);

// Empty state component
const ProjectsEmpty = ({ filter, onClearFilter }) => (
  <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
    <div className="text-gray-400 text-6xl mb-4">📁</div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      {filter !== "all" ? "No projects found" : "No projects yet"}
    </h3>
    <p className="text-gray-500 mb-4">
      {filter !== "all"
        ? `No ${filter} projects available. Try a different filter.`
        : "Create your first project to get started."}
    </p>
    {filter !== "all" && (
      <button
        onClick={onClearFilter}
        className="px-4 py-2 text-[#4DA5AD] hover:underline"
      >
        Show all projects
      </button>
    )}
  </div>
);

// Stat Card Component
const StatCard = ({ title, value, color = "gray" }) => {
  const colorClasses = {
    gray: "text-gray-900",
    green: "text-green-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className={`text-2xl font-bold ${colorClasses[color]} mb-2`}>
        {value}
      </div>
      <p className="font-medium text-gray-900">{title}</p>
    </div>
  );
};

const ProjectsManagement = () => {
  const [filter, setFilter] = useState("all");
  const loaderData = useLoaderData();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canManageProjects = hasPermission(PERMISSIONS.MANAGE_PROJECTS);

  const {
    data: projects = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    ...projectsQuery(),
    initialData: loaderData?.projects,
  });

  if (isLoading) return <ProjectsSkeleton />;

  if (isError) {
    return (
      <ProjectsError
        message={error?.message || "Failed to load projects data"}
        onRetry={refetch}
      />
    );
  }

  const stats = calculateStats(projects);
  const filteredProjects =
    filter === "all" ? projects : projects.filter((p) => p.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Project Management
        </h1>
        <p className="text-gray-600">
          View and monitor all projects across teams
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Projects" value={stats.total} color="gray" />
        <StatCard title="Active Projects" value={stats.active} color="green" />
        <StatCard title="Completed" value={stats.completed} color="blue" />
        <StatCard
          title="Avg. Progress"
          value={`${stats.averageProgress}%`}
          color="purple"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {!canManageProjects && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            View-only mode. You can still see existing projects, but project-management actions stay hidden unless the
            <span className="mx-1 font-semibold">manage_projects</span>
            permission is granted.
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-lg font-bold text-gray-900">All Projects</h2>
          <div className="flex space-x-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filter === f
                    ? "bg-[#4DA5AD] text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => navigate(`/admin/projects/${project.id}`)}
              />
            ))}
          </div>
        ) : (
          <ProjectsEmpty
            filter={filter}
            onClearFilter={() => setFilter("all")}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectsManagement;
