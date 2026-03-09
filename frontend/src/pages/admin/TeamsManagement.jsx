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

  // Load teams and users data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [teamsData, usersData] = await Promise.all([
        getTeams(),
        getUsers()
      ]);
      
      console.log('Teams data:', teamsData);
      console.log('Users data:', usersData);
      
      setTeams(teamsData || []);
      setUsers(usersData || []);
    } catch (err) {
      console.error('Error fetching teams/users:', err);
      
      // Handle specific error types
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

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTeam((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Toggle member selection
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

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!newTeam.name.trim()) {
      errors.name = 'Team name is required';
    } else if (newTeam.name.length < 3) {
      errors.name = 'Team name must be at least 3 characters';
    } else if (newTeam.name.length > 50) {
      errors.name = 'Team name must be less than 50 characters';
    }
    
    // Optional: Validate that lead is a valid user
    if (newTeam.leadId) {
      const leadExists = users.some(u => u.id === parseInt(newTeam.leadId));
      if (!leadExists) {
        errors.leadId = 'Selected lead does not exist';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

 // src/pages/admin/TeamsManagement.jsx
// Update only the handleCreateTeam function:

const handleCreateTeam = async (e) => {
  e.preventDefault();
  
  // Validate form
  if (!validateForm()) {
    return;
  }

  setOperationLoading(true);
  setError(null);

  try {
    // Prepare team data with all information in one payload
    const teamData = {
      name: newTeam.name.trim(),
      description: newTeam.description?.trim() || null,
      leadId: newTeam.leadId ? parseInt(newTeam.leadId) : null,
      selectedMembers: newTeam.selectedMembers // Pass selected members directly
    };

    console.log('Creating team with data:', teamData);

    // Create the team - the service will handle memberIds
    const createdTeam = await createTeam(teamData);
    console.log('Team created successfully:', createdTeam);

    // Refresh teams list
    await loadData();
    
    // Reset form
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

  // Delete team
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

  // Get potential leads
  const getLeadOptions = () => {
    return users.filter(user => {
      return user.name && user.id;
    });
  };

  // Filter users for member selection
  const getFilteredUsers = () => {
    return users.filter(user => 
      user.role !== 'admin' && 
      (user.role === 'team-member' || user.role === 'project-manager' || 
       user.role === 'team_member' || user.role === 'project_manager')
    );
  };

  // Retry loading
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

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
          <p className="text-gray-500 mb-6">Get started by creating your first team</p>
          <button
            onClick={() => setShowCreateTeamPopup(true)}
            className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-opacity-90"
          >
            Create Team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={{
                ...team,
                members: team.memberCount || team.users?.length || 0,
                projects: team.projects?.length || 0,
                lead: team.leadName || team.lead || 'Unassigned',
              }}
              showActions={true}
              onDelete={(e) => handleDeleteTeam(team.id, e)}
              onClick={() => navigate(`/admin/teams/${team.id}`)}
            />
          ))}
        </div>
      )}

      {/* Create Team Popup */}
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
              {/* Form error display */}
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
                    {getLeadOptions().length > 0 ? (
                      getLeadOptions().map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} {u.role ? `(${u.role})` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No users available</option>
                    )}
                  </select>
                  {formErrors.leadId && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.leadId}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {getLeadOptions().length} users available
                  </p>
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