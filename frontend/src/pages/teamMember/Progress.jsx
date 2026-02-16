// src/pages/teamMember/Progress.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  TrendingUp, Target, Award, Clock, 
  CheckCircle, Download
} from 'lucide-react';

const StatCard = ({ title, value, subtext, icon: Icon, colorClass }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="text-xs text-gray-500">{subtext}</div>
    </div>
  </div>
);

const ProgressRow = ({ label, current, total, percentage, unit = "tasks" }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-sm">
      <span className="font-medium text-gray-900">{label}</span>
      <span className="text-gray-500">{current}/{total} {unit}</span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div 
        className="bg-[#4DA5AD] h-2 rounded-full transition-all duration-500" 
        style={{ width: `${percentage}%` }}
      />
    </div>
  </div>
);

const MetricGroup = ({ title, items }) => (
  <div className="space-y-3">
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
    <div className="space-y-2">
      {items.map(i => (
        <div key={i.label} className="flex justify-between text-sm border-b border-gray-50 pb-1">
          <span className="text-gray-600">{i.label}</span>
          <span className="font-semibold text-gray-900">{i.val}</span>
        </div>
      ))}
    </div>
  </div>
);

const TeamMemberProgress = () => {
  const [tasks, setTasks] = useState([]);
  const [timePeriod, setTimePeriod] = useState('month');
  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Example current employee
        const currentEmployee = { id: 1, name: 'Tewodros Mekonnen' };
        setEmployee(currentEmployee);

        // Fetch tasks from backend
        const res = await axios.get(`http://localhost:5000/api/tasks?assigneeId=${currentEmployee.id}`);
        setTasks(res.data);
      } catch (err) {
        console.error('Failed to load tasks:', err);
        alert('Error fetching tasks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const { stats, projectBreakdown } = useMemo(() => {
    const completed = tasks.filter(t => t.status === 'completed');
    const inProgress = tasks.filter(t => t.status === 'in-progress');
    const pending = tasks.filter(t => t.status === 'pending');

    const totalHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    const estHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    const projectMap = {};
    tasks.forEach(task => {
      const name = task.project || task.projectName || 'Unassigned';
      if (!projectMap[name]) projectMap[name] = { total: 0, completed: 0 };
      projectMap[name].total++;
      if (task.status === 'completed') projectMap[name].completed++;
    });

    return {
      stats: {
        efficiency: tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0,
        completedCount: completed.length,
        inProgressCount: inProgress.length,
        pendingCount: pending.length,
        totalHours,
        utilization: estHours ? Math.round((totalHours / estHours) * 100) : 0,
        avgTime: completed.length ? (totalHours / completed.length).toFixed(1) : 0,
      },
      projectBreakdown: Object.entries(projectMap).map(([name, data]) => ({
        name,
        ...data,
        percentage: Math.round((data.completed / data.total) * 100)
      }))
    };
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">Loading progress data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Progress</h1>
          <p className="text-gray-600">Performance insights and task metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DA5AD] outline-none bg-white text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Efficiency Rate" value={`${stats.efficiency}%`} 
          subtext="Based on completion" icon={TrendingUp} colorClass="bg-green-50 text-green-600" 
        />
        <StatCard 
          title="Tasks Completed" value={stats.completedCount} 
          subtext={`${stats.totalHours} hours logged`} icon={CheckCircle} colorClass="bg-blue-50 text-blue-600" 
        />
        <StatCard 
          title="Avg. Completion" value={`${stats.avgTime}h`} 
          subtext="Per task average" icon={Clock} colorClass="bg-orange-50 text-orange-600" 
        />
        <StatCard 
          title="Utilization" value={`${stats.utilization}%`} 
          subtext="Against estimated hours" icon={Target} colorClass="bg-purple-50 text-purple-600" 
        />
      </section>

      {/* Project & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Project Breakdown</h2>
          <div className="space-y-6">
            {projectBreakdown.map(proj => (
              <ProgressRow 
                key={proj.name}
                label={proj.name}
                current={proj.completed}
                total={proj.total}
                percentage={proj.percentage}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Efficiency Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <MetricGroup title="Task Status" items={[
              { label: "Completed", val: stats.completedCount },
              { label: "In Progress", val: stats.inProgressCount },
              { label: "Pending", val: stats.pendingCount },
            ]} />
            <MetricGroup title="Quality" items={[
              { label: "First-time Quality", val: "92%" },
              { label: "Bug Rate", val: "2%" },
              { label: "Satisfaction", val: "4.8/5" },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberProgress;
