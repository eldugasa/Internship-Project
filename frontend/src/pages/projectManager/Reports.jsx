// src/components/projectManager/Reports.jsx
import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Calendar, BarChart3, PieChart, 
  TrendingUp, Users, CheckSquare, Clock, AlertCircle,
  DownloadCloud, Printer, Share2
} from 'lucide-react';
import { getProjects } from '../../services/projectsService';
import { getTasks } from '../../services/tasksService';
import { getTeams } from '../../services/teamsService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('progress');
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [filteredData, setFilteredData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [projectsData, tasksData, teamsData] = await Promise.all([
          getProjects(),
          getTasks(),
          getTeams()
        ]);

        setProjects(projectsData);
        setTasks(tasksData);
        setTeams(teamsData);

        calculateStats(projectsData, tasksData, teamsData);
        calculateTeamPerformance(teamsData, projectsData, tasksData);
      } catch (err) {
        console.error('Error fetching report data:', err);
        alert('Failed to fetch report data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (projects.length && tasks.length) {
      filterDataByDate();
    }
  }, [dateRange, projects, tasks]);

  const calculateStats = (projectsData, tasksData, teamsData) => {
    const totalProjects = projectsData.length;
    const activeProjects = projectsData.filter(p => 
      p.status === 'active' || p.status === 'in_progress'
    ).length;
    const completedProjects = projectsData.filter(p => 
      p.status === 'completed'
    ).length;
    const plannedProjects = projectsData.filter(p => 
      p.status === 'planned'
    ).length;
    
    const totalTasks = tasksData.length;
    const completedTasks = tasksData.filter(t => 
      t.status === 'completed' || t.status === 'done'
    ).length;
    const inProgressTasks = tasksData.filter(t => 
      t.status === 'in-progress'
    ).length;
    const pendingTasks = tasksData.filter(t => 
      t.status === 'pending'
    ).length;
    
    const overdueTasks = tasksData.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
    ).length;

    const totalProgress = projectsData.reduce((sum, p) => sum + (p.progress || 0), 0);
    const overallProgress = projectsData.length ? Math.round(totalProgress / projectsData.length) : 0;

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = tasksData.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= now && dueDate <= nextWeek;
    }).length;

    const totalTeams = teamsData.length;
    
    const uniqueTeamMembers = new Set();
    projectsData.forEach(project => {
      if (project.teamMembers) {
        project.teamMembers.forEach(member => uniqueTeamMembers.add(member.id));
      }
    });

    setStats({
      totalProjects,
      activeProjects,
      completedProjects,
      plannedProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      overallProgress,
      upcomingDeadlines,
      totalTeams,
      estimatedTeamMembers: uniqueTeamMembers.size
    });
  };

  const calculateTeamPerformance = (teamsData, projectsData, tasksData) => {
    const performance = teamsData.map(team => {
      const teamProjects = projectsData.filter(p => p.teamId === team.id || p.teamName === team.name);
      const teamProjectIds = teamProjects.map(p => p.id);
      
      const teamTasks = tasksData.filter(t => teamProjectIds.includes(t.projectId));
      
      const totalTasks = teamTasks.length;
      const completedTasks = teamTasks.filter(t => t.status === 'completed').length;
      const inProgressTasks = teamTasks.filter(t => t.status === 'in-progress').length;
      const pendingTasks = teamTasks.filter(t => t.status === 'pending').length;
      
      const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const totalHours = teamTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
      
      return {
        id: team.id,
        name: team.name,
        lead: team.lead || team.leadName || 'Unassigned',
        memberCount: team.memberCount || team.users?.length || 0,
        projects: teamProjects.length,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        completionRate,
        totalHours,
        performance: completionRate
      };
    });

    setTeamPerformance(performance);
  };

  const filterDataByDate = () => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);

    const filteredTasks = tasks.filter(t => {
      const taskDate = new Date(t.createdAt || t.updatedAt);
      return taskDate >= start && taskDate <= end;
    });

    const filteredProjects = projects.filter(p => {
      const projectDate = new Date(p.createdAt || p.startDate);
      return projectDate >= start && projectDate <= end;
    });

    const filteredTaskStats = {
      total: filteredTasks.length,
      completed: filteredTasks.filter(t => t.status === 'completed').length,
      inProgress: filteredTasks.filter(t => t.status === 'in-progress').length,
      pending: filteredTasks.filter(t => t.status === 'pending').length
    };

    setFilteredData({
      tasks: filteredTasks,
      projects: filteredProjects,
      taskStats: filteredTaskStats
    });
  };

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
      ],
      getDetails: () => projects.map(p => ({
        name: p.name,
        status: p.status,
        progress: p.progress,
        team: p.teamName,
        tasks: p.tasks?.total || 0
      })).slice(0, 5)
    },
    {
      id: 'tasks',
      name: 'Task Completion Report',
      description: 'Task completion rates and performance',
      icon: <CheckSquare className="w-6 h-6" />,
      getMetrics: () => [
        { label: 'Total Tasks', value: stats.totalTasks },
        { label: 'Completed Tasks', value: stats.completedTasks },
        { label: 'In Progress', value: stats.inProgressTasks },
        { label: 'Pending', value: stats.pendingTasks },
      ],
      getDetails: () => {
        const priorityCounts = {
          high: tasks.filter(t => t.priority === 'high').length,
          medium: tasks.filter(t => t.priority === 'medium').length,
          low: tasks.filter(t => t.priority === 'low').length
        };
        return [
          { label: 'High Priority', value: priorityCounts.high, color: 'red' },
          { label: 'Medium Priority', value: priorityCounts.medium, color: 'yellow' },
          { label: 'Low Priority', value: priorityCounts.low, color: 'green' }
        ];
      }
    },
    {
      id: 'workload',
      name: 'Team Workload Report',
      description: 'Team member workload and distribution',
      icon: <PieChart className="w-6 h-6" />,
      getMetrics: () => {
        const totalTeams = teamPerformance.length;
        const avgPerformance = teamPerformance.length 
          ? Math.round(teamPerformance.reduce((sum, t) => sum + (t.completionRate || 0), 0) / totalTeams)
          : 0;
        const totalMembers = teamPerformance.reduce((sum, t) => sum + (t.memberCount || 0), 0);
        const totalTeamProjects = teamPerformance.reduce((sum, t) => sum + (t.projects || 0), 0);
        
        return [
          { label: 'Total Teams', value: totalTeams },
          { label: 'Avg Completion Rate', value: `${avgPerformance}%` },
          { label: 'Team Members', value: totalMembers },
          { label: 'Team Projects', value: totalTeamProjects },
        ];
      },
      getDetails: () => teamPerformance.map(t => ({
        name: t.name,
        lead: t.lead,
        members: t.memberCount,
        projects: t.projects,
        completionRate: t.completionRate,
        totalTasks: t.totalTasks,
        completedTasks: t.completedTasks
      }))
    },
    {
      id: 'deadlines',
      name: 'Deadline Overview',
      description: 'Upcoming and overdue deadlines',
      icon: <Clock className="w-6 h-6" />,
      getMetrics: () => [
        { label: 'Overdue Tasks', value: stats.overdueTasks },
        { label: 'Upcoming Deadlines', value: stats.upcomingDeadlines },
        { label: 'Total Tasks', value: stats.totalTasks },
        { label: 'Completion Rate', value: `${Math.round((stats.completedTasks / stats.totalTasks) * 100) || 0}%` },
      ],
      getDetails: () => {
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        return tasks
          .filter(t => t.dueDate && t.status !== 'completed')
          .map(t => ({
            name: t.title,
            project: t.projectName,
            dueDate: new Date(t.dueDate).toLocaleDateString(),
            status: new Date(t.dueDate) < now ? 'overdue' : 'upcoming',
            priority: t.priority
          }))
          .slice(0, 5);
      }
    }
  ];

  const currentReport = reports.find(r => r.id === selectedReport);
  const metrics = currentReport?.getMetrics() || [];
  const details = currentReport?.getDetails?.() || [];

  // Generate PDF Report
  const generatePDF = (data) => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(77, 165, 173);
    doc.text(data.reportName, 14, 22);
    
    // Metadata
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${data.generatedAt}`, 14, 32);
    doc.text(`Period: ${data.dateRange.start} to ${data.dateRange.end}`, 14, 38);
    
    // Metrics Table
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Key Metrics', 14, 48);
    
    const metricsData = data.metrics.map(m => [m.label, m.value.toString()]);
    
    // ✅ Use autoTable as a function, not doc.autoTable
    autoTable(doc, {
      startY: 52,
      head: [['Metric', 'Value']],
      body: metricsData,
      theme: 'grid',
      headStyles: { fillColor: [77, 165, 173] },
      styles: { fontSize: 10 },
      margin: { left: 14, right: 14 }
    });
    
    // Details Section
    if (data.details && data.details.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Detailed Breakdown', 14, doc.lastAutoTable.finalY + 10);
      
      // Prepare data based on report type
      let headers = [];
      let bodyData = [];
      
      if (data.reportType === 'progress') {
        headers = ['Project', 'Team', 'Status', 'Progress'];
        bodyData = data.details.map(item => [
          item.name || '-',
          item.team || '-',
          item.status || '-',
          `${item.progress || 0}%`
        ]);
      } else if (data.reportType === 'workload') {
        headers = ['Team', 'Lead', 'Members', 'Projects', 'Completion'];
        bodyData = data.details.map(item => [
          item.name || '-',
          item.lead || '-',
          (item.members || 0).toString(),
          (item.projects || 0).toString(),
          `${item.completionRate || 0}%`
        ]);
      } else if (data.reportType === 'deadlines') {
        headers = ['Task', 'Project', 'Due Date', 'Status', 'Priority'];
        bodyData = data.details.map(item => [
          item.name || '-',
          item.project || '-',
          item.dueDate || '-',
          item.status || '-',
          item.priority || '-'
        ]);
      } else {
        headers = ['Item', 'Value'];
        bodyData = data.details.map(item => [
          item.name || item.label || '-',
          `${item.value || item.progress || item.completionRate || 0}%`
        ]);
      }
      
      if (headers.length > 0 && bodyData.length > 0) {
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 14,
          head: [headers],
          body: bodyData,
          theme: 'grid',
          headStyles: { fillColor: [77, 165, 173] },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 }
        });
      }
    }
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Generated by TaskFlow • Page ${i} of ${pageCount}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }
    
    // Save PDF
    doc.save(`${data.reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Generate CSV Report
  const generateCSV = (data) => {
    let csv = '';
    
    csv += `Report: ${data.reportName}\n`;
    csv += `Generated: ${data.generatedAt}\n`;
    csv += `Period: ${data.dateRange.start} to ${data.dateRange.end}\n\n`;
    
    csv += 'METRICS\n';
    csv += 'Metric,Value\n';
    data.metrics.forEach(m => {
      csv += `${m.label},${m.value}\n`;
    });
    
    if (data.details.length > 0) {
      csv += '\nDETAILED BREAKDOWN\n';
      
      // Determine headers based on data structure
      if (data.details[0]?.name && data.details[0]?.team && data.details[0]?.progress !== undefined) {
        csv += 'Item,Team,Status,Progress\n';
        data.details.forEach(item => {
          csv += `${item.name || '-'},${item.team || '-'},${item.status || '-'},${item.progress || 0}%\n`;
        });
      } else if (data.details[0]?.name && data.details[0]?.projects !== undefined) {
        csv += 'Team,Lead,Members,Projects,Completion Rate,Total Tasks,Completed\n';
        data.details.forEach(item => {
          csv += `${item.name || '-'},${item.lead || '-'},${item.members || 0},${item.projects || 0},${item.completionRate || 0}%,${item.totalTasks || 0},${item.completedTasks || 0}\n`;
        });
      } else if (data.details[0]?.name && data.details[0]?.dueDate) {
        csv += 'Task,Project,Due Date,Status,Priority\n';
        data.details.forEach(item => {
          csv += `${item.name || '-'},${item.project || '-'},${item.dueDate || '-'},${item.status || '-'},${item.priority || '-'}\n`;
        });
      }
    }
    
    return csv;
  };

  const handleDownload = (format) => {
    const reportData = {
      reportType: selectedReport,
      reportName: currentReport?.name,
      dateRange,
      generatedAt: new Date().toLocaleString(),
      metrics: currentReport?.getMetrics() || [],
      details: currentReport?.getDetails?.() || [],
      teamPerformance: teamPerformance,
      stats: stats
    };
    
    switch(format.toLowerCase()) {
      case 'pdf':
        generatePDF(reportData);
        break;
        
      case 'excel':
      case 'csv':
        const csv = generateCSV(reportData);
        const csvBlob = new Blob([csv], { type: 'text/csv' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvLink = document.createElement('a');
        csvLink.href = csvUrl;
        csvLink.download = `${selectedReport}-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(csvLink);
        csvLink.click();
        document.body.removeChild(csvLink);
        URL.revokeObjectURL(csvUrl);
        break;
        
      default:
        // JSON fallback
        const json = JSON.stringify(reportData, null, 2);
        const jsonBlob = new Blob([json], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const jsonLink = document.createElement('a');
        jsonLink.href = jsonUrl;
        jsonLink.download = `${selectedReport}-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(jsonLink);
        jsonLink.click();
        document.body.removeChild(jsonLink);
        URL.revokeObjectURL(jsonUrl);
    }
    
    alert(`✅ ${format} report downloaded successfully!`);
  };

  const generateReport = () => {
    alert(`${currentReport?.name} generated for ${dateRange.start} to ${dateRange.end}`);
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                />
              </div>
              {filteredData.taskStats && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600">Filtered period:</p>
                  <p className="text-sm font-medium">{filteredData.taskStats.total} tasks in period</p>
                </div>
              )}
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
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center text-sm"
                  >
                    <Download className="w-4 h-4 mr-1" /> {format}
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {metrics.map((metric, i) => (
                <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                  <div className="text-sm text-gray-600">{metric.label}</div>
                </div>
              ))}
            </div>

            {/* Detailed Data */}
            {details.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Detailed Breakdown</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {details.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">
                        {item.name || item.label || item.title}
                      </span>
                      <div className="flex items-center gap-4">
                        {item.team && <span className="text-sm text-gray-500">{item.team}</span>}
                        {item.project && <span className="text-sm text-gray-500">{item.project}</span>}
                        {item.dueDate && <span className="text-sm text-gray-500">Due: {item.dueDate}</span>}
                        {item.status && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            item.status === 'completed' ? 'bg-green-100 text-green-800' :
                            item.status === 'active' ? 'bg-blue-100 text-blue-800' :
                            item.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            item.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status}
                          </span>
                        )}
                        {item.priority && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            item.priority === 'high' ? 'bg-red-100 text-red-800' :
                            item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {item.priority}
                          </span>
                        )}
                        <span className="font-bold text-[#4DA5AD]">
                          {item.progress !== undefined ? `${item.progress}%` : 
                           item.completionRate ? `${item.completionRate}%` :
                           item.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export Options */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;