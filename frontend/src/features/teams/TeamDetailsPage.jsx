import React, { Suspense, useState } from "react";
import {
  Await,
  useLoaderData,
  useLocation,
  useNavigate,
  useParams,
  useRevalidator,
} from "react-router-dom";
import { ArrowLeft, RefreshCw, UserMinus, UserPlus, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { deleteProject } from "../../services/projectsService";
import { addMemberToTeam, removeMemberFromTeam } from "../../services/teamsService";
import { getTeamsBasePath, isAdminTeamsView, resolveCanManageTeams } from "./teamAccess";

const TeamDetailsSkeleton = () => (
  <div className="p-6">
    <div className="mb-8 flex items-center justify-between">
      <div className="h-10 w-32 animate-pulse rounded bg-gray-200" />
      <div className="h-10 w-24 animate-pulse rounded bg-gray-200" />
    </div>
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="h-20 w-20 animate-pulse rounded-xl bg-gray-200" />
        <div className="flex-1">
          <div className="mb-2 h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {[...Array(2)].map((_, index) => (
        <div key={index} className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200" />
          <div className="space-y-3">
            {[...Array(3)].map((__, childIndex) => (
              <div key={childIndex} className="h-16 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const TeamDetailsError = ({ error, onBack }) => (
  <div className="flex min-h-[400px] items-center justify-center p-6">
    <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-8 text-center">
      <h3 className="mb-2 text-lg font-semibold text-red-800">Failed to Load Team</h3>
      <p className="mb-4 text-red-600">{error || "Team not found or unable to load"}</p>
      <div className="flex justify-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
        >
          Retry
        </button>
        <button
          onClick={onBack}
          className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50"
        >
          Back to Teams
        </button>
      </div>
    </div>
  </div>
);

const SharedTeamDetailsPage = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const revalidator = useRevalidator();
  const loaderData = useLoaderData();
  const { user } = useAuth();
  const isAdminSide = isAdminTeamsView(location.pathname);
  const canManageTeams = isAdminSide ? resolveCanManageTeams(user, true) : !!loaderData.canManageTeams;
  const teamsBasePath = getTeamsBasePath(location.pathname, user?.role || loaderData.role);
  const [showAddMemberPopup, setShowAddMemberPopup] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  const calculateAverageProgress = (projects) => {
    if (!projects?.length) {
      return 0;
    }
    const total = projects.reduce((sum, project) => sum + (project.progress || 0), 0);
    return Math.round(total / projects.length);
  };

  const removeTeamMember = async (userId) => {
    if (!canManageTeams) {
      return;
    }
    if (!window.confirm("Are you sure you want to remove this member?")) {
      return;
    }

    setActionLoading(true);
    try {
      await removeMemberFromTeam(teamId, userId);
      revalidator.revalidate();
      alert("Member removed successfully!");
    } catch (error) {
      alert(error.message || "Failed to remove member");
    } finally {
      setActionLoading(false);
    }
  };

  const addTeamMember = async (userId) => {
    if (!canManageTeams) {
      return;
    }

    setActionLoading(true);
    try {
      await addMemberToTeam(teamId, userId);
      setShowAddMemberPopup(false);
      revalidator.revalidate();
      alert("Member added successfully!");
    } catch (error) {
      alert(error.message || "Failed to add member");
    } finally {
      setActionLoading(false);
    }
  };

  const removeProject = async (projectId) => {
    if (!canManageTeams) {
      return;
    }
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    setActionLoading(true);
    try {
      await deleteProject(projectId);
      revalidator.revalidate();
      alert("Project removed successfully!");
    } catch (error) {
      alert(error.message || "Failed to remove project");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => navigate(teamsBasePath)}
          className="flex items-center text-gray-600 hover:text-gray-900"
          disabled={actionLoading}
        >
          <ArrowLeft className="mr-2 h-5 w-5" /> Back to Teams
        </button>
        <div className="flex space-x-2">
          <button
            onClick={() => revalidator.revalidate()}
            disabled={revalidator.state === "loading" || actionLoading}
            className="flex items-center rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${revalidator.state === "loading" ? "animate-spin" : ""}`} />
            {revalidator.state === "loading" ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => navigate(teamsBasePath)}
            className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
            disabled={actionLoading}
          >
            Close
          </button>
        </div>
      </div>

      <Suspense fallback={<TeamDetailsSkeleton />}>
        <Await
          resolve={Promise.all([loaderData.team, loaderData.users])}
          errorElement={<TeamDetailsError error="Failed to load team data" onBack={() => navigate(teamsBasePath)} />}
        >
          {([team, allUsers]) => {
            if (!team) {
              return <TeamDetailsError error="Team not found" onBack={() => navigate(teamsBasePath)} />;
            }

            const teamMembers = team.users || team.members || [];
            const teamProjects = team.projects || [];
            const averageProgress = calculateAverageProgress(teamProjects);
            const availableUsers = allUsers.filter(
              (userItem) =>
                !teamMembers.some((member) => member.id === userItem.id) &&
                userItem.role !== "admin",
            );

            return (
              <>
                <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                    <div className="flex items-center space-x-4">
                      <div
                        className="flex h-20 w-20 items-center justify-center rounded-xl text-3xl font-bold text-white"
                        style={{ backgroundColor: "#4DA5AD" }}
                      >
                        {team.name?.charAt(0).toUpperCase() || "T"}
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                          {team.name || "N/A"}{" "}
                          <span className="text-sm font-normal text-gray-500">(ID: {team.id})</span>
                        </h1>
                        <p className="mt-1 text-gray-600">
                          <span className="font-medium">Team Lead:</span> {team.leadName || team.lead || "Unassigned"}
                        </p>
                        {team.description && <p className="mt-2 max-w-2xl text-gray-500">{team.description}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 rounded-lg bg-gray-50 p-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[#4DA5AD]">{teamMembers.length}</div>
                        <div className="text-sm text-gray-600">Members</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[#4DA5AD]">{teamProjects.length}</div>
                        <div className="text-sm text-gray-600">Projects</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[#4DA5AD]">{averageProgress}%</div>
                        <div className="text-sm text-gray-600">Avg. Progress</div>
                      </div>
                    </div>
                  </div>
                </div>

                {!canManageTeams && (
                  <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    {isAdminSide ? (
                      <>
                        View-only mode. Admins can still view team details, but management actions stay hidden unless the{" "}
                        <span className="mx-1 font-semibold">manage_teams</span> permission is granted.
                      </>
                    ) : (
                      <>View-only mode. Team management is normally available to project managers by default, but it has been revoked for this account.</>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-900">Team Members ({teamMembers.length})</h2>
                      {canManageTeams && (
                        <button
                          onClick={() => setShowAddMemberPopup(true)}
                          disabled={actionLoading}
                          className="flex items-center rounded-lg bg-[#4DA5AD] px-3 py-2 text-sm text-white hover:bg-[#3D8B93] disabled:opacity-50"
                        >
                          <UserPlus className="mr-1 h-4 w-4" /> Add Member
                        </button>
                      )}
                    </div>

                    <div className="max-h-96 space-y-3 overflow-y-auto">
                      {teamMembers.length === 0 ? (
                        <div className="rounded-lg bg-gray-50 py-8 text-center">
                          <p className="text-gray-500">No members in this team</p>
                          {canManageTeams && (
                            <button
                              onClick={() => setShowAddMemberPopup(true)}
                              className="mt-2 text-sm text-[#4DA5AD] hover:underline"
                            >
                              Add your first member
                            </button>
                          )}
                        </div>
                      ) : (
                        teamMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] text-lg font-bold text-white">
                                {member.name?.charAt(0).toUpperCase() || "U"}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{member.name}</p>
                                <p className="text-sm text-gray-500">{member.email}</p>
                                <p className="mt-1 text-xs capitalize text-gray-400">
                                  {member.role?.replace(/[_-]/g, " ")}
                                </p>
                              </div>
                            </div>
                            {canManageTeams && (
                              <button
                                onClick={() => removeTeamMember(member.id)}
                                disabled={actionLoading}
                                className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                                title="Remove member"
                              >
                                <UserMinus className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-900">Team Projects ({teamProjects.length})</h2>
                    </div>

                    <div className="max-h-96 space-y-4 overflow-y-auto">
                      {teamProjects.length === 0 ? (
                        <div className="rounded-lg bg-gray-50 py-8 text-center">
                          <p className="text-gray-500">No projects assigned to this team</p>
                        </div>
                      ) : (
                        teamProjects.map((project) => (
                          <div
                            key={project.id}
                            className="cursor-pointer rounded-lg border border-gray-200 p-4 transition hover:shadow-md"
                            onClick={() => setSelectedProject(project)}
                          >
                            <div className="mb-3 flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-900">{project.name}</h3>
                                {project.description && (
                                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{project.description}</p>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`rounded px-2 py-1 text-xs font-medium ${getPriorityColor(project.priority)}`}>
                                  {project.priority || "Low"}
                                </span>
                                <span className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(project.status)}`}>
                                  {project.status?.replace(/[_-]/g, " ") || "Planned"}
                                </span>
                              </div>
                            </div>

                            <div className="mb-3">
                              <div className="mb-1 flex justify-between text-sm text-gray-600">
                                <span>Progress</span>
                                <span className="font-medium">{project.progress || 0}%</span>
                              </div>
                              <div className="h-2.5 w-full rounded-full bg-gray-200">
                                <div
                                  className="h-2.5 rounded-full bg-[#4DA5AD] transition-all duration-300"
                                  style={{ width: `${project.progress || 0}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Manager:</span> {project.managerName || project.manager || "N/A"}
                                <span className="mx-2">•</span>
                                <span className="font-medium">Due:</span>{" "}
                                {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "N/A"}
                              </div>
                              {canManageTeams && (
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    removeProject(project.id);
                                  }}
                                  disabled={actionLoading}
                                  className="rounded-lg bg-red-50 px-3 py-1 text-sm text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {showAddMemberPopup && canManageTeams && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl border border-gray-200 bg-white shadow-2xl">
                      <div className="flex items-center justify-between border-b border-gray-200 p-6">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">Add Members to Team</h2>
                          <p className="mt-1 text-sm text-gray-500">Select users to add to {team.name}</p>
                        </div>
                        <button
                          onClick={() => setShowAddMemberPopup(false)}
                          className="rounded-lg p-2 hover:bg-gray-100"
                          disabled={actionLoading}
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6">
                        {availableUsers.length === 0 ? (
                          <p className="py-8 text-center text-gray-500">No available users to add</p>
                        ) : (
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {availableUsers.map((userItem) => (
                              <div
                                key={userItem.id}
                                className="cursor-pointer rounded-lg border border-gray-200 p-4 transition hover:border-[#4DA5AD]"
                                onClick={() => addTeamMember(userItem.id)}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] text-lg font-bold text-white">
                                    {userItem.name?.charAt(0).toUpperCase() || "U"}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900">{userItem.name}</p>
                                    <p className="text-sm text-gray-500">{userItem.email}</p>
                                    <p className="mt-1 text-xs capitalize text-gray-400">
                                      {userItem.role?.replace(/[_-]/g, " ")}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-gray-200 p-6">
                        <button
                          onClick={() => setShowAddMemberPopup(false)}
                          className="w-full rounded-lg border border-gray-300 py-2 text-gray-700 transition hover:bg-gray-50"
                          disabled={actionLoading}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedProject && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
                      <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h2>
                        <button
                          onClick={() => setSelectedProject(null)}
                          className="rounded-lg p-2 hover:bg-gray-100"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="space-y-6">
                        {selectedProject.description && (
                          <div>
                            <h3 className="mb-2 text-sm font-medium text-gray-500">Description</h3>
                            <p className="text-gray-700">{selectedProject.description}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-lg bg-gray-50 p-4">
                            <p className="mb-1 text-sm text-gray-500">Status</p>
                            <p className="font-semibold capitalize">
                              {selectedProject.status?.replace(/[_-]/g, " ") || "Planned"}
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-4">
                            <p className="mb-1 text-sm text-gray-500">Priority</p>
                            <p className="font-semibold capitalize">{selectedProject.priority || "Medium"}</p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-4">
                            <p className="mb-1 text-sm text-gray-500">Manager</p>
                            <p className="font-semibold">
                              {selectedProject.managerName || selectedProject.manager || "Unassigned"}
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-4">
                            <p className="mb-1 text-sm text-gray-500">Due Date</p>
                            <p className="font-semibold">
                              {selectedProject.dueDate
                                ? new Date(selectedProject.dueDate).toLocaleDateString()
                                : "Not set"}
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 flex justify-between text-sm text-gray-600">
                            <span>Progress</span>
                            <span className="font-semibold">{selectedProject.progress || 0}%</span>
                          </div>
                          <div className="h-4 w-full rounded-full bg-gray-200">
                            <div
                              className="h-4 rounded-full bg-[#4DA5AD] transition-all duration-300"
                              style={{ width: `${selectedProject.progress || 0}%` }}
                            />
                          </div>
                        </div>

                        <div className="pt-4">
                          <button
                            onClick={() => setSelectedProject(null)}
                            className="w-full rounded-lg bg-[#4DA5AD] py-3 font-medium text-white transition hover:bg-[#3D8B93]"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          }}
        </Await>
      </Suspense>
    </div>
  );
};

export default SharedTeamDetailsPage;
