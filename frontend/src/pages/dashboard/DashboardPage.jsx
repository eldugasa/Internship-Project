import React, { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import BaseSummary from "./widgets/BaseSummary";
import SuperAdminPanel from "./widgets/SuperAdminPanel";
import WorkspacePanel from "./widgets/WorkspacePanel";
import { getVisibleWidgets, workspaceWidgetConfigs } from "../../features/dashboard/widgetAccess";

const DashboardPage = () => {
  const { user, hasPermission, isSuperAdmin } = useAuth();
  const role = user?.role;

  const visiblePanels = useMemo(() => {
    return getVisibleWidgets({ hasPermission, isSuperAdmin, role });
  }, [hasPermission, isSuperAdmin, role]);

  const visibleWorkspaceWidgets = useMemo(
    () => workspaceWidgetConfigs.filter((widget) => visiblePanels.includes(widget.key)),
    [visiblePanels],
  );

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <BaseSummary user={user} />

        <div className="grid gap-5">
          {visibleWorkspaceWidgets.map((widget) => (
            <WorkspacePanel key={widget.key} {...widget} />
          ))}
          {visiblePanels.includes("super-admin") && <SuperAdminPanel />}
        </div>
      </div>
    </main>
  );
};

export default DashboardPage;
