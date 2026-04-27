import React, { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { PERMISSIONS } from "../../config/permissions";
import BaseSummary from "./widgets/BaseSummary";
import ProjectManagerPanel from "./widgets/ProjectManagerPanel";
import QATesterPanel from "./widgets/QATesterPanel";
import TeamMemberPanel from "./widgets/TeamMemberPanel";
import AdminPanel from "./widgets/AdminPanel";
import SuperAdminPanel from "./widgets/SuperAdminPanel";

const DashboardPage = () => {
  const { user, hasPermission, isSuperAdmin } = useAuth();
  const role = user?.role;

  const visiblePanels = useMemo(() => {
    const panels = [];

    if (role === "team-member") {
      panels.push("team");
    }
    if (role === "project-manager" || hasPermission(PERMISSIONS.MANAGE_TEAMS) || hasPermission(PERMISSIONS.MANAGE_PROJECTS) || hasPermission(PERMISSIONS.ASSIGN_TASKS)) {
      panels.push("pm");
    }
    if (role === "qa-tester" || hasPermission(PERMISSIONS.TEST_TASKS)) {
      panels.push("qa");
    }
    if (
      role === "admin" ||
      role === "super-admin" ||
      hasPermission(PERMISSIONS.MANAGE_USERS) ||
      hasPermission(PERMISSIONS.MANAGE_TEAMS) ||
      hasPermission(PERMISSIONS.MANAGE_PROJECTS) ||
      hasPermission(PERMISSIONS.VIEW_REPORTS) ||
      hasPermission(PERMISSIONS.MANAGE_SETTINGS)
    ) {
      panels.push("admin");
    }
    if (isSuperAdmin()) {
      panels.push("super-admin");
    }

    return [...new Set(panels)];
  }, [hasPermission, isSuperAdmin, role]);

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <BaseSummary user={user} />

        <div className="grid gap-5">
          {visiblePanels.includes("team") && <TeamMemberPanel />}
          {visiblePanels.includes("pm") && <ProjectManagerPanel />}
          {visiblePanels.includes("qa") && <QATesterPanel />}
          {visiblePanels.includes("admin") && <AdminPanel />}
          {visiblePanels.includes("super-admin") && <SuperAdminPanel />}
        </div>
      </div>
    </main>
  );
};

export default DashboardPage;
