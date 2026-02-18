// src/pages/admin/TeamDetailsPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTeamById } from "../../services/teamsService";
import { getUsers } from "../../services/usersService";
import { addMemberToTeam, removeMemberFromTeam } from "../../services/teamsService";
import { deleteProject } from "../../services/projectsService";
import { UserPlus, UserMinus, X, ArrowLeft, RefreshCw } from 'lucide-react';

const TeamDetailsPage = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [users, setUsers] = useState([]);
  const [showAddMemberPopup, setShowAddMemberPopup] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch team and users
  useEffect(() => {
    fetchData();
  }, [teamId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch team details and users in parallel
      const [teamData, usersData] = await Promise.all([
        getTeamById(teamId),
        getUsers()
      ]);
      
      console.log("Team data received:", teamData); // Debug log
      
      setTeam(teamData);
      setUsers(usersData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to load team details");
    } finally {
      setLoading(false);
    }
  };

  // Refresh team data
  const refreshTeamData = async () => {
    try {
      setRefreshing(true);
      const teamData = await getTeamById(teamId);
      setTeam(teamData);
    } catch (err) {
      console.error("Error refreshing team:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Remove team member
  const removeTeamMember = async (userId) => {
    try {
      await removeMemberFromTeam(team.id, userId);
      
      // Get current members
      const currentMembers = team.users || team.members || [];
      
      // Update local state - FILTER OUT the removed user
      setTeam({
        ...team,
        users: currentMembers.filter((u) => u.id !== userId),
        members: currentMembers.filter((u) => u.id !== userId),
        memberCount: (team.memberCount || currentMembers.length) - 1
      });
      
      alert("Member removed successfully!");
    } catch (err) {
      console.error("Error removing member:", err);
      alert(err.message || "Failed to remove member");
    }
  };

  // Add team member - FIXED VERSION
  const addTeamMember = async (userId) => {
    try {
      await addMemberToTeam(team.id, userId);
      const newUser = users.find((u) => u.id === userId);
      
      // Get current members array
      const currentMembers = team.users || team.members || [];
      
      // Check if user already exists
      if (currentMembers.some(m => m.id === userId)) {
        alert("User is already a member of this team");
        setShowAddMemberPopup(false);
        return;
      }
      
      // Update local state - APPEND new user to existing array (NOT replace)
      const updatedMembers = [...currentMembers, newUser];
      
      setTeam({
        ...team,
        users: updatedMembers,
        members: updatedMembers,
        memberCount: updatedMembers.length
      });
      
      setShowAddMemberPopup(false);
      alert("Member added successfully!");
      
      // Optional: Refresh from server to ensure sync
      // await refreshTeamData();
    } catch (err) {
      console.error("Error adding member:", err);
      alert(err.message || "Failed to add member");
    }
  };

  // Remove project from team
  const removeProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    
    try {
      await deleteProject(projectId);
      
      // Update local state
      const currentProjects = team.projects || [];
      
      setTeam({
        ...team,
        projects: currentProjects.filter((p) => p.id !== projectId),
        projectCount: (team.projectCount || currentProjects.length) - 1
      });
      
      alert("Project removed successfully!");
    } catch (err) {
      console.error("Error removing project:", err);
      alert(err.message || "Failed to remove project");
    }
  };

  // Get priority color for styling
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

  // Get status color
  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "active":
      case "in_progress":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "on-hold":
      case "on_hold":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate average progress
  const calculateAverageProgress = () => {
    if (!team?.projects?.length) return 0;
    const total = team.projects.reduce((sum, p) => sum + (p.progress || 0), 0);
    return Math.round(total / team.projects.length);
  };

  // Get team members array
  const getTeamMembers = () => {
    return team?.users || team?.members || [];
  };

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

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => navigate("/admin/teams")}
          className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93]"
        >
          Back to Teams
        </button>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Team not found.</p>
        <button
          onClick={() => navigate("/admin/teams")}
          className="mt-4 px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93]"
        >
          Back to Teams
        </button>
      </div>
    );
  }

  const averageProgress = calculateAverageProgress();
  const teamMembers = getTeamMembers();

  return (
    <div className="p-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate("/admin/teams")}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Teams
        </button>
        <div className="flex space-x-2">
          <button
            onClick={refreshTeamData}
            disabled={refreshing}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => navigate("/admin/teams")}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>

      {/* Team Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center text-white text-3xl font-bold"
              style={{ backgroundColor: "#4DA5AD" }}
            >
              {team.name?.charAt(0).toUpperCase() || "T"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {team.name || "N/A"} <span className="text-sm font-normal text-gray-500">(ID: {team.id})</span>
              </h1>
              <p className="text-gray-600 mt-1">
                <span className="font-medium">Team Lead:</span> {team.lead || team.leadName || "Unassigned"}
              </p>
              {team.description && (
                <p className="text-gray-500 mt-2 max-w-2xl">{team.description}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 bg-gray-50 p-4 rounded-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#4DA5AD]">{teamMembers.length}</div>
              <div className="text-sm text-gray-600">Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#4DA5AD]">{team.projects?.length || 0}</div>
              <div className="text-sm text-gray-600">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#4DA5AD]">{averageProgress}%</div>
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
              Team Members ({teamMembers.length})
            </h2>
            <button
              onClick={() => setShowAddMemberPopup(true)}
              className="px-3 py-2 text-sm bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] flex items-center"
            >
              <UserPlus className="w-4 h-4 mr-1" /> Add Member
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {teamMembers.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No members in this team</p>
                <button
                  onClick={() => setShowAddMemberPopup(true)}
                  className="mt-2 text-sm text-[#4DA5AD] hover:underline"
                >
                  Add your first member
                </button>
              </div>
            ) : (
              teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {member.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                      <p className="text-xs text-gray-400 mt-1 capitalize">
                        {member.role?.replace(/[_-]/g, " ")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeTeamMember(member.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Remove member"
                  >
                    <UserMinus className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Team Projects Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Team Projects ({team.projects?.length || 0})
            </h2>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {!team.projects?.length ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No projects assigned to this team</p>
              </div>
            ) : (
              team.projects.map((project) => (
                <div
                  key={project.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(project.priority)}`}>
                        {project.priority || "Low"}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status?.replace(/[_-]/g, " ") || "Planned"}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span className="font-medium">{project.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-[#4DA5AD] h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Manager:</span> {project.managerName || project.manager || "N/A"}
                      <span className="mx-2">•</span>
                      <span className="font-medium">Due:</span> {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "N/A"}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeProject(project.id);
                      }}
                      className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add Members to Team</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Select users to add to {team.name}
                </p>
              </div>
              <button
                onClick={() => setShowAddMemberPopup(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users
                  .filter((user) => !teamMembers.some((member) => member.id === user.id))
                  .filter((user) => user.role !== 'admin')
                  .map((user) => (
                    <div
                      key={user.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-[#4DA5AD] transition cursor-pointer"
                      onClick={() => addTeamMember(user.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-400 mt-1 capitalize">
                            {user.role?.replace(/[_-]/g, " ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              {users.filter((user) => !teamMembers.some((member) => member.id === user.id) && user.role !== 'admin').length === 0 && (
                <p className="text-center text-gray-500 py-8">No available users to add</p>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddMemberPopup(false)}
                className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h2>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {selectedProject.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                  <p className="text-gray-700">{selectedProject.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <p className="font-semibold capitalize">{selectedProject.status?.replace(/[_-]/g, " ") || "Planned"}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Priority</p>
                  <p className="font-semibold capitalize">{selectedProject.priority || "Medium"}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Manager</p>
                  <p className="font-semibold">{selectedProject.managerName || selectedProject.manager || "Unassigned"}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Due Date</p>
                  <p className="font-semibold">
                    {selectedProject.dueDate ? new Date(selectedProject.dueDate).toLocaleDateString() : "Not set"}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span className="font-semibold">{selectedProject.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-[#4DA5AD] h-4 rounded-full transition-all duration-300"
                    style={{ width: `${selectedProject.progress || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="w-full py-3 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetailsPage;