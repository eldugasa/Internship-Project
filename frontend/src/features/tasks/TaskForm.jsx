import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Download, Loader2, Paperclip, Save, Users, X } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getProjectMembers, getProjects } from "../../services/projectsService";
import { getTaskById, createTask, updateTask } from "../../services/tasksService";
import { getUsers } from "../../services/usersService";
import {
  TASK_MODES,
  getTaskBasePath,
  getTaskDetailsPath,
} from "./taskAccess";

const isNotEmpty = (value) => value?.toString().trim() !== "";

const isFutureDate = (dateString) => {
  if (!dateString) return false;
  const selectedDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);
  return selectedDate >= today;
};

const isValidPriority = (priority) =>
  ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority?.toUpperCase());

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read the selected file."));
    reader.readAsDataURL(file);
  });

const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const createInitialValues = (projectId = "") => ({
  title: "",
  description: "",
  attachment: null,
  attachmentMimeType: "",
  attachmentName: "",
  attachmentUrl: "",
  projectId,
  assigneeId: "",
  qaTesterId: "",
  dueDate: "",
  priority: "MEDIUM",
});

const mapTaskToValues = (task) => ({
  title: task?.title || "",
  description: task?.description || "",
  attachment: null,
  attachmentMimeType: task?.attachmentMimeType || "",
  attachmentName: task?.attachmentName || "",
  attachmentUrl: task?.attachmentUrl || "",
  projectId: task?.projectId ? String(task.projectId) : "",
  assigneeId: task?.assigneeId ? String(task.assigneeId) : "",
  qaTesterId: task?.qaTesterId ? String(task.qaTesterId) : "",
  dueDate: task?.rawDueDate
    ? new Date(task.rawDueDate).toISOString().split("T")[0]
    : "",
  priority: task?.priority?.toUpperCase() || "MEDIUM",
});

const validateTaskForm = (values) => {
  const errors = [];

  if (!isNotEmpty(values.title)) {
    errors.push("Task title is required.");
  }

  if (!isNotEmpty(values.projectId)) {
    errors.push("Please select a project.");
  }

  if (!isNotEmpty(values.assigneeId)) {
    errors.push("Please assign this task to a team member.");
  }

  if (!isNotEmpty(values.dueDate)) {
    errors.push("Due date is required.");
  } else if (!isFutureDate(values.dueDate)) {
    errors.push("Due date cannot be in the past.");
  }

  if (!isValidPriority(values.priority)) {
    errors.push("Please select a valid priority.");
  }

  return errors;
};

const TaskForm = ({ formMode = "create" }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get("projectId") || "";

  const [projects, setProjects] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [availableQaTesters, setAvailableQaTesters] = useState([]);
  const [values, setValues] = useState(createInitialValues(initialProjectId));
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [errors, setErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachmentDirty, setAttachmentDirty] = useState(false);

  const isEditMode = formMode === "edit";
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const loadFormData = async () => {
      setLoading(true);

      try {
        const [projectsData, usersData, taskData] = await Promise.all([
          getProjects(),
          getUsers(),
          isEditMode ? getTaskById(id) : Promise.resolve(null),
        ]);

        setProjects(Array.isArray(projectsData) ? projectsData : []);
        setAvailableQaTesters(Array.isArray(usersData) ? usersData : []);

        if (taskData) {
          setValues(mapTaskToValues(taskData));
          setAttachmentDirty(false);
        }
      } catch (error) {
        console.error("Error loading task form:", error);
        setErrors([error.message || "Failed to load task form"]);
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, [id, isEditMode]);

  useEffect(() => {
    const loadMembers = async () => {
      if (!values.projectId) {
        setAvailableMembers([]);
        return;
      }

      setLoadingMembers(true);
      try {
        const members = await getProjectMembers(values.projectId);
        setAvailableMembers(Array.isArray(members) ? members : []);
      } catch (error) {
        console.error("Error fetching project members:", error);
        setAvailableMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };

    loadMembers();
  }, [values.projectId]);

  const qaTesters = useMemo(
    () =>
      availableQaTesters.filter((member) =>
        member.role?.toLowerCase() === "qa-tester",
      ),
    [availableQaTesters],
  );

  const teamMembers = useMemo(
    () =>
      availableMembers.filter(
        (member) =>
          member.role?.toLowerCase() !== "qa-tester",
      ),
    [availableMembers],
  );

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === values.projectId),
    [projects, values.projectId],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const handleAttachmentChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
        throw new Error("Unsupported file type. Please upload PDF, JPG, PNG, TXT, DOCX, or XLSX.");
      }

      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        throw new Error("Attachment must be 5 MB or smaller.");
      }

      const content = await fileToDataUrl(file);
      setValues((current) => ({
        ...current,
        attachment: { content, name: file.name, type: file.type },
        attachmentMimeType: file.type || "",
        attachmentName: file.name,
        attachmentUrl: "",
      }));
      setAttachmentDirty(true);
    } catch (error) {
      setErrors([error.message || "Failed to read the selected file."]);
    } finally {
      event.target.value = "";
    }
  };

  const handleAttachmentRemove = () => {
    setValues((current) => ({
      ...current,
      attachment: null,
      attachmentMimeType: "",
      attachmentName: "",
      attachmentUrl: "",
    }));
    setAttachmentDirty(true);
  };

  const handleCancel = () => {
    navigate(getTaskBasePath(TASK_MODES.MANAGER));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateTaskForm(values);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setIsSubmitting(true);

    const payload = {
      title: values.title,
      description: values.description,
      projectId: Number(values.projectId),
      assigneeId: Number(values.assigneeId),
      qaTesterId: values.qaTesterId ? Number(values.qaTesterId) : null,
      dueDate: new Date(values.dueDate).toISOString(),
      priority: values.priority.toUpperCase(),
      attachment: attachmentDirty ? values.attachment : undefined,
      removeAttachment:
        isEditMode &&
        attachmentDirty &&
        !values.attachment &&
        !values.attachmentUrl,
    };

    try {
      if (isEditMode) {
        const updatedTask = await updateTask(id, payload);
        setSuccessMessage("Task updated successfully!");
        setTimeout(() => {
          navigate(getTaskDetailsPath(TASK_MODES.MANAGER, updatedTask.id));
        }, 1200);
      } else {
        const newTask = await createTask(payload);
        setSuccessMessage(`Task "${newTask.title}" created successfully!`);
        setTimeout(() => {
          navigate(
            values.projectId
              ? `/manager/projects/${values.projectId}`
              : getTaskDetailsPath(TASK_MODES.MANAGER, newTask.id),
          );
        }, 1200);
      }
    } catch (error) {
      setErrors([error.message || "Failed to save task"]);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#4DA5AD] mx-auto" />
          <p className="mt-4 text-gray-600">Loading task form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? "Edit Task" : "Create New Task"}
          </h1>
          <p className="text-gray-600">
            {isEditMode
              ? "Update task details and assignment"
              : "Assign task to team members of the selected project"}
          </p>
        </div>
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-gray-100 rounded-lg"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{successMessage}</p>
            <p className="text-sm text-green-600 mt-1">Redirecting...</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Task Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                name="title"
                value={values.title}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                placeholder="Enter task title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                rows="3"
                value={values.description}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                placeholder="Describe the task"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachment
              </label>
              <input
                type="file"
                onChange={handleAttachmentChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-[#4DA5AD] file:px-3 file:py-2 file:text-white"
              />
              {(values.attachmentName || values.attachmentUrl) && (
                <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Paperclip className="w-4 h-4 text-[#4DA5AD]" />
                    <span className="font-medium">{values.attachmentName}</span>
                  </div>
                  {values.attachmentUrl && (
                    <a
                      href={values.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-[#4DA5AD] hover:underline"
                    >
                      <Download className="w-4 h-4" />
                      Open file
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleAttachmentRemove}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Optional. Add one file related to this task.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project *
                </label>
                <select
                  name="projectId"
                  value={values.projectId}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To *
                </label>
                {!values.projectId ? (
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <Users className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Select a project first
                    </p>
                  </div>
                ) : loadingMembers ? (
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-[#4DA5AD] mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">
                      Loading members...
                    </p>
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-500">
                      No team members available
                    </p>
                  </div>
                ) : (
                  <select
                    name="assigneeId"
                    value={values.assigneeId}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                  >
                    <option value="">Select team member</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.role || "Team Member"})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QA Tester
                </label>
                {qaTesters.length === 0 ? (
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-500">
                      No QA testers available. The project manager will handle
                      QA.
                    </p>
                  </div>
                ) : (
                  <>
                    <select
                      name="qaTesterId"
                      value={values.qaTesterId}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                    >
                      <option value="">
                        Leave empty to use the project manager
                      </option>
                      {qaTesters.map((tester) => (
                        <option key={tester.id} value={tester.id}>
                          {tester.name} ({tester.role || "QA Tester"})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Leave this blank if the project manager will handle QA.
                    </p>
                  </>
                )}
              </div>
            </div>

            {selectedProject && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Selected Project:</span>{" "}
                  {selectedProject.name}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={values.dueDate}
                  onChange={handleChange}
                  min={today}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be today or a future date
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={values.priority}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800 mb-1">
                Please fix the following errors:
              </h3>
              <ul className="list-disc list-inside text-sm text-red-700">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !!successMessage}
            className="px-6 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] transition flex items-center disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditMode
              ? isSubmitting
                ? "Updating..."
                : "Update Task"
              : isSubmitting
                ? "Creating..."
                : "Create & Assign Task"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
