import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { getMyTasks } from '../../services/tasksService';
import { FolderOpen } from 'lucide-react';

const normalizeId = (value) => {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
};

const buildProjectFromTask = (task) => {
  const project = task.project || {};

  return {
    id: task.projectId ?? project.id ?? task.projectName,
    name: project.name || task.projectName || 'Unknown Project',
    teamName:
      task.teamName ||
      project.team?.name ||
      project.team?.teamName ||
      project.teamName ||
      task.team?.name ||
      'Unassigned',
    progress: project.progress ?? 0,
  };
};

const QATesterProjects = () => {
  const { user } = useAuth();
  const currentUserId = normalizeId(user?.id);

  const { data: myTasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['qa-tasks'],
    queryFn: ({ signal }) => getMyTasks({ signal }),
    retry: false,
  });

  const qaAssignedTasks = useMemo(() => {
    if (!currentUserId) return myTasks;

    return myTasks.filter((task) => {
      const qaTesterId = normalizeId(task.qaTesterId ?? task.qaTester?.id);
      return qaTesterId === currentUserId;
    });
  }, [myTasks, currentUserId]);

  const qaProjects = useMemo(() => {
    const projectMap = new Map();

    qaAssignedTasks.forEach((task) => {
      const projectId = normalizeId(task.projectId ?? task.project?.id ?? task.projectName);
      if (!projectId) return;

      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, buildProjectFromTask(task));
      }
    });

    return Array.from(projectMap.values());
  }, [qaAssignedTasks]);

  if (loadingTasks) {
    return <div className="p-6">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
      </div>

      <div className="space-y-6">
        {qaProjects.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <p className="text-gray-500">You don't have tasks in any active projects.</p>
          </div>
        ) : (
          qaProjects.map(project => {
            const projectId = normalizeId(project.id);
            const projectTasks = qaAssignedTasks.filter(
              (task) => normalizeId(task.projectId ?? task.project?.id) === projectId
            );
            const projectProgress = project.progress ?? 0;

            return (
              <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#4DA5AD]/15 rounded-lg flex items-center justify-center text-[#4DA5AD]">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{project.name}</h2>
                      <p className="text-sm text-gray-500">{project.teamName}</p>
                    </div>
                  </div>
                  <div className="w-full sm:w-1/3 space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Overall Project Progress</span>
                      <span>{projectProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className="bg-[#4DA5AD] h-2 rounded-full"
                        style={{ width: `${projectProgress}%` }} 
                      />
                    </div>
                  </div>
                </div>

                <div className="p-0">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                        <th className="px-6 py-3">Your QA Tasks</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 min-w-[120px]">QA Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {projectTasks.length === 0 ? (
                         <tr>
                           <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                             No tasks assigned to you in this project.
                           </td>
                         </tr>
                      ) : (
                        projectTasks.map(task => (
                          <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-sm text-gray-900">{task.title}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 uppercase">
                                {task.status?.replace('-', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-[#4DA5AD]">
                              <a href={`/qa-tester/tasks/${task.id}`} className="hover:underline flex items-center gap-1">
                                View Details & Test
                              </a>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default QATesterProjects;
