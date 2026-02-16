import { useState, useEffect } from "react";

const DashboardOverview = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);

  // Convert backend status to frontend status
  const normalizeStatus = (status) => {
    switch (status) {
      case "PLANNED":
        return "to_do";
      case "IN_PROGRESS":
        return "in_progress";
      case "COMPLETED":
        return "completed";
      default:
        return "to_do";
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("You are not logged in.");
          setIsLoading(false);
          return;
        }

        const res = await fetch("http://localhost:5000/api/projects", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          setError("Unauthorized. Please login again.");
          setIsLoading(false);
          return;
        }

        const data = await res.json();

        const mappedProjects = data.map((p) => ({
          id: p.id,
          name: p.name,
          team: p.team?.name || "N/A",
          manager: `Manager #${p.managerId}`,
          status: normalizeStatus(p.status),
          startDate: new Date(p.startDate).toLocaleDateString(),
          deadline: new Date(p.endDate).toLocaleDateString(),
          tasks: {
  total: Array.isArray(p.tasks) ? p.tasks.length : 0,
  completed: Array.isArray(p.tasks)
    ? p.tasks.filter((t) => t.status === "COMPLETED").length
    : 0,
},

        }));

        setProjects(mappedProjects);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Something went wrong while loading projects.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const updateProjectStatus = (projectId, newStatus) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? { ...project, status: newStatus }
          : project
      )
    );
  };

  const getStatusConfig = (status) => {
    const configs = {
      to_do: {
        label: "To Do",
        color: "bg-gray-100 text-gray-800",
        badgeColor: "bg-gray-500",
        icon: "⏳",
      },
      in_progress: {
        label: "In Progress",
        color: "bg-blue-100 text-blue-800",
        badgeColor: "bg-blue-500",
        icon: "🚀",
      },
      completed: {
        label: "Completed",
        color: "bg-green-100 text-green-800",
        badgeColor: "bg-green-500",
        icon: "✅",
      },
    };
    return configs[status] || configs.to_do;
  };

  const getCompletionPercentage = (project) => {
    if (project.tasks.total > 0) {
      return Math.round(
        (project.tasks.completed / project.tasks.total) * 100
      );
    }
    return project.status === "completed" ? 100 : 0;
  };

  const getStatusOptions = () => [
    { value: "to_do", label: "To Do" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ];

  const filteredProjects =
    filter === "all"
      ? projects
      : projects.filter((p) => p.status === filter);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-10 font-medium">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            All Projects Overview
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            View and manage project status across all teams
          </p>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All Status</option>
          <option value="to_do">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Team
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Manager
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tasks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
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
                  <td className="px-6 py-4">{project.name}</td>
                  <td className="px-6 py-4">{project.team}</td>
                  <td className="px-6 py-4">{project.manager}</td>
                  <td className="px-6 py-4">
                    {project.tasks.completed}/{project.tasks.total}
                  </td>
                  <td className="px-6 py-4">
                    {statusConfig.label} {statusConfig.icon}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {project.startDate} → {project.deadline}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardOverview;
