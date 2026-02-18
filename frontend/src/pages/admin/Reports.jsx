import React, { useState, useEffect } from "react";
import { apiClient } from "../../services/apiClient";

const Reports = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardData = await apiClient('/admin/dashboard');
        const usersData = await apiClient('/users');

        setDashboardStats(dashboardData);
        setUsers(usersData);
      } catch (err) {
        console.error("Reports fetch error:", err);
        setError("Something went wrong while loading reports.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const completionRate = dashboardStats
    ? Math.round(
        (dashboardStats.completedTasks /
          (dashboardStats.totalTasks || 1)) *
          100
      )
    : 0;

  const exportCSV = () => {
    const csvContent = `
Total Users,${dashboardStats?.totalUsers || 0}
Total Teams,${dashboardStats?.totalTeams || 0}
Total Projects,${dashboardStats?.totalProjects || 0}
Total Tasks,${dashboardStats?.totalTasks || 0}
Completed Tasks,${dashboardStats?.completedTasks || 0}
In Progress Tasks,${dashboardStats?.inProgressTasks || 0}
Completion Rate,${completionRate}%
    `;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "admin-report.csv";
    link.click();
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-600">
        Loading reports...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Reports</h1>
        <button
          onClick={exportCSV}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Export CSV
        </button>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Users" value={dashboardStats?.totalUsers} />
        <StatCard label="Total Teams" value={dashboardStats?.totalTeams} />
        <StatCard label="Total Projects" value={dashboardStats?.totalProjects} />
        <StatCard label="Total Tasks" value={dashboardStats?.totalTasks} />
      </div>

      {/* TASK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Completed Tasks"
          value={dashboardStats?.completedTasks}
        />
        <StatCard
          label="In Progress Tasks"
          value={dashboardStats?.inProgressTasks}
        />
        <StatCard
          label="Completion Rate"
          value={`${completionRate}%`}
        />
      </div>

      {/* USERS TABLE */}
      <div className="bg-white shadow rounded p-6">
        <h2 className="text-lg font-semibold mb-4">Users Overview</h2>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-b hover:bg-gray-50">
                <td className="py-2">{user.name}</td>
                <td>{user.email}</td>
                <td className="capitalize">{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-gray-500 text-center py-4">
            No users found.
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div className="bg-white shadow rounded p-6">
    <div className="text-gray-500 text-sm">{label}</div>
    <div className="text-2xl font-bold text-gray-900">
      {value ?? 0}
    </div>
  </div>
);

export default Reports;
