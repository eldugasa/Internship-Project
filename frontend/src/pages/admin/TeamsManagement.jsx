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

  const [showCreateTeamPopup, setShowCreateTeamPopup] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    lead: '',
    description: '',
    selectedMembers: [],
  });

  // Load teams and users data
  const loadData = async () => {
    setLoading(true);
    try {
      const [teamsData, usersData] = await Promise.all([
        getTeams(),
        getUsers()
      ]);
      
      setTeams(teamsData);
      setUsers(usersData);
      setError(null);
    } catch (err) {
      console.error('Error fetching teams/users:', err);
      setError(err.message || 'Failed to load teams');
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

  // Create team
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    
    if (!newTeam.name.trim()) {
      alert('Team name required');
      return;
    }

    try {
      // Create the team
      const createdTeam = await createTeam({
        name: newTeam.name,
        lead: newTeam.lead || null,
        description: newTeam.description || null,
      });

      // Add selected members to the team
      if (newTeam.selectedMembers.length > 0) {
        await Promise.all(
          newTeam.selectedMembers.map((userId) => 
            addMemberToTeam(createdTeam.id, userId)
          ),
        );
      }

      // Refresh teams list
      await loadData();
      
      // Reset form
      setNewTeam({ name: '', lead: '', description: '', selectedMembers: [] });
      setShowCreateTeamPopup(false);
      alert('Team created successfully!');
    } catch (err) {
      console.error('Error creating team:', err);
      alert(err.message || 'Failed to create team');
    }
  };

  // Delete team
  const handleDeleteTeam = async (teamId, e) => {
    e?.stopPropagation(); // Prevent event bubbling
    
    if (!window.confirm('Are you sure you want to delete this team?')) return;

    try {
      await deleteTeam(teamId);
      // Refresh teams list after deletion
      await loadData();
      alert('Team deleted successfully!');
    } catch (err) {
      console.error('Error deleting team:', err);
      alert(err.message || 'Failed to delete team');
    }
  };

  // Filter users for member selection (exclude admins)
  const getFilteredUsers = () => {
    return users.filter(user => 
      user.role !== 'admin' && 
      (user.role === 'team-member' || user.role === 'project-manager' || 
       user.role === 'team_member' || user.role === 'project_manager')
    );
  };

  // Get potential leads (project managers and admins)
  const getLeadOptions = () => {
    return users.filter(user => 
      user.role === 'project-manager' || user.role === 'project_manager' || 
      user.role === 'admin'
    );
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD]"></div>
    </div>
  );

  if (error) return (
    <div className="text-center text-red-500 py-10 font-medium">
      <p>{error}</p>
      <button 
        onClick={loadData}
        className="mt-4 px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-opacity-90"
      >
        Retry
      </button>
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
          className="px-4 py-2 bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] text-white rounded-lg hover:opacity-90 transition font-medium"
        >
          + Create Team
        </button>
      </div>

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

      {/* Create Team Popup */}
      {showCreateTeamPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-3xl flex flex-col" style={{ maxHeight: '80vh' }}>
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Create New Team</h2>
              <button 
                onClick={() => setShowCreateTeamPopup(false)} 
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateTeam} className="flex-1 overflow-y-auto p-6 space-y-6">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Lead
                  </label>
                  <select
                    name="lead"
                    value={newTeam.lead}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                  >
                    <option value="">Select lead (optional)</option>
                    {getLeadOptions().map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
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
                        onClick={() => toggleMemberSelection(u.id)}
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
                  onClick={() => setShowCreateTeamPopup(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] transition"
                >
                  Create Team
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