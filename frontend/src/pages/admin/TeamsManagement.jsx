// src/pages/admin/TeamsManagement.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import TeamCard from '../../Component/admin/TeamCard';
import { useNavigate } from "react-router-dom";

const TeamsManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = localStorage.getItem('token'); // Auth token
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCreateTeamPopup, setShowCreateTeamPopup] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    lead: '',
    description: '',
    selectedMembers: []
  });

  const [users, setUsers] = useState([]);

  // Fetch teams from backend
  const fetchTeams = async () => {
    if (!token) return setError('Not authenticated');
    try {
      const res = await axios.get('http://localhost:5000/api/teams', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeams(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError(err.response?.data?.error || 'Failed to load teams');
      setLoading(false);
    }
  };

  // Fetch users for selection
  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTeam(prev => ({ ...prev, [name]: value }));
  };

  // Toggle member selection
  const toggleMemberSelection = (userId) => {
    setNewTeam(prev => {
      const isSelected = prev.selectedMembers.includes(userId);
      return {
        ...prev,
        selectedMembers: isSelected
          ? prev.selectedMembers.filter(id => id !== userId)
          : [...prev.selectedMembers, userId]
      };
    });
  };

  // Create team API
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeam.name.trim()) return alert('Team name required');

    try {
      const res = await axios.post(
        'http://localhost:5000/api/teams',
        {
          name: newTeam.name,
          lead: newTeam.lead,
          description: newTeam.description,
          memberIds: newTeam.selectedMembers
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTeams(prev => [...prev, res.data.team]);
      setNewTeam({ name: '', lead: '', description: '', selectedMembers: [] });
      setShowCreateTeamPopup(false);
      alert('Team created successfully!');
    } catch (err) {
      console.error('Error creating team:', err);
      alert(err.response?.data?.error || 'Failed to create team');
    }
  };

  if (loading) return <p>Loading teams...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

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
        {teams.map(team => (
         <TeamCard
  key={team.id}
  team={{
    ...team,
    members: team.users?.length || 0,
    projects: team.projects?.length || 0
  }}
  showActions={true}
  onClick={() => navigate(`/admin/teams/${team.id}`)}
/>


        ))}
      </div>

      {/* Create Team Popup */}
      {showCreateTeamPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-3xl flex flex-col" style={{ maxHeight: '80vh' }}>
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Create New Team</h2>
              <button onClick={() => setShowCreateTeamPopup(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={newTeam.name}
                    onChange={handleInputChange}
                    placeholder="Enter team name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team Lead</label>
                  <select
                    name="lead"
                    value={newTeam.lead}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select lead (optional)</option>
                    {users.map(u => (
                      <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={newTeam.description}
                  onChange={handleInputChange}
                  placeholder="Enter team description (optional)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Members ({newTeam.selectedMembers.length})
                </label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {users.map(u => (
                    <div
                      key={u.id}
                      className={`flex items-center justify-between p-2 border rounded-lg mb-2 cursor-pointer ${
                        newTeam.selectedMembers.includes(u.id) ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => toggleMemberSelection(u.id)}
                    >
                      <span>{u.name} ({u.role})</span>
                      {newTeam.selectedMembers.includes(u.id) && <span>✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button onClick={() => setShowCreateTeamPopup(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreateTeam} className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93]">Create Team</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsManagement;
