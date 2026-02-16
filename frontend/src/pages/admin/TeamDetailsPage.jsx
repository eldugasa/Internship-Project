// src/pages/admin/TeamDetailsPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const TeamDetailsPage = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [team, setTeam] = useState(null);
  const [users, setUsers] = useState([]);
  const [showAddMemberPopup, setShowAddMemberPopup] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch team and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch team details
        const teamRes = await axios.get(`/api/teams/${teamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeam(teamRes.data);

        // Fetch all users
        const usersRes = await axios.get("/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(usersRes.data);
      } catch (err) {
        console.error(err);
        navigate("/admin/teams"); // fallback if error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teamId, navigate, token]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4DA5AD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading team details...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Team not found.</p>
      </div>
    );
  }

  // --- Helper Functions ---
  const removeTeamMember = async (userId) => {
    try {
      await axios.put(
        `/api/teams/${team.id}/remove-member`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTeam({
        ...team,
        users: team.users.filter((u) => u.id !== userId),
      });
    } catch (err) {
      console.error(err);
      alert("Failed to remove member");
    }
  };

  const addTeamMember = async (userId) => {
    try {
      await axios.put(
        `/api/teams/${team.id}/add-member`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newUser = users.find((u) => u.id === userId);
      setTeam({
        ...team,
        users: [...(team.users || []), newUser],
      });
      setShowAddMemberPopup(false);
    } catch (err) {
      console.error(err);
      alert("Failed to add member");
    }
  };

  const removeProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to remove this project?")) return;
    try {
      await axios.delete(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeam({
        ...team,
        projects: (team.projects || []).filter((p) => p.id !== projectId),
      });
    } catch (err) {
      console.error(err);
      alert("Failed to remove project");
    }
  };

  const getPriorityColor = (priority) => {
    switch ((priority || "").toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // --- Render ---
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate("/admin/teams")}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <span className="mr-2">←</span> Back to Teams
        </button>
        <button
          onClick={() => navigate("/admin/teams")}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Close
        </button>
      </div>

      {/* Team Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: "#4DA5AD" }}
            >
              {team.name?.charAt(0) || "T"}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {team.name || "N/A"} (ID: {team.id || "N/A"})
              </h1>
              <p className="text-gray-600">
                Team Lead: <span className="font-medium">{team.lead || "N/A"}</span>
              </p>
              <p className="text-gray-500 mt-2">{team.description || ""}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{team.users?.length || 0}</div>
              <div className="text-sm text-gray-600">Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{team.projects?.length || 0}</div>
              <div className="text-sm text-gray-600">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {team.projects?.length
                  ? Math.round(team.projects.reduce((sum, p) => sum + (p.progress || 0), 0) / team.projects.length)
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-600">Avg. Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Team Members ({team.users?.length || 0})
            </h2>
            <button
              onClick={() => setShowAddMemberPopup(true)}
              className="px-3 py-1 text-sm bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93]"
            >
              + Add Member
            </button>
          </div>

          <div className="space-y-3">
            {(team.users || []).map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] rounded-full flex items-center justify-center text-white font-medium mr-3">
                    {user.name?.slice(0, 2).toUpperCase() || "US"}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.name || "N/A"}</p>
                    <p className="text-sm text-gray-500">{user.email || "N/A"}</p>
                    <p className="text-xs text-gray-400">{user.role?.replace("_", " ") || "N/A"}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeTeamMember(user.id)}
                  className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Team Projects Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Team Projects ({team.projects?.length || 0})
            </h2>
          </div>

          <div className="space-y-4">
            {(team.projects || []).map((project) => (
              <div
                key={project.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900 text-lg">{project.name || "N/A"}</h3>
                    <p className="text-sm text-gray-500 mt-1">{project.description || ""}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(project.priority)}`}>
                      {project.priority || "low"}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        project.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {project.status || "PLANNED"}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{project.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#4DA5AD] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600">
                  <div>
                    <span>Manager: {project.manager || "N/A"}</span>
                    <span className="mx-2">•</span>
                    <span>Due: {project.dueDate ? project.dueDate.split("T")[0] : "N/A"}</span>
                  </div>
                  <button
                    onClick={() => removeProject(project.id)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Member Popup */}
      {showAddMemberPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-20">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Add Members to Team
                </h2>
                <button
                  onClick={() => setShowAddMemberPopup(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Select users to add to {team.name || "N/A"} team
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users
                  .filter((u) => !(team.users || []).find((tu) => tu.id === u.id))
                  .map((user) => (
                    <div
                      key={user.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-[#4DA5AD] transition"
                    >
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] rounded-full flex items-center justify-center text-white font-medium mr-3">
                          {user.name?.slice(0, 2).toUpperCase() || "US"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name || "N/A"}</p>
                          <p className="text-sm text-gray-500">{user.email || "N/A"}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => addTeamMember(user.id)}
                        className="w-full py-2 text-sm bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93]"
                      >
                        Add to Team
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddMemberPopup(false)}
                className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Details Popup */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-20">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{selectedProject.name || "N/A"}</h2>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-gray-600">{selectedProject.description || ""}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">{selectedProject.status || "N/A"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Priority</p>
                  <p className="font-medium capitalize">{selectedProject.priority || "N/A"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Manager</p>
                  <p className="font-medium">{selectedProject.manager || "N/A"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="font-medium">
                    {selectedProject.dueDate ? selectedProject.dueDate.split("T")[0] : "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">
                  Progress: {selectedProject.progress || 0}%
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-[#4DA5AD] h-3 rounded-full"
                    style={{ width: `${selectedProject.progress || 0}%` }}
                  ></div>
                </div>
              </div>

              <button
                onClick={() => setSelectedProject(null)}
                className="w-full py-2 bg-[#4DA5AD] text-white rounded-lg mt-6"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetailsPage;
