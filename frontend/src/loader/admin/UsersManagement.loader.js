// src/loader/admin/UsersManagement.loader.js
import { getUsers } from '../../services/usersService';
import { getTeams } from '../../services/teamsService';

// Define query keys as constants for consistency
export const userQueryKeys = {
  all: ['users'],
  details: () => [...userQueryKeys.all, 'detail'],
  detail: (id) => [...userQueryKeys.details(), id],
};

// Query configuration for users
export const usersQuery = () => ({
  queryKey: userQueryKeys.all,
  queryFn: getUsers,
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
});

// Optional: Prefetch teams as well
export const teamsQuery = () => ({
  queryKey: ['teams'],
  queryFn: getTeams,
  staleTime: 5 * 60 * 1000,
});

// Updated loader with queryClient
export const usersLoader = (queryClient) => async () => {
  // Prefetch users data into cache
  const usersData = await queryClient.ensureQueryData(usersQuery());
  
  // Optional: Prefetch teams data in parallel
  const teamsData = await queryClient.ensureQueryData(teamsQuery());
  
  // Return initial data (React Router needs this for Suspense)
  return {
    users: usersData,
    teams: teamsData,
  };
};

// Helper functions (keep as is)
export const ROLE_OPTIONS = [
  { value: 'super-admin', label: 'Super Admin' },
  { value: 'admin', label: 'Administrator' },
  { value: 'project-manager', label: 'Project Manager' },
  { value: 'qa-tester', label: 'QA Tester' },
  { value: 'team-member', label: 'Team Member' },
];

export const PERMISSION_OPTIONS = [
  { value: 'manage_users', label: 'Manage Users' },
  { value: 'manage_teams', label: 'Manage Teams' },
  { value: 'manage_projects', label: 'Manage Projects' },
  { value: 'assign_tasks', label: 'Assign Tasks' },
  { value: 'test_tasks', label: 'Test Tasks' },
];

export const toDisplayRole = (role = '') => role?.replace(/[-_]/g, ' ') || '';

export const getRoleColor = (role) => {
  switch (role) {
    case 'super-admin':
      return 'bg-fuchsia-100 text-fuchsia-800';
    case 'admin':
      return 'bg-purple-100 text-purple-800';
    case 'project-manager':
      return 'bg-blue-100 text-blue-800';
    case 'qa-tester':
      return 'bg-amber-100 text-amber-800';
    case 'team-member':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusColor = (status) =>
  status === 'inactive' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
