// src/components/projectManager/ProjectDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plus, CheckSquare, User, Calendar, FolderKanban } from 'lucide-react';
import { getProjectById } from '../../services/projectsService';
import { getTasksByProject, deleteTask } from '../../services/tasksService';
import { getProjectMembers } from '../../services/projectsService';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    setLoading(true);
    try {
      const [projectData, tasksData, membersData] = await Promise.all([
        getProjectById(id),
        getTasksByProject(id),
        getProjectMembers(id)
      ]);

      setProject(projectData);
      setProjectTasks(tasksData);
      setTeamMembers(membersData);
    } catch (error) {
      console.error('Error fetching project details:', error);
      alert('Failed to fetch project details.');
      navigate('/manager/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await deleteTask(taskId);
      setProjectTasks(projectTasks.filter(t => t.id !== taskId));
      alert('Task deleted successfully!');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert(error.message || 'Failed to delete task.');
    }
  };

  const addTask = () => navigate(`/manager/tasks/create?projectId=${id}`);

  const deleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? All associated tasks will also be deleted.')) return;

    try {
      await deleteProject(id);
      navigate('/manager/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert(error.message || 'Failed to delete project.');
    }
  };

  if (loading || !project) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={() => navigate('/manager/projects')} 
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </button>
        <div className="flex space-x-3">
          <button 
            onClick={() => navigate(`/manager/projects/edit/${id}`)} 
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <Edit className="w-4 h-4 mr-2" /> Edit Project
          </button>
          <button 
            onClick={deleteProject} 
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete Project
          </button>
        </div>
      </div>

      {/* Project Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-2">{project.description || 'No description'}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            project.status === 'active' ? 'bg-green-100 text-green-800' :
            project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
            project.status === 'planned' ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {project.status?.toUpperCase()}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900">{project.progress || 0}%</div>
            <div className="text-sm text-gray-600">Progress</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900">{projectTasks.length}</div>
            <div className="text-sm text-gray-600">Tasks</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900">{teamMembers.length}</div>
            <div className="text-sm text-gray-600">Team Members</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{project.dueDate || project.endDate || 'N/A'}</div>
            <div className="text-sm text-gray-600">Deadline</div>
          </div>
        </div>

        {/* Project Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center text-sm text-blue-600 mb-1">
              <FolderKanban className="w-4 h-4 mr-2" /> Team
            </div>
            <div className="font-medium text-blue-800">{project.teamName || 'Unassigned'}</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center text-sm text-green-600 mb-1">
              <Calendar className="w-4 h-4 mr-2" /> Timeline
            </div>
            <div className="font-medium text-green-800">
              {project.startDate || 'N/A'} to {project.dueDate || project.endDate || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Tasks & Team Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">Project Tasks ({projectTasks.length})</h2>
            <button 
              onClick={addTask} 
              className="px-3 py-1 text-sm bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Task
            </button>
          </div>
          {projectTasks.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {projectTasks.map(task => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition cursor-pointer"
                     onClick={() => navigate(`/manager/tasks/${task.id}`)}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{task.title || task.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <User className="w-3 h-3 mr-1" />
                        <span>{task.assigneeName || task.assignee || 'Unassigned'}</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                      }} 
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{task.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#4DA5AD] h-2 rounded-full" 
                          style={{ width: `${task.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status || 'pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No tasks assigned to this project yet.</p>
              <button 
                onClick={addTask} 
                className="mt-3 px-4 py-2 text-sm bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93]"
              >
                Create First Task
              </button>
            </div>
          )}
        </div>

        {/* Team */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Team Members ({teamMembers.length})</h2>
          {teamMembers.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {teamMembers.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] rounded-full flex items-center justify-center text-white font-medium mr-3">
                      {member.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.role || 'Team Member'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No team members assigned to this project.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;