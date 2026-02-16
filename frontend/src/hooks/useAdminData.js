// src/hooks/useAdminData.js
import { useState, useEffect } from 'react';

export const useAdminData = () => {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      const usersData = [
        { id: 1, name: 'John Doe', email: 'john@company.com', role: 'team_member', team: 'Engineering', status: 'active', avatar: 'JD', joinDate: '2024-01-15' },
        { id: 2, name: 'Jane Smith', email: 'jane@company.com', role: 'project_manager', team: 'Design', status: 'active', avatar: 'JS', joinDate: '2023-11-20' },
        { id: 3, name: 'Bob Johnson', email: 'bob@company.com', role: 'admin', team: 'Management', status: 'active', avatar: 'BJ', joinDate: '2023-08-10' },
        { id: 4, name: 'Alice Brown', email: 'alice@company.com', role: 'team_member', team: 'QA', status: 'inactive', avatar: 'AB', joinDate: '2024-02-01' },
        { id: 5, name: 'Mike Wilson', email: 'mike@company.com', role: 'team_member', team: 'DevOps', status: 'active', avatar: 'MW', joinDate: '2024-01-05' },
      ];
      
      const teamsData = [
        { id: 1, name: 'Engineering', lead: 'John Doe', members: 12, projects: 5, color: '#4DA5AD' },
        { id: 2, name: 'Design', lead: 'Jane Smith', members: 8, projects: 3, color: '#FF6B6B' },
        { id: 3, name: 'QA', lead: 'Alice Brown', members: 6, projects: 4, color: '#51CF66' },
        { id: 4, name: 'DevOps', lead: 'Mike Wilson', members: 4, projects: 2, color: '#FF922B' },
      ];
      
      const projectsData = [
        { id: 1, name: 'Website Redesign', team: 'Design', manager: 'Jane Smith', progress: 75, status: 'active', priority: 'high', dueDate: '2024-06-15' },
        { id: 2, name: 'Mobile App v2', team: 'Engineering', manager: 'John Doe', progress: 45, status: 'active', priority: 'medium', dueDate: '2024-07-30' },
        { id: 3, name: 'API Migration', team: 'Engineering', manager: 'Bob Johnson', progress: 90, status: 'completed', priority: 'low', dueDate: '2024-03-01' },
      ];

      setUsers(usersData);
      setTeams(teamsData);
      setProjects(projectsData);
      
      setStats([
        { label: 'Total Users', value: usersData.length, change: '+2' },
        { label: 'Active Teams', value: teamsData.length, change: '+1' },
        { label: 'Total Projects', value: projectsData.length, change: '+3' },
        { label: 'Active Users', value: usersData.filter(u => u.status === 'active').length, change: '+5' },
      ]);
      
      setIsLoading(false);
    }, 1000);
  }, []);

  const updateUserRole = (userId, newRole) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ));
  };

  const updateUserStatus = (userId, newStatus) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
  };

  const deleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const createTeam = () => {
    const teamName = prompt('Enter team name:');
    if (teamName) {
      const newTeam = {
        id: teams.length + 1,
        name: teamName,
        lead: 'Unassigned',
        members: 0,
        projects: 0,
        color: '#4DA5AD'
      };
      setTeams([...teams, newTeam]);
    }
  };

  const deleteTeam = (teamId) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      setTeams(teams.filter(team => team.id !== teamId));
    }
  };

  return {
    users,
    teams,
    projects,
    stats,
    isLoading,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    createTeam,
    deleteTeam
  };
};
