import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, Trash2, X, 
  FolderKanban, Calendar, Clock, Users,
  TrendingUp, CheckCircle, AlertCircle,
  BarChart3, Eye, Edit, MoreVertical,
  Download, RefreshCw
} from 'lucide-react';
import { getProjects, deleteProject } from '../../services/projectsService';

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [sortBy, setSortBy] = useState('deadline');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    planned: 0,
    overdue: 0
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
      calculateStats(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (projectsData) => {
    const now = new Date();
    setStats({
      total: projectsData.length,
      active: projectsData.filter(p => p.status === 'active').length,
      completed: projectsData.filter(p => p.status === 'completed').length,
      planned: projectsData.filter(p => p.status === 'planned').length,
      overdue: projectsData.filter(p => 
        p.status !== 'completed' && 
        new Date(p.dueDate || p.endDate) < now
      ).length
    });
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchQuery === '' || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch(sortBy) {
      case 'deadline':
        return new Date(a.dueDate || a.endDate) - new Date(b.dueDate || b.endDate);
      case 'progress':
        return b.progress - a.progress;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteProject(id);
      const updatedProjects = projects.filter(p => p.id !== id);
      setProjects(updatedProjects);
      calculateStats(updatedProjects);
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active', icon: TrendingUp },
      completed: { color: 'bg-blue-100 text-blue-800', label: 'Completed', icon: CheckCircle },
      planned: { color: 'bg-purple-100 text-purple-800', label: 'Planned', icon: Calendar },
      'on-hold': { color: 'bg-yellow-100 text-yellow-800', label: 'On Hold', icon: AlertCircle }
    };
    const statusConfig = config[status] || config.planned;
    const Icon = statusConfig.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {statusConfig.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-[#4DA5AD] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FolderKanban className="w-8 h-8 text-[#4DA5AD] animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Projects Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage and monitor all your projects in one place</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchProjects}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => navigate('/manager/projects/create')}
                className="px-4 py-2 bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>New Project</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <StatCard 
              title="Total Projects" 
              value={stats.total} 
              icon={FolderKanban} 
              color="bg-blue-500"
              bgColor="bg-blue-50"
            />
            <StatCard 
              title="Active" 
              value={stats.active} 
              icon={TrendingUp} 
              color="bg-green-500"
              bgColor="bg-green-50"
            />
            <StatCard 
              title="Completed" 
              value={stats.completed} 
              icon={CheckCircle} 
              color="bg-emerald-500"
              bgColor="bg-emerald-50"
            />
            <StatCard 
              title="Planned" 
              value={stats.planned} 
              icon={Calendar} 
              color="bg-purple-500"
              bgColor="bg-purple-50"
            />
            <StatCard 
              title="Overdue" 
              value={stats.overdue} 
              icon={AlertCircle} 
              color="bg-red-500"
              bgColor="bg-red-50"
            />
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by name or description..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA5AD] bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="planned">Planned</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA5AD] bg-white"
              >
                <option value="deadline">Sort by Deadline</option>
                <option value="progress">Sort by Progress</option>
                <option value="name">Sort by Name</option>
              </select>

              {/* View Toggle */}
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 ${viewMode === 'grid' ? 'bg-[#4DA5AD] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <BarChart3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 ${viewMode === 'list' ? 'bg-[#4DA5AD] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid/List */}
        {sortedProjects.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={handleDeleteProject}
                  onView={() => navigate(`/manager/projects/${project.id}`)}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedProjects.map(project => (
                    <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{project.name}</div>
                          {project.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">{project.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {project.teamName || 'No Team'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(project.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-[#4DA5AD] h-2 rounded-full transition-all"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{project.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {project.dueDate || project.endDate || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/manager/projects/${project.id}`)}
                            className="p-2 text-[#4DA5AD] hover:bg-[#4DA5AD]/10 rounded-lg transition-colors"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <EmptyState 
            searchQuery={searchQuery} 
            onClear={() => setSearchQuery('')}
            onCreate={() => navigate('/manager/projects/create')}
          />
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
  <div className={`${bgColor} rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-all`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`${color} p-3 rounded-lg text-white shadow-lg`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

// Project Card Component
const ProjectCard = ({ project, onDelete, onView, getStatusBadge }) => {
  const [showMenu, setShowMenu] = useState(false);
  const isOverdue = project.status !== 'completed' && 
    new Date(project.dueDate || project.endDate) < new Date();

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FolderKanban className="w-5 h-5 text-[#4DA5AD]" />
              <h3 className="font-bold text-gray-900 text-lg">{project.name}</h3>
            </div>
            {project.description && (
              <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => {
                    onView();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" /> View Details
                </button>
                <button
                  onClick={() => {
                    onDelete(project.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete Project
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-4 flex items-center justify-between">
          {getStatusBadge(project.status)}
          {isOverdue && (
            <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
              <AlertCircle className="w-3 h-3" />
              Overdue
            </span>
          )}
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-semibold text-[#4DA5AD]">{project.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Project Info */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <Clock className="w-4 h-4 text-gray-400 mb-1" />
            <div className="text-xs text-gray-500">Tasks</div>
            <div className="font-semibold text-gray-900">{project.tasks?.total || 0}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <Users className="w-4 h-4 text-gray-400 mb-1" />
            <div className="text-xs text-gray-500">Team</div>
            <div className="font-semibold text-gray-900">{project.teamName || '—'}</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-2 text-sm text-gray-500 border-t border-gray-100 pt-4">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>Start: {project.startDate || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>Deadline: {project.dueDate || project.endDate || 'N/A'}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onView}
            className="flex-1 px-4 py-2.5 bg-[#4DA5AD]/10 text-[#4DA5AD] rounded-lg hover:bg-[#4DA5AD] hover:text-white transition-all duration-300 font-medium text-sm flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ searchQuery, onClear, onCreate }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
    {searchQuery ? (
      <>
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
        <p className="text-gray-500 mb-6">No projects match "{searchQuery}"</p>
        <button
          onClick={onClear}
          className="px-6 py-2.5 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] transition-colors font-medium"
        >
          Clear Search
        </button>
      </>
    ) : (
      <>
        <div className="w-24 h-24 bg-gradient-to-br from-[#4DA5AD]/20 to-[#2D4A6B]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <FolderKanban className="w-12 h-12 text-[#4DA5AD]" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No projects yet</h3>
        <p className="text-gray-500 mb-6">Get started by creating your first project</p>
        <button
          onClick={onCreate}
          className="px-6 py-2.5 bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] text-white rounded-lg hover:shadow-lg transition-all font-medium inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Project
        </button>
      </>
    )}
  </div>
);

export default Projects;