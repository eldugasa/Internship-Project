import React from "react";
import { Link } from "react-router-dom";

const ProjectManagerPanel = () => (
  <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
    <h2 className="text-xl font-bold text-slate-900">Project Manager Work</h2>
    <p className="mt-2 text-sm text-slate-600">
      Manage projects, teams, assignments, and execution workflows.
    </p>
    <div className="mt-4 flex flex-wrap gap-3">
      <Link to="/manager/dashboard" className="rounded-lg bg-[#194f87] px-4 py-2 text-sm font-semibold text-white">
        Open Manager Dashboard
      </Link>
      <Link to="/manager/tasks" className="rounded-lg border border-[#194f87] px-4 py-2 text-sm font-semibold text-[#194f87]">
        Manage Tasks
      </Link>
    </div>
  </section>
);

export default ProjectManagerPanel;
