// src/components/projectmanager/ProjectManagerLayout.jsx
import React, { useState, useMemo, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  TrendingUp,
  FileText,
  Settings,
  LogOut,
  Search,
  X,
  Menu,
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import Sidebar from "./Sidebar";

const ProjectManagerLayout = () => {
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get user from localStorage
  const userData = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  }, []);

  const userName = userData?.name || "Project Manager";
  const userRole = userData?.role || "project-manager";

  const userInitials = useMemo(() => {
    if (!userName) return "PM";
    const parts = userName.split(" ");
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[1][0]).toUpperCase();
  }, [userName]);

  const navItems = [
    { path: "/manager/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/manager/projects", icon: FolderKanban, label: "Projects" },
    { path: "/manager/tasks", icon: CheckSquare, label: "Tasks" },
    { path: "/manager/progress", icon: TrendingUp, label: "Progress" },
    { path: "/manager/reports", icon: FileText, label: "Reports" },
    { path: "/manager/settings", icon: Settings, label: "Settings" },
  ];

  // Close mobile menu when screen size changes to large
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Search handler
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/manager/projects?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery("");
  };

  // Logout logic
  const confirmLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Menu Button - Shows on left when closed */}
      {!isMobileMenuOpen && (
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all"
          style={{ background: `linear-gradient(to right, #0f5841, #194f87)` }}
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Sidebar Component */}
      <Sidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        navItems={navItems}
        userName={userName}
        userRole={userRole}
        userInitials={userInitials}
        setShowLogoutConfirm={setShowLogoutConfirm}
      />

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 bg-opacity-60 z-30 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3">
          <div className="flex justify-between items-center">
            {/* Search */}
            <form
              onSubmit={handleSearch}
              className={`flex-1 max-w-md ${isMobileMenuOpen ? 'ml-14' : 'ml-14 lg:ml-0'}`}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search projects, tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#194f87] focus:border-transparent text-sm"
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

            {/* Right Side */}
            <div className="flex items-center space-x-2 notifications-container">
              {/* Notification Bell Component */}
              <NotificationBell />

              {/* Desktop Profile */}
              <div className="hidden lg:flex items-center space-x-3 ml-2">
                <div className="text-right">
                  <p className="font-medium text-gray-900 text-sm">{userName}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {userRole.replace(/_/g, ' ')}
                  </p>
                </div>

                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:shadow-md transition"
                  style={{ background: `linear-gradient(to bottom right, #0f5841, #194f87)` }}
                  onClick={() => navigate("/manager/settings")}
                >
                  {userInitials}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>

      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 mb-4">
                <LogOut className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Logout</h3>
              <p className="text-sm text-gray-500 mb-6">Are you sure you want to logout?</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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

export default ProjectManagerLayout;