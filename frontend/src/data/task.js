// // src/data/tasks.js
// export const tasks = [
//   {
//     id: 1,
//     title: 'Fix login authentication bug',
//     description: 'Fix the authentication bug in the login flow that occurs when users try to login with incorrect credentials multiple times.',
//     projectId: 1,
//     projectName: 'Mobile App v2',
//     assigneeId: 1,
//     assignee: 'Tewodros Mekonnen',
//     priority: 'high',
//     deadline: '2024-03-15',
//     progress: 80,
//     status: 'in-progress',
//     estimatedHours: 8,
//     actualHours: 6,
//     teamId: 1,
//     teamName: 'Engineering Team',
//     createdAt: '2024-02-20',
//     updatedAt: '2024-03-10',
//     tags: ['bug', 'authentication', 'security']
//   },
//   {
//     id: 2,
//     title: 'Design homepage mockups',
//     description: 'Create modern homepage mockups with improved user experience and responsive design',
//     projectId: 2,
//     projectName: 'Website Redesign',
//     assigneeId: 2,
//     assignee: 'Selamawit Assefa',
//     priority: 'medium',
//     deadline: '2024-03-20',
//     progress: 60,
//     status: 'in-progress',
//     estimatedHours: 12,
//     actualHours: 8,
//     teamId: 2,
//     teamName: 'Design Team',
//     createdAt: '2024-02-25',
//     updatedAt: '2024-03-12',
//     tags: ['design', 'ui', 'homepage']
//   },
//   {
//     id: 3,
//     title: 'Write API documentation',
//     description: 'Document all API endpoints with examples and usage instructions',
//     projectId: 3,
//     projectName: 'API Migration',
//     assigneeId: 3,
//     assignee: 'Mikias Getachew',
//     priority: 'low',
//     deadline: '2024-03-01',
//     progress: 100,
//     status: 'completed',
//     estimatedHours: 6,
//     actualHours: 6,
//     teamId: 1,
//     teamName: 'Engineering Team',
//     createdAt: '2024-01-15',
//     updatedAt: '2024-03-01',
//     tags: ['documentation', 'api', 'backend']
//   },
//   {
//     id: 4,
//     title: 'Database optimization',
//     description: 'Optimize database queries and improve performance for payment processing',
//     projectId: 4,
//     projectName: 'Payment Integration',
//     assigneeId: 4,
//     assignee: 'Betelhem Alemu',
//     priority: 'high',
//     deadline: '2024-03-10',
//     progress: 40,
//     status: 'pending',
//     estimatedHours: 10,
//     actualHours: 4,
//     teamId: 3,
//     teamName: 'QA Team',
//     createdAt: '2024-02-10',
//     updatedAt: '2024-03-05',
//     tags: ['database', 'performance', 'optimization']
//   },
//   {
//     id: 5,
//     title: 'Mobile testing phase 2',
//     description: 'Conduct second phase of mobile application testing on multiple devices',
//     projectId: 1,
//     projectName: 'Mobile App v2',
//     assigneeId: 1,
//     assignee: 'Tewodros Mekonnen',
//     priority: 'medium',
//     deadline: '2024-03-25',
//     progress: 20,
//     status: 'pending',
//     estimatedHours: 16,
//     actualHours: 3,
//     teamId: 1,
//     teamName: 'Engineering Team',
//     createdAt: '2024-03-01',
//     updatedAt: '2024-03-08',
//     tags: ['testing', 'mobile', 'quality']
//   }
// ];

// // Helper functions remain the same...
// export const getTaskById = (id) => {
//   return tasks.find(task => task.id === id);
// };

// export const getTasksByProject = (projectId) => {
//   return tasks.filter(task => task.projectId === projectId);
// };

// export const getTasksByAssignee = (assigneeId) => {
//   return tasks.filter(task => task.assigneeId === assigneeId);
// };

// export const getTasksByTeam = (teamId) => {
//   return tasks.filter(task => task.teamId === teamId);
// };

// export const getTasksByStatus = (status) => {
//   return tasks.filter(task => task.status === status);
// };

// export const createTask = (taskData) => {
//   const newTask = {
//     id: Date.now(),
//     ...taskData,
//     progress: 0,
//     status: 'pending',
//     actualHours: 0,
//     createdAt: new Date().toISOString().split('T')[0],
//     updatedAt: new Date().toISOString().split('T')[0],
//     tags: []
//   };
  
//   tasks.push(newTask);
//   return newTask;
// };

// export const updateTaskProgress = (taskId, progress) => {
//   const taskIndex = tasks.findIndex(task => task.id === taskId);
//   if (taskIndex !== -1) {
//     tasks[taskIndex] = {
//       ...tasks[taskIndex],
//       progress,
//       status: progress === 100 ? 'completed' : 'in-progress',
//       updatedAt: new Date().toISOString().split('T')[0]
//     };
//     return tasks[taskIndex];
//   }
//   return null;
// };