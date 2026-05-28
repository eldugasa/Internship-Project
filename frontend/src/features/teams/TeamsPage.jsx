import React, { useMemo, useState } from "react";
import { useLoaderData, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import TeamCard from "../../Component/projectmanager/TeamCard";
import { useAuth } from "../../context/AuthContext";
import {
  prepareTeamForDisplay,
  teamsQuery,
  usersQuery,
} from "../../loader/admin/TeamsManagement.loader";
import { createTeam, deleteTeam } from "../../services/teamsService";
import { isAdminTeamsView, resolveCanManageTeams } from "./teamAccess";

const getUserSkillLabel = (user) => user?.skill || user?.skills || "No skill listed";

const TeamsSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200" />
    </div>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 h-5 w-32 rounded bg-gray-200" />
              <div className="h-4 w-24 rounded bg-gray-200" />
            </div>
            <div className="h-8 w-8 rounded-full bg-gray-200" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-4 w-40 rounded bg-gray-200" />
            <div className="h-4 w-32 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const TeamFormModal = ({ onClose, onToast, users }) => {
  const queryClient = useQueryClient();
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [newTeam, setNewTeam] = useState({
    description: "",
    leadId: "",
    name: "",
    selectedMembers: [],
  });

  const filteredMembers = useMemo(() => {
    if (!Array.isArray(users)) {
      return [];
    }
    const members = users.filter((user) => user?.role !== "admin");
    if (!memberSearchQuery.trim()) {
      return members;
    }

    const query = memberSearchQuery.toLowerCase();
    return members.filter(
      (member) =>
        member?.name?.toLowerCase().includes(query) ||
        member?.email?.toLowerCase().includes(query) ||
        member?.role?.toLowerCase().includes(query) ||
        getUserSkillLabel(member).toLowerCase().includes(query),
    );
  }, [memberSearchQuery, users]);

  const createTeamMutation = useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      onToast?.("Team created successfully!", "success");
      handleClose();
    },
    onError: (error) => {
      const message = error.message || "Failed to create team";
      if (message.includes("duplicate") || message.includes("already exists")) {
        setFormErrors({ name: "A team with this name already exists" });
        return;
      }
      onToast?.(message, "error");
    },
  });

  const validateForm = () => {
    const errors = {};

    if (!newTeam.name.trim()) {
      errors.name = "Team name is required";
    } else if (newTeam.name.length < 3) {
      errors.name = "Team name must be at least 3 characters";
    } else if (newTeam.name.length > 50) {
      errors.name = "Team name must be less than 50 characters";
    }

    if (newTeam.leadId) {
      const leadExists = users?.some((user) => user.id === parseInt(newTeam.leadId, 10));
      if (!leadExists) {
        errors.leadId = "Selected lead does not exist";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewTeam((current) => ({ ...current, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((current) => ({ ...current, [name]: null }));
    }
  };

  const toggleMemberSelection = (userId) => {
    setNewTeam((current) => ({
      ...current,
      selectedMembers: current.selectedMembers.includes(userId)
        ? current.selectedMembers.filter((id) => id !== userId)
        : [...current.selectedMembers, userId],
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    createTeamMutation.mutate({
      description: newTeam.description?.trim() || null,
      leadId: newTeam.leadId ? parseInt(newTeam.leadId, 10) : null,
      name: newTeam.name.trim(),
      selectedMembers: newTeam.selectedMembers,
    });
  };

  const handleClose = () => {
    setNewTeam({
      description: "",
      leadId: "",
      name: "",
      selectedMembers: [],
    });
    setFormErrors({});
    setMemberSearchQuery("");
    onClose();
  };

  const leadOptions = Array.isArray(users)
    ? users.filter((user) => user?.name && user?.id)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div
        className="flex max-h-[80vh] w-full max-w-3xl flex-col rounded-xl border border-gray-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900">Create New Team</h2>
          <button
            onClick={handleClose}
            className="text-2xl text-gray-500 hover:text-gray-700"
            disabled={createTeamMutation.isPending}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Team Name *</label>
              <input
                type="text"
                name="name"
                value={newTeam.name}
                onChange={handleInputChange}
                placeholder="Enter team name"
                className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#4DA5AD] ${
                  formErrors.name ? "border-red-500" : "border-gray-300"
                }`}
                required
                disabled={createTeamMutation.isPending}
              />
              {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Team Lead</label>
              <select
                name="leadId"
                value={newTeam.leadId}
                onChange={handleInputChange}
                className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#4DA5AD] ${
                  formErrors.leadId ? "border-red-500" : "border-gray-300"
                }`}
                disabled={createTeamMutation.isPending}
              >
                <option value="">Select team lead (optional)</option>
                {leadOptions.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} {user.role ? `(${user.role})` : ""}
                  </option>
                ))}
              </select>
              {formErrors.leadId && <p className="mt-1 text-sm text-red-600">{formErrors.leadId}</p>}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={newTeam.description}
              onChange={handleInputChange}
              placeholder="Enter team description (optional)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#4DA5AD]"
              rows="3"
              disabled={createTeamMutation.isPending}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Select Members ({newTeam.selectedMembers.length})
            </label>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(event) => setMemberSearchQuery(event.target.value)}
                placeholder="Search members by name, email or role..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-10 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#4DA5AD]"
                disabled={createTeamMutation.isPending}
              />
              {memberSearchQuery && (
                <button
                  type="button"
                  onClick={() => setMemberSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-300 p-4">
              {!users || users.length === 0 ? (
                <p className="py-4 text-center text-gray-500">No team members available</p>
              ) : filteredMembers.length === 0 ? (
                <p className="py-4 text-center text-gray-500">
                  No members found matching "{memberSearchQuery}"
                </p>
              ) : (
                filteredMembers.map((user) => (
                  <div
                    key={user.id}
                    className={`mb-2 flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                      newTeam.selectedMembers.includes(user.id)
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => !createTeamMutation.isPending && toggleMemberSelection(user.id)}
                  >
                    <div>
                      <span className="font-medium">{user.name}</span>
                      <span className="ml-2 text-sm text-gray-600">({user.role})</span>
                      {user.email && <div className="mt-0.5 text-xs text-gray-400">{user.email}</div>}
                      <div className="mt-0.5 text-xs text-gray-500">
                        Skill: {getUserSkillLabel(user)}
                      </div>
                    </div>
                    {newTeam.selectedMembers.includes(user.id) && (
                      <span className="font-bold text-blue-600">Selected</span>
                    )}
                  </div>
                ))
              )}
            </div>

            {newTeam.selectedMembers.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                {newTeam.selectedMembers.length} member(s) selected
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50"
              disabled={createTeamMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTeamMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-[#4DA5AD] px-4 py-2 text-white transition hover:bg-[#3D8B93] disabled:opacity-50"
            >
              {createTeamMutation.isPending ? "Creating..." : "Create Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SharedTeamsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { canManageTeams } = useLoaderData();
  const isAdminSide = isAdminTeamsView(location.pathname);
  const canShowTeamActions = isAdminSide ? resolveCanManageTeams(user, true) : !!canManageTeams;
  const [showCreateTeamPopup, setShowCreateTeamPopup] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const {
    data: teamsData = [],
    error: teamsError,
    isLoading: teamsLoading,
    refetch: refetchTeams,
  } = useQuery(teamsQuery());

  const { data: usersData = [], error: usersError } = useQuery({
    ...usersQuery(),
    enabled: canShowTeamActions,
  });

  const deleteTeamMutation = useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      showToast("Team deleted successfully!", "success");
    },
    onError: (error) => {
      let message = error.message || "Failed to delete team";
      if (error.message?.includes("has projects")) {
        message = "Cannot delete team that has projects assigned. Please reassign projects first.";
      } else if (error.message?.includes("has members")) {
        message = "Cannot delete team that has members. Please remove all members first.";
      }
      showToast(message, "error");
    },
  });

  const handleDeleteTeam = (teamId, event) => {
    event?.stopPropagation();
    if (!canShowTeamActions) {
      return;
    }

    if (window.confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      deleteTeamMutation.mutate(teamId);
    }
  };

  if (teamsLoading) {
    return <TeamsSkeleton />;
  }

  if (teamsError || (canShowTeamActions && usersError)) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <h3 className="mb-2 text-lg font-semibold text-red-800">Failed to Load Teams</h3>
          <p className="mb-4 text-red-600">
            {teamsError?.message || usersError?.message || "An error occurred while loading teams"}
          </p>
          <button
            onClick={() => refetchTeams()}
            className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600">
            {canShowTeamActions ? "Create and manage project teams" : "View existing project teams"}
          </p>
        </div>
        {canShowTeamActions && (
          <button
            onClick={() => setShowCreateTeamPopup(true)}
            disabled={deleteTeamMutation.isPending}
            className="rounded-lg bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] px-4 py-2 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Create Team
          </button>
        )}
      </div>

      {!canShowTeamActions && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {isAdminSide
            ? "View-only mode. Admins can still view teams, but team-management actions stay hidden unless the manage_teams permission is granted."
            : "View-only mode. Team management is normally available to project managers by default, but it has been revoked for this account."}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teamsData.length === 0 ? (
          <div className="col-span-full rounded-lg bg-gray-50 py-12 text-center">
            <p className="text-gray-500">
              {canShowTeamActions ? "No teams found. Create your first team!" : "No teams found."}
            </p>
          </div>
        ) : (
          teamsData.map((team) => {
            const displayTeam = prepareTeamForDisplay(team, usersData);
            return (
              <TeamCard
                key={team.id}
                team={displayTeam}
                showActions={canShowTeamActions}
                primaryActionLabel={canShowTeamActions ? "Manage Team" : "View Team"}
                onDelete={(event) => handleDeleteTeam(team.id, event)}
                onClick={() => navigate(`${team.id}`)}
              />
            );
          })
        )}
      </div>

      <AnimatePresence>
        {canShowTeamActions && showCreateTeamPopup && (
          <TeamFormModal
            onClose={() => setShowCreateTeamPopup(false)}
            users={usersData}
            onToast={showToast}
          />
        )}
      </AnimatePresence>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div
            className={`rounded-lg px-4 py-3 shadow-lg ${
              toast.type === "success"
                ? "border border-green-200 bg-green-50 text-green-800"
                : "border border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedTeamsPage;
