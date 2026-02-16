// src/pages/admin/UsersManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddUserPopup, setShowAddUserPopup] = useState(false);
  const [showEditUserPopup, setShowEditUserPopup] = useState(false);
  const [showViewUserPopup, setShowViewUserPopup] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'team_member',
    team: 'Engineering',
    status: 'active'
  });

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data);
      } catch (err) {
        console.error(err);
        alert('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Role & status colors
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'project_manager': return 'bg-blue-100 text-blue-800';
      case 'team_member': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  // Input change for Add User
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  // Add User
  const handleAddUser = async (e) => {
    e.preventDefault();

    if (!newUser.name.trim() || !newUser.email.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/users',
        newUser,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers([...users, res.data]);

      setNewUser({
        name: '',
        email: '',
        role: 'team_member',
        team: 'Engineering',
        status: 'active'
      });
      setShowAddUserPopup(false);
      alert('User added successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to add user');
    }
  };

  // Delete user
  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users.filter(u => u.id !== userId));
      alert('User deleted successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // Edit user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditUserPopup(true);
  };

const saveEditedUser = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await axios.put(
      `http://localhost:5000/api/users/${selectedUser.id}/role`,
      { role: selectedUser.role },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setUsers(users.map(u =>
      u.id === selectedUser.id ? res.data : u
    ));

    setShowEditUserPopup(false);
    setSelectedUser(null);
    alert("Role updated successfully!");
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Failed to update role");
  }
};


  // View user
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowViewUserPopup(true);
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage user roles, permissions, and access</p>
          </div>
         
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] rounded-full flex items-center justify-center text-white font-medium mr-3">
                        {u.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{u.name}</div>
                        <div className="text-sm text-gray-500">{u.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(u.role)}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                        {u.team}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(u.status)}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex space-x-2">
                      <button onClick={() => handleViewUser(u)}>👁️</button>
                      <button onClick={() => handleEditUser(u)}>✏️</button>
                      <button onClick={() => deleteUser(u.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Popup */}
      {showAddUserPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add New User</h2>
              <button onClick={() => setShowAddUserPopup(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <input type="text" name="name" value={newUser.name} onChange={handleInputChange} placeholder="Full Name *" className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
              <input type="email" name="email" value={newUser.email} onChange={handleInputChange} placeholder="Email Address *" className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
              <select name="role" value={newUser.role} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="team_member">Team Member</option>
                <option value="project_manager">Project Manager</option>
                <option value="admin">Administrator</option>
              </select>
              <select name="team" value={newUser.team} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Management">Management</option>
                <option value="QA">QA</option>
                <option value="DevOps">DevOps</option>
              </select>
              <select name="status" value={newUser.status} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowAddUserPopup(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg">Add User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View & Edit User Popups */}
      {showViewUserPopup && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">User Details</h2>
              <button onClick={() => setShowViewUserPopup(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium">{selectedUser.role.replace('_',' ')}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Team</p>
                  <p className="font-medium">{selectedUser.team}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedUser.status)}`}>
                    {selectedUser.status}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Joined</p>
                  <p className="font-medium">{selectedUser.joinDate || '-'}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <button onClick={() => setShowViewUserPopup(false)} className="w-full px-4 py-2 bg-[#4DA5AD] text-white rounded-lg">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditUserPopup && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
              <button onClick={() => setShowEditUserPopup(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={selectedUser.name} onChange={(e)=>setSelectedUser({...selectedUser,name:e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={selectedUser.email} onChange={(e)=>setSelectedUser({...selectedUser,email:e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={selectedUser.role} onChange={(e)=>setSelectedUser({...selectedUser,role:e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="team_member">Team Member</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                <select value={selectedUser.team} onChange={(e)=>setSelectedUser({...selectedUser,team:e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Management">Management</option>
                  <option value="QA">QA</option>
                  <option value="DevOps">DevOps</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={selectedUser.status} onChange={(e)=>setSelectedUser({...selectedUser,status:e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button onClick={()=>setShowEditUserPopup(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                <button onClick={saveEditedUser} className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UsersManagement;
