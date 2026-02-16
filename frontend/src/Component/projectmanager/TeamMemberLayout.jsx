// src/components/projectmanager/TeamMemberLayout.jsx

import React, { useState, useMemo } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  TrendingUp,
  FileText,
  User,
  LogOut,
  Bell,
  HelpCircle,
  Search,
  X,
  Menu,
  Home,
} from "lucide-react";

const TeamMemberLayout = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // 🔥 Get real user from localStorage
  const userData = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("userData")) || {};
    } catch {
      return {};
    }
  }, []);

  const userName = userData?.name || "Team Member";
  const userRole = userData?.role || "Employee";

  const userInitials = useMemo(() => {
    if (!userName) return "TM";
    const parts = userName.split(" ");
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[1][0]).toUpperCase();
  }, [userName]);

  const navItems = [
    { path: "/team-member/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/team-member/tasks", icon: CheckSquare, label: "My Tasks" },
    { path: "/team-member/progress", icon: TrendingUp, label: "Progress" },
    { path: "/team-member/reports", icon: FileText, label: "Reports" },
    { path: "/team-member/profile", icon: User, label: "Profile" },
  ];

  // 🔎 Search
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    navigate(
      `/team-member/tasks?search=${encodeURIComponent(searchQuery.trim())}`
    );
    setSearchQuery("");
  };

  // 🔐 Logout
  const confirmLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* MOBILE MENU BUTTON */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* SIDEBAR */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200
          flex flex-col transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* LOGO */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] rounded-lg flex items-center justify-center text-white font-bold mr-3">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Team Portal
              </h1>
              <p className="text-xs text-gray-500">
                Task Management
              </p>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-[#4DA5AD]/10 text-[#4DA5AD] border-l-4 border-[#4DA5AD]"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* USER CARD */}
        <div className="p-4 border-t border-gray-200">
          <div
            className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition cursor-pointer"
            onClick={() => navigate("/team-member/profile")}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] rounded-full flex items-center justify-center text-white font-bold mr-3">
              {userInitials}
            </div>

            <div className="flex-1">
              <p className="font-medium text-gray-900 truncate">
                {userName}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {userRole}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLogoutConfirm(true);
              }}
              className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-40 z-30 lg:hidden"
        />
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
          <div className="flex justify-between items-center">
            {/* SEARCH */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />

                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#4DA5AD]"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* RIGHT SIDE */}
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <HelpCircle className="w-5 h-5" />
              </button>

              <div className="hidden lg:flex items-center space-x-3">
                <div className="text-right">
                  <p className="font-medium text-gray-900 text-sm">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {userRole}
                  </p>
                </div>

                <div
                  className="w-8 h-8 bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] rounded-full flex items-center justify-center text-white font-bold cursor-pointer"
                  onClick={() => navigate("/team-member/profile")}
                >
                  {userInitials}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>

      {/* LOGOUT MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 mb-4">
                <LogOut className="w-6 h-6 text-red-600" />
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Confirm Logout
              </h3>

              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to logout?
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMemberLayout;
