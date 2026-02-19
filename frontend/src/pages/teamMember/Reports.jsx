// src/pages/teamMember/Reports.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Download, Calendar, BarChart3, TrendingUp, 
  Clock, CheckCircle, Printer, Share2, AlertCircle 
} from 'lucide-react';
import { getMyTasks } from '../../services/tasksService';

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
        
        // ✅ Use getMyTasks instead of axios
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

  // --- Compute Report Metrics ---
  const { reportData, weeklyPerformance, projects, monthlyPerformance } = useMemo(() => {
    const completed = tasks.filter(t => t.status === 'completed');
    const totalHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    const estHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    
    // Calculate on-time delivery
    const onTimeTasks = tasks.filter(t => {
      if (!t.dueDate || t.status !== 'completed') return false;
      const completedDate = t.completedDate ? new Date(t.completedDate) : new Date(t.updatedAt);
      const dueDate = new Date(t.dueDate);
      return completedDate <= dueDate;
    }).length;

    // Calculate overdue tasks
    const overdueTasks = tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
    ).length;

    // Weekly distribution based on actual dates
    const weeks = [];
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() + 7 * i));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt || task.updatedAt);
        return taskDate >= weekStart && taskDate <= weekEnd;
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
    weeks.reverse(); // Show oldest first

    // Monthly performance
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthData = months.map((month, index) => {
      const monthTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt || task.updatedAt);
        return taskDate.getMonth() === index;
      });
      
      return {
        month,
        tasks: monthTasks.length,
        completed: monthTasks.filter(t => t.status === 'completed').length,
        hours: monthTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)
      };
    }).filter(m => m.tasks > 0); // Only show months with data

    // Project breakdown
    const projectMap = {};
    tasks.forEach((task) => {
      const pName = task.projectName || task.project || 'Internal';
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
        totalTasks: tasks.length,
        completedCount: completed.length,
        pendingCount: tasks.filter(t => t.status === 'pending').length,
        inProgressCount: tasks.filter(t => t.status === 'in-progress').length,
        overdueCount: overdueTasks,
        totalHours,
        estHours,
        efficiency: tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0,
        avgTime: completed.length ? (totalHours / completed.length).toFixed(1) : 0,
        onTimeDelivery: tasks.length ? Math.round((onTimeTasks / completed.length) * 100) : 0,
        utilization: estHours > 0 ? Math.round((totalHours / estHours) * 100) : 0
      },
      weeklyPerformance: weeks,
      monthlyPerformance: monthData,
      projects: Object.entries(projectMap).map(([name, data]) => ({
        name,
        ...data,
        rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
      }))
    };
  }, [tasks]);

  const exportReport = (format) => {
    alert(`Preparing ${format.toUpperCase()} export...`);
    // In a real app, you would generate and download the report
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
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500">Comprehensive performance analysis and exports</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-[#4DA5AD]"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button 
            onClick={() => exportReport('pdf')} 
            className="bg-[#4DA5AD] text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-[#3e868d] transition-colors"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button 
            onClick={() => exportReport('excel')} 
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
                    style={{ width: `${(w.hours / 40) * 100}%` }} 
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
            projects.map((p, i) => (
              <div key={i} className="space-y-2 mb-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{p.name}</p>
                    <div className="flex gap-3 text-xs text-gray-500 mt-1">
                      <span>✅ {p.completed} done</span>
                      <span>🔄 {p.inProgress || 0} in progress</span>
                      <span>⏳ {p.pending || 0} pending</span>
                      <span>⏱️ {p.hours}h</span>
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

      {/* Monthly Performance Chart */}
      {monthlyPerformance.length > 0 && (
        <ReportCard title="Monthly Performance">
          <div className="grid grid-cols-6 gap-2 mt-4">
            {monthlyPerformance.map((month, i) => (
              <div key={i} className="text-center">
                <div className="text-xs font-medium text-gray-500 mb-2">{month.month}</div>
                <div className="flex flex-col items-center">
                  <div 
                    className="w-full bg-[#4DA5AD] rounded-t-lg transition-all duration-500" 
                    style={{ height: `${(month.tasks / Math.max(...monthlyPerformance.map(m => m.tasks))) * 100}px`, minHeight: '20px' }}
                  />
                  <div className="text-xs font-bold mt-2">{month.tasks}</div>
                  <div className="text-xs text-gray-400">tasks</div>
                </div>
              </div>
            ))}
          </div>
        </ReportCard>
      )}

      {/* Detailed Table */}
      <ReportCard title="Detailed Statistics" actions={[
        <button key="print" className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors" title="Print">
          <Printer className="w-4 h-4" />
        </button>,
        <button key="share" className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors" title="Share">
          <Share2 className="w-4 h-4" />
        </button>
      ]}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 font-semibold">Metric</th>
                <th className="px-6 py-4 font-semibold">Value</th>
                <th className="px-6 py-4 font-semibold">Target</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              <TableRow 
                label="Task Completion Rate" 
                val={`${reportData.efficiency}%`} 
                target="85%" 
                status={reportData.efficiency >= 85 ? 'Met' : 'Below Target'} 
                isPositive={reportData.efficiency >= 85} 
                trend={`${reportData.efficiency - 85 > 0 ? '+' : ''}${reportData.efficiency - 85}%`} 
              />
              <TableRow 
                label="Average Completion Time" 
                val={`${reportData.avgTime}h`} 
                target="8h" 
                status={parseFloat(reportData.avgTime) <= 8 ? 'Good' : 'Needs Work'} 
                isPositive={parseFloat(reportData.avgTime) <= 8} 
                trend={`${8 - parseFloat(reportData.avgTime) > 0 ? '-' : '+'}${Math.abs(8 - parseFloat(reportData.avgTime)).toFixed(1)}h`} 
              />
              <TableRow 
                label="Hours Utilization" 
                val={`${reportData.utilization}%`} 
                target="80%" 
                status={reportData.utilization >= 80 ? 'Good' : 'Below Target'} 
                isPositive={reportData.utilization >= 80} 
                trend={`${reportData.utilization - 80 > 0 ? '+' : ''}${reportData.utilization - 80}%`} 
              />
              <TableRow 
                label="On-time Delivery" 
                val={`${reportData.onTimeDelivery}%`} 
                target="90%" 
                status={reportData.onTimeDelivery >= 90 ? 'Met' : 'Below Target'} 
                isPositive={reportData.onTimeDelivery >= 90} 
                trend={`${reportData.onTimeDelivery - 90 > 0 ? '+' : ''}${reportData.onTimeDelivery - 90}%`} 
              />
            </tbody>
          </table>
        </div>
      </ReportCard>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ExportCard title="PDF Report" desc="Detailed report with charts" color="text-red-500" icon={FileText} onClick={() => exportReport('pdf')} />
        <ExportCard title="Excel Data" desc="Raw data for analysis" color="text-green-500" icon={BarChart3} onClick={() => exportReport('excel')} />
        <ExportCard title="Summary Report" desc="Brief overview" color="text-blue-500" icon={FileText} onClick={() => exportReport('summary')} />
      </div>
    </div>
  );
};

// --- Helper Components ---
const StatCard = ({ title, value, icon: Icon, color, bg }) => (
  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
    <div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
    <div className={`p-3 rounded-lg ${bg} ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

const TableRow = ({ label, val, target, status, trend, isPositive }) => (
  <tr className="hover:bg-gray-50/50 transition">
    <td className="px-6 py-4 font-medium text-gray-900">{label}</td>
    <td className="px-6 py-4 font-medium">{val}</td>
    <td className="px-6 py-4 text-gray-400">{target}</td>
    <td className="px-6 py-4">
      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
        isPositive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
      }`}>
        {status}
      </span>
    </td>
    <td className={`px-6 py-4 flex items-center gap-1 font-medium ${
      trend.startsWith('+') ? 'text-green-600' : trend.startsWith('-') ? 'text-red-600' : 'text-gray-600'
    }`}>
      <TrendingUp className={`w-3 h-3 ${trend.startsWith('+') ? 'rotate-0' : 'rotate-180'}`} /> 
      {trend}
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