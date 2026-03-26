// src/loader/admin/UsersManagement.loader.js
import { getUsers } from '../../services/usersService';

// In React Router v7, just return the promise directly - no defer needed!
export async function usersLoader() {
  return {
    users: getUsers() // Return the promise directly
  };
}

// Helper functions
export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrator' },
  { value: 'project-manager', label: 'Project Manager' },
  { value: 'team-member', label: 'Team Member' },
];

export const toDisplayRole = (role = '') => role?.replace(/[-_]/g, ' ') || '';

export const getRoleColor = (role) => {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800';
    case 'project-manager':
      return 'bg-blue-100 text-blue-800';
    case 'team-member':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusColor = (status) =>
  status === 'inactive' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';