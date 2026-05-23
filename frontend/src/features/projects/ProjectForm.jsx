import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  Paperclip,
  Save,
  Search,
  Users,
  X,
} from "lucide-react";
import { createProject, getProjectById, updateProject } from "../../services/projectsService";
import { getTeams } from "../../services/teamsService";
import { getProjectDetailsPath, getProjectsBasePath } from "./projectAccess";

const isNotEmpty = (value) => value?.trim() !== "";

const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !Number.isNaN(date.getTime());
};

const isFutureDate = (dateString) => {
  if (!isValidDate(dateString)) return false;
  const selectedDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);
  return selectedDate >= today;
};

const isEndDateAfterStart = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  return new Date(endDate) >= new Date(startDate);
};

const parseDate = (dateString) => {
  if (!dateString) return null;
  if (typeof dateString === "string" && dateString.includes("/")) {
    const [day, month, year] = dateString.split("/");
    if (day && month && year) {
      return new Date(`${year}-${month}-${day}`);
    }
  }
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateForInput = (dateString) => {
  const date = parseDate(dateString);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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

const defaultFormValues = {
  description: "",
  endDate: "",
  name: "",
  attachment: null,
  attachmentMimeType: "",
  attachmentName: "",
  attachmentUrl: "",
  selectedTeam: "",
  startDate: "",
  status: "planned",
};

const SharedProjectForm = ({ mode = "create" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditMode = mode === "edit";
  const projectsPath = getProjectsBasePath(location.pathname);
  const projectDetailsPath = getProjectDetailsPath(location.pathname, id);
  const today = new Date().toISOString().split("T")[0];
  const dropdownRef = useRef(null);

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState([]);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [showSelectedTeamDetails, setShowSelectedTeamDetails] = useState(false);
  const [formValues, setFormValues] = useState(defaultFormValues);
  const [attachmentDirty, setAttachmentDirty] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [teamsData, projectData] = await Promise.all([
          getTeams(),
          isEditMode && id ? getProjectById(id) : Promise.resolve(null),
        ]);

        setTeams(Array.isArray(teamsData) ? teamsData : []);

        if (projectData) {
          setFormValues({
            description: projectData.description || "",
            endDate: formatDateForInput(projectData.dueDate || projectData.endDate),
            name: projectData.name || "",
            attachment: null,
            attachmentMimeType: projectData.attachmentMimeType || "",
            attachmentName: projectData.attachmentName || "",
            attachmentUrl: projectData.attachmentUrl || "",
            selectedTeam: projectData.teamId?.toString() || "",
            startDate: formatDateForInput(projectData.startDate),
            status: projectData.status || "planned",
          });
          setAttachmentDirty(false);
        }
      } catch (error) {
        setErrors([error.message || `Failed to load ${isEditMode ? "project" : "teams"} data.`]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsTeamDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTeams = useMemo(() => {
    if (!teamSearchQuery.trim()) {
      return teams;
    }
    const query = teamSearchQuery.toLowerCase();
    return teams.filter((team) =>
      team.name?.toLowerCase().includes(query) ||
      team.lead?.toLowerCase().includes(query) ||
      team.description?.toLowerCase().includes(query)
    );
  }, [teamSearchQuery, teams]);

  const selectedTeamDetails = teams.find((team) => String(team.id) === String(formValues.selectedTeam));

  const validateForm = () => {
    const nextErrors = [];

    if (!isNotEmpty(formValues.name)) {
      nextErrors.push("Project name is required.");
    }

    if (!isNotEmpty(formValues.startDate)) {
      nextErrors.push("Start date is required.");
    } else if (!isValidDate(formValues.startDate)) {
      nextErrors.push("Please enter a valid start date.");
    } else if (!isEditMode && !isFutureDate(formValues.startDate)) {
      nextErrors.push("Start date cannot be in the past.");
    }

    if (!isNotEmpty(formValues.endDate)) {
      nextErrors.push("End date is required.");
    } else if (!isValidDate(formValues.endDate)) {
      nextErrors.push("Please enter a valid end date.");
    }

    if (
      formValues.startDate &&
      formValues.endDate &&
      !isEndDateAfterStart(formValues.startDate, formValues.endDate)
    ) {
      nextErrors.push("End date must be after start date.");
    }

    if (!isNotEmpty(formValues.selectedTeam)) {
      nextErrors.push("Please select a team for this project.");
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const handleChange = (field) => (event) => {
    setFormValues((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleTeamSelect = (teamId) => {
    setFormValues((current) => ({ ...current, selectedTeam: String(teamId) }));
    setIsTeamDropdownOpen(false);
    setTeamSearchQuery("");
  };

  const clearTeamSelection = () => {
    setFormValues((current) => ({ ...current, selectedTeam: "" }));
    setShowSelectedTeamDetails(false);
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
      setFormValues((current) => ({
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
    setFormValues((current) => ({
      ...current,
      attachment: null,
      attachmentMimeType: "",
      attachmentName: "",
      attachmentUrl: "",
    }));
    setAttachmentDirty(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setErrors([]);
    try {
      const payload = {
        description: formValues.description,
        endDate: new Date(formValues.endDate).toISOString(),
        name: formValues.name,
        attachment: attachmentDirty ? formValues.attachment : undefined,
        removeAttachment:
          isEditMode &&
          attachmentDirty &&
          !formValues.attachment &&
          !formValues.attachmentUrl,
        startDate: new Date(formValues.startDate).toISOString(),
        status: isEditMode ? formValues.status : "planned",
        teamId: parseInt(formValues.selectedTeam, 10),
      };

      if (isEditMode) {
        const updatedProject = await updateProject(id, payload);
        setSuccessMessage(`Project "${updatedProject.name}" updated successfully!`);
        setTimeout(() => navigate(projectDetailsPath), 1200);
      } else {
        const newProject = await createProject(payload);
        setSuccessMessage(`Project "${newProject.name}" created successfully!`);
        setTimeout(() => navigate(projectsPath), 1200);
      }
    } catch (error) {
      setErrors([error.message || `Failed to ${isEditMode ? "update" : "create"} project`]);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#194f87]" />
          <p className="text-gray-600">{isEditMode ? "Loading project details..." : "Loading teams..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {isEditMode ? "Edit Project" : "Create New Project"}
            </h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">
              {isEditMode ? "Update project details and team assignment" : "Create a project and assign it to a team"}
            </p>
          </div>
          <button
            onClick={() => navigate(isEditMode ? projectDetailsPath : projectsPath)}
            className="rounded-lg p-2 transition hover:bg-gray-200"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {successMessage && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-green-700">{successMessage}</p>
            <p className="mt-1 text-sm text-green-600">
              Redirecting to {isEditMode ? "project details" : "projects"}...
            </p>
          </div>
        )}

        {errors.length > 0 && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <div>
              <h3 className="mb-1 font-medium text-red-800">Please fix the following errors:</h3>
              <ul className="list-inside list-disc text-sm text-red-700">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Project Information</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Project Name *</label>
                <input
                  type="text"
                  value={formValues.name}
                  onChange={handleChange("name")}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#194f87]"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows="3"
                  value={formValues.description}
                  onChange={handleChange("description")}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#194f87]"
                  placeholder="Describe the project"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Attachment</label>
                <input
                  type="file"
                  onChange={handleAttachmentChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-[#194f87] file:px-3 file:py-2 file:text-white"
                />
                {(formValues.attachmentName || formValues.attachmentUrl) && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Paperclip className="h-4 w-4 text-[#194f87]" />
                      <span className="font-medium">{formValues.attachmentName}</span>
                    </div>
                    {formValues.attachmentUrl && (
                      <a
                        href={formValues.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-[#194f87] hover:underline"
                      >
                        <Download className="h-4 w-4" />
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
                <p className="mt-1 text-xs text-gray-500">Optional. Add one file related to this project.</p>
              </div>

              {isEditMode && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Project Status</label>
                  <select
                    value={formValues.status}
                    onChange={handleChange("status")}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#194f87]"
                  >
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Start Date *</label>
                  <input
                    type="date"
                    value={formValues.startDate}
                    onChange={handleChange("startDate")}
                    min={isEditMode ? undefined : today}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#194f87]"
                  />
                  {!isEditMode && <p className="mt-1 text-xs text-gray-500">Must be today or a future date</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">End Date *</label>
                  <input
                    type="date"
                    value={formValues.endDate}
                    onChange={handleChange("endDate")}
                    min={formValues.startDate || today}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#194f87]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Users className="h-5 w-5 text-[#0f5841]" />
              Assign to Team
            </h2>

            <label className="mb-2 block text-sm font-medium text-gray-700">Select Team *</label>

            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={teamSearchQuery}
                  onChange={(event) => setTeamSearchQuery(event.target.value)}
                  onFocus={() => setIsTeamDropdownOpen(true)}
                  placeholder="Search teams by name, lead or description..."
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-10 focus:border-transparent focus:ring-2 focus:ring-[#4DA5AD]"
                />
                {teamSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setTeamSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {isTeamDropdownOpen && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {filteredTeams.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No teams found matching "{teamSearchQuery}"
                    </div>
                  ) : (
                    filteredTeams.map((team) => (
                      <div
                        key={team.id}
                        className={`cursor-pointer border-b border-gray-100 p-3 transition-colors last:border-b-0 hover:bg-gray-50 ${
                          formValues.selectedTeam === String(team.id) ? "bg-blue-50" : ""
                        }`}
                        onClick={() => handleTeamSelect(team.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{team.name}</div>
                            <div className="text-sm text-gray-500">Lead: {team.lead || "N/A"}</div>
                            {team.description && <div className="mt-1 line-clamp-1 text-xs text-gray-400">{team.description}</div>}
                          </div>
                          {formValues.selectedTeam === String(team.id) && (
                            <span className="text-sm font-medium text-blue-600">Selected</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedTeamDetails && (
              <div className="mt-4">
                <div
                  className="cursor-pointer rounded-lg border border-blue-200 bg-blue-50 p-4 transition hover:bg-blue-100"
                  onClick={() => setShowSelectedTeamDetails((value) => !value)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Selected Team: {selectedTeamDetails.name}</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        Click to {showSelectedTeamDetails ? "hide" : "show"} details
                      </p>
                    </div>
                    {showSelectedTeamDetails ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>

                {showSelectedTeamDetails && (
                  <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-3 font-medium text-gray-900">Team Details</h3>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Team Lead:</span> {selectedTeamDetails.lead || "N/A"}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Description:</span> {selectedTeamDetails.description || "No description"}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Members:</span> {selectedTeamDetails.memberCount || 0}
                    </p>
                    <button
                      type="button"
                      onClick={clearTeamSelection}
                      className="mt-3 flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                      Clear selection
                    </button>
                  </div>
                )}
              </div>
            )}

            <p className="mt-2 text-xs text-gray-500">Search for a team by name, lead name, or description</p>
          </div>

          <div className="flex flex-col justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate(isEditMode ? projectDetailsPath : projectsPath)}
              className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || !!successMessage}
              className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#0f5841] to-[#194f87] px-6 py-2 text-white transition hover:shadow-lg disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {submitting
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                  ? "Update Project"
                  : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SharedProjectForm;
