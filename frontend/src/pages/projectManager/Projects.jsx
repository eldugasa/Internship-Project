// src/pages/projectManager/Projects.jsx
import React, { useState, Suspense, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLoaderData, Await } from 'react-router-dom';
import { 
  Plus, Search, Filter, Trash2, X, 
  FolderKanban, Calendar, Clock, Users,
  TrendingUp, CheckCircle, AlertCircle,
  BarChart3, Eye, Edit, MoreVertical,
  Download, RefreshCw, Loader2, AlertTriangle,
  Grid3x3, List, SortAsc, SortDesc
} from 'lucide-react';
import { deleteProject } from '../../services/projectsService';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../config/permissions';
import { 
  projectsLoader, 
  calculateStats, 
  isOverdue, 
  isAtRisk,
  parseDate,
  formatDate,
  invalidateProjectsQueries,
  projectsQuery
} from '../../loader/manager/Projects.loader';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export { projectsLoader as loader };

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, bgColor, onClick, loading }) => (
  <div 
    onClick={onClick}
    className={`${bgColor} rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-all ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 font-medium">{title}</p>
        {loading ? (
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
        ) : (
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        )}
      </div>
      <div className={`${color} p-3 rounded-lg text-white shadow-lg`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

// Loading skeleton component
const ProjectsSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4">
            <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
            <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-20 bg-gray-200 rounded mt-1 animate-pulse"></div>
          </div>
        ))}
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex gap-3">
            <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-24 h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-3"></div>
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-2 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Error component
const ProjectsError = ({ error, onRetry }) => {
  const errorMessage = error?.message || error || 'Unable to load projects';
  const isAuthError = errorMessage.toLowerCase().includes('auth') || errorMessage.toLowerCase().includes('login') || errorMessage.toLowerCase().includes('401');
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-center">
        <div className="text-5xl mb-4">{isAuthError ? '🔐' : '⚠️'}</div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          {isAuthError ? 'Authentication Required' : 'Failed to Load Projects'}
        </h3>
        <p className="text-red-600 mb-6">{errorMessage}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onRetry} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
            {isAuthError ? 'Go to Login' : 'Retry'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Project Card Component
const ProjectCard = ({ project, onDelete, onView, onEdit, getStatusBadge, isOverdue, isAtRisk, canManageProjects }) => {
  const [showMenu, setShowMenu] = useState(false);
  const overdue = isOverdue(project);
  const atRisk = isAtRisk(project);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showMenu && !e.target.closest('.menu-container')) {
        setShowMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'from-green-500 to-emerald-600';
    if (progress >= 50) return 'from-[#0f5841] to-[#194f87]';
    if (progress >= 20) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FolderKanban className="w-5 h-5 text-[#0f5841]" />
              <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{project.name}</h3>
            </div>
            {project.description && (
              <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
            )}
          </div>
          {canManageProjects && (
            <div className="relative menu-container">
              <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-500" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <button onClick={() => { onView(); setShowMenu(false); }} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Eye className="w-4 h-4" /> View Details
                  </button>
                  <button onClick={() => { onEdit(); setShowMenu(false); }} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Edit className="w-4 h-4" /> Edit Project
                  </button>
                  <button onClick={() => { onDelete(project.id); setShowMenu(false); }} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Delete Project
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
          {getStatusBadge(project.status)}
          {overdue && (
            <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
              <AlertCircle className="w-3 h-3" /> Overdue
            </span>
          )}
          {atRisk && !overdue && (
            <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
              <AlertTriangle className="w-3 h-3" /> At Risk
            </span>
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-semibold text-[#0f5841]">{project.progress || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div className={`bg-gradient-to-r ${getProgressColor(project.progress || 0)} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${project.progress || 0}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <Clock className="w-4 h-4 text-gray-400 mb-1" />
            <div className="text-xs text-gray-500">Tasks</div>
            <div className="font-semibold text-gray-900">{project.tasks?.completed || 0}/{project.tasks?.total || 0}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <Users className="w-4 h-4 text-gray-400 mb-1" />
            <div className="text-xs text-gray-500">Team</div>
            <div className="font-semibold text-gray-900 truncate" title={project.teamName}>{project.teamName || 'Unassigned'}</div>
          </div>
        </div>

        <div className="space-y-1 text-sm text-gray-500 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>Start: {formatDate(project.startDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className={overdue ? 'text-red-600 font-medium' : ''}>Deadline: {formatDate(project.dueDate || project.endDate)}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={onView} className="flex-1 px-4 py-2.5 bg-[#0f5841]/10 text-[#0f5841] rounded-lg hover:bg-[#0f5841] hover:text-white transition-all duration-300 font-medium text-sm flex items-center justify-center gap-2">
            <Eye className="w-4 h-4" /> View Details
          </button>
        </div>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ searchQuery, onClear, onCreate, hasFilters, canManageProjects }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
    {searchQuery || hasFilters ? (
      <>
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
        <p className="text-gray-500 mb-6">{searchQuery ? `No projects match "${searchQuery}"` : 'No projects match the selected filters'}</p>
        <button onClick={onClear} className="px-6 py-2.5 bg-[#0f5841] text-white rounded-lg hover:bg-[#0a4030] transition-colors font-medium">
          Clear {searchQuery ? 'Search' : 'Filters'}
        </button>
      </>
    ) : (
      <>
        <div className="w-24 h-24 bg-gradient-to-br from-[#0f5841]/20 to-[#194f87]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <FolderKanban className="w-12 h-12 text-[#0f5841]" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No projects yet</h3>
        <p className="text-gray-500 mb-6">
          {canManageProjects
            ? "Get started by creating your first project"
            : "No projects are available to view right now."}
        </p>
        {canManageProjects && (
          <button onClick={onCreate} className="px-6 py-2.5 bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white rounded-lg hover:shadow-lg transition-all font-medium inline-flex items-center gap-2">
            <Plus className="w-5 h-5" /> Create Project
          </button>
        )}
      </>
    )}
  </div>
);

// Main Projects Component
const Projects = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const loaderData = useLoaderData();
  const { hasPermission, hasRole } = useAuth();
  const canManageProjects = hasPermission(PERMISSIONS.MANAGE_PROJECTS);
  const isProjectManager = hasRole(["project-manager", "project_manager"]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('projectsViewMode') || 'grid');
  const [sortBy, setSortBy] = useState('deadline');
  const [sortOrder, setSortOrder] = useState('asc');
  const [deletingId, setDeletingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem('projectsViewMode', viewMode);
  }, [viewMode]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: projectsData, isLoading, error, refetch: refetchProjects, isFetching } = useQuery({
    ...projectsQuery(),
    initialData: loaderData?.projects,
    refetchInterval: 30000,
    staleTime: 5000,
  });

  const projects = projectsData || [];
  const safeProjects = Array.isArray(projects) ? projects : [];
  const stats = useMemo(() => calculateStats(safeProjects), [safeProjects]);

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    
    setDeletingId(id);
    try {
      await deleteProject(id);
      await invalidateProjectsQueries();
      await refetchProjects();
      showToast('Project deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting project:', err);
      showToast(err.message || 'Failed to delete project', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active', icon: TrendingUp },
      'in-progress': { color: 'bg-blue-100 text-blue-800', label: 'In Progress', icon: TrendingUp },
      completed: { color: 'bg-emerald-100 text-emerald-800', label: 'Completed', icon: CheckCircle },
      planned: { color: 'bg-purple-100 text-purple-800', label: 'Planned', icon: Calendar },
      'on-hold': { color: 'bg-yellow-100 text-yellow-800', label: 'On Hold', icon: AlertCircle },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: X }
    };
    const statusConfig = config[status] || config.planned;
    const Icon = statusConfig.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
        <Icon className="w-3 h-3 mr-1" /> {statusConfig.label}
      </span>
    );
  };

  const handleRetry = () => window.location.reload();

  const handleExport = () => {
    if (!filteredProjects.length) {
      showToast('No projects to export', 'error');
      return;
    }
    
    const csvData = filteredProjects.map(p => ({
      'Project Name': p.name,
      'Description': p.description || '',
      'Status': p.status,
      'Progress': `${p.progress}%`,
      'Team': p.teamName || 'Unassigned',
      'Start Date': p.startDate || 'N/A',
      'Deadline': p.dueDate || p.endDate || 'N/A',
      'Tasks Completed': `${p.tasks?.completed || 0}/${p.tasks?.total || 0}`,
    }));
    
    const headers = Object.keys(csvData[0]);
    const csv = [headers.join(','), ...csvData.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projects_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Projects exported successfully', 'success');
  };

  const filteredProjects = useMemo(() => {
    let filtered = safeProjects.filter(project => {
      const matchesSearch = searchQuery === '' || 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch(sortBy) {
        case 'deadline': {
          const dateA = parseDate(a.dueDate || a.endDate);
          const dateB = parseDate(b.dueDate || b.endDate);
          if (!dateA && !dateB) comparison = 0;
          else if (!dateA) comparison = 1;
          else if (!dateB) comparison = -1;
          else comparison = dateA - dateB;
          break;
        }
        case 'progress':
          comparison = (b.progress || 0) - (a.progress || 0);
          break;
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'tasks':
          comparison = (b.tasks?.total || 0) - (a.tasks?.total || 0);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [safeProjects, searchQuery, statusFilter, sortBy, sortOrder]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortBy('deadline');
    setSortOrder('asc');
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all';

  if (isLoading && (!loaderData || !loaderData.projects)) return <ProjectsSkeleton />;
  if (error && (!loaderData || !loaderData.projects)) return <ProjectsError error={error} onRetry={handleRetry} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-slideIn">
          <div className={`rounded-lg shadow-lg p-4 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
            {toast.message}
          </div>
        </div>
      )}

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage and monitor all your projects in one place</p>
          </div>
          <div className="flex items-center gap-3">
              <button onClick={handleExport} disabled={safeProjects.length === 0} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50" title="Export to CSV">
                <Download className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={() => refetchProjects()} disabled={isFetching} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50" title="Refresh">
                <RefreshCw className={`w-5 h-5 text-gray-600 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
              {canManageProjects && (
                <button onClick={() => navigate('/manager/projects/create')} className="px-4 py-2 bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2">
                  <Plus className="w-5 h-5" /> New Project
                </button>
              )}
            </div>
          </div>

         <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
  <StatCard 
    title="Total Projects" 
    value={stats.total} 
    icon={FolderKanban} 
    color="bg-blue-500" 
    bgColor="bg-blue-50" 
    onClick={() => setStatusFilter('all')} 
    loading={isLoading} 
  />
  <StatCard 
    title="Active" 
    value={stats.active} 
    icon={TrendingUp} 
    color="bg-green-500" 
    bgColor="bg-green-50" 
    onClick={() => setStatusFilter('active')} 
    loading={isLoading} 
  />
  <StatCard 
    title="Completed" 
    value={stats.completed} 
    icon={CheckCircle} 
    color="bg-emerald-500" 
    bgColor="bg-emerald-50" 
    onClick={() => setStatusFilter('completed')} 
    loading={isLoading} 
  />
  <StatCard 
    title="Planned" 
    value={stats.planned} 
    icon={Calendar} 
    color="bg-purple-500" 
    bgColor="bg-purple-50" 
    onClick={() => setStatusFilter('planned')} 
    loading={isLoading} 
  />
  <StatCard 
    title="Overdue" 
    value={stats.overdue} 
    icon={AlertCircle} 
    color="bg-red-500" 
    bgColor="bg-red-50" 
    onClick={() => setStatusFilter('active')} 
    loading={isLoading} 
  />
</div>
        </div>

        {!canManageProjects && isProjectManager && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            View-only mode. Project managers can still see existing projects, but project-management actions are hidden because the
            <span className="mx-1 font-semibold">manage_projects</span>
            permission has been revoked for this account.
          </div>
        )}

        {/* Filters & Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search projects by name or description..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5841] focus:border-transparent" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4 text-gray-400" /></button>}
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden px-4 py-2.5 border border-gray-200 rounded-lg flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filters
              </button>
              
              <div className={`${showFilters ? 'flex' : 'hidden'} lg:flex flex-wrap gap-3`}>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5841] bg-white">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="in-progress">In Progress</option>
                  <option value="planned">Planned</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5841] bg-white">
                  <option value="deadline">Sort by Deadline</option>
                  <option value="progress">Sort by Progress</option>
                  <option value="name">Sort by Name</option>
                  <option value="tasks">Sort by Tasks</option>
                </select>
                
                <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </button>
              </div>
              
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => setViewMode('grid')} className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-[#0f5841] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  <Grid3x3 className="w-5 h-5" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-[#0f5841] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 flex justify-between items-center flex-wrap gap-2">
          <p className="text-sm text-gray-600">Showing {filteredProjects.length} of {safeProjects.length} projects{isFetching && <Loader2 className="w-4 h-4 inline ml-2 animate-spin" />}</p>
          {hasActiveFilters && <button onClick={clearFilters} className="text-sm text-[#0f5841] hover:underline flex items-center gap-1"><X className="w-3 h-3" /> Clear all filters</button>}
        </div>

        {filteredProjects.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map(project => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  onDelete={handleDeleteProject} 
                  onView={() => navigate(`/manager/projects/${project.id}`)}
                  onEdit={() => navigate(`/manager/projects/${project.id}/edit`)}
                  getStatusBadge={getStatusBadge} 
                  isOverdue={isOverdue}
                  isAtRisk={isAtRisk}
                  canManageProjects={canManageProjects}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Team</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProjects.map(project => (
                      <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{project.name}</div>
                          {project.description && <div className="text-sm text-gray-500 truncate max-w-xs">{project.description}</div>}
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{project.teamName || 'Unassigned'}</span>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(project.status)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div className="bg-gradient-to-r from-[#0f5841] to-[#194f87] h-2 rounded-full transition-all duration-300" style={{ width: `${project.progress || 0}%` }} />
                            </div>
                            <span className="text-sm text-gray-600">{project.progress || 0}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className={`text-sm ${isOverdue(project) ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                              {formatDate(project.dueDate || project.endDate)}{isOverdue(project) && ' (Overdue)'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{project.tasks?.completed || 0}/{project.tasks?.total || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => navigate(`/manager/projects/${project.id}`)} className="p-2 text-[#0f5841] hover:bg-[#0f5841]/10 rounded-lg" title="View Details">
                              <Eye className="w-5 h-5" />
                            </button>
                            {canManageProjects && (
                              <>
                                <button onClick={() => navigate(`/manager/projects/${project.id}/edit`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit Project">
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDeleteProject(project.id)} disabled={deletingId === project.id} className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50" title="Delete Project">
                                  {deletingId === project.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <EmptyState searchQuery={searchQuery} onClear={clearFilters} onCreate={() => navigate('/manager/projects/create')} hasFilters={statusFilter !== 'all'} canManageProjects={canManageProjects} />
        )}
      </div>
    </div>
  );
};

export default Projects;
