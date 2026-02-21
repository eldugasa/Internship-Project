// src/components/projectManager/EditProject.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Save, Users, Loader2 } from 'lucide-react';
import { getProjectById, updateProject } from '../../services/projectsService';
import { getTeams } from '../../services/teamsService';

const EditProject = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [project, setProject] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    selectedTeam: '',
    status: 'planned'
  });

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState('');

  // Parse dates in various formats (DD/MM/YYYY, YYYY-MM-DD, etc.)
  const parseDate = (dateString) => {
    if (!dateString) return null;
    
    try {
      // Check if it's in DD/MM/YYYY format
      if (typeof dateString === 'string' && dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        if (day && month && year) {
          return new Date(`${year}-${month}-${day}`);
        }
      }
      
      // Try standard date parsing
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
        
        // Fetch both project and teams in parallel
        const [projectData, teamsData] = await Promise.all([
          getProjectById(id),
          getTeams()
        ]);

        setTeams(teamsData);

        // Safely format dates with fallbacks
        setProject({
          name: projectData.name || '',
          description: projectData.description || '',
          startDate: formatDateForInput(projectData.startDate),
          endDate: formatDateForInput(projectData.dueDate || projectData.endDate),
          selectedTeam: projectData.teamId?.toString() || '',
          status: projectData.status || 'planned'
        });

      } catch (err) {
        console.error("Failed to fetch project:", err);
        setError(err.message || 'Failed to load project');
      } finally {
        setFetchingData(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProject(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  // Validate dates
  const validateDates = () => {
    if (!project.startDate || !project.endDate) {
      setError('Start date and end date are required');
      return false;
    }
    
    try {
      const start = new Date(project.startDate);
      const end = new Date(project.endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        setError('Invalid date format');
        return false;
      }
      
      if (end < start) {
        setError('End date cannot be before start date');
        return false;
      }
      return true;
    } catch (err) {
      setError('Invalid date format');
      return false;
    }
  };

  // Submit project

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!project.name || !project.startDate || !project.endDate || !project.selectedTeam) {
    setError('Please fill in all required fields.');
    return;
  }

  if (!validateDates()) {
    return;
  }

  setLoading(true);
  setError('');

  try {
    // Create dates safely
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    
    // ✅ Create payload with ONLY fields that exist in schema
    const projectData = {
      name: project.name,
      description: project.description,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),  // ✅ This will be used for both endDate and dueDate in UI
      status: project.status,
      teamId: parseInt(project.selectedTeam, 10),
      // ❌ REMOVED dueDate - let the backend use endDate
    };

    console.log('Updating project with data:', projectData);

    const updatedProject = await updateProject(id, projectData);

    alert(`Project "${updatedProject.name}" updated successfully!`);
    navigate(`/manager/projects/${id}`);

  } catch (err) {
    console.error("Update project error:", err);
    setError(err.message || 'Failed to update project');
  } finally {
    setLoading(false);
  }
};

  const selectedTeamDetails = teams.find(t => t.id === parseInt(project.selectedTeam, 10));

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

  if (error && !project.name) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/manager/projects')}
            className="px-6 py-2 bg-[#194f87] text-white rounded-lg hover:bg-[#0f5841] transition"
          >
            Back to Projects
          </button>
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
            onClick={() => navigate(`/manager/projects/${id}`)}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
                  value={project.name}
                  onChange={handleChange}
                  required
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
                  value={project.description}
                  onChange={handleChange}
                  rows="3"
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
                  value={project.status}
                  onChange={handleChange}
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
                    value={project.startDate}
                    onChange={handleChange}
                    required
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
                    value={project.endDate}
                    onChange={handleChange}
                    required
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
                value={project.selectedTeam}
                onChange={handleChange}
                required
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`/manager/projects/${id}`)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition order-2 sm:order-1"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-white rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 order-1 sm:order-2"
              style={{ background: `linear-gradient(to right, #0f5841, #194f87)` }}
            >
              {loading ? (
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