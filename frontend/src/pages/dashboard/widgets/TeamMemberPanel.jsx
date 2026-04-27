import React from "react";
import { Link } from "react-router-dom";

const TeamMemberPanel = () => (
  <section className="rounded-2xl border border-green-200 bg-green-50 p-5">
    <h2 className="text-xl font-bold text-slate-900">Team Member Work</h2>
    <p className="mt-2 text-sm text-slate-600">
      Track personal tasks, progress, and execution details from the member workspace.
    </p>
    <div className="mt-4 flex flex-wrap gap-3">
      <Link to="/team-member/dashboard" className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white">
        Open Member Dashboard
      </Link>
      <Link to="/team-member/tasks" className="rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-800">
        View My Tasks
      </Link>
    </div>
  </section>
);

export default TeamMemberPanel;
