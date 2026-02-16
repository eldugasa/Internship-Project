// src/hooks/useAdminData.js
import { useState, useEffect } from "react";
import {
  getUsers,
  updateUserRole as updateUserRoleApi,
  deleteUser as deleteUserApi,
} from "../services/usersService";
import {
  getTeams,
  createTeam as createTeamApi,
  deleteTeam as deleteTeamApi,
} from "../services/teamsService";
import { getProjects } from "../services/projectsService";

// Normalize role key for UI fallback updates (project-manager -> project_manager)
const getRoleKey = (role = "") => role.toLowerCase().replace(/-/g, "_");

export const useAdminData = () => {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState([]);

  // Build dashboard stats from fetched backend data
  const buildStats = (usersData, teamsData, projectsData) => {
    setStats([
      { label: "Total Users", value: usersData.length, change: "" },
      { label: "Active Teams", value: teamsData.length, change: "" },
      { label: "Total Projects", value: projectsData.length, change: "" },
      {
        label: "Active Users",
        value: usersData.filter((u) => (u.status || "active") === "active").length,
        change: "",
      },
    ]);
  };

  // Load all admin data in parallel for better performance
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, teamsData, projectsData] = await Promise.all([
        getUsers(),
        getTeams(),
        getProjects(),
      ]);

      setUsers(usersData);
      setTeams(teamsData);
      setProjects(projectsData);
      buildStats(usersData, teamsData, projectsData);
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Update user role:
  // - Try backend first
  // - If backend fails, keep UI responsive with local fallback update
  const updateUserRole = async (userId, newRole) => {
    try {
      const updated = await updateUserRoleApi(userId, newRole);
      setUsers((prev) => prev.map((user) => (user.id === userId ? updated : user)));
    } catch (error) {
      console.error("Failed to update user role:", error);
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role: getRoleKey(newRole) } : user,
        ),
      );
    }
  };

  // UI-only status update (can be connected to backend later)
  const updateUserStatus = (userId, newStatus) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, status: newStatus } : user)),
    );
  };

  // Delete user:
  // - Confirm first
  // - Call backend
  // - Always remove from local list to keep UX smooth
  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteUserApi(userId);
    } catch (error) {
      console.error("Failed to delete user on backend:", error);
    }

    setUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  // Create team:
  // - Prompt name
  // - Try backend
  // - Fallback to temporary local team if backend fails
  const createTeam = async () => {
    const teamName = prompt("Enter team name:");
    if (!teamName) return;

    try {
      const newTeam = await createTeamApi({
        name: teamName,
        lead: "Unassigned",
        description: "",
      });
      setTeams((prev) => [...prev, newTeam]);
    } catch (error) {
      console.error("Failed to create team:", error);
      const fallbackTeam = {
        id: Date.now(),
        name: teamName,
        lead: "Unassigned",
        memberCount: 0,
        projects: 0,
        color: "#4DA5AD",
      };
      setTeams((prev) => [...prev, fallbackTeam]);
    }
  };

  // Delete team:
  // - Confirm
  // - Try backend
  // - Remove locally for immediate feedback
  const deleteTeam = async (teamId) => {
    if (!window.confirm("Are you sure you want to delete this team?")) return;

    try {
      await deleteTeamApi(teamId);
    } catch (error) {
      console.error("Failed to delete team on backend:", error);
    }

    setTeams((prev) => prev.filter((team) => team.id !== teamId));
  };

  return {
    users,
    teams,
    projects,
    stats,
    isLoading,
    reload: loadData,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    createTeam,
    deleteTeam,
  };
};
