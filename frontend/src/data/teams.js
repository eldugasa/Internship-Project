// src/data/teams.js
import { teamMembers } from './teamMember.js';

export const teams = [
  {
    id: 1,
    name: 'Engineering Team',
    lead: 'Tewodros Mekonnen',
    leadId: 1,
    description: 'Responsible for developing and maintaining software applications',
    members: [1, 3, 6],
    memberCount: 3,
    projects: ['Mobile App v2', 'API Migration'],
    projectsCount: 2,
    performance: 94,
    color: '#4DA5AD',
    createdAt: '2023-01-10'
  },
  {
    id: 2,
    name: 'Design Team',
    lead: 'Selamawit Assefa',
    leadId: 2,
    description: 'Responsible for UI/UX design and user experience',
    members: [2, 7],
    memberCount: 2,
    projects: ['Website Redesign'],
    projectsCount: 1,
    performance: 89,
    color: '#FF6B6B',
    createdAt: '2023-01-12'
  },
  {
    id: 3,
    name: 'QA Team',
    lead: 'Betelhem Alemu',
    leadId: 4,
    description: 'Quality assurance and testing team',
    members: [4, 8],
    memberCount: 2,
    projects: ['Payment Integration', 'Mobile App v2'],
    projectsCount: 2,
    performance: 90,
    color: '#51CF66',
    createdAt: '2023-01-15'
  },
  {
    id: 4,
    name: 'DevOps Team',
    lead: 'Bereket Tadesse',
    leadId: 5,
    description: 'Infrastructure and deployment management',
    members: [5, 9],
    memberCount: 2,
    projects: ['API Migration', 'Payment Integration'],
    projectsCount: 2,
    performance: 92,
    color: '#FF922B',
    createdAt: '2023-01-18'
  }
];

// Helper functions remain the same...
export const getTeamById = (id) => {
  return teams.find(team => team.id === id);
};

export const getTeamMembersDetails = (teamId) => {
  const team = getTeamById(teamId);
  if (!team) return [];
  
  return team.members.map(memberId => {
    const member = teamMembers.find(m => m.id === memberId);
    return member || null;
  }).filter(Boolean);
};

export const getTeamsByProject = (projectName) => {
  return teams.filter(team => team.projects.includes(projectName));
};