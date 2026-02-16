// src/data/teamMembers.js
export const teamMembers = [
  {
    id: 1,
    name: 'Tewodros Mekonnen',
    email: 'tewodros@company.com',
    role: 'Frontend Developer',
    avatar: 'TM',
    status: 'active',
    team: 'Engineering Team',
    joinDate: '2023-01-15',
    skills: ['React', 'JavaScript', 'CSS', 'TypeScript'],
    projects: ['Mobile App v2', 'Website Redesign'],
    tasksCompleted: 42,
    efficiency: 95
  },
  {
    id: 2,
    name: 'Selamawit Assefa',
    email: 'selamawit@company.com',
    role: 'UI Designer',
    avatar: 'SA',
    status: 'active',
    team: 'Design Team',
    joinDate: '2023-02-20',
    skills: ['Figma', 'Photoshop', 'UI/UX Design', 'Prototyping'],
    projects: ['Website Redesign', 'Mobile App v2'],
    tasksCompleted: 38,
    efficiency: 92
  },
  {
    id: 3,
    name: 'Mikias Getachew',
    email: 'mikias@company.com',
    role: 'Backend Developer',
    avatar: 'MG',
    status: 'active',
    team: 'Engineering Team',
    joinDate: '2023-03-10',
    skills: ['Node.js', 'Python', 'MongoDB', 'API Development'],
    projects: ['Mobile App v2', 'API Migration'],
    tasksCompleted: 56,
    efficiency: 98
  },
  {
    id: 4,
    name: 'Betelhem Alemu',
    email: 'betelhem@company.com',
    role: 'QA Engineer',
    avatar: 'BA',
    status: 'active',
    team: 'QA Team',
    joinDate: '2023-01-30',
    skills: ['Testing', 'Automation', 'Selenium', 'Jest'],
    projects: ['Payment Integration', 'Mobile App v2'],
    tasksCompleted: 31,
    efficiency: 88
  },
  {
    id: 5,
    name: 'Girma Jembere',
    email: 'girma@company.com',
    role: 'DevOps Engineer',
    avatar: 'GJ',
    status: 'active',
    team: 'DevOps Team',
    joinDate: '2023-02-25',
    skills: ['Docker', 'AWS', 'CI/CD', 'Kubernetes'],
    projects: ['API Migration', 'Payment Integration'],
    tasksCompleted: 29,
    efficiency: 94
  },
  {
    id: 6,
    name: 'Tolossa Negash',
    email: 'tolossa@company.com',
    role: 'Frontend Developer',
    avatar: 'TN',
    status: 'active',
    team: 'Engineering Team',
    joinDate: '2023-04-05',
    skills: ['React', 'Vue.js', 'Sass', 'Webpack'],
    projects: ['Mobile App v2'],
    tasksCompleted: 24,
    efficiency: 90
  },
  {
    id: 7,
    name: 'Tigist Chernet',
    email: 'tigist@company.com',
    role: 'UI Designer',
    avatar: 'TC',
    status: 'active',
    team: 'Design Team',
    joinDate: '2023-03-18',
    skills: ['Sketch', 'Adobe XD', 'Illustrator', 'Prototyping'],
    projects: ['Website Redesign'],
    tasksCompleted: 19,
    efficiency: 86
  },
  {
    id: 8,
    name: 'Eyerusalem Wondimu',
    email: 'eyerusalem@company.com',
    role: 'QA Engineer',
    avatar: 'EW',
    status: 'active',
    team: 'QA Team',
    joinDate: '2023-02-14',
    skills: ['Manual Testing', 'Postman', 'JIRA', 'Test Planning'],
    projects: ['API Migration'],
    tasksCompleted: 27,
    efficiency: 91
  },
  {
    id: 9,
    name: 'Fikadu Eshetu',
    email: 'fikadu@company.com',
    role: 'DevOps Engineer',
    avatar: 'FE',
    status: 'active',
    team: 'DevOps Team',
    joinDate: '2023-05-10',
    skills: ['Linux', 'Jenkins', 'Terraform', 'Ansible'],
    projects: ['Payment Integration'],
    tasksCompleted: 15,
    efficiency: 89
  }
];

// Helper functions remain the same...
export const getTeamMemberById = (id) => {
  return teamMembers.find(member => member.id === id);
};

export const getTeamMembersByTeam = (teamName) => {
  return teamMembers.filter(member => member.team === teamName);
};

export const getTeamMembersByProject = (projectName) => {
  return teamMembers.filter(member => 
    member.projects.includes(projectName)
  );
};

export const getAvailableTeamMembers = () => {
  return teamMembers.filter(member => member.status === 'active');
};