// src/pages/projectManager/EditTask.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Save, Users } from 'lucide-react';
import { getTaskById, updateTask } from '../../services/tasksService';
import { getProjects } from '../../services/projectsService';
import { getProjectMembers } from '../../services/projectsService';

const EditTask = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [task, setTask] = useState({
    title: '',
    description: '',
    projectId: '',
    assigneeId: '',
    priority: 'medium',
    deadline: '',
    estimatedHours: '',
    tags: ''
  });

  const [projects, setProjects] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingMembers, setFetchingMembers] = useState(false);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        console.error('Error fetching projects:', error);
        alert('Failed to fetch projects');
      }
    };
    fetchProjects();
  }, []);

  // Fetch task data
 // In EditTask.jsx, update the fetchTask function:

useEffect(() => {
  const fetchTask = async () => {
    setLoading(true);
    try {
      const taskData = await getTaskById(id);
      
      // Format date safely - check if it exists and is valid
      let formattedDate = '';
      if (taskData.dueDate) {
        try {
          const date = new Date(taskData.dueDate);
          // Check if date is valid
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split('T')[0];
          }
        } catch (e) {
          console.error('Error parsing date:', e);
        }
      }
      
      setTask({
        title: taskData.title || '',
        description: taskData.description || '',
        projectId: taskData.projectId?.toString() || '',
        assigneeId: taskData.assigneeId?.toString() || '',
        priority: taskData.priority?.toLowerCase() || 'medium',
        deadline: formattedDate,  // Use safely formatted date
        estimatedHours: taskData.estimatedHours?.toString() || '',
        tags: taskData.tags?.join(', ') || ''
      });
    } catch (error) {
      console.error('Error fetching task:', error);
      alert(error.message || 'Failed to load task');
      navigate('/manager/tasks');
    } finally {
      setLoading(false);
    }
  };
  
  fetchTask();
}, [id, navigate]);

  // Fetch team members when project changes
  useEffect(() => {
    const fetchMembers = async () => {
      if (!task.projectId) {
        setAvailableMembers([]);
        return;
      }
      
      setFetchingMembers(true);
      try {
        const members = await getProjectMembers(task.projectId);
        setAvailableMembers(members);
      } catch (error) {
        console.error('Error fetching team members:', error);
        setAvailableMembers([]);
      } finally {
        setFetchingMembers(false);
      }
    };
    
    fetchMembers();
  }, [task.projectId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!task.title.trim()) {
      alert('Task title is required');
      return;
    }
    
    if (!task.projectId) {
      alert('Please select a project');
      return;
    }
    
    if (!task.assigneeId) {
      alert('Please assign the task to a team member');
      return;
    }
    
    if (!task.deadline) {
      alert('Please select a deadline');
      return;
    }

    setSaving(true);
    try {
      const taskData = {
        title: task.title,
        description: task.description,
        projectId: parseInt(task.projectId),
        assignedTo: parseInt(task.assigneeId),
        priority: task.priority.toUpperCase(),
        dueDate: new Date(task.deadline).toISOString(),
        estimatedHours: task.estimatedHours ? parseFloat(task.estimatedHours) : null,
        tags: task.tags ? task.tags.split(',').map(tag => tag.trim()) : []
      };

      await updateTask(id, taskData);

      alert('Task updated successfully!');
      navigate(`/manager/tasks/${id}`);
    } catch (error) {
      console.error('Error updating task:', error);
      alert(error.message || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA5AD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading task data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Task</h1>
          <p className="text-gray-600">Update task details and assignment</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title *
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project *
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To *
                </label>
                {!task.projectId ? (
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <Users className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Select a project first</p>
                  </div>
                ) : fetchingMembers ? (
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#4DA5AD] mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading members...</p>
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

            {/* Priority, Deadline, Estimated Hours */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority *
                </label>
                <select
                  name="priority"
                  value={task.priority}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline *
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={task.deadline}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  name="estimatedHours"
                  value={task.estimatedHours}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                  min="0"
                  step="0.5"
                  placeholder="e.g., 2.5"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                name="tags"
                value={task.tags}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                placeholder="e.g., frontend, urgent, bug"
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
            disabled={saving}
            className="px-6 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] transition flex items-center disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Updating...' : 'Update Task'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditTask;