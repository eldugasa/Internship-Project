// src/pages/admin/TeamsManagement.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeamCard from '../../Component/admin/TeamCard';
import {
  addMemberToTeam,
  createTeam,
  deleteTeam,
  getTeams,
} from '../../services/teamsService';
import { getUsers } from '../../services/usersService';
import { Users } from 'lucide-react';

const TeamsManagement = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [operationLoading, setOperationLoading] = useState(false);

  const [showCreateTeamPopup, setShowCreateTeamPopup] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    leadId: '',
    description: '',
    selectedMembers: [],
  });
  const [formErrors, setFormErrors] = useState({});

  // Helper to safely get a number from any value
  const safeNumber = (value, defaultValue = 0) => {
    const num = parseInt(value);
    return isNaN(num) ? defaultValue : Math.max(0, num);
  };

  // Helper to safely get a string from any value
  const safeString = (value, defaultValue = '') => {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return defaultValue;
    return String(value);
  };

  // Helper to prepare team for display - ONLY shows lead if explicitly assigned
  const prepareTeamForDisplay = (team) => {
    const displayTeam = {
      id: safeNumber(team.id),
      name: safeString(team.name, 'Unnamed Team'),
      lead: 'Unassigned', // Default to Unassigned
      memberCount: 0,
      projectCount: 0
    };
    
    // Set member count
    if (team.memberCount !== undefined) {
      displayTeam.memberCount = safeNumber(team.memberCount);
    } else if (team.members && Array.isArray(team.members)) {
      displayTeam.memberCount = team.members.length;
    } else if (team.users && Array.isArray(team.users)) {
      displayTeam.memberCount = team.users.length;
    }
    
    // Set project count
    if (team.projectCount !== undefined) {
      displayTeam.projectCount = safeNumber(team.projectCount);
    } else if (team.projects && Array.isArray(team.projects)) {
      displayTeam.projectCount = team.projects.length;
    }
    
    // ONLY set lead if explicitly assigned via leadName or lead string
    if (team.leadName && typeof team.leadName === 'string' && team.leadName !== 'Unassigned') {
      displayTeam.lead = team.leadName;
    } else if (team.lead && typeof team.lead === 'string' && team.lead !== 'Unassigned') {
      displayTeam.lead = team.lead;
    } else if (team.lead && typeof team.lead === 'object' && team.lead.name) {
      displayTeam.lead = safeString(team.lead.name, 'Unassigned');
    } else if (team.leadId) {
      // If leadId exists but no name, still show Unassigned until we fetch the name
      // Optionally, we could look up the name from users array if available
      const leadUser = users.find(u => u.id === safeNumber(team.leadId));
      if (leadUser && leadUser.name) {
        displayTeam.lead = leadUser.name;
      }
    }
    // NO AUTO-ASSIGNMENT - never infer lead from members
    
    return displayTeam;
  };

  // Load teams and users data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [teamsData, usersData] = await Promise.all([
        getTeams(),
        getUsers()
      ]);
      
      setTeams(teamsData || []);
      setUsers(usersData || []);
    } catch (err) {
      console.error('Error fetching teams/users:', err);
      
      if (err.message?.includes('401')) {
        setError('Authentication failed. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.message?.includes('403')) {
        setError('You do not have permission to view teams.');
      } else if (err.message?.includes('network')) {
        setError('Network error. Please check your connection.');
      } else {
        setError(err.message || 'Failed to load teams');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTeam((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const toggleMemberSelection = (userId) => {
    setNewTeam((prev) => {
      const isSelected = prev.selectedMembers.includes(userId);
      return {
        ...prev,
        selectedMembers: isSelected
          ? prev.selectedMembers.filter((id) => id !== userId)
          : [...prev.selectedMembers, userId],
      };
    });
  };

  const validateForm = () => {
    const errors = {};
    
    if (!newTeam.name.trim()) {
      errors.name = 'Team name is required';
    } else if (newTeam.name.length < 3) {
      errors.name = 'Team name must be at least 3 characters';
    } else if (newTeam.name.length > 50) {
      errors.name = 'Team name must be less than 50 characters';
    }
    
    if (newTeam.leadId) {
      const leadExists = users.some(u => u.id === parseInt(newTeam.leadId));
      if (!leadExists) {
        errors.leadId = 'Selected lead does not exist';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setOperationLoading(true);
    setError(null);

    try {
      const teamData = {
        name: newTeam.name.trim(),
        description: newTeam.description?.trim() || null,
        leadId: newTeam.leadId ? parseInt(newTeam.leadId) : null,
        selectedMembers: newTeam.selectedMembers
      };

      const createdTeam = await createTeam(teamData);

      await loadData();
      
      setNewTeam({ name: '', leadId: '', description: '', selectedMembers: [] });
      setShowCreateTeamPopup(false);
      setFormErrors({});
      alert('Team created successfully!');
      
    } catch (err) {
      console.error('Error creating team:', err);
      
      const errorMessage = err.message || 'Failed to create team';
      
      if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        setFormErrors({ name: 'A team with this name already exists' });
      } else {
        setError(errorMessage);
      }
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId, e) => {
    e?.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) return;

    setOperationLoading(true);
    
    try {
      await deleteTeam(teamId);
      await loadData();
      alert('Team deleted successfully!');
    } catch (err) {
      console.error('Error deleting team:', err);
      
      if (err.message?.includes('has projects')) {
        alert('Cannot delete team that has projects assigned. Please reassign projects first.');
      } else if (err.message?.includes('has members')) {
        alert('Cannot delete team that has members. Please remove all members first.');
      } else {
        alert(err.message || 'Failed to delete team');
      }
    } finally {
      setOperationLoading(false);
    }
  };

  const getLeadOptions = () => {
    return users.filter(user => user.name && user.id);
  };

  const getFilteredUsers = () => {
    return users.filter(user => user.role !== 'admin');
  };

  const handleRetry = () => {
    setError(null);
    loadData();
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD]"></div>
    </div>
  );

  if (error) return (
    <div className="text-center py-10">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
        <p className="text-red-600 font-medium mb-4">{error}</p>
        <div className="flex gap-3 justify-center">
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-opacity-90"
          >
            Retry
          </button>
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Management</h1>
          <p className="text-gray-600">Create and manage project teams</p>
        </div>
        <button
          onClick={() => setShowCreateTeamPopup(true)}
          disabled={operationLoading}
          className="px-4 py-2 bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] text-white rounded-lg hover:opacity-90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {operationLoading ? 'Processing...' : '+ Create Team'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => {
          const displayTeam = prepareTeamForDisplay(team);

          return (
            <TeamCard
              key={team.id}
              team={displayTeam}
              showActions={true}
              onDelete={(e) => handleDeleteTeam(team.id, e)}
              onClick={() => navigate(`/admin/teams/${team.id}`)}
            />
          );
        })}
      </div>

      {showCreateTeamPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-3xl flex flex-col" style={{ maxHeight: '80vh' }}>
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Create New Team</h2>
              <button 
                onClick={() => {
                  setShowCreateTeamPopup(false);
                  setNewTeam({ name: '', leadId: '', description: '', selectedMembers: [] });
                  setFormErrors({});
                }} 
                className="text-gray-500 hover:text-gray-700 text-2xl"
                disabled={operationLoading}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateTeam} className="flex-1 overflow-y-auto p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newTeam.name}
                    onChange={handleInputChange}
                    placeholder="Enter team name"
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                    disabled={operationLoading}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Lead
                  </label>
                  <select
                    name="leadId"
                    value={newTeam.leadId}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent ${
                      formErrors.leadId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={operationLoading}
                  >
                    <option value="">Select team lead (optional)</option>
                    {getLeadOptions().map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.role ? `(${u.role})` : ''}
                      </option>
                    ))}
                  </select>
                  {formErrors.leadId && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.leadId}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newTeam.description}
                  onChange={handleInputChange}
                  placeholder="Enter team description (optional)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                  rows="3"
                  disabled={operationLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Members ({newTeam.selectedMembers.length})
                </label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {getFilteredUsers().length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No team members available</p>
                  ) : (
                    getFilteredUsers().map((u) => (
                      <div
                        key={u.id}
                        className={`flex items-center justify-between p-3 border rounded-lg mb-2 cursor-pointer transition-colors ${
                          newTeam.selectedMembers.includes(u.id)
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => !operationLoading && toggleMemberSelection(u.id)}
                      >
                        <div>
                          <span className="font-medium">{u.name}</span>
                          <span className="text-sm text-gray-600 ml-2">({u.role})</span>
                        </div>
                        {newTeam.selectedMembers.includes(u.id) && (
                          <span className="text-blue-600 font-bold">✓</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateTeamPopup(false);
                    setNewTeam({ name: '', leadId: '', description: '', selectedMembers: [] });
                    setFormErrors({});
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled={operationLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={operationLoading}
                  className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] transition flex items-center gap-2 disabled:opacity-50"
                >
                  {operationLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Team'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsManagement;