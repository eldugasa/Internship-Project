// src/pages/projectManager/EditTask.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useActionState } from 'react';
import { X, Save, Users, AlertCircle } from 'lucide-react';
import { getTaskById, updateTask } from '../../services/tasksService';
import { getProjects } from '../../services/projectsService';
import { getProjectMembers } from '../../services/projectsService';

// Validation functions
const isNotEmpty = (value) => value?.trim() !== '';
const isFutureDate = (dateString) => {
  if (!dateString) return false;
  const selectedDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);
  return selectedDate >= today;
};
const isValidPriority = (priority) => ['low', 'medium', 'high', 'critical'].includes(priority?.toLowerCase());

const EditTask = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [projects, setProjects] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMembers, setFetchingMembers] = useState(false);
  const [initialTaskData, setInitialTaskData] = useState(null);

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

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
  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      try {
        const taskData = await getTaskById(id);
        
        // Format date safely
        let formattedDate = '';
        if (taskData.dueDate) {
          try {
            const date = new Date(taskData.dueDate);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toISOString().split('T')[0];
            }
          } catch (e) {
            console.error('Error parsing date:', e);
          }
        }
        
        const initialData = {
          title: taskData.title || '',
          description: taskData.description || '',
          projectId: taskData.projectId?.toString() || '',
          assigneeId: taskData.assigneeId?.toString() || '',
          priority: taskData.priority?.toLowerCase() || 'medium',
          deadline: formattedDate,
          tags: Array.isArray(taskData.tags) ? taskData.tags.join(', ') : (taskData.tags || '')
        };
        
        setInitialTaskData(initialData);
        
        // Fetch team members for the project
        if (taskData.projectId) {
          setFetchingMembers(true);
          try {
            const members = await getProjectMembers(taskData.projectId);
            setAvailableMembers(members);
          } catch (error) {
            console.error('Error fetching team members:', error);
          } finally {
            setFetchingMembers(false);
          }
        }
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

  // Fetch team members when project changes (for form updates)
  useEffect(() => {
    const fetchMembers = async (projectId) => {
      if (!projectId) {
        setAvailableMembers([]);
        return;
      }
      
      setFetchingMembers(true);
      try {
        const members = await getProjectMembers(projectId);
        setAvailableMembers(members);
      } catch (error) {
        console.error('Error fetching team members:', error);
        setAvailableMembers([]);
      } finally {
        setFetchingMembers(false);
      }
    };
    
    // Only fetch if we have a projectId and it's not the initial load
    if (initialTaskData?.projectId && !loading) {
      fetchMembers(initialTaskData.projectId);
    }
  }, [initialTaskData?.projectId, loading]);

  const editTaskAction = async (prevFormState, formData) => {
    const title = formData.get("title");
    const description = formData.get("description");
    const projectId = formData.get("projectId");
    const assigneeId = formData.get("assigneeId");
    const priority = formData.get("priority") || 'medium';
    const deadline = formData.get("deadline");
    const tags = formData.get("tags");

    let errors = [];

    // Validate required fields
    if (!isNotEmpty(title)) {
      errors.push("Task title is required.");
    }

    if (!isNotEmpty(projectId)) {
      errors.push("Please select a project.");
    }

    if (!isNotEmpty(assigneeId)) {
      errors.push("Please assign this task to a team member.");
    }

    if (!isNotEmpty(deadline)) {
      errors.push("Deadline is required.");
    } else if (!isFutureDate(deadline)) {
      errors.push("Deadline cannot be in the past.");
    }

    if (!isValidPriority(priority)) {
      errors.push("Please select a valid priority.");
    }

    // If validation fails, return errors and entered values
    if (errors.length > 0) {
      return {
        errors,
        enteredValues: {
          title,
          description,
          projectId,
          assigneeId,
          priority,
          deadline,
          tags
        },
        success: false
      };
    }

    // Validation passed - call API
    try {
      const taskData = {
        title,
        description,
        projectId: parseInt(projectId),
        assignedTo: parseInt(assigneeId),
        priority: priority.toUpperCase(),
        dueDate: new Date(deadline).toISOString(),
        tags: tags ? tags.split(',').map(tag => tag.trim()) : []
      };

      await updateTask(id, taskData);

      return {
        errors: null,
        success: true,
        message: 'Task updated successfully!',
        taskId: id
      };
    } catch (err) {
      return {
        errors: [err.message || 'Failed to update task'],
        enteredValues: {
          title,
          description,
          projectId,
          assigneeId,
          priority,
          deadline,
          tags
        },
        success: false
      };
    }
  };

  const [formState, formAction, isPending] = useActionState(editTaskAction, {
    errors: null,
    enteredValues: initialTaskData || {
      title: '',
      description: '',
      projectId: '',
      assigneeId: '',
      priority: 'medium',
      deadline: '',
      tags: ''
    },
    success: false
  });

  // Update form state when initial data loads
  useEffect(() => {
    if (initialTaskData && !formState.success) {
      // This is a workaround since we can't directly update formState
      // The form will use defaultValue from initialTaskData
    }
  }, [initialTaskData, formState.success]);

  // Redirect on success
  if (formState.success) {
    setTimeout(() => {
      navigate(`/manager/tasks/${formState.taskId}`);
    }, 1500);
  }

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

      <form action={formAction} className="space-y-6">
        {/* Success Message */}
        {formState.success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{formState.message}</p>
            <p className="text-sm text-green-600 mt-1">Redirecting to task details...</p>
          </div>
        )}

      

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
                defaultValue={formState.enteredValues?.title || initialTaskData?.title}
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
                rows="3"
                defaultValue={formState.enteredValues?.description || initialTaskData?.description}
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
                  defaultValue={formState.enteredValues?.projectId || initialTaskData?.projectId}
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
                {!formState.enteredValues?.projectId && !initialTaskData?.projectId ? (
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
                    defaultValue={formState.enteredValues?.assigneeId || initialTaskData?.assigneeId}
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

            {/* Priority & Deadline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority *
                </label>
                <select
                  name="priority"
                  defaultValue={formState.enteredValues?.priority || initialTaskData?.priority}
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
                  defaultValue={formState.enteredValues?.deadline || initialTaskData?.deadline}
                  min={today}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Must be today or a future date</p>
              </div>

            </div>

            
          </div>
        </div>
          {/* Error Display */}
        {formState.errors && formState.errors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800 mb-1">Please fix the following errors:</h3>
              <ul className="list-disc list-inside text-sm text-red-700">
                {formState.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

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
            disabled={isPending || formState.success}
            className="px-6 py-2 bg-[#4DA5AD] text-white rounded-lg hover:bg-[#3D8B93] transition flex items-center disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isPending ? 'Updating...' : 'Update Task'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditTask;
