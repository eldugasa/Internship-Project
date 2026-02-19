// src/components/projectManager/Progress.jsx
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Target, Users, 
  Clock, CheckCircle, AlertCircle, Calendar,
  Award, Zap
} from 'lucide-react';
import { getProjects } from '../../services/projectsService';
import { getTasks } from '../../services/tasksService';
import { getTeams } from '../../services/teamsService';

const Progress = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [stats, setStats] = useState({});
  const [projectTimeline, setProjectTimeline] = useState([]);
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [memberWorkload, setMemberWorkload] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch only data PM has access to
        const [projectsData, tasksData, teamsData] = await Promise.all([
          getProjects(),
          getTasks(),
          getTeams()
        ]);

        setProjects(projectsData);
        setTasks(tasksData);
        setTeams(teamsData);

        // Calculate stats
        calculateStats(projectsData, tasksData, teamsData);
        calculateProjectTimeline(projectsData, tasksData);
        calculateTeamPerformance(teamsData, projectsData, tasksData);
        calculateMemberWorkload(tasksData, teamsData, projectsData);
      } catch (error) {
        console.error('Error fetching progress data:', error);
        alert('Failed to fetch progress data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateStats = (projectsData, tasksData, teamsData) => {
    const totalProjects = projectsData.length;
    const activeProjects = projectsData.filter(p => 
      p.status === 'active' || p.status === 'in_progress'
    ).length;
    const completedProjects = projectsData.filter(p => 
      p.status === 'completed'
    ).length;
    
    const totalTasks = tasksData.length;
    const completedTasks = tasksData.filter(t => 
      t.status === 'completed' || t.status === 'done'
    ).length;
    
    const overdueTasks = tasksData.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
    ).length;

    const totalProgress = projectsData.reduce((sum, p) => sum + (p.progress || 0), 0);
    const overallProgress = projectsData.length ? Math.round(totalProgress / projectsData.length) : 0;

    setStats({
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      overallProgress,
      totalTeams: teamsData.length
    });
  };

  const calculateProjectTimeline = (projectsData, tasksData) => {
    const timeline = projectsData.map(project => {
      // Calculate days remaining
      const endDate = project.endDate || project.dueDate;
      let daysRemaining = 'N/A';
      let overdue = false;
      
      if (endDate) {
        const today = new Date();
        const deadline = new Date(endDate);
        const diffTime = deadline - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          daysRemaining = `${Math.abs(diffDays)} days overdue`;
          overdue = true;
        } else if (diffDays === 0) {
          daysRemaining = 'Due today';
        } else if (diffDays === 1) {
          daysRemaining = '1 day left';
        } else {
          daysRemaining = `${diffDays} days left`;
        }
      }

      // Get project tasks
      const projectTasks = tasksData.filter(t => t.projectId === project.id);
      const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
      const totalTasks = projectTasks.length;
      
      // Calculate progress from tasks if not provided
      let progress = project.progress || 0;
      if (totalTasks > 0 && progress === 0) {
        progress = Math.round((completedTasks / totalTasks) * 100);
      }

      return {
        id: project.id,
        name: project.name,
        status: project.status,
        progress,
        daysRemaining,
        overdue,
        teamName: project.teamName,
        startDate: project.startDate,
        endDate: project.endDate || project.dueDate,
        tasks: {
          total: totalTasks,
          completed: completedTasks
        }
      };
    });

    // Sort by deadline
    timeline.sort((a, b) => {
      if (!a.endDate) return 1;
      if (!b.endDate) return -1;
      return new Date(a.endDate) - new Date(b.endDate);
    });

    setProjectTimeline(timeline);
  };

  const calculateTeamPerformance = (teamsData, projectsData, tasksData) => {
    const performance = teamsData.map(team => {
      // Get team projects
      const teamProjects = projectsData.filter(p => p.teamId === team.id || p.teamName === team.name);
      const teamProjectIds = teamProjects.map(p => p.id);
      
      // Get team tasks
      const teamTasks = tasksData.filter(t => teamProjectIds.includes(t.projectId));
      
      const totalTasks = teamTasks.length;
      const completedTasks = teamTasks.filter(t => t.status === 'completed').length;
      const inProgressTasks = teamTasks.filter(t => t.status === 'in-progress').length;
      const overdueTasks = teamTasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
      ).length;
      
      const performance = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      return {
        teamId: team.id,
        teamName: team.name,
        memberCount: team.memberCount || team.users?.length || 0,
        projects: teamProjects.length,
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        performance
      };
    });

    setTeamPerformance(performance);
  };

  const calculateMemberWorkload = (tasksData, teamsData, projectsData) => {
    // Extract unique assignees from tasks
    const assigneeMap = new Map();
    
    tasksData.forEach(task => {
      if (task.assigneeId && task.assigneeName) {
        if (!assigneeMap.has(task.assigneeId)) {
          assigneeMap.set(task.assigneeId, {
            id: task.assigneeId,
            name: task.assigneeName,
            avatar: task.assigneeName?.charAt(0).toUpperCase() || 'U',
            role: 'Team Member',
            team: task.teamName || 'Unassigned',
            activeTasks: 0,
            completedTasks: 0,
            overdueTasks: 0,
            totalTasks: 0,
            totalHours: 0,
            estimatedHours: 0
          });
        }
        
        const member = assigneeMap.get(task.assigneeId);
        member.totalTasks++;
        member.totalHours += task.actualHours || 0;
        member.estimatedHours += task.estimatedHours || 0;
        
        if (task.status === 'completed') {
          member.completedTasks++;
        } else if (task.status === 'in-progress' || task.status === 'pending') {
          member.activeTasks++;
        }
        
        if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed') {
          member.overdueTasks++;
        }
      }
    });

    // Calculate efficiency for each member
    const workload = Array.from(assigneeMap.values()).map(member => ({
      ...member,
      efficiency: member.estimatedHours > 0 
        ? Math.round((member.totalHours / member.estimatedHours) * 100) 
        : 100
    }));

    // Sort by workload (active tasks + overdue)
    workload.sort((a, b) => (b.activeTasks + b.overdueTasks) - (a.activeTasks + a.overdueTasks));

    setMemberWorkload(workload);
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading progress data...</p>
        </div>
      </div>
    );
  }

  const activeProjects = projectTimeline.filter(p => p.status === 'active' || p.status === 'in_progress').length;
  const overdueProjects = projectTimeline.filter(p => p.overdue && p.status !== 'completed').length;
  const avgTeamPerformance = teamPerformance.length
    ? Math.round(teamPerformance.reduce((sum, t) => sum + t.performance, 0) / teamPerformance.length)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progress Monitoring</h1>
          <p className="text-gray-600">Track project and team performance</p>
        </div>
        <div className="flex gap-3">
          <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg flex items-center text-sm">
            <Calendar className="w-4 h-4 mr-1" />
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Overall Progress</p>
              <p className="text-3xl font-bold text-gray-900">{stats.overallProgress || 0}%</p>
              <p className="text-sm text-gray-500 mt-1">Across all projects</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Projects</p>
              <p className="text-3xl font-bold text-gray-900">{activeProjects}</p>
              <p className="text-sm text-gray-500 mt-1">{overdueProjects} overdue</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg text-green-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Team Performance</p>
              <p className="text-3xl font-bold text-gray-900">{avgTeamPerformance}%</p>
              <p className="text-sm text-gray-500 mt-1">Average efficiency</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg text-purple-600">
              <Target className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalTasks || 0}</p>
              <p className="text-sm text-gray-500 mt-1">{stats.completedTasks || 0} completed</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg text-orange-600">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Project Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Project Progress</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {projectTimeline.length > 0 ? (
              projectTimeline.map(project => (
                <div key={project.id} className="space-y-2 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{project.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#4DA5AD]">{project.progress}%</span>
                      {project.overdue && project.status !== 'completed' && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">OVERDUE</span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        project.overdue && project.status !== 'completed'
                          ? 'bg-red-500'
                          : 'bg-[#4DA5AD]'
                      }`}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="capitalize">{project.status?.replace(/[_-]/g, ' ')}</span>
                    <span className={project.overdue && project.status !== 'completed' ? 'text-red-500 font-medium' : ''}>
                      {project.daysRemaining}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Team: {project.teamName || 'Unassigned'} • Tasks: {project.tasks.completed}/{project.tasks.total}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No projects found</p>
            )}
          </div>
        </div>

        {/* Team Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Team Performance</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {teamPerformance.length > 0 ? (
              teamPerformance.map(team => (
                <div key={team.teamId} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{team.teamName}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Users className="w-3 h-3" /> {team.memberCount} members • {team.projects} projects
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        team.performance >= 90
                          ? 'bg-green-100 text-green-800'
                          : team.performance >= 75
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {team.performance}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-bold text-gray-900">{team.totalTasks}</div>
                      <div className="text-gray-500">Tasks</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-bold text-green-600">{team.completedTasks}</div>
                      <div className="text-green-600">Done</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <div className="font-bold text-yellow-600">{team.inProgressTasks || 0}</div>
                      <div className="text-yellow-600">Active</div>
                    </div>
                  </div>
                  {team.overdueTasks > 0 && (
                    <div className="mt-3 p-2 bg-red-50 rounded flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-xs text-red-600">{team.overdueTasks} overdue tasks</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No team data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Member Workload */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#4DA5AD]" />
          Member Workload Distribution
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberWorkload.length > 0 ? (
            memberWorkload.map(member => (
              <div key={member.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] rounded-full flex items-center justify-center text-white font-medium mr-3">
                    {member.avatar}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-500">{member.role} • {member.team}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active Tasks:</span>
                    <span className="font-medium text-blue-600">{member.activeTasks}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium text-green-600">{member.completedTasks}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Efficiency:</span>
                    <span
                      className={`font-medium ${
                        member.efficiency >= 90
                          ? 'text-green-600'
                          : member.efficiency >= 75
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {member.efficiency}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Hours:</span>
                    <span className="font-medium">{member.totalHours}/{member.estimatedHours}h</span>
                  </div>
                  {member.overdueTasks > 0 && (
                    <div className="mt-3 p-2 bg-red-50 rounded flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600 font-medium">
                        {member.overdueTasks} overdue
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">No member workload data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-white rounded-lg">
            <Award className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Top Performer</p>
            <p className="text-lg font-bold text-gray-900">
              {memberWorkload[0]?.name || 'N/A'}
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-white rounded-lg">
            <Zap className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Most Productive Team</p>
            <p className="text-lg font-bold text-gray-900">
              {teamPerformance.sort((a, b) => b.performance - a.performance)[0]?.teamName || 'N/A'}
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-white rounded-lg">
            <Clock className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Tasks Due Soon</p>
            <p className="text-lg font-bold text-gray-900">{stats.overdueTasks || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;