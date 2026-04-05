// src/components/projectManager/CreateProject.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActionState } from 'react';
import { X, Save, Users, AlertCircle, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { createProject } from '../../services/projectsService';
import { getTeams } from '../../services/teamsService';

// Validation functions
const isNotEmpty = (value) => value?.trim() !== '';
const isFutureDate = (dateString) => {
  if (!dateString) return false;
  const selectedDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);
  return selectedDate >= today;
};
const isEndDateAfterStart = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end >= start;
};

const CreateProject = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [fetchingTeams, setFetchingTeams] = useState(true);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [showSelectedTeamDetails, setShowSelectedTeamDetails] = useState(false);
  
  // Ref for dropdown container
  const dropdownRef = useRef(null);

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setFetchingTeams(true);
        const data = await getTeams();
        setTeams(data);
      } catch (err) {
        console.error("Failed to fetch teams:", err);
        alert('Failed to load teams.');
      } finally {
        setFetchingTeams(false);
      }
    };

    fetchTeams();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsTeamDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter teams based on search query
  const filteredTeams = useMemo(() => {
    if (!teamSearchQuery.trim()) return teams;
    const query = teamSearchQuery.toLowerCase();
    return teams.filter(team => 
      team.name?.toLowerCase().includes(query) ||
      team.lead?.toLowerCase().includes(query) ||
      team.description?.toLowerCase().includes(query)
    );
  }, [teams, teamSearchQuery]);

  const createProjectAction = async (prevFormState, formData) => {
    const name = formData.get("name");
    const description = formData.get("description");
    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");
    const selectedTeam = formData.get("selectedTeam");

    let errors = [];

    // Validate required fields
    if (!isNotEmpty(name)) {
      errors.push("Project name is required.");
    }

    if (!isNotEmpty(startDate)) {
      errors.push("Start date is required.");
    } else if (!isFutureDate(startDate)) {
      errors.push("Start date cannot be in the past.");
    }

    if (!isNotEmpty(endDate)) {
      errors.push("End date is required.");
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
          selectedTeam
        },
        success: false
      };
    }

    // Validation passed - call API
    try {
      const projectData = {
        name,
        description,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        status: 'planned',
        teamId: parseInt(selectedTeam, 10),
      };

      const newProject = await createProject(projectData);

      return {
        errors: null,
        success: true,
        message: `Project "${newProject.name}" created successfully!`,
        project: newProject
      };
    } catch (err) {
      return {
        errors: [err.message || 'Failed to create project'],
        enteredValues: {
          name,
          description,
          startDate,
          endDate,
          selectedTeam
        },
        success: false
      };
    }
  };

  const [formState, formAction, isPending] = useActionState(createProjectAction, {
    errors: null,
    enteredValues: {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      selectedTeam: ''
    },
    success: false
  });

  // Update selected team ID when form values change
  useEffect(() => {
    if (formState.enteredValues?.selectedTeam) {
      setSelectedTeamId(formState.enteredValues.selectedTeam);
    }
  }, [formState.enteredValues?.selectedTeam]);

  // Redirect on success
  if (formState.success) {
    setTimeout(() => {
      navigate('/manager/projects');
    }, 1500);
  }

  const selectedTeamDetails = teams.find(t => t.id === parseInt(selectedTeamId, 10));

  const handleTeamSelect = (teamId) => {
    setSelectedTeamId(teamId);
    setIsTeamDropdownOpen(false);
    setTeamSearchQuery('');
  };

  const clearTeamSelection = () => {
    setSelectedTeamId('');
    setShowSelectedTeamDetails(false);
  };

  const handleSearchFocus = () => {
    setIsTeamDropdownOpen(true);
  };

  if (fetchingTeams) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Create New Project
          </h1>
          <p className="text-gray-600">
            Create project and assign to a team
          </p>
        </div>

        <button
          onClick={() => navigate('/manager/projects')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form action={formAction} className="space-y-6">
        {/* Hidden input for selected team */}
        <input type="hidden" name="selectedTeam" value={selectedTeamId} />

        {/* Success Message */}
        {formState.success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{formState.message}</p>
            <p className="text-sm text-green-600 mt-1">Redirecting to projects...</p>
          </div>
        )}

        {/* Error Display */}
        {formState.errors && formState.errors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
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

        {/* Project Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Project Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                name="name"
                defaultValue={formState.enteredValues?.name}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                placeholder="Enter project name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                rows="3"
                defaultValue={formState.enteredValues?.description}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                placeholder="Describe the project"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  defaultValue={formState.enteredValues?.startDate}
                  min={today}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be today or a future date
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  defaultValue={formState.enteredValues?.endDate}
                  min={formState.enteredValues?.startDate || today}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Team Assignment with Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Assign to Team
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Team *
            </label>

            {/* Search and Dropdown Container */}
            <div className="relative" ref={dropdownRef}>
              {/* Search Input for Teams */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  onFocus={handleSearchFocus}
                  placeholder="Search teams by name, lead or description..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                />
                {teamSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setTeamSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Dropdown List */}
              {isTeamDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredTeams.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No teams found matching "{teamSearchQuery}"
                    </div>
                  ) : (
                    filteredTeams.map(team => (
                      <div
                        key={team.id}
                        className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                          selectedTeamId === String(team.id) ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleTeamSelect(team.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">{team.name}</div>
                            <div className="text-sm text-gray-500">
                              Lead: {team.lead || 'N/A'}
                            </div>
                            {team.description && (
                              <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                                {team.description}
                              </div>
                            )}
                          </div>
                          {selectedTeamId === String(team.id) && (
                            <span className="text-blue-600 text-sm font-medium">Selected</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected Team Display */}
            {selectedTeamDetails && (
              <div className="mt-4">
                <div 
                  className="p-4 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition"
                  onClick={() => setShowSelectedTeamDetails(!showSelectedTeamDetails)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Selected Team: {selectedTeamDetails.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Click to {showSelectedTeamDetails ? 'hide' : 'show'} details
                      </p>
                    </div>
                    {showSelectedTeamDetails ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>

                {showSelectedTeamDetails && (
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-3">
                      Team Details
                    </h3>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Team Lead:</span>{' '}
                      {selectedTeamDetails.lead || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Description:</span>{' '}
                      {selectedTeamDetails.description || "No description"}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Members:</span>{' '}
                      {selectedTeamDetails.memberCount || 0}
                    </p>
                    <button
                      type="button"
                      onClick={clearTeamSelection}
                      className="mt-3 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Clear selection
                    </button>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
              Search for a team by name, lead name, or description
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/manager/projects')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isPending || formState.success}
            className="px-6 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] transition flex items-center disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isPending ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProject;