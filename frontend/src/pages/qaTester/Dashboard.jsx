import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyTasks } from '../../services/tasksService';
import { LayoutDashboard, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';

const QATesterDashboard = () => {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['qa-tasks', 'dashboard'],
    queryFn: getMyTasks,
  });

  if (isLoading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  // Count by status
  const inProgress = tasks.filter(t => t.status === 'in-progress' || t.progress === 100 && t.status !== 'in-test' && t.status !== 'passed' && t.status !== 'failed').length;
  const inTest = tasks.filter(t => t.status === 'in-test').length;
  const passed = tasks.filter(t => t.status === 'passed').length;
  const failed = tasks.filter(t => t.status === 'failed').length;
  const pendingRetest = tasks.filter(t => t.status === 'pending-retest').length;

  const total = tasks.length;

  const statCards = [
    { title: 'Total Tasks Assigned', value: total, icon: LayoutDashboard, color: 'text-gray-600', bg: 'bg-gray-100' },
    { title: 'In Test', value: inTest, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Passed', value: passed, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Failed', value: failed, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
    { title: 'Pending Retest', value: pendingRetest, icon: RefreshCw, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">QA Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className={`w-12 h-12 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent QA Tasks</h2>
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-sm">No tasks assigned to you right now.</p>
        ) : (
          <div className="space-y-4">
            {tasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <h3 className="font-medium text-gray-900">{task.title}</h3>
                  <p className="text-xs text-gray-500">{task.projectName} • Status: <span className="uppercase">{task.status}</span></p>
                </div>
                <div className="text-sm font-semibold">
                  Progress: {task.progress}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QATesterDashboard;
