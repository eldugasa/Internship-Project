// src/components/projectManager/ProjectManagerDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderKanban, CheckSquare, Clock, AlertCircle, 
  Users, Calendar, TrendingUp, Plus,
  FileText, ChevronRight, Activity
} from 'lucide-react';
import axios from 'axios';

const ProjectManagerDashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [projectTimeline, setProjectTimeline] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');

        // Fetch projects
        const projectsRes = await axios.get(
          'http://localhost:5000/api/projects?limit=3&sort=deadline',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const projects = projectsRes.data.map((p) => {
          const totalTasks = p.tasks?.total || 0;
          const completedTasks = p.tasks?.completed || 0;
          const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
          const daysRemaining = p.endDate ? Math.max(0, Math.ceil((new Date(p.endDate) - new Date()) / (1000*60*60*24))) : 'N/A';
          return { ...p, progress, daysRemaining };
        });

        // Fetch tasks
        let tasksResData = [];
        try {
          const tasksRes = await axios.get(
            'http://localhost:5000/api/tasks?limit=3&sort=createdAt',
            { headers: { Authorization: `Bearer ${token}` } }
          );
          tasksResData = tasksRes.data;
        } catch {
          tasksResData = [];
        }

        // Compute dashboard stats
        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.status?.toLowerCase() === 'active').length;
        const totalTasks = tasksResData.length;
        const completedTasks = tasksResData.filter(t => t.status?.toLowerCase() === 'completed').length;
        const overallProgress = projects.length ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length) : 0;
        const upcomingDeadlines = projects.filter(p => p.daysRemaining !== 'N/A' && p.daysRemaining <= 7).length;

        setStats({ totalProjects, activeProjects, totalTasks, completedTasks, overallProgress, upcomingDeadlines, totalTeamMembers: 'N/A' });
        setProjectTimeline(projects);
        setRecentTasks(tasksResData);
      } catch (err) {
        console.error(err);
        alert('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statsCards = [
    { title: 'Total Projects', value: stats.totalProjects, change: `${stats.activeProjects} active`, icon: <FolderKanban className="w-6 h-6" />, color: 'bg-blue-100 text-blue-600' },
    { title: 'Total Tasks', value: stats.totalTasks, change: `${stats.completedTasks} completed`, icon: <CheckSquare className="w-6 h-6" />, color: 'bg-green-100 text-green-600' },
    { title: 'Avg. Progress', value: `${stats.overallProgress}%`, change: 'Across all projects', icon: <TrendingUp className="w-6 h-6" />, color: 'bg-purple-100 text-purple-600' },
    { title: 'Upcoming Deadlines', value: stats.upcomingDeadlines, change: 'Within 7 days', icon: <AlertCircle className="w-6 h-6" />, color: 'bg-red-100 text-red-600' },
  ];

  const quickActions = [
    { title: 'Create New Project', icon: <Plus className="w-5 h-5" />, onClick: () => navigate('/manager/projects/create') },
    { title: 'Assign Task', icon: <CheckSquare className="w-5 h-5" />, onClick: () => navigate('/manager/tasks/create') },
    { title: 'View Progress', icon: <Activity className="w-5 h-5" />, onClick: () => navigate('/manager/progress') },
    { title: 'Generate Report', icon: <FileText className="w-5 h-5" />, onClick: () => navigate('/manager/reports') },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Manager Dashboard</h1>
          <p className="text-gray-600">Monitor and manage projects and tasks</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            <span>Team: {stats.totalTeamMembers} members</span>
          </div>
          <button onClick={() => navigate('/manager/projects/create')} className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] flex items-center">
            <Plus className="w-4 h-4 mr-2" /> New Project
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action, i) => (
                <button key={i} onClick={action.onClick} className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-200 transition">
                  <div className="flex items-center">
                    <div className="text-blue-600 mr-3">{action.icon}</div>
                    <span className="font-medium text-gray-900">{action.title}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Active Projects</h2>
              <button onClick={() => navigate('/manager/projects')} className="text-sm text-[#4DA5AD] hover:underline flex items-center">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            <div className="space-y-4">
              {projectTimeline.map(project => (
                <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition cursor-pointer" onClick={() => navigate(`/manager/projects/${project.id}`)}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{project.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>Due in {project.daysRemaining}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(project.status)}`}>{project.status}</span>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-[#4DA5AD] h-2 rounded-full transition-all duration-300" style={{ width: `${project.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-900">Recent Tasks</h2>
          <button onClick={() => navigate('/manager/tasks')} className="text-sm text-[#4DA5AD] hover:underline flex items-center">
            View All Tasks <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        <div className="space-y-3">
          {recentTasks.map(task => (
            <div
              key={task.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer"
              onClick={() => navigate(`/manager/tasks/${task.id}`, { state: { task } })}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{task.name}</h3>
                  <p className="text-sm text-gray-500">
                    {task.project?.name || "No Project"} • {task.assignee?.name || "Unassigned"}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.priority)}`}>
                  {task.priority || "Low"}
                </span>
              </div>
              <div className="flex justify-between items-center mt-3">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>Due: {task.deadline ? task.deadline.split("T")[0] : "N/A"}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 rounded-full h-1.5 mr-2">
                    <div
                      className="bg-[#4DA5AD] h-1.5 rounded-full"
                      style={{ width: `${task.progress || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{task.progress || 0}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectManagerDashboard;
