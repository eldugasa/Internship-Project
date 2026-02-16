// src/components/projectManager/CreateTask.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Save } from 'lucide-react';
import axios from 'axios';

const CreateTask = () => {
  const navigate = useNavigate();
  const [task, setTask] = useState({
    title: '',
    description: '',
    projectId: '',
    assigneeId: ''
  });

  const [projects, setProjects] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch projects from backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/projects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProjects(res.data);
      } catch (error) {
        console.error(error);
        alert('Failed to fetch projects');
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
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `http://localhost:5000/api/projects/${task.projectId}/members`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAvailableMembers(res.data);
        setTask(prev => ({ ...prev, assigneeId: '' }));
      } catch (error) {
        console.error(error);
        setAvailableMembers([]);
      }
    };
    fetchTeamMembers();
  }, [task.projectId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!task.title || !task.projectId || !task.assigneeId) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: task.title,
        description: task.description,
        assigneeId: parseInt(task.assigneeId)
      };

      const res = await axios.post(
        `http://localhost:5000/api/projects/${task.projectId}/tasks`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Task "${res.data.title}" created and assigned successfully!`);
      navigate('/manager/tasks');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

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
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign To *</label>
                <select
                  name="assigneeId"
                  value={task.assigneeId}
                  onChange={handleChange}
                  required
                  disabled={!task.projectId}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">{task.projectId ? 'Select team member' : 'Select project first'}</option>
                  {availableMembers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {!task.projectId && (
                  <p className="text-sm text-gray-500 mt-1">Select project first to see team members</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/manager/tasks')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] flex items-center"
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
