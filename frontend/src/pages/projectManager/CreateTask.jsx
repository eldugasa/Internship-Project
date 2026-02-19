// src/components/projectManager/CreateTask.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Save, Users } from 'lucide-react';
import { getProjects } from '../../services/projectsService';
import { getProjectMembers } from '../../services/projectsService';
import { createTask } from '../../services/tasksService';

const CreateTask = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('projectId');

  const [task, setTask] = useState({
    title: '',
    description: '',
    projectId: projectIdFromUrl || '',
    assigneeId: '',
    priority: 'MEDIUM',
    dueDate: '',
    estimatedHours: ''
  });

  const [projects, setProjects] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingProjects, setFetchingProjects] = useState(true);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setFetchingProjects(true);
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        console.error('Error fetching projects:', error);
        alert('Failed to fetch projects');
      } finally {
        setFetchingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  // Fetch team members when project changes
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!task.projectId) {
        setAvailableMembers([]);
        setTask(prev => ({ ...prev, assigneeId: '' }));
        return;
      }
      
      try {
        const members = await getProjectMembers(task.projectId);
        setAvailableMembers(members);
        setTask(prev => ({ ...prev, assigneeId: '' }));
      } catch (error) {
        console.error('Error fetching team members:', error);
        setAvailableMembers([]);
      }
    };
    
    fetchTeamMembers();
  }, [task.projectId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask(prev => ({ ...prev, [name]: value }));
  };

// In CreateTask.jsx, update handleSubmit:

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!task.title || !task.projectId || !task.assigneeId || !task.dueDate) {
    alert('Please fill in all required fields');
    return;
  }

  setLoading(true);
  try {
    const taskData = {
      title: task.title,
      description: task.description,
      projectId: parseInt(task.projectId),
      assignedTo: parseInt(task.assigneeId),  // ✅ Change this line from assigneeId to assignedTo
      dueDate: new Date(task.dueDate).toISOString(),
      priority: task.priority?.toUpperCase() || 'MEDIUM',
      estimatedHours: task.estimatedHours ? parseFloat(task.estimatedHours) : null
    };

    console.log('Sending to backend:', taskData);
    
    const newTask = await createTask(taskData);
    alert(`Task "${newTask.title}" created successfully!`);
    
    if (task.projectId) {
      navigate(`/manager/projects/${task.projectId}`);
    } else {
      navigate('/manager/tasks');
    }
  } catch (error) {
    console.error('Error creating task:', error);
    alert(error.message || 'Failed to create task');
  } finally {
    setLoading(false);
  }
};

  if (fetchingProjects) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Task</h1>
          <p className="text-gray-600">Assign task to team members of selected project</p>
        </div>
        <button
          onClick={() => navigate('/manager/tasks')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Task Information</h2>

          <div className="space-y-4">
            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
              <input
                type="text"
                name="title"
                value={task.title}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                placeholder="Enter task title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={task.description}
                onChange={handleChange}
                rows="3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                placeholder="Describe the task"
              />
            </div>

            {/* Project & Assignee */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project *</label>
                <select
                  name="projectId"
                  value={task.projectId}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                >
                  <option value="">Select project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign To *</label>
                {!task.projectId ? (
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <Users className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Select a project first</p>
                  </div>
                ) : availableMembers.length === 0 ? (
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-500">No team members available</p>
                  </div>
                ) : (
                  <select
                    name="assigneeId"
                    value={task.assigneeId}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                  >
                    <option value="">Select team member</option>
                    {availableMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role || 'Team Member'})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Due Date & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
                <input
                  type="date"
                  name="dueDate"
                  value={task.dueDate}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  name="priority"
                  value={task.priority}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            {/* Estimated Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Hours</label>
              <input
                type="number"
                name="estimatedHours"
                value={task.estimatedHours}
                onChange={handleChange}
                min="0"
                step="0.5"
                placeholder="e.g., 2.5"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/manager/tasks')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] transition flex items-center disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create & Assign Task'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTask;