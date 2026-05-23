import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  Download,
  Edit,
  FolderKanban,
  Paperclip,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import {
  deleteProject as deleteProjectApi,
  getProjectById,
  getProjectMembers,
  resolveProjectProgress,
} from "../../services/projectsService";
import { deleteTask, getTasksByProject } from "../../services/tasksService";
import { useAuth } from "../../context/AuthContext";
import { PERMISSIONS } from "../../config/permissions";
import {
  getProjectEditPath,
  getProjectsBasePath,
  getProjectTaskCreatePath,
  getProjectTaskDetailsPath,
  isAdminProjectsView,
  resolveCanManageProjects,
} from "./projectAccess";

const SharedProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  const isAdminView = isAdminProjectsView(location.pathname);
  const canManageProjects = resolveCanManageProjects(user, location.pathname);
  const canAssignTasks = hasPermission(PERMISSIONS.ASSIGN_TASKS);
  const canManageProjectTasks = canManageProjects && canAssignTasks;
  const projectsPath = getProjectsBasePath(location.pathname);
  const editProjectPath = getProjectEditPath(location.pathname, id);
  const taskCreatePath = getProjectTaskCreatePath(location.pathname, id);

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  const projectProgress = resolveProjectProgress(project, projectTasks);

  useEffect(() => {
    const fetchProjectData = async () => {
      setLoading(true);
      try {
        const [projectData, tasksData, membersData] = await Promise.all([
          getProjectById(id),
          getTasksByProject(id),
          getProjectMembers(id),
        ]);

        setProject(projectData);
        setProjectTasks(Array.isArray(tasksData) ? tasksData : []);
        setTeamMembers(Array.isArray(membersData) ? membersData : []);
      } catch (error) {
        alert(error.message || "Failed to fetch project details.");
        navigate(projectsPath);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [id, navigate, projectsPath]);

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      await deleteTask(taskId);
      setProjectTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
      alert("Task deleted successfully!");
    } catch (error) {
      alert(error.message || "Failed to delete task.");
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm("Are you sure you want to delete this project? All associated tasks will also be deleted.")) {
      return;
    }

    try {
      await deleteProjectApi(id);
      navigate(projectsPath);
    } catch (error) {
      alert(error.message || "Failed to delete project.");
    }
  };

  if (loading || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#4DA5AD]" />
          <p className="mt-4 text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <button onClick={() => navigate(projectsPath)} className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </button>
        {canManageProjects && (
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(editProjectPath)}
              className="flex items-center rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
            >
              <Edit className="mr-2 h-4 w-4" /> Edit Project
            </button>
            <button
              onClick={handleDeleteProject}
              className="flex items-center rounded-lg border border-red-300 px-4 py-2 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Project
            </button>
          </div>
        )}
      </div>

      {!canManageProjects && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {isAdminView
            ? "View-only mode. Admins can still see project details, but project-management actions are hidden unless the "
            : "View-only mode. You can still see project details, but project-management actions are hidden because the "}
          <span className="font-semibold">manage_projects</span>
          {isAdminView ? " permission is granted." : " permission has been revoked for this account."}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="mt-2 text-gray-600">{project.description || "No description"}</p>
            {project.attachmentUrl && (
              <a
                href={project.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-[#194f87] hover:bg-gray-100"
              >
                <Paperclip className="h-4 w-4" />
                <span>{project.attachmentName || "Project attachment"}</span>
                <Download className="h-4 w-4" />
              </a>
            )}
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              project.status === "active"
                ? "bg-green-100 text-green-800"
                : project.status === "completed"
                  ? "bg-blue-100 text-blue-800"
                  : project.status === "planned"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-gray-100 text-gray-800"
            }`}
          >
            {project.status?.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <div className="text-3xl font-bold text-gray-900">{projectProgress}%</div>
            <div className="text-sm text-gray-600">Progress</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <div className="text-3xl font-bold text-gray-900">{projectTasks.length}</div>
            <div className="text-sm text-gray-600">Tasks</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <div className="text-3xl font-bold text-gray-900">{teamMembers.length}</div>
            <div className="text-sm text-gray-600">Team Members</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{project.dueDate || project.endDate || "N/A"}</div>
            <div className="text-sm text-gray-600">Deadline</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-blue-50 p-3">
            <div className="mb-1 flex items-center text-sm text-blue-600">
              <FolderKanban className="mr-2 h-4 w-4" /> Team
            </div>
            <div className="font-medium text-blue-800">{project.teamName || "Unassigned"}</div>
          </div>
          <div className="rounded-lg bg-green-50 p-3">
            <div className="mb-1 flex items-center text-sm text-green-600">
              <Calendar className="mr-2 h-4 w-4" /> Timeline
            </div>
            <div className="font-medium text-green-800">
              {project.startDate || "N/A"} to {project.dueDate || project.endDate || "N/A"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Project Tasks ({projectTasks.length})</h2>
            {canManageProjectTasks && taskCreatePath && (
              <button
                onClick={() => navigate(taskCreatePath)}
                className="flex items-center rounded-lg bg-[#4DA5AD] px-3 py-1 text-sm text-white hover:bg-[#3D8B93]"
              >
                <Plus className="mr-1 h-4 w-4" /> Add Task
              </button>
            )}
          </div>

          {projectTasks.length > 0 ? (
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {projectTasks.map((task) => {
                const taskDetailsPath = getProjectTaskDetailsPath(location.pathname, task.id);
                return (
                  <div
                    key={task.id}
                    className={`rounded-lg border border-gray-200 p-4 transition hover:shadow-sm ${taskDetailsPath ? "cursor-pointer" : ""}`}
                    onClick={() => taskDetailsPath && navigate(taskDetailsPath)}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{task.title || task.name}</h3>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <User className="mr-1 h-3 w-3" />
                          <span>{task.assigneeName || task.assignee || "Unassigned"}</span>
                        </div>
                      </div>
                      {canManageProjectTasks && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="mr-4 flex-1">
                        <div className="mb-1 flex justify-between text-sm text-gray-600">
                          <span>Progress</span>
                          <span>{task.progress || 0}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div className="h-2 rounded-full bg-[#4DA5AD]" style={{ width: `${task.progress || 0}%` }} />
                        </div>
                      </div>
                      <span
                        className={`rounded px-2 py-1 text-xs ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : task.status === "in-progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {task.status || "pending"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <CheckSquare className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="text-gray-500">No tasks assigned to this project yet.</p>
              {canManageProjectTasks && taskCreatePath && (
                <button
                  onClick={() => navigate(taskCreatePath)}
                  className="mt-3 rounded-lg bg-[#4DA5AD] px-4 py-2 text-sm text-white hover:bg-[#3D8B93]"
                >
                  Create First Task
                </button>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-bold text-gray-900">Team Members ({teamMembers.length})</h2>
          {teamMembers.length > 0 ? (
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] font-medium text-white">
                      {member.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.role || "Team Member"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <User className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="text-gray-500">No team members assigned to this project.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedProjectDetailsPage;
