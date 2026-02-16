// src/data/projects.js
import { teamMembers } from './teamMember.js';

export const projects = [
  {
    id: 1,
    name: 'Mobile App v2',
    description: 'Next generation mobile application with enhanced features',
    status: 'active',
    progress: 75,
    startDate: '2024-01-15',
    deadline: '2024-06-15',
    teamId: 1,
    teamName: 'Engineering Team',
    teamMembers: [1, 3, 6],
    tasks: {
      total: 24,
      completed: 18,
      pending: 4,
      overdue: 2
    },
    budget: 50000,
    spent: 37500,
    priority: 'high',
    manager: 'Tewodros Mekonnen',
    createdAt: '2024-01-01',
    updatedAt: '2024-03-15'
  },
  {
    id: 2,
    name: 'Website Redesign',
    description: 'Modern responsive website redesign',
    status: 'active',
    progress: 45,
    startDate: '2024-02-01',
    deadline: '2024-07-30',
    teamId: 2,
    teamName: 'Design Team',
    teamMembers: [2, 7],
    tasks: {
      total: 18,
      completed: 8,
      pending: 8,
      overdue: 2
    },
    budget: 30000,
    spent: 13500,
    priority: 'medium',
    manager: 'Selamawit Assefa',
    createdAt: '2024-01-20',
    updatedAt: '2024-03-10'
  },
  {
    id: 3,
    name: 'API Migration',
    description: 'Migrate legacy APIs to microservices architecture',
    status: 'completed',
    progress: 100,
    startDate: '2023-11-01',
    deadline: '2024-03-01',
    teamId: 1,
    teamName: 'Engineering Team',
    teamMembers: [1, 3],
    tasks: {
      total: 32,
      completed: 32,
      pending: 0,
      overdue: 0
    },
    budget: 40000,
    spent: 38000,
    priority: 'high',
    manager: 'Mikias Getachew',
    createdAt: '2023-10-15',
    updatedAt: '2024-03-01'
  },
  {
    id: 4,
    name: 'Payment Integration',
    description: 'Integrate new payment gateway with enhanced security',
    status: 'active',
    progress: 60,
    startDate: '2024-01-20',
    deadline: '2024-05-20',
    teamId: 4,
    teamName: 'DevOps Team',
    teamMembers: [5, 9],
    tasks: {
      total: 16,
      completed: 10,
      pending: 5,
      overdue: 1
    },
    budget: 25000,
    spent: 15000,
    priority: 'medium',
    manager: 'Bereket Tadesse',
    createdAt: '2024-01-10',
    updatedAt: '2024-03-12'
  }
];

// Helper functions remain the same...
export const getProjectById = (id) => {
  return projects.find(project => project.id === id);
};

export const getProjectsByTeam = (teamId) => {
  return projects.filter(project => project.teamId === teamId);
};

export const getProjectTeamMembers = (projectId) => {
  const project = getProjectById(projectId);
  if (!project) return [];
  
  return teamMembers.filter(member => 
    project.teamMembers.includes(member.id)
  );
};

export const getProjectsByStatus = (status) => {
  return projects.filter(project => project.status === status);
};

export const createProject = (projectData) => {
  const newProject = {
    id: Date.now(),
    ...projectData,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
    progress: 0,
    status: 'active',
    tasks: {
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0
    },
    spent: 0
  };
  
  projects.push(newProject);
  return newProject;
};