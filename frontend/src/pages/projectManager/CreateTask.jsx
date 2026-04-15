// src/components/projectManager/CreateTask.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useActionState } from 'react';
import { X, Save, Users, AlertCircle } from 'lucide-react';
import { getProjects } from '../../services/projectsService';
import { getProjectMembers } from '../../services/projectsService';
import { getUsers } from '../../services/usersService';
import { createTask } from '../../services/tasksService';

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
const isValidPriority = (priority) => ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(priority);

const CreateTask = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('projectId');

  const [projects, setProjects] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [availableQaTesters, setAvailableQaTesters] = useState([]);
  const [fetchingProjects, setFetchingProjects] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(projectIdFromUrl || '');
  const qaTesters = availableQaTesters.filter(
    (member) => ['qa-tester', 'qa_tester'].includes(member.role?.toLowerCase())
  );
  const teamMembers = availableMembers.filter(
    (member) => !['qa-tester', 'qa_tester'].includes(member.role?.toLowerCase())
  );

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  // Fetch projects
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setFetchingProjects(true);
        const [projectsData, usersData] = await Promise.all([
          getProjects(),
          getUsers()
        ]);
        setProjects(projectsData);
        setAvailableQaTesters(usersData);
      } catch (error) {
        console.error('Error fetching task form data:', error);
        alert('Failed to fetch projects and QA testers');
      } finally {
        setFetchingProjects(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch team members when project changes
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!selectedProjectId) {
        setAvailableMembers([]);
        return;
      }
      
      try {
        const members = await getProjectMembers(selectedProjectId);
        setAvailableMembers(members);
      } catch (error) {
        console.error('Error fetching team members:', error);
        setAvailableMembers([]);
      }
    };
    
    fetchTeamMembers();
  }, [selectedProjectId]);

  const createTaskAction = async (prevFormState, formData) => {
    const title = formData.get("title");
    const description = formData.get("description");
    const projectId = formData.get("projectId");
    const assigneeId = formData.get("assigneeId");
    const qaTesterId = formData.get("qaTesterId");
    const dueDate = formData.get("dueDate");
    const priority = formData.get("priority") || 'MEDIUM';
    const estimatedHours = formData.get("estimatedHours");

    // Update selected project ID for member fetching
    setSelectedProjectId(projectId);

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

    if (!isNotEmpty(dueDate)) {
      errors.push("Due date is required.");
    } else if (!isFutureDate(dueDate)) {
      errors.push("Due date cannot be in the past.");
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
          qaTesterId,
          dueDate,
          priority,
          estimatedHours
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
        qaTesterId: qaTesterId ? parseInt(qaTesterId) : null,
        dueDate: new Date(dueDate).toISOString(),
        priority: priority?.toUpperCase() || 'MEDIUM',
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null
      };

      console.log('Sending to backend:', taskData);
      
      const newTask = await createTask(taskData);

      return {
        errors: null,
        success: true,
        message: `Task "${newTask.title}" created successfully!`,
        task: newTask,
        projectId
      };
    } catch (err) {
      return {
        errors: [err.message || 'Failed to create task'],
        enteredValues: {
          title,
          description,
          projectId,
          assigneeId,
          qaTesterId,
          dueDate,
          priority,
          estimatedHours
        },
        success: false
      };
    }
  };

  const [formState, formAction, isPending] = useActionState(createTaskAction, {
    errors: null,
    enteredValues: {
      title: '',
      description: '',
      projectId: projectIdFromUrl || '',
      assigneeId: '',
      qaTesterId: '',
      dueDate: '',
      priority: 'MEDIUM',
      estimatedHours: ''
    },
    success: false
  });

  // Redirect on success
  if (formState.success) {
    setTimeout(() => {
      if (formState.projectId) {
        navigate(`/manager/projects/${formState.projectId}`);
      } else {
        navigate('/manager/tasks');
      }
    }, 1500);
  }

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

  const selectedProject = projects.find(p => p.id === parseInt(selectedProjectId || formState.enteredValues?.projectId));

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

      <form action={formAction} className="space-y-6">
        {/* Success Message */}
        {formState.success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{formState.message}</p>
            <p className="text-sm text-green-600 mt-1">Redirecting...</p>
          </div>
        )}

     

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Task Information</h2>

          <div className="space-y-4">
            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
              <input
                type="text"
                name="title"
                defaultValue={formState.enteredValues?.title}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                placeholder="Enter task title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                rows="3"
                defaultValue={formState.enteredValues?.description}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                placeholder="Describe the task"
              />
            </div>

            {/* Project, Assignee & QA Tester */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project *</label>
                <select
                  name="projectId"
                  defaultValue={selectedProjectId || formState.enteredValues?.projectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
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
                {!selectedProjectId ? (
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <Users className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Select a project first</p>
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-500">No team members available</p>
                  </div>
                ) : (
                  <select
                    name="assigneeId"
                    defaultValue={formState.enteredValues?.assigneeId}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                  >
                    <option value="">Select team member</option>
                    {teamMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role || 'Team Member'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">QA Tester</label>
                {qaTesters.length === 0 ? (
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-500">No QA testers available</p>
                  </div>
                ) : (
                  <select
                    name="qaTesterId"
                    defaultValue={formState.enteredValues?.qaTesterId}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                  >
                    <option value="">Select QA tester</option>
                    {qaTesters.map((tester) => (
                      <option key={tester.id} value={tester.id}>
                        {tester.name} ({tester.role || 'QA Tester'})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Project Info Display */}
            {selectedProject && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Selected Project:</span> {selectedProject.name}
                </p>
              </div>
            )}

            {/* Due Date & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
                <input
                  type="date"
                  name="dueDate"
                  defaultValue={formState.enteredValues?.dueDate}
                  min={today}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Must be today or a future date</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  name="priority"
                  defaultValue={formState.enteredValues?.priority}
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
                defaultValue={formState.enteredValues?.estimatedHours}
                min="0"
                step="0.5"
                placeholder="e.g., 2.5"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4DA5AD] focus:border-transparent"
              />
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
            {isPending ? 'Creating...' : 'Create & Assign Task'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTask;
