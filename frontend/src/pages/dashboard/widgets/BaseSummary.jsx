import React from "react";

const BaseSummary = ({ user }) => {
  const permissions = user?.effectivePermissions || [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#4DA5AD]">
        Access Summary
      </p>
      <h1 className="mt-2 text-3xl font-black text-slate-900">
        {user?.name || "User"} Workspace
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Primary role: <span className="font-semibold text-slate-900">{user?.role?.replace(/[-_]/g, " ")}</span>
      </p>
      <p className="mt-1 text-sm text-slate-600">
        Effective permissions: <span className="font-semibold text-slate-900">{permissions.includes("*") ? "All" : permissions.length}</span>
      </p>
    </section>
  );
};

export default BaseSummary;
