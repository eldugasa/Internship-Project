// src/pages/projectManager/TeamsManagement.jsx
import React, { useState, useMemo, useCallback } from "react";
import { useNavigate, useLoaderData, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, X } from 'lucide-react';
import {motion, AnimatePresence} from 'framer-motion';
import TeamCard from "../../Component/projectmanager/TeamCard";
import { createTeam, deleteTeam } from "../../services/teamsService";
import { useAuth } from "../../context/AuthContext";
import {
  teamsQuery,
  usersQuery,
  prepareTeamForDisplay,
  safeNumber,
  teamsLoader
} from "../../loader/admin/TeamsManagement.loader";
export { teamsLoader as loader };
// Loading skeleton component
const TeamsSkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse"></div>
      </div>
      <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-4 w-40 bg-gray-200 rounded"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Create Team Modal Component with React Query
const CreateTeamModal = ({ onClose, users, onToast }) => {
  const queryClient = useQueryClient();
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [newTeam, setNewTeam] = useState({
    name: "",
    leadId: "",
    description: "",
    selectedMembers: [],
  });
  const [formErrors, setFormErrors] = useState({});

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    const members = users.filter(user => user?.role !== "admin");
    if (!memberSearchQuery.trim()) return members;
    
    const query = memberSearchQuery.toLowerCase();
    return members.filter(member => 
      member?.name?.toLowerCase().includes(query) ||
      member?.email?.toLowerCase().includes(query) ||
      member?.role?.toLowerCase().includes(query)
    );
  }, [users, memberSearchQuery]);

  const getLeadOptions = (usersList) => {
    if (!usersList || !Array.isArray(usersList)) return [];
    return usersList.filter((user) => user?.name && user?.id) || [];
  };

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      onToast?.("Team created successfully!", "success");
      handleClose();
    },
    onError: (err) => {
      const errorMessage = err.message || "Failed to create team";
      
      if (errorMessage.includes("duplicate") || errorMessage.includes("already exists")) {
        setFormErrors({ name: "A team with this name already exists" });
      } else {
        onToast?.(errorMessage, "error");
      }
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTeam((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const toggleMemberSelection = (userId) => {
    setNewTeam((prev) => ({
      ...prev,
      selectedMembers: prev.selectedMembers.includes(userId)
        ? prev.selectedMembers.filter((id) => id !== userId)
        : [...prev.selectedMembers, userId],
    }));
  };

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
      const leadExists = users?.some((u) => u.id === parseInt(newTeam.leadId));
      if (!leadExists) {
        errors.leadId = "Selected lead does not exist";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearMemberSearch = () => {
    setMemberSearchQuery("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const teamData = {
      name: newTeam.name.trim(),
      description: newTeam.description?.trim() || null,
      leadId: newTeam.leadId ? parseInt(newTeam.leadId) : null,
      selectedMembers: newTeam.selectedMembers,
    };

    createTeamMutation.mutate(teamData);
  };

  const handleClose = () => {
    setNewTeam({
      name: "",
      leadId: "",
      description: "",
      selectedMembers: [],
    });
    setFormErrors({});
    setMemberSearchQuery("");
    onClose();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -30 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -30 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      >
        <motion.div
         
          className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-3xl flex flex-col"
          style={{ maxHeight: "80vh" }}
        >
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              Create New Team
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
              disabled={createTeamMutation.isPending}
            >
              &times;
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newTeam.name}
                  onChange={handleInputChange}
                  placeholder="Enter team name"
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent ${
                    formErrors.name
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  required
                  disabled={createTeamMutation.isPending}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Lead
                </label>
                <select
                  name="leadId"
                  value={newTeam.leadId}
                  onChange={handleInputChange}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent ${
                    formErrors.leadId
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  disabled={createTeamMutation.isPending}
                >
                  <option value="">
                    Select team lead (optional)
                  </option>
                  {getLeadOptions(users).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.role ? `(${u.role})` : ""}
                    </option>
                  ))}
                </select>
                {formErrors.leadId && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.leadId}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={newTeam.description}
                onChange={handleInputChange}
                placeholder="Enter team description (optional)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                rows="3"
                disabled={createTeamMutation.isPending}
              />
            </div>

            {/* Members Selection with Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Members ({newTeam.selectedMembers.length})
              </label>
              
              {/* Search Input */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Search members by name, email or role..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                  disabled={createTeamMutation.isPending}
                />
                {memberSearchQuery && (
                  <button
                    type="button"
                    onClick={clearMemberSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Members List */}
              <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                {!users || users.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No team members available
                  </p>
                ) : filteredMembers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No members found matching "{memberSearchQuery}"
                  </p>
                ) : (
                  filteredMembers.map((u) => (
                    <div
                      key={u.id}
                      className={`flex items-center justify-between p-3 border rounded-lg mb-2 cursor-pointer transition-colors ${
                        newTeam.selectedMembers.includes(u.id)
                          ? "bg-blue-50 border-blue-300"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                      onClick={() =>
                        !createTeamMutation.isPending &&
                        toggleMemberSelection(u.id)
                      }
                    >
                      <div>
                        <span className="font-medium">{u.name}</span>
                        <span className="text-sm text-gray-600 ml-2">
                          ({u.role})
                        </span>
                        {u.email && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {u.email}
                          </div>
                        )}
                      </div>
                      {newTeam.selectedMembers.includes(u.id) && (
                        <span className="text-blue-600 font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              {/* Selected Count Summary */}
              {newTeam.selectedMembers.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  {newTeam.selectedMembers.length} member(s) selected
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                disabled={createTeamMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createTeamMutation.isPending}
                className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] transition flex items-center gap-2 disabled:opacity-50"
              >
                {createTeamMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  "Create Team"
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>

    </>
  );
};

// Main TeamsManagement Component
const TeamsManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { role, canManageTeams } = useLoaderData();
  const normalizedRole = (user?.role || role || "guest").toLowerCase().replace(/_/g, "-");
  const permissionOverrides = Array.isArray(user?.permissionOverrides)
    ? user.permissionOverrides
    : [];
  const isAdminSide = location.pathname.startsWith("/admin");
  const canShowTeamActions =
    isAdminSide
      ? normalizedRole === "super-admin" || permissionOverrides.includes("manage_teams")
      : !!canManageTeams;

  const [showCreateTeamPopup, setShowCreateTeamPopup] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch data with React Query
  const { 
    data: teamsData = [], 
    isLoading: teamsLoading,
    error: teamsError,
    refetch: refetchTeams
  } = useQuery(teamsQuery());
  
  const { 
    data: usersData = [],
    error: usersError
  } = useQuery({
    ...usersQuery(),
    enabled: canShowTeamActions,
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      showToast("Team deleted successfully!", "success");
    },
    onError: (err) => {
      let errorMessage = err.message || "Failed to delete team";
      
      if (err.message?.includes("has projects")) {
        errorMessage = "Cannot delete team that has projects assigned. Please reassign projects first.";
      } else if (err.message?.includes("has members")) {
        errorMessage = "Cannot delete team that has members. Please remove all members first.";
      }
      
      showToast(errorMessage, "error");
    },
  });

  const handleDeleteTeam = (teamId, e) => {
    e?.stopPropagation();

    if (!canShowTeamActions) {
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      deleteTeamMutation.mutate(teamId);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateTeamPopup(false);
  };

  // Loading state
  if (teamsLoading) {
    return <TeamsSkeleton />;
  }

  // Error state
  if (teamsError || (canShowTeamActions && usersError)) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Failed to Load Teams
          </h3>
          <p className="text-red-600 mb-4">
            {teamsError?.message || usersError?.message || "An error occurred while loading teams"}
          </p>
          <button
            onClick={() => refetchTeams()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AnimatePresence>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Team Management
          </h1>
          <p className="text-gray-600">
            {canShowTeamActions
              ? "Create and manage project teams"
              : "View existing project teams"}
          </p>
        </div>
        {canShowTeamActions && (
          <button
            onClick={() => setShowCreateTeamPopup(true)}
            disabled={deleteTeamMutation.isPending}
            className="px-4 py-2 bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] text-white rounded-lg hover:opacity-90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Create Team
          </button>
        )}
      </div>
      </AnimatePresence>
      

      {!canShowTeamActions && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {isAdminSide
            ? "View-only mode. Admins can still view teams, but team-management actions stay hidden unless the manage_teams permission is granted."
            : "View-only mode. Team management is normally available to project managers by default, but it has been revoked for this account."}
        </div>
      )}

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
        {teamsData.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              {canShowTeamActions
                ? "No teams found. Create your first team!"
                : "No teams found."}
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
                onDelete={(e) => handleDeleteTeam(team.id, e)}
                onClick={() => navigate(`${team.id}`)}
              />
            );
          })
        )}
        </AnimatePresence>
      </div>
      


      {/* Create Team Modal */}
      <AnimatePresence>
        {canShowTeamActions && showCreateTeamPopup && (
          <CreateTeamModal
            onClose={() => setShowCreateTeamPopup(false)}
            users={usersData}
            onToast={showToast}
          />
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className={`px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsManagement;
