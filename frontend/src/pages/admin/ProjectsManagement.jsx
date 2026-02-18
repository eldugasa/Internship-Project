import React, { useState, useEffect } from "react";
import { apiClient } from "../../services/apiClient";
import ProjectCard from "../../Component/admin/ProjectCard";

const ProjectsManagement = () => {
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizeStatus = (status) => {
    if (!status) return "active";

    if (status === "COMPLETED") return "completed";
    if (status === "IN_PROGRESS") return "active";
    if (status === "PLANNED") return "active";

    return status.toLowerCase();
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await apiClient('/projects');

        const mappedProjects = data.map((p) => {
          const totalTasks = Array.isArray(p.tasks) ? p.tasks.length : 0;
          const completedTasks = Array.isArray(p.tasks)
            ? p.tasks.filter((t) => t.status === "COMPLETED").length
            : 0;

          const progress =
            totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : p.status === "COMPLETED"
              ? 100
              : 0;

          return {
            id: p.id,
            name: p.name,
            team: p.team?.name || "N/A",
            manager: `Manager #${p.managerId}`,
            progress,
            status: normalizeStatus(p.status),
            dueDate: new Date(p.endDate).toLocaleDateString(),
          };
        });

        setProjects(mappedProjects);
      } catch (err) {
        console.error("Project fetch error:", err);
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects =
    filter === "all"
      ? projects
      : projects.filter((project) => project.status === filter);

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === "active").length,
    completed: projects.filter((p) => p.status === "completed").length,
    averageProgress:
      projects.length > 0
        ? Math.round(
            projects.reduce((sum, p) => sum + p.progress, 0) /
              projects.length
          )
        : 0,
  };

  if (loading) {
    return <div className="text-center py-10">Loading projects...</div>;
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-10 font-medium">
        {error}
      </div>
    );
  }

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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Projects" value={stats.total} />
        <StatCard title="Active Projects" value={stats.active} />
        <StatCard title="Completed" value={stats.completed} />
        <StatCard
          title="Avg. Progress"
          value={`${stats.averageProgress}%`}
        />
      </div>

      {/* Filter & Projects */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-900">
            All Projects
          </h2>

          <div className="flex space-x-2">
            {["all", "active", "completed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg ${
                  filter === f
                    ? "bg-[#4DA5AD] text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📁</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No projects found
            </h3>
            <p className="text-gray-500">
              Try selecting a different filter
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="text-2xl font-bold text-gray-900 mb-2">
      {value}
    </div>
    <p className="font-medium text-gray-900">{title}</p>
  </div>
);

export default ProjectsManagement;
