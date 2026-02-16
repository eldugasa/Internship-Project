// src/pages/teamMember/Reports.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  FileText, Download, Calendar, BarChart3, TrendingUp, 
  Clock, CheckCircle, Printer, Share2 
} from 'lucide-react';

const TeamMemberReports = () => {
  const [timePeriod, setTimePeriod] = useState('month');
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Example: current user id
        const userId = 1;
        const res = await axios.get(`http://localhost:5000/api/tasks?assigneeId=${userId}`);
        setTasks(res.data);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        alert('Failed to fetch tasks');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // --- Compute Report Metrics ---
  const { reportData, weeklyPerformance, projects } = useMemo(() => {
    const completed = tasks.filter(t => t.status === 'completed');
    const totalHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    const estHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    // Weekly distribution
    const weeks = Array.from({ length: 4 }, (_, i) => ({ week: `Week ${i + 1}`, hours: 0, tasks: 0, completed: 0 }));

    const projectMap = {};
    tasks.forEach((task, idx) => {
      const wIdx = idx % 4;
      weeks[wIdx].hours += task.actualHours || 0;
      weeks[wIdx].tasks += 1;
      if (task.status === 'completed') weeks[wIdx].completed += 1;

      const pName = task.project || task.projectName || 'Internal';
      if (!projectMap[pName]) projectMap[pName] = { total: 0, completed: 0, hours: 0 };
      projectMap[pName].total++;
      projectMap[pName].hours += task.actualHours || 0;
      if (task.status === 'completed') projectMap[pName].completed++;
    });

    return {
      reportData: {
        totalTasks: tasks.length,
        completedCount: completed.length,
        totalHours,
        estHours,
        efficiency: tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0,
        avgTime: completed.length ? (totalHours / completed.length).toFixed(1) : 0,
      },
      weeklyPerformance: weeks.map(w => ({
        ...w,
        efficiency: w.tasks > 0 ? Math.round((w.completed / w.tasks) * 100) : 0
      })),
      projects: Object.entries(projectMap).map(([name, data]) => ({
        name,
        ...data,
        rate: Math.round((data.completed / data.total) * 100)
      }))
    };
  }, [tasks]);

  const exportReport = (format) => alert(`Preparing ${format.toUpperCase()} export...`);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">Loading reports...</p>
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
          <button onClick={() => exportReport('pdf')} className="bg-[#4DA5AD] text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-[#3e868d]">
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button onClick={() => exportReport('excel')} className="border border-gray-300 bg-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50">
            <Download className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Tasks" value={reportData.totalTasks} icon={FileText} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="Completed" value={reportData.completedCount} icon={CheckCircle} color="text-green-600" bg="bg-green-50" />
        <StatCard title="Hours Worked" value={`${reportData.totalHours}h`} icon={Clock} color="text-blue-500" bg="bg-blue-50" />
        <StatCard title="Efficiency" value={`${reportData.efficiency}%`} icon={TrendingUp} color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* Weekly & Project */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Performance */}
        <ReportCard title="Weekly Performance" icon={<Calendar className="w-4 h-4 text-gray-400" />}>
          {weeklyPerformance.map((w, i) => (
            <div key={i} className="p-4 border border-gray-100 rounded-xl mb-2">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold">{w.week}</span>
                <span className="text-gray-500">{w.efficiency}% efficiency</span>
              </div>
              <div className="flex gap-4 text-xs text-gray-400 mb-3">
                <span>Hours: <b>{w.hours}h</b></span>
                <span>Tasks: <b>{w.tasks}</b></span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#4DA5AD] h-full" style={{ width: `${(w.hours / 40) * 100}%` }} />
              </div>
            </div>
          ))}
        </ReportCard>

        {/* Project Breakdown */}
        <ReportCard title="Project Breakdown">
          {projects.map((p, i) => (
            <div key={i} className="space-y-2 mb-3">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm font-bold">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.completed}/{p.total} tasks • {p.hours}h</p>
                </div>
                <span className="text-sm font-bold">{p.rate}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#4DA5AD] h-full transition-all duration-1000" style={{ width: `${p.rate}%` }} />
              </div>
            </div>
          ))}
        </ReportCard>
      </div>

      {/* Detailed Table */}
      <ReportCard title="Detailed Statistics" actions={[
        <button key="print" className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><Printer className="w-4 h-4" /></button>,
        <button key="share" className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><Share2 className="w-4 h-4" /></button>
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
              <TableRow label="Task Completion Rate" val={`${reportData.efficiency}%`} target="90%" status={reportData.efficiency >= 90 ? 'Met' : 'Below Target'} isPositive={reportData.efficiency >= 90} trend="+5%" />
              <TableRow label="Average Completion Time" val={`${reportData.avgTime}h`} target="6h" status={parseFloat(reportData.avgTime) <= 6 ? 'Good' : 'Needs Work'} isPositive={parseFloat(reportData.avgTime) <= 6} trend="-0.5h" />
              <TableRow label="Hours Utilization" val={`${reportData.estHours ? Math.round((reportData.totalHours/reportData.estHours)*100) : 0}%`} target="85%" status="Good" isPositive trend="+8%" />
              <TableRow label="On-time Delivery" val="95%" target="95%" status="Met" isPositive trend="+3%" />
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
  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
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
  <tr className="hover:bg-gray-50/50">
    <td className="px-6 py-4 font-medium text-gray-900">{label}</td>
    <td className="px-6 py-4">{val}</td>
    <td className="px-6 py-4 text-gray-400">{target}</td>
    <td className="px-6 py-4">
      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${isPositive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
        {status}
      </span>
    </td>
    <td className={`px-6 py-4 flex items-center gap-1 font-medium ${isPositive ? 'text-green-600' : 'text-orange-600'}`}>
      <TrendingUp className="w-3 h-3" /> {trend}
    </td>
  </tr>
);

const ExportCard = ({ title, desc, icon: Icon, color, onClick }) => (
  <button onClick={onClick} className="p-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex flex-col items-center text-center">
    <Icon className={`w-10 h-10 ${color} mb-3`} />
    <span className="font-bold text-gray-900">{title}</span>
    <span className="text-xs text-gray-500 mt-1">{desc}</span>
  </button>
);

const ReportCard = ({ title, children, icon, actions }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
    <div className="flex justify-between items-center mb-4">
      <h2 className="font-bold text-gray-900">{title}</h2>
      <div className="flex gap-2">{icon}{actions}</div>
    </div>
    {children}
  </div>
);

export default TeamMemberReports;
