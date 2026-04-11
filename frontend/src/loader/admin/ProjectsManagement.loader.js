// src/loader/admin/ProjectsManagement.loader.js
import { queryClient } from '../../services/apiClient';
import { getProjects } from '../../services/projectsService';

export const projectsQuery = () => ({
  queryKey: ['projects'],
  queryFn: getProjects,
  staleTime: 1000 * 60 * 5, // 5 minutes
  cacheTime: 1000 * 60 * 10, // 10 minutes
});

export async function projectsLoader() {
  const projectsData = await queryClient.ensureQueryData(projectsQuery());
  return { projects: projectsData };
}
