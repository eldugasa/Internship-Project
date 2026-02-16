// src/components/projectManager/Progress.jsx
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Target, Users } from 'lucide-react';
import axios from 'axios';

const Progress = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [projectTimeline, setProjectTimeline] = useState([]);
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [memberWorkload, setMemberWorkload] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');

        const [statsRes, projectsRes, teamsRes, membersRes] = await Promise.all([
          axios.get('http://localhost:5000/api/dashboard/stats', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/projects', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/teams/performance', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/members/workload', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setStats(statsRes.data);
        setProjectTimeline(projectsRes.data);
        setTeamPerformance(teamsRes.data);
        setMemberWorkload(membersRes.data);
      } catch (error) {
        console.error(error);
        alert('Failed to fetch progress data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const completedProjects = projectTimeline.filter(p => p.status === 'completed').length;
  const activeProjects = projectTimeline.filter(p => p.status === 'active').length;
  const overdueProjects = projectTimeline.filter(p => p.daysRemaining < 0 && p.status === 'active').length;
  const avgTeamPerformance = teamPerformance.length
    ? Math.round(teamPerformance.reduce((sum, t) => sum + t.performance, 0) / teamPerformance.length)
    : 0;

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progress Monitoring</h1>
          <p className="text-gray-600">Track project and team performance</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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

        {/* Active Projects */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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

        {/* Team Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
      </div>

      {/* Project Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Project Progress</h2>
          <div className="space-y-4">
            {projectTimeline.map(project => (
              <div key={project.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{project.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{project.progress}%</span>
                    {project.daysRemaining < 0 && project.status === 'active' && (
                      <span className="text-xs text-red-500">OVERDUE</span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      project.daysRemaining < 0 && project.status === 'active'
                        ? 'bg-red-500'
                        : 'bg-[#4DA5AD]'
                    }`}
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{project.status}</span>
                  <span>{project.daysRemaining} days remaining</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Team Performance</h2>
          <div className="space-y-4">
            {teamPerformance.map(team => (
              <div key={team.teamId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{team.teamName}</h3>
                    <p className="text-sm text-gray-500">{team.memberCount} members</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      team.performance >= 90
                        ? 'bg-green-100 text-green-800'
                        : team.performance >= 80
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {team.performance}% efficiency
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Member Workload */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Member Workload Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberWorkload.map(member => (
            <div key={member.id} className="border border-gray-200 rounded-lg p-4">
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
                  <span className="text-gray-600">Tasks:</span>
                  <span className="font-medium">{member.activeTasks} active</span>
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
                        : member.efficiency >= 80
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {member.efficiency}%
                  </span>
                </div>
                {member.overdueTasks > 0 && (
                  <div className="mt-3 p-2 bg-red-50 rounded text-center">
                    <span className="text-sm text-red-600 font-medium">
                      {member.overdueTasks} overdue task{member.overdueTasks > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Progress;
