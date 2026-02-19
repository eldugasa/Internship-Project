// src/components/projectManager/Projects.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, Filter, Trash2, X } from 'lucide-react';
import { getProjects, deleteProject } from '../../services/projectsService';
import { getTasksByProject } from '../../services/tasksService';

const Projects = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const searchFromUrl = queryParams.get('q') || '';

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState(searchFromUrl);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [projectTasks, setProjectTasks] = useState({});

  // Fetch projects using service
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        // Fetch all projects
        const data = await getProjects();
        setProjects(data);
        
        // Fetch tasks for each project to calculate progress
        const tasksMap = {};
        await Promise.all(
          data.map(async (project) => {
            try {
              const tasks = await getTasksByProject(project.id);
              tasksMap[project.id] = tasks;
            } catch (err) {
              console.error(`Error fetching tasks for project ${project.id}:`, err);
              tasksMap[project.id] = [];
            }
          })
        );
        setProjectTasks(tasksMap);
      } catch (err) {
        console.error('Error fetching projects:', err);
        
        if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
          alert('Your session has expired. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('current_user');
          navigate('/login');
        } else {
          alert(err.message || 'Failed to load projects.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, [navigate]);

  // Calculate project progress based on tasks
  const calculateProjectProgress = (projectId) => {
    const tasks = projectTasks[projectId] || [];
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(task => 
      task.status === 'completed' || task.status === 'done'
    ).length;
    
    return Math.round((completedTasks / tasks.length) * 100);
  };

  // Filter projects based on search
  useEffect(() => {
    if (!localSearch.trim()) {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project => 
        project.name.toLowerCase().includes(localSearch.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(localSearch.toLowerCase())) ||
        (project.status && project.status.toLowerCase().includes(localSearch.toLowerCase()))
      );
      setFilteredProjects(filtered);
    }
  }, [localSearch, projects]);

  // Update search from URL
  useEffect(() => {
    setLocalSearch(searchFromUrl);
  }, [searchFromUrl]);

  const handleSearchChange = e => {
    const value = e.target.value;
    setLocalSearch(value);
    const params = new URLSearchParams();
    if (value.trim()) params.set('q', value);
    navigate({ search: params.toString() }, { replace: true });
  };

  const clearSearch = () => {
    setLocalSearch('');
    navigate({ search: '' }, { replace: true });
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
      // Also remove from tasks map
      const newTasksMap = { ...projectTasks };
      delete newTasksMap[id];
      setProjectTasks(newTasksMap);
      alert('Project deleted successfully!');
    } catch (err) {
      console.error('Error deleting project:', err);
      
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        alert('Your session has expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('current_user');
        navigate('/login');
      } else {
        alert(err.message || 'Failed to delete project.');
      }
    }
  };

  const formatDate = dateStr => dateStr || 'N/A';

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-600">Create and manage your projects</p>
        </div>
        <button 
          onClick={() => navigate('/manager/projects/create')} 
          className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" /> New Project
        </button>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={localSearch}
            onChange={handleSearchChange}
            placeholder="Search projects by name"
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
          />
          {localSearch && (
            <button 
              onClick={clearSearch} 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
          <Filter className="w-4 h-4 mr-2" /> Filter
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length > 0 ? filteredProjects.map(project => {
          const progress = calculateProjectProgress(project.id);
          const tasks = projectTasks[project.id] || [];
          const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'done').length;
          const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
          const pendingTasks = tasks.filter(t => t.status === 'pending').length;

          return (
            <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span className="font-semibold text-[#4DA5AD]">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-[#4DA5AD] h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-gray-900">{tasks.length}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="text-lg font-bold text-green-600">{completedTasks}</div>
                  <div className="text-xs text-green-600">Done</div>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="text-lg font-bold text-blue-600">{inProgressTasks}</div>
                  <div className="text-xs text-blue-600">Active</div>
                </div>
              </div>

              <div className="text-sm text-gray-500 mb-4">
                <div className="font-medium text-gray-700 mb-1">{project.teamName || 'No Team'}</div>
                <div>Start: {formatDate(project.startDate)}</div>
                <div>Deadline: {formatDate(project.dueDate || project.endDate)}</div>
              </div>

              <div className="mb-4 flex justify-between items-center">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  project.status === 'active' ? 'bg-green-100 text-green-800' :
                  project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  project.status === 'planned' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {project.status?.toUpperCase()}
                </span>
                {pendingTasks > 0 && (
                  <span className="text-xs text-yellow-600">
                    ⏳ {pendingTasks} pending
                  </span>
                )}
              </div>

              <div className="flex space-x-2">
                <button 
                  onClick={() => navigate(`/manager/projects/${project.id}`)} 
                  className="flex-1 py-2 border border-[#4DA5AD] text-[#4DA5AD] rounded-lg hover:bg-[#4DA5AD]/10 transition-colors"
                >
                  View Details
                </button>
                <button 
                  onClick={() => handleDeleteProject(project.id)} 
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full text-center py-12">
            {localSearch ? (
              <>
                <div className="text-gray-400 text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-500">No projects match "{localSearch}"</p>
                <button 
                  onClick={clearSearch} 
                  className="mt-4 px-4 py-2 text-[#4DA5AD] hover:underline"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <div className="text-gray-400 text-4xl mb-4">📁</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                <p className="text-gray-500 mb-4">Create your first project to get started</p>
                <button 
                  onClick={() => navigate('/manager/projects/create')} 
                  className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] flex items-center mx-auto"
                >
                  <Plus className="w-4 h-4 mr-2" /> Create First Project
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;