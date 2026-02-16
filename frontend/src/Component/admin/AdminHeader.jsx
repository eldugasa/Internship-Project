const DashboardHeader = ({ user, logout }) => {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] rounded-xl flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-lg"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">👑 Admin Dashboard</h1>
              <p className="text-sm text-gray-500">System Administration Panel</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="text-sm font-medium text-gray-900">{user?.name}</div>
              <div className="text-xs text-gray-500"></div>
            </div>
            {/*<button
              onClick={logout}
              className="px-4 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"
            >
              Logout
            </button>*/}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;