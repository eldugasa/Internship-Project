import React from "react";
import { Link } from "react-router-dom";

const AdminPanel = () => (
  <section className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
    <h2 className="text-xl font-bold text-slate-900">Admin Work</h2>
    <p className="mt-2 text-sm text-slate-600">
      Manage users, projects, reports, and platform-wide administration.
    </p>
    <div className="mt-4 flex flex-wrap gap-3">
      <Link to="/admin/dashboard" className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white">
        Open Admin Dashboard
      </Link>
      <Link to="/admin/users" className="rounded-lg border border-purple-700 px-4 py-2 text-sm font-semibold text-purple-800">
        Manage Users
      </Link>
    </div>
  </section>
);

export default AdminPanel;
