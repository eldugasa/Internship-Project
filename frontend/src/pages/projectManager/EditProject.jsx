// src/components/projectManager/EditProject.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useActionState } from 'react';
import { X, Save, Users, Loader2, AlertCircle } from 'lucide-react';
import { getProjectById, updateProject } from '../../services/projectsService';
import { getTeams } from '../../services/teamsService';

// Validation functions
const isNotEmpty = (value) => value?.trim() !== '';
const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};
const isEndDateAfterStart = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end >= start;
};

const EditProject = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isAdminView = location.pathname.startsWith('/admin');
  const projectDetailsPath = isAdminView
    ? `/admin/projects/${id}`
    : `/manager/projects/${id}`;

  const [teams, setTeams] = useState([]);
  const [fetchingData, setFetchingData] = useState(true);
  const [initialProjectData, setInitialProjectData] = useState(null);

  // Parse dates in various formats (DD/MM/YYYY, YYYY-MM-DD, etc.)
  const parseDate = (dateString) => {
    if (!dateString) return null;
    
    try {
      if (typeof dateString === 'string' && dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        if (day && month && year) {
          return new Date(`${year}-${month}-${day}`);
        }
      }
      
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      return null;
    } catch (err) {
      console.warn('Date parsing error:', err);
      return null;
    }
  };

  // Format date for input fields (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = parseDate(dateString);
      if (!date) return '';
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (err) {
      console.warn('Date formatting error:', err);
      return '';
    }
  };

  // Fetch project details and teams
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchingData(true);
        
        const [projectData, teamsData] = await Promise.all([
          getProjectById(id),
          getTeams()
        ]);

        setTeams(teamsData);

        const initialData = {
          name: projectData.name || '',
          description: projectData.description || '',
          startDate: formatDateForInput(projectData.startDate),
          endDate: formatDateForInput(projectData.dueDate || projectData.endDate),
          selectedTeam: projectData.teamId?.toString() || '',
          status: projectData.status || 'planned'
        };
        
        setInitialProjectData(initialData);

      } catch (err) {
        console.error("Failed to fetch project:", err);
      } finally {
        setFetchingData(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const editProjectAction = async (prevFormState, formData) => {
    const name = formData.get("name");
    const description = formData.get("description");
    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");
    const selectedTeam = formData.get("selectedTeam");
    const status = formData.get("status");

    let errors = [];

    // Validate required fields
    if (!isNotEmpty(name)) {
      errors.push("Project name is required.");
    }

    if (!isNotEmpty(startDate)) {
      errors.push("Start date is required.");
    } else if (!isValidDate(startDate)) {
      errors.push("Please enter a valid start date.");
    }

    if (!isNotEmpty(endDate)) {
      errors.push("End date is required.");
    } else if (!isValidDate(endDate)) {
      errors.push("Please enter a valid end date.");
    }

    if (startDate && endDate && !isEndDateAfterStart(startDate, endDate)) {
      errors.push("End date must be after start date.");
    }

    if (!isNotEmpty(selectedTeam)) {
      errors.push("Please select a team for this project.");
    }

    // If validation fails, return errors and entered values
    if (errors.length > 0) {
      return {
        errors,
        enteredValues: {
          name,
          description,
          startDate,
          endDate,
          selectedTeam,
          status
        },
        success: false
      };
    }

    // Validation passed - call API
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const projectData = {
        name,
        description,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        status,
        teamId: parseInt(selectedTeam, 10),
      };

      const updatedProject = await updateProject(id, projectData);

      return {
        errors: null,
        success: true,
        message: `Project "${updatedProject.name}" updated successfully!`,
        projectId: id
      };
    } catch (err) {
      return {
        errors: [err.message || 'Failed to update project'],
        enteredValues: {
          name,
          description,
          startDate,
          endDate,
          selectedTeam,
          status
        },
        success: false
      };
    }
  };

  const [formState, formAction, isPending] = useActionState(editProjectAction, {
    errors: null,
    enteredValues: initialProjectData || {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      selectedTeam: '',
      status: 'planned'
    },
    success: false
  });

  // Redirect on success
  if (formState.success) {
    setTimeout(() => {
      navigate(
        isAdminView
          ? `/admin/projects/${formState.projectId}`
          : `/manager/projects/${formState.projectId}`
      );
    }, 1500);
  }

  const selectedTeamDetails = teams.find(t => t.id === parseInt(formState.enteredValues?.selectedTeam || initialProjectData?.selectedTeam, 10));

  if (fetchingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: '#194f87' }} />
          <p className="text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Edit Project
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Update project details and team assignment
            </p>
          </div>

          <button
            onClick={() => navigate(projectDetailsPath)}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Success Message */}
        {formState.success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{formState.message}</p>
            <p className="text-sm text-green-600 mt-1">Redirecting to project details...</p>
          </div>
        )}

     

        <form action={formAction} className="space-y-6">
          {/* Project Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Project Information
            </h2>

            <div className="space-y-4">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={formState.enteredValues?.name || initialProjectData?.name}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
                  placeholder="Enter project name"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="3"
                  defaultValue={formState.enteredValues?.description || initialProjectData?.description}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
                  placeholder="Describe the project"
                />
              </div>

              {/* Project Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Status
                </label>
                <select
                  name="status"
                  defaultValue={formState.enteredValues?.status || initialProjectData?.status}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
                >
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={formState.enteredValues?.startDate || initialProjectData?.startDate}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    defaultValue={formState.enteredValues?.endDate || initialProjectData?.endDate}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Team Assignment */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: '#0f5841' }} />
              Assign to Team
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Team *
              </label>

              <select
                name="selectedTeam"
                defaultValue={formState.enteredValues?.selectedTeam || initialProjectData?.selectedTeam}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#194f87] focus:border-transparent"
              >
                <option value="">Choose a team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} {team.lead ? `(Lead: ${team.lead})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Team Details */}
            {selectedTeamDetails && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">
                  Selected Team Details
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Team Lead:</span>{' '}
                    {selectedTeamDetails.lead || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Description:</span>{' '}
                    {selectedTeamDetails.description || "No description"}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Members:</span>{' '}
                    {selectedTeamDetails.memberCount || 0}
                  </p>
                </div>
              </div>
            )}
          </div>
   {/* Error Display */}
        {formState.errors && formState.errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800 mb-1">Please fix the following errors:</h3>
              <ul className="list-disc list-inside text-sm text-red-700">
                {formState.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(projectDetailsPath)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition order-2 sm:order-1"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPending || formState.success}
              className="px-6 py-2 text-white rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 order-1 sm:order-2"
              style={{ background: `linear-gradient(to right, #0f5841, #194f87)` }}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProject;
