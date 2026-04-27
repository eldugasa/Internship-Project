import React from "react";
import { Link } from "react-router-dom";

const QATesterPanel = () => (
  <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
    <h2 className="text-xl font-bold text-slate-900">QA Testing Work</h2>
    <p className="mt-2 text-sm text-slate-600">
      Review assigned QA tasks, validate quality, and move work through testing.
    </p>
    <div className="mt-4 flex flex-wrap gap-3">
      <Link to="/qa-tester/dashboard" className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white">
        Open QA Dashboard
      </Link>
      <Link to="/qa-tester/tasks" className="rounded-lg border border-amber-600 px-4 py-2 text-sm font-semibold text-amber-700">
        View QA Tasks
      </Link>
    </div>
  </section>
);

export default QATesterPanel;
