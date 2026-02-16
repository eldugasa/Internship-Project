// src/components/projectManager/Reports.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, BarChart3, PieChart } from 'lucide-react';
import axios from 'axios';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('progress');
  const [dateRange, setDateRange] = useState({ start: '2024-01-01', end: '2024-12-31' });
  const [stats, setStats] = useState(null);
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportsData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');

        const [statsRes, teamRes] = await Promise.all([
          axios.get('http://localhost:5000/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/dashboard/team-performance', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        setStats(statsRes.data);
        setTeamPerformance(teamRes.data);
      } catch (err) {
        console.error(err);
        alert('Failed to fetch report data.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  const reports = [
    {
      id: 'progress',
      name: 'Project Progress Report',
      description: 'Detailed progress of all projects',
      icon: <BarChart3 className="w-6 h-6" />,
      getMetrics: () => [
        { label: 'Total Projects', value: stats.totalProjects },
        { label: 'Active Projects', value: stats.activeProjects },
        { label: 'Completed Projects', value: stats.completedProjects },
        { label: 'Overall Progress', value: `${stats.overallProgress}%` },
      ]
    },
    {
      id: 'tasks',
      name: 'Task Completion Report',
      description: 'Task completion rates and performance',
      icon: <FileText className="w-6 h-6" />,
      getMetrics: () => [
        { label: 'Total Tasks', value: stats.totalTasks },
        { label: 'Completed Tasks', value: stats.completedTasks },
        { label: 'Completion Rate', value: `${Math.round((stats.completedTasks / stats.totalTasks) * 100) || 0}%` },
        { label: 'Upcoming Deadlines', value: stats.upcomingDeadlines },
      ]
    },
    {
      id: 'workload',
      name: 'Team Workload Report',
      description: 'Team member workload and distribution',
      icon: <PieChart className="w-6 h-6" />,
      getMetrics: () => {
        const totalTeams = teamPerformance.length;
        const avgPerformance = Math.round(teamPerformance.reduce((sum, t) => sum + t.performance, 0) / totalTeams);
        return [
          { label: 'Total Teams', value: totalTeams },
          { label: 'Avg Team Performance', value: `${avgPerformance}%` },
          { label: 'Total Team Members', value: teamPerformance.reduce((sum, t) => sum + t.memberCount, 0) },
          { label: 'Active Projects', value: teamPerformance.reduce((sum, t) => sum + t.activeProjects, 0) },
        ];
      }
    }
  ];

  const currentReport = reports.find(r => r.id === selectedReport);
  const metrics = currentReport.getMetrics();

  const handleDownload = (format) => {
    alert(`Downloading ${currentReport.name} as ${format}...`);
    // TODO: Implement backend report download API
  };

  const generateReport = () => {
    alert(`${currentReport.name} generated for ${dateRange.start} to ${dateRange.end}`);
    // TODO: Implement backend report generation API
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate and download project reports</p>
        </div>
        <button 
          onClick={generateReport}
          className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] flex items-center"
        >
          <FileText className="w-4 h-4 mr-2" /> Generate Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel: Date range + report selection */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-4 h-4 mr-2" /> Date Range
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Report Types</h3>
            <div className="space-y-2">
              {reports.map(report => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedReport === report.id
                      ? 'bg-[#4DA5AD]/10 border border-[#4DA5AD]'
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${
                      selectedReport === report.id ? 'bg-[#4DA5AD] text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {report.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{report.name}</div>
                      <div className="text-xs text-gray-500">{report.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel: Report preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{currentReport?.name}</h2>
                <p className="text-gray-600">Generated: {new Date().toLocaleDateString()}</p>
              </div>
              <div className="flex space-x-2">
                {['PDF', 'Excel', 'CSV'].map(format => (
                  <button
                    key={format}
                    onClick={() => handleDownload(format)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                  >
                    <Download className="w-4 h-4 mr-1" /> {format}
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metrics.map((metric, i) => (
                <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                  <div className="text-sm text-gray-600">{metric.label}</div>
                </div>
              ))}
            </div>

            {/* Summary & Key Findings remain the same */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
