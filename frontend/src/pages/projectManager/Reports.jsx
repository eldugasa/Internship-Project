// src/pages/manager/Reports.jsx
import React, { useState, useMemo } from 'react';
import { useLoaderData } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, Download, Calendar, BarChart3, PieChart, 
  TrendingUp, Users, CheckSquare, Clock, AlertCircle,
  DownloadCloud, Printer, Share2, Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  reportsLoader,
  reportsProjectsQuery,
  reportsTasksQuery,
  reportsTeamsQuery,
  calculateStats, 
  calculateTeamPerformance,
  filterDataByDate
} from '../../loader/manager/Reports.loader';

// Re-export the loader for the route
export { reportsLoader as loader };

// Loading skeleton component
const ReportsSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-200 rounded mt-2 animate-pulse"></div>
              </div>
              <div className="flex space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-50 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Error component
const ReportsError = ({ error, onRetry }) => {
  const errorMessage = error?.message || error || 'Unable to load reports data';
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Reports</h3>
        <p className="text-red-600 mb-6">{errorMessage}</p>
        <button onClick={onRetry} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
          Retry
        </button>
      </div>
    </div>
  );
};

const Reports = () => {
  const loaderData = useLoaderData();
  const [selectedReport, setSelectedReport] = useState('progress');
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });
  const [downloading, setDownloading] = useState(false);

  // Use React Query for real-time updates with initial data from loader
  const { 
    data: projectsData, 
    isLoading: projectsLoading,
    error: projectsError 
  } = useQuery({
    ...reportsProjectsQuery(),
    initialData: loaderData?.projects,
  });
  
  const { 
    data: tasksData, 
    isLoading: tasksLoading,
    error: tasksError 
  } = useQuery({
    ...reportsTasksQuery(),
    initialData: loaderData?.tasks,
  });
  
  const { 
    data: teamsData, 
    isLoading: teamsLoading,
    error: teamsError 
  } = useQuery({
    ...reportsTeamsQuery(),
    initialData: loaderData?.teams,
  });
  
  const isLoading = projectsLoading || tasksLoading || teamsLoading;
  const hasError = projectsError || tasksError || teamsError;
  
  const handleRetry = () => {
    window.location.reload();
  };
  
  const safeProjects = useMemo(() => Array.isArray(projectsData) ? projectsData : [], [projectsData]);
  const safeTasks = useMemo(() => Array.isArray(tasksData) ? tasksData : [], [tasksData]);
  const safeTeams = useMemo(() => Array.isArray(teamsData) ? teamsData : [], [teamsData]);
  
  const stats = useMemo(() => calculateStats(safeProjects, safeTasks, safeTeams), [safeProjects, safeTasks, safeTeams]);
  const teamPerformance = useMemo(() => calculateTeamPerformance(safeTeams, safeProjects, safeTasks), [safeTeams, safeProjects, safeTasks]);
  const filteredData = useMemo(() => filterDataByDate(safeProjects, safeTasks, dateRange), [safeProjects, safeTasks, dateRange]);
  
  const reports = [
    {
      id: 'progress',
      name: 'Project Progress Report',
      description: 'Detailed progress of all projects',
      icon: <BarChart3 className="w-5 h-5" />,
      getMetrics: () => [
        { label: 'Total Projects', value: stats.totalProjects },
        { label: 'Active Projects', value: stats.activeProjects },
        { label: 'Completed Projects', value: stats.completedProjects },
        { label: 'Overall Progress', value: `${stats.overallProgress}%` },
      ],
      getDetails: () => filteredData.projects.map(p => ({
        name: p.name,
        team: p.teamName || p.team?.name || 'Unassigned',
        status: p.status,
        progress: p.progress || 0,
        tasks: p.tasks?.total || 0
      })).slice(0, 10)
    },
    {
      id: 'tasks',
      name: 'Task Completion Report',
      description: 'Task completion rates and performance',
      icon: <CheckSquare className="w-5 h-5" />,
      getMetrics: () => [
        { label: 'Total Tasks', value: stats.totalTasks },
        { label: 'Completed Tasks', value: stats.completedTasks },
        { label: 'In Progress', value: stats.inProgressTasks },
        { label: 'Pending', value: stats.pendingTasks },
      ],
      getDetails: () => {
        const priorityCounts = {
          high: filteredData.tasks.filter(t => t.priority === 'high' || t.priority === 'critical').length,
          medium: filteredData.tasks.filter(t => t.priority === 'medium').length,
          low: filteredData.tasks.filter(t => t.priority === 'low').length
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
      icon: <Users className="w-5 h-5" />,
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
      icon: <Clock className="w-5 h-5" />,
      getMetrics: () => [
        { label: 'Overdue Tasks', value: stats.overdueTasks },
        { label: 'Upcoming Deadlines', value: stats.upcomingDeadlines },
        { label: 'Total Tasks', value: stats.totalTasks },
        { label: 'Completion Rate', value: `${Math.round((stats.completedTasks / stats.totalTasks) * 100) || 0}%` },
      ],
      getDetails: () => {
        const now = new Date();
        return filteredData.tasks
          .filter(t => t.dueDate && t.status !== 'completed')
          .map(t => {
            const dueDate = new Date(t.dueDate);
            const isOverdue = dueDate < now;
            return {
              name: t.title,
              project: t.projectName || t.project?.name || 'Unknown',
              dueDate: dueDate.toLocaleDateString(),
              status: isOverdue ? 'overdue' : 'upcoming',
              priority: t.priority || 'medium'
            };
          })
          .sort((a, b) => {
            if (a.status === 'overdue' && b.status !== 'overdue') return -1;
            if (a.status !== 'overdue' && b.status === 'overdue') return 1;
            return 0;
          })
          .slice(0, 10);
      }
    }
  ];
  
  const currentReport = reports.find(r => r.id === selectedReport);
  const metrics = currentReport?.getMetrics() || [];
  const details = currentReport?.getDetails?.() || [];

  const generatePDF = async (reportData) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(15, 88, 65);
    doc.text(reportData.reportName, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${reportData.generatedAt}`, 14, 32);
    doc.text(`Period: ${reportData.dateRange.start} to ${reportData.dateRange.end}`, 14, 38);
    
    // Metrics section
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Key Metrics', 14, 48);
    
    const metricsData = reportData.metrics.map(m => [m.label, m.value.toString()]);
    autoTable(doc, {
      startY: 52,
      head: [['Metric', 'Value']],
      body: metricsData,
      theme: 'grid',
      headStyles: { fillColor: [15, 88, 65] },
      styles: { fontSize: 10 },
      margin: { left: 14, right: 14 }
    });
    
    // Details section
    if (reportData.details && reportData.details.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Detailed Breakdown', 14, doc.lastAutoTable.finalY + 10);
      
      let headers = [];
      let bodyData = [];
      
      if (reportData.reportType === 'progress') {
        headers = ['Project', 'Team', 'Status', 'Progress'];
        bodyData = reportData.details.map(item => [
          item.name || '-', 
          item.team || '-', 
          item.status || '-', 
          `${item.progress || 0}%`
        ]);
      } else if (reportData.reportType === 'workload') {
        headers = ['Team', 'Lead', 'Members', 'Projects', 'Completion'];
        bodyData = reportData.details.map(item => [
          item.name || '-', 
          item.lead || '-', 
          (item.members || 0).toString(),
          (item.projects || 0).toString(), 
          `${item.completionRate || 0}%`
        ]);
      } else if (reportData.reportType === 'deadlines') {
        headers = ['Task', 'Project', 'Due Date', 'Status', 'Priority'];
        bodyData = reportData.details.map(item => [
          item.name || '-', 
          item.project || '-', 
          item.dueDate || '-', 
          item.status || '-', 
          item.priority || '-'
        ]);
      } else if (reportData.reportType === 'tasks') {
        headers = ['Priority', 'Count'];
        bodyData = reportData.details.map(item => [item.label || '-', item.value.toString()]);
      }
      
      if (headers.length > 0 && bodyData.length > 0) {
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 14,
          head: [headers],
          body: bodyData,
          theme: 'grid',
          headStyles: { fillColor: [15, 88, 65] },
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
      doc.text(`Generated by TaskFlow • Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
    }
    
    doc.save(`${reportData.reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
  const generateCSV = (reportData) => {
    let csv = `Report: ${reportData.reportName}\n`;
    csv += `Generated: ${reportData.generatedAt}\n`;
    csv += `Period: ${reportData.dateRange.start} to ${reportData.dateRange.end}\n\n`;
    csv += 'METRICS\n';
    csv += 'Metric,Value\n';
    reportData.metrics.forEach(m => { csv += `${m.label},${m.value}\n`; });
    
    if (reportData.details.length > 0) {
      csv += '\nDETAILED BREAKDOWN\n';
      if (reportData.details[0]?.name && reportData.details[0]?.team && reportData.details[0]?.progress !== undefined) {
        csv += 'Project,Team,Status,Progress\n';
        reportData.details.forEach(item => {
          csv += `${item.name || '-'},${item.team || '-'},${item.status || '-'},${item.progress || 0}%\n`;
        });
      } else if (reportData.details[0]?.name && reportData.details[0]?.projects !== undefined) {
        csv += 'Team,Lead,Members,Projects,Completion Rate,Total Tasks,Completed\n';
        reportData.details.forEach(item => {
          csv += `${item.name || '-'},${item.lead || '-'},${item.members || 0},${item.projects || 0},${item.completionRate || 0}%,${item.totalTasks || 0},${item.completedTasks || 0}\n`;
        });
      } else if (reportData.details[0]?.name && reportData.details[0]?.dueDate) {
        csv += 'Task,Project,Due Date,Status,Priority\n';
        reportData.details.forEach(item => {
          csv += `${item.name || '-'},${item.project || '-'},${item.dueDate || '-'},${item.status || '-'},${item.priority || '-'}\n`;
        });
      } else if (reportData.details[0]?.label) {
        csv += 'Priority,Count\n';
        reportData.details.forEach(item => {
          csv += `${item.label || '-'},${item.value || 0}\n`;
        });
      }
    }
    return csv;
  };
  
  const handleDownload = async (format) => {
    setDownloading(true);
    try {
      const reportData = {
        reportType: selectedReport,
        reportName: currentReport?.name,
        dateRange,
        generatedAt: new Date().toLocaleString(),
        metrics: currentReport?.getMetrics() || [],
        details: currentReport?.getDetails?.() || [],
      };
      
      switch(format.toLowerCase()) {
        case 'pdf':
          await generatePDF(reportData);
          break;
        case 'excel':
        case 'csv':
          const csv = generateCSV(reportData);
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${selectedReport}-report-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          break;
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setDownloading(false);
    }
  };
  
  if (isLoading && (!loaderData?.projects || !loaderData?.tasks)) {
    return <ReportsSkeleton />;
  }
  
  if (hasError && (!loaderData?.projects || !loaderData?.tasks)) {
    return <ReportsError error={projectsError || tasksError} onRetry={handleRetry} />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Generate and download project reports</p>
          </div>
          <div className="flex gap-2">
            {filteredData.taskStats && (
              <div className="px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-600">
                {filteredData.taskStats.total} tasks in period
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Filters & Report Types */}
          <div className="space-y-6">
            {/* Date Range Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-[#0f5841]" /> Date Range
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    value={dateRange.start} 
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#0f5841] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">End Date</label>
                  <input 
                    type="date" 
                    value={dateRange.end} 
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#0f5841] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            {/* Report Types */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Report Types</h3>
              <div className="space-y-2">
                {reports.map(report => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedReport === report.id 
                        ? 'bg-[#0f5841]/10 border border-[#0f5841] shadow-sm' 
                        : 'border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-3 ${
                        selectedReport === report.id 
                          ? 'bg-[#0f5841] text-white' 
                          : 'bg-gray-100 text-gray-600'
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
          
          {/* Right Panel - Report Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Report Header */}
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{currentReport?.name}</h2>
                  <p className="text-gray-600 text-sm">
                    Generated: {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {['PDF', 'CSV'].map(format => (
                    <button
                      key={format}
                      onClick={() => handleDownload(format)}
                      disabled={downloading}
                      className="px-4 py-2 bg-[#0f5841] text-white rounded-lg hover:bg-[#0a4030] transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                      {downloading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {format}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {metrics.map((metric, i) => (
                  <div key={i} className="text-center p-4 bg-gray-50 rounded-lg hover:shadow-sm transition">
                    <div className="text-2xl font-bold text-[#0f5841]">{metric.value}</div>
                    <div className="text-sm text-gray-600">{metric.label}</div>
                  </div>
                ))}
              </div>
              
              {/* Detailed Breakdown */}
              {details.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Detailed Breakdown</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {details.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        <div className="flex-1">
                          <span className="font-medium text-gray-700">
                            {item.name || item.label || item.title}
                          </span>
                          {item.team && (
                            <span className="text-sm text-gray-500 ml-2">({item.team})</span>
                          )}
                          {item.project && (
                            <span className="text-sm text-gray-500 ml-2">• {item.project}</span>
                          )}
                          {item.dueDate && (
                            <span className="text-sm text-gray-500 ml-2">• Due: {item.dueDate}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {item.status && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
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
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              item.priority === 'high' || item.priority === 'critical' ? 'bg-red-100 text-red-800' :
                              item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {item.priority}
                            </span>
                          )}
                          <span className="font-bold text-[#0f5841]">
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
              
              {/* Empty State */}
              {details.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No data available for this report</p>
                  <p className="text-sm text-gray-400">Try adjusting the date range</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;