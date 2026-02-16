// src/components/projectManager/CreateProject.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Save, Users } from 'lucide-react';
import axios from 'axios';

const CreateProject = () => {
  const navigate = useNavigate();

  const [project, setProject] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    selectedTeam: '',
  });

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const token = localStorage.getItem('token');

        const res = await axios.get(
          'http://localhost:5000/api/teams',
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        setTeams(res.data);
      } catch (err) {
        console.error("Failed to fetch teams:", err);
        alert('Failed to load teams.');
      }
    };

    fetchTeams();
  }, []);

  // ✅ Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProject(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Submit project
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!project.name || !project.startDate || !project.endDate || !project.selectedTeam) {
      alert('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      const payload = {
        name: project.name,
        description: project.description,
        startDate: new Date(project.startDate).toISOString(),
        endDate: new Date(project.endDate).toISOString(),
        status: 'PLANNED',
        teamId: parseInt(project.selectedTeam, 10),
      };

      console.log("Submitting project:", payload);

      const res = await axios.post(
        'http://localhost:5000/api/projects',
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // ✅ FIXED: backend returns project directly
      alert(`Project "${res.data.name}" created successfully!`);

      navigate('/manager/projects');

    } catch (err) {
      console.error("Create project error:", err);
      alert(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

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

      <form onSubmit={handleSubmit} className="space-y-6">

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
                value={project.name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Enter project name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={project.description}
                onChange={handleChange}
                rows="3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
                  value={project.startDate}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

            </div>
          </div>
        </div>

        {/* Team Assignment */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Choose a team</option>

              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name} {team.lead ? `(Lead: ${team.lead})` : ''}
                </option>
              ))}
            </select>
          </div>

          {project.selectedTeam && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">
                Selected Team Details
              </h3>

              {(() => {
                const selectedTeam = teams.find(
                  t => t.id === parseInt(project.selectedTeam, 10)
                );

                return selectedTeam ? (
                  <>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Team Lead:</span>{' '}
                      {selectedTeam.lead || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Description:</span>{' '}
                      {selectedTeam.description || "No description"}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500">Team not found</p>
                );
              })()}
            </div>
          )}

        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3">

          <button
            type="button"
            onClick={() => navigate('/manager/projects')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Project'}
          </button>

        </div>
      </form>
    </div>
  );
};

export default CreateProject;
