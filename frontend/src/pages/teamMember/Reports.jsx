// src/pages/teamMember/Reports.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Download, Calendar, BarChart3, TrendingUp, 
  Clock, CheckCircle, Printer, Share2, AlertCircle 
} from 'lucide-react';
import { getMyTasks } from '../../services/tasksService';
import PrintReport from '../../Component/teamMember/PrintReport';
import ReactDOMServer from 'react-dom/server';

const TeamMemberReports = () => {
  const [timePeriod, setTimePeriod] = useState('month');
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const userTasks = await getMyTasks();
        setTasks(userTasks);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError(err.message || 'Failed to fetch tasks');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // Date parsing function for DD/MM/YYYY format
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        return new Date(`${year}-${month}-${day}`);
      }
      return new Date(dateStr);
    } catch {
      return null;
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      if (typeof dateStr === 'string' && dateStr.includes('/')) {
        return dateStr;
      }
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  // --- Compute Report Metrics from REAL data only ---
  const { reportData, weeklyPerformance, projects, monthlyPerformance } = useMemo(() => {
    // Filter tasks based on selected time period
    const now = new Date();
    const filteredTasks = tasks.filter(task => {
      const taskDate = parseDate(task.createdAt || task.updatedAt);
      if (!taskDate) return true;

      if (timePeriod === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return taskDate >= weekAgo;
      } else if (timePeriod === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        return taskDate >= monthAgo;
      } else if (timePeriod === 'year') {
        const yearAgo = new Date(now);
        yearAgo.setFullYear(now.getFullYear() - 1);
        return taskDate >= yearAgo;
      }
      return true;
    });

    const completed = filteredTasks.filter(t => t.status === 'completed');
    const inProgress = filteredTasks.filter(t => t.status === 'in-progress');
    const pending = filteredTasks.filter(t => t.status === 'pending');
    
    const totalHours = filteredTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    const estHours = filteredTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    
    // Calculate on-time delivery from REAL data
    const onTimeTasks = completed.filter(t => {
      if (!t.dueDate) return true;
      const completedDate = t.completedDate ? parseDate(t.completedDate) : parseDate(t.updatedAt);
      const dueDate = parseDate(t.dueDate);
      return completedDate && dueDate && completedDate <= dueDate;
    }).length;

    // Calculate overdue tasks from REAL data
    const overdueTasks = filteredTasks.filter(t => {
      if (t.status === 'completed' || !t.dueDate) return false;
      const dueDate = parseDate(t.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate?.setHours(0, 0, 0, 0);
      return dueDate && dueDate < today;
    }).length;

    // Weekly distribution based on REAL dates
    const weeks = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() + 7 * i));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekTasks = filteredTasks.filter(task => {
        const taskDate = parseDate(task.createdAt || task.updatedAt);
        return taskDate && taskDate >= weekStart && taskDate <= weekEnd;
      });
      
      const weekCompleted = weekTasks.filter(t => t.status === 'completed').length;
      const weekHours = weekTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
      
      weeks.push({
        week: `Week ${4 - i}`,
        hours: weekHours,
        tasks: weekTasks.length,
        completed: weekCompleted,
        efficiency: weekTasks.length > 0 ? Math.round((weekCompleted / weekTasks.length) * 100) : 0
      });
    }
    weeks.reverse();

    // Monthly performance from REAL data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthData = months.map((month, index) => {
      const monthTasks = filteredTasks.filter(task => {
        const taskDate = parseDate(task.createdAt || task.updatedAt);
        return taskDate && taskDate.getMonth() === index && taskDate.getFullYear() === now.getFullYear();
      });
      
      return {
        month,
        tasks: monthTasks.length,
        completed: monthTasks.filter(t => t.status === 'completed').length,
        hours: monthTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)
      };
    }).filter(m => m.tasks > 0);

    // Project breakdown from REAL data
    const projectMap = {};
    filteredTasks.forEach((task) => {
      const pName = task.projectName || task.project || 'Individual Tasks';
      if (!projectMap[pName]) {
        projectMap[pName] = { 
          total: 0, 
          completed: 0, 
          hours: 0,
          pending: 0,
          inProgress: 0
        };
      }
      projectMap[pName].total++;
      projectMap[pName].hours += task.actualHours || 0;
      
      if (task.status === 'completed') {
        projectMap[pName].completed++;
      } else if (task.status === 'in-progress') {
        projectMap[pName].inProgress++;
      } else {
        projectMap[pName].pending++;
      }
    });

    return {
      reportData: {
        totalTasks: filteredTasks.length,
        completedCount: completed.length,
        pendingCount: pending.length,
        inProgressCount: inProgress.length,
        overdueCount: overdueTasks,
        totalHours,
        estHours,
        efficiency: filteredTasks.length ? Math.round((completed.length / filteredTasks.length) * 100) : 0,
        avgTime: completed.length ? (totalHours / completed.length).toFixed(1) : 0,
        onTimeDelivery: completed.length ? Math.round((onTimeTasks / completed.length) * 100) : 0,
        utilization: estHours > 0 ? Math.round((totalHours / estHours) * 100) : 0
      },
      weeklyPerformance: weeks.filter(w => w.tasks > 0),
      monthlyPerformance: monthData,
      projects: Object.entries(projectMap).map(([name, data]) => ({
        name,
        ...data,
        rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
      })).sort((a, b) => b.total - a.total)
    };
  }, [tasks, timePeriod]);

  // Print function using the PrintReport component
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    const printContent = ReactDOMServer.renderToString(
      <PrintReport 
        reportData={reportData}
        weeklyPerformance={weeklyPerformance}
        projects={projects}
        timePeriod={timePeriod}
      />
    );
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Generate CSV for Excel
  const generateCSV = () => {
    const rows = [
      ['TASK PERFORMANCE REPORT'],
      [`Generated: ${new Date().toLocaleString()}`],
      [`Time Period: Last ${timePeriod === 'week' ? '7 Days' : timePeriod === 'month' ? '30 Days' : '12 Months'}`],
      [''],
      ['KEY METRICS'],
      ['Metric', 'Value', 'Target', 'Status'],
      ['Total Tasks', reportData.totalTasks, '-', '-'],
      ['Completed', reportData.completedCount, '-', '-'],
      ['In Progress', reportData.inProgressCount, '-', '-'],
      ['Overdue', reportData.overdueCount, '-', '-'],
      ['Completion Rate', `${reportData.efficiency}%`, '80%', reportData.efficiency >= 80 ? 'On Track' : 'Behind'],
      ['On-time Delivery', `${reportData.onTimeDelivery}%`, '90%', reportData.onTimeDelivery >= 90 ? 'Excellent' : 'Needs Work'],
      ['Hours Utilization', `${reportData.utilization}%`, '80%', reportData.utilization >= 80 ? 'Good' : 'Low'],
      ['Average Time/Task', `${reportData.avgTime}h`, '8h', parseFloat(reportData.avgTime) <= 8 ? 'Good' : 'High'],
      [''],
      ['WEEKLY PERFORMANCE'],
      ['Week', 'Tasks', 'Completed', 'Hours', 'Efficiency'],
      ...weeklyPerformance.map(w => [w.week, w.tasks, w.completed, `${w.hours}h`, `${w.efficiency}%`]),
      [''],
      ['PROJECT BREAKDOWN'],
      ['Project', 'Total Tasks', 'Completed', 'In Progress', 'Pending', 'Hours', 'Completion Rate'],
      ...projects.map(p => [
        p.name,
        p.total,
        p.completed,
        p.inProgress || 0,
        p.pending || 0,
        `${p.hours}h`,
        `${p.rate}%`
      ])
    ];

    return rows.map(row => row.join(',')).join('\n');
  };

  // Download function
  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Export to Excel (CSV format)
  const exportToExcel = () => {
    const csv = generateCSV();
    downloadFile(
      csv, 
      `task-report-${timePeriod}-${new Date().toISOString().split('T')[0]}.csv`, 
      'text/csv'
    );
    alert('✅ CSV file downloaded - Open in Excel');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Performance Reports</h1>
          <p className="text-gray-500">Real-time analytics from your actual task data</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-[#4DA5AD]"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last 12 Months</option>
          </select>
          <button 
            onClick={handlePrint}
            className="bg-[#4DA5AD] text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-[#3e868d] transition-colors"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button 
            onClick={exportToExcel} 
            className="border border-gray-300 bg-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Tasks" value={reportData.totalTasks} icon={FileText} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="Completed" value={reportData.completedCount} icon={CheckCircle} color="text-green-600" bg="bg-green-50" />
        <StatCard title="In Progress" value={reportData.inProgressCount} icon={TrendingUp} color="text-yellow-600" bg="bg-yellow-50" />
        <StatCard title="Overdue" value={reportData.overdueCount} icon={AlertCircle} color="text-red-600" bg="bg-red-50" />
      </div>

      {/* Weekly & Project */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Performance */}
        <ReportCard title="Weekly Performance" icon={<Calendar className="w-4 h-4 text-gray-400" />}>
          {weeklyPerformance.length > 0 ? (
            weeklyPerformance.map((w, i) => (
              <div key={i} className="p-4 border border-gray-100 rounded-xl mb-2 hover:shadow-sm transition">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-bold">{w.week}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    w.efficiency >= 75 ? 'bg-green-100 text-green-700' :
                    w.efficiency >= 50 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {w.efficiency}% efficiency
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-gray-500 mb-3">
                  <span>Hours: <b className="text-gray-900">{w.hours}h</b></span>
                  <span>Tasks: <b className="text-gray-900">{w.tasks}</b></span>
                  <span>Completed: <b className="text-gray-900">{w.completed}</b></span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#4DA5AD] h-full transition-all duration-500" 
                    style={{ width: `${(w.completed / (w.tasks || 1)) * 100}%` }} 
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No weekly data available</p>
          )}
        </ReportCard>

        {/* Project Breakdown */}
        <ReportCard title="Project Breakdown">
          {projects.length > 0 ? (
            projects.slice(0, 5).map((p, i) => (
              <div key={i} className="space-y-2 mb-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{p.name}</p>
                    <div className="flex gap-3 text-xs text-gray-500 mt-1">
                      <span className="text-green-600">✅ {p.completed}</span>
                      <span className="text-blue-600">🔄 {p.inProgress || 0}</span>
                      <span className="text-yellow-600">⏳ {p.pending || 0}</span>
                      <span className="text-purple-600">⏱️ {p.hours}h</span>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-[#4DA5AD]">{p.rate}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#4DA5AD] h-full transition-all duration-1000 rounded-full" 
                    style={{ width: `${p.rate}%` }} 
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No project data available</p>
          )}
        </ReportCard>
      </div>

      {/* Monthly Performance */}
      {monthlyPerformance.length > 0 && (
        <ReportCard title="Monthly Performance">
          <div className="grid grid-cols-6 gap-2 mt-4">
            {monthlyPerformance.map((month, i) => (
              <div key={i} className="text-center">
                <div className="text-xs font-medium text-gray-500 mb-2">{month.month}</div>
                <div className="flex flex-col items-center">
                  <div 
                    className="w-full bg-[#4DA5AD] rounded-t-lg transition-all duration-500 hover:bg-[#2D4A6B] relative group" 
                    style={{ height: `${Math.max((month.tasks / Math.max(...monthlyPerformance.map(m => m.tasks))) * 100, 4)}px`, minHeight: '20px' }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                      {month.tasks} tasks • {month.hours}h
                    </div>
                  </div>
                  <div className="text-xs font-bold mt-2">{month.tasks}</div>
                  <div className="text-xs text-gray-400">tasks</div>
                </div>
              </div>
            ))}
          </div>
        </ReportCard>
      )}

      {/* Detailed Table */}
      <ReportCard title="Performance Metrics" actions={[
        <button key="share" className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors" title="Share" onClick={() => navigator.clipboard.writeText(window.location.href).then(() => alert('Link copied!'))}>
          <Share2 className="w-4 h-4" />
        </button>
      ]}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 font-semibold">Metric</th>
                <th className="px-6 py-4 font-semibold">Your Value</th>
                <th className="px-6 py-4 font-semibold">Target</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              <TableRow 
                label="Task Completion Rate" 
                value={`${reportData.efficiency}%`} 
                target="80%" 
                status={reportData.efficiency >= 80 ? 'On Track' : 'Behind'} 
                isPositive={reportData.efficiency >= 80} 
              />
              <TableRow 
                label="On-time Delivery" 
                value={`${reportData.onTimeDelivery}%`} 
                target="90%" 
                status={reportData.onTimeDelivery >= 90 ? 'Excellent' : 'Needs Work'} 
                isPositive={reportData.onTimeDelivery >= 90} 
              />
              <TableRow 
                label="Hours Utilization" 
                value={`${reportData.utilization}%`} 
                target="80%" 
                status={reportData.utilization >= 80 ? 'Good' : 'Low'} 
                isPositive={reportData.utilization >= 80} 
              />
              <TableRow 
                label="Average Time/Task" 
                value={`${reportData.avgTime}h`} 
                target="8h" 
                status={parseFloat(reportData.avgTime) <= 8 ? 'Good' : 'High'} 
                isPositive={parseFloat(reportData.avgTime) <= 8} 
              />
            </tbody>
          </table>
        </div>
      </ReportCard>

      {/* Export Options - Print and Excel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExportCard 
          title="Print Report" 
          desc="Open print-friendly version" 
          color="text-[#4DA5AD]" 
          icon={Printer} 
          onClick={handlePrint} 
        />
        <ExportCard 
          title="Excel Data" 
          desc="Download CSV for analysis" 
          color="text-green-600" 
          icon={BarChart3} 
          onClick={exportToExcel} 
        />
      </div>
    </div>
  );
};

// Helper Components (keep these in the same file)
const StatCard = ({ title, value, icon: Icon, color, bg }) => (
  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
    <div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
    <div className={`p-3 rounded-lg ${bg}`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
  </div>
);

const TableRow = ({ label, value, target, status, isPositive }) => (
  <tr className="hover:bg-gray-50/50 transition">
    <td className="px-6 py-4 font-medium text-gray-900">{label}</td>
    <td className="px-6 py-4 font-medium">{value}</td>
    <td className="px-6 py-4 text-gray-400">{target}</td>
    <td className="px-6 py-4">
      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
        isPositive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
      }`}>
        {status}
      </span>
    </td>
  </tr>
);

const ExportCard = ({ title, desc, icon: Icon, color, onClick }) => (
  <button 
    onClick={onClick} 
    className="p-6 border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all flex flex-col items-center text-center group"
  >
    <Icon className={`w-10 h-10 ${color} mb-3 group-hover:scale-110 transition-transform`} />
    <span className="font-bold text-gray-900">{title}</span>
    <span className="text-xs text-gray-500 mt-1">{desc}</span>
  </button>
);

const ReportCard = ({ title, children, icon, actions }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
    <div className="flex justify-between items-center mb-4">
      <h2 className="font-bold text-gray-900 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <div className="flex gap-2">{actions}</div>
    </div>
    {children}
  </div>
);

export default TeamMemberReports;