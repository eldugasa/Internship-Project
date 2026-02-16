// src/utils/adminUtils.js
export const getRoleBadge = (role) => {
  const config = {
    admin: { color: 'bg-purple-100 text-purple-800', icon: '👑' },
    project_manager: { color: 'bg-blue-100 text-blue-800', icon: '📋' },
    team_member: { color: 'bg-green-100 text-green-800', icon: '👤' }
  };
  return config[role] || { color: 'bg-gray-100 text-gray-800', icon: '👤' };
};

export const getStatusBadge = (status) => {
  return status === 'active' 
    ? { class: 'bg-green-100 text-green-800', text: 'Active' }
    : { class: 'bg-red-100 text-red-800', text: 'Inactive' };
};

export const getPriorityBadge = (priority) => {
  const config = {
    high: { color: 'bg-red-100 text-red-800', text: 'High' },
    medium: { color: 'bg-yellow-100 text-yellow-800', text: 'Medium' },
    low: { color: 'bg-green-100 text-green-800', text: 'Low' }
  };
  return config[priority] || { color: 'bg-gray-100 text-gray-800', text: 'Normal' };
};

export const getRandomColor = () => {
  const colors = ['#4DA5AD', '#FF6B6B', '#51CF66', '#FF922B', '#748FFC', '#F06595'];
  return colors[Math.floor(Math.random() * colors.length)];
};