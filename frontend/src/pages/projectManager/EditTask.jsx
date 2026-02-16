// src/pages/projectManager/EditTask.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Save, AlertCircle, Users } from 'lucide-react';
import axios from 'axios';

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

  // Fetch projects
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

  // Fetch task data
  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/tasks/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const t = res.data;
        setTask({
          title: t.title,
          description: t.description || '',
          projectId: t.projectId.toString(),
          assigneeId: t.assigneeId.toString(),
          priority: t.priority,
          deadline: t.deadline,
          estimatedHours: t.estimatedHours?.toString() || '',
          tags: t.tags?.join(', ') || ''
        });
      } catch (error) {
        console.error(error);
        alert('Failed to load task');
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
      if (!task.projectId) return setAvailableMembers([]);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `http://localhost:5000/api/projects/${task.projectId}/members`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAvailableMembers(res.data);
      } catch (error) {
        console.error(error);
        setAvailableMembers([]);
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
    if (!task.title || !task.projectId || !task.assigneeId || !task.deadline) {
      alert('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: task.title,
        description: task.description,
        assigneeId: parseInt(task.assigneeId),
        priority: task.priority,
        deadline: task.deadline,
        estimatedHours: task.estimatedHours ? parseInt(task.estimatedHours) : 0,
        tags: task.tags ? task.tags.split(',').map(tag => tag.trim()) : []
      };

      await axios.put(`http://localhost:5000/api/tasks/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Task updated successfully!');
      navigate('/manager/tasks');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to update task');
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
        <button onClick={() => navigate('/manager/tasks')} className="p-2 hover:bg-gray-100 rounded-lg">
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
                    <option key={p.id} value={p.id}>{p.name} ({p.teamName})</option>
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
                  <option value="">Select team member</option>
                  {availableMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority, Deadline, Estimated Hours */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
                <select
                  name="priority"
                  value={task.priority}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deadline *</label>
                <input
                  type="date"
                  name="deadline"
                  value={task.deadline}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Hours</label>
                <input
                  type="number"
                  name="estimatedHours"
                  value={task.estimatedHours}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  min="0"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
              <input
                type="text"
                name="tags"
                value={task.tags}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
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
            disabled={saving}
            className="px-6 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] flex items-center"
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
