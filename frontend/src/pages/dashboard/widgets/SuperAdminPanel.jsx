import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProjects } from "../../../services/projectsService";
import { getTeams } from "../../../services/teamsService";
import { getUsers } from "../../../services/usersService";

const governanceItems = [
  "View all users and oversee admin management.",
  "Create admins or upgrade users to admin.",
  "Create new roles, assign roles, and update role access.",
  "Manage access hierarchy, permissions, reports, and platform settings.",
  "View projects with their assigned team names.",
  "Show total teams and display the available team list.",
];

const SuperAdminPanel = () => {
  const { data: users = [] } = useQuery({
    queryKey: ["users", "super-admin-panel"],
    queryFn: getUsers,
    staleTime: 5 * 60 * 1000,
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["projects", "super-admin-panel"],
    queryFn: getProjects,
    staleTime: 5 * 60 * 1000,
  });
  const { data: teams = [] } = useQuery({
    queryKey: ["teams", "super-admin-panel"],
    queryFn: getTeams,
    staleTime: 5 * 60 * 1000,
  });

  const normalizeRole = (value = "") =>
    value.toString().trim().toLowerCase().replace(/_/g, "-");

  const stats = useMemo(() => {
    const adminCount = users.filter((user) =>
      ["admin", "super-admin"].includes(normalizeRole(user.role)),
    ).length;

    return {
      userCount: users.length,
      adminCount,
      roleCount: new Set(users.map((user) => normalizeRole(user.role)).filter(Boolean)).size,
      teamCount: teams.length,
      projectCount: projects.length,
    };
  }, [projects, teams, users]);

  const teamPreview = useMemo(
    () => teams.slice(0, 4).map((team) => ({
      id: team.id,
      name: team.name || "Unnamed Team",
      members: team.memberCount || team.members?.length || 0,
      projects: team.projectCount || team.projects?.length || 0,
    })),
    [teams],
  );

  const projectPreview = useMemo(
    () => projects.slice(0, 4).map((project) => ({
      id: project.id,
      name: project.name || "Untitled Project",
      team: project.teamName || project.team || "Unassigned",
    })),
    [projects],
  );

  return (
    <section className="rounded-2xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 via-white to-rose-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-700">
            Super Admin
          </span>
          <h2 className="mt-3 text-xl font-bold text-slate-900">Platform Governance Dashboard</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Super admin access is focused on users, admin management, role creation, access hierarchy, projects, reports, and settings. This dashboard is strictly platform oversight and does not include task operations.
          </p>
        </div>

        <div className="rounded-xl border border-fuchsia-200 bg-white/80 px-4 py-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Sidebar Scope</p>
          <p className="mt-1">Dashboard, Users, Reports, and Settings.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-fuchsia-100 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-700">Users</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.userCount}</p>
          <p className="mt-1 text-sm text-slate-600">Total users in the platform</p>
        </div>
        <div className="rounded-xl border border-fuchsia-100 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-700">Admins</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.adminCount}</p>
          <p className="mt-1 text-sm text-slate-600">Admins managed by super admin</p>
        </div>
        <div className="rounded-xl border border-fuchsia-100 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-700">Roles</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.roleCount}</p>
          <p className="mt-1 text-sm text-slate-600">Existing role structure</p>
        </div>
        <div className="rounded-xl border border-fuchsia-100 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-700">Teams</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.teamCount}</p>
          <p className="mt-1 text-sm text-slate-600">Teams visible on the platform</p>
        </div>
        <div className="rounded-xl border border-fuchsia-100 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-700">Projects</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.projectCount}</p>
          <p className="mt-1 text-sm text-slate-600">Projects and assigned teams</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {governanceItems.map((item) => (
          <div
            key={item}
            className="rounded-xl border border-fuchsia-100 bg-white px-4 py-3 text-sm text-slate-700"
          >
            {item}
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-fuchsia-100 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Team Overview</h3>
            <span className="text-xs text-slate-500">{stats.teamCount} total teams</span>
          </div>
          <div className="mt-3 space-y-2">
            {teamPreview.length ? (
              teamPreview.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{team.name}</p>
                    <p className="text-xs text-slate-500">{team.members} members</p>
                  </div>
                  <span className="text-xs font-medium text-fuchsia-700">
                    {team.projects} projects
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No teams available.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-fuchsia-100 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Project Overview</h3>
            <span className="text-xs text-slate-500">{stats.projectCount} total projects</span>
          </div>
          <div className="mt-3 space-y-2">
            {projectPreview.length ? (
              projectPreview.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{project.name}</p>
                    <p className="text-xs text-slate-500">Assigned team: {project.team}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No projects available.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          to="/admin/dashboard"
          className="rounded-lg bg-fuchsia-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Open Dashboard
        </Link>
        <Link
          to="/admin/users"
          className="rounded-lg border border-fuchsia-700 px-4 py-2 text-sm font-semibold text-fuchsia-800"
        >
          Users & Admin Management
        </Link>
        <Link
          to="/admin/reports"
          className="rounded-lg border border-fuchsia-700 px-4 py-2 text-sm font-semibold text-fuchsia-800"
        >
          View Reports
        </Link>
        <Link
          to="/admin/settings"
          className="rounded-lg border border-fuchsia-700 px-4 py-2 text-sm font-semibold text-fuchsia-800"
        >
          Manage Settings
        </Link>
      </div>
    </section>
  );
};

export default SuperAdminPanel;
