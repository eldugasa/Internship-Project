// src/pages/admin/TeamsManagement.jsx
import React, { useState, Suspense } from 'react';
import { useNavigate, useLoaderData, Await } from 'react-router-dom';
import TeamCard from '../../Component/admin/TeamCard';
import { 
  createTeam, 
  deleteTeam
} from '../../services/teamsService';
import { teamsLoader, prepareTeamForDisplay } from '../../loader/admin/TeamsManagement.loader';

// Re-export the loader for the route
export { teamsLoader as loader };

// Loading skeleton component
const TeamsSkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse"></div>
      </div>
      <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-4 w-40 bg-gray-200 rounded"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Error component
const TeamsError = ({ error, onRetry }) => (
  <div className="flex justify-center items-center min-h-[400px]">
    <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-center">
      <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Teams</h3>
      <p className="text-red-600 mb-4">{error?.message || 'An error occurred while loading teams'}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
      >
        Retry
      </button>
    </div>
  </div>
);

const TeamsManagement = () => {
  const navigate = useNavigate();
  const loaderData = useLoaderData();
  
  const [operationLoading, setOperationLoading] = useState(false);
  const [showCreateTeamPopup, setShowCreateTeamPopup] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    leadId: '',
    description: '',
    selectedMembers: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState(null);

  const handleRetry = () => {
    navigate('.', { replace: true }); // Reload the page to trigger loader again
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTeam((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const toggleMemberSelection = (userId) => {
    setNewTeam((prev) => ({
      ...prev,
      selectedMembers: prev.selectedMembers.includes(userId)
        ? prev.selectedMembers.filter((id) => id !== userId)
        : [...prev.selectedMembers, userId],
    }));
  };

  const validateForm = (users) => {
    const errors = {};
    
    if (!newTeam.name.trim()) {
      errors.name = 'Team name is required';
    } else if (newTeam.name.length < 3) {
      errors.name = 'Team name must be at least 3 characters';
    } else if (newTeam.name.length > 50) {
      errors.name = 'Team name must be less than 50 characters';
    }
    
    if (newTeam.leadId) {
      const leadExists = users?.some(u => u.id === parseInt(newTeam.leadId));
      if (!leadExists) {
        errors.leadId = 'Selected lead does not exist';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTeam = async (e, users) => {
    e.preventDefault();
    
    if (!validateForm(users)) {
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

      await createTeam(teamData);
      
      // Reset form
      setNewTeam({ name: '', leadId: '', description: '', selectedMembers: [] });
      setShowCreateTeamPopup(false);
      setFormErrors({});
      
      // Refresh the page to trigger loader again
      navigate('.', { replace: true });
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
      navigate('.', { replace: true }); // Refresh data
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

  const getLeadOptions = (users) => {
    return users?.filter(user => user.name && user.id) || [];
  };

  const getFilteredUsers = (users) => {
    return users?.filter(user => user.role !== 'admin') || [];
  };

  return (
    <Suspense fallback={<TeamsSkeleton />}>
      <Await 
        resolve={Promise.all([loaderData.teams, loaderData.users])}
        errorElement={<TeamsError error={{ message: 'Failed to load teams data' }} onRetry={handleRetry} />}
      >
        {([teams, users]) => {
          const safeTeams = Array.isArray(teams) ? teams : [];
          const safeUsers = Array.isArray(users) ? users : [];
          
          return (
            <div className="space-y-6">
              {/* Header */}
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

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Teams Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {safeTeams.length === 0 ? (
                  <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No teams found. Create your first team!</p>
                  </div>
                ) : (
                  safeTeams.map((team) => {
                    const displayTeam = prepareTeamForDisplay(team, safeUsers);
                    
                    return (
                      <TeamCard
                        key={team.id}
                        team={displayTeam}
                        showActions={true}
                        onDelete={(e) => handleDeleteTeam(team.id, e)}
                        onClick={() => navigate(`/admin/teams/${team.id}`)}
                      />
                    );
                  })
                )}
              </div>

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
                    
                    <form onSubmit={(e) => handleCreateTeam(e, safeUsers)} className="flex-1 overflow-y-auto p-6 space-y-6">
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
                            {getLeadOptions(safeUsers).map((u) => (
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
                          {getFilteredUsers(safeUsers).length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No team members available</p>
                          ) : (
                            getFilteredUsers(safeUsers).map((u) => (
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
        }}
      </Await>
    </Suspense>
  );
};

export default TeamsManagement;