import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/client';
import useStore from '../store/useStore';

// Helper to get current project ID
function useProjectId() {
  const currentProject = useStore(state => state.currentProject);
  return currentProject?.id;
}

// ============ AUTH ============
export function useLogin() {
  const setAuth = useStore(state => state.setAuth);
  return useMutation({
    mutationFn: ({ username, password }) => api.login(username, password),
    onSuccess: (response) => {
      setAuth(response.data.user, response.data.token);
    },
  });
}

export function useMe() {
  const token = useStore(state => state.token);
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.getMe().then(res => res.data),
    enabled: !!token,
  });
}

// ============ USERS (Admin) ============
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers().then(res => res.data),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useAssignUserProjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, projectIds, projectRole }) => api.assignUserProjects(id, projectIds, projectRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// ============ PROJECTS ============
export function useProjects() {
  const token = useStore(state => state.token);
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects().then(res => res.data),
    enabled: !!token,
  });
}

export function useProject(id) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => api.getProject(id).then(res => res.data),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useProjectStats(projectId) {
  return useQuery({
    queryKey: ['projectStats', projectId],
    queryFn: () => api.getProjectStats(projectId).then(res => res.data),
    enabled: !!projectId,
  });
}

// ============ TASKS ============
export function useTasks(params) {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ['tasks', projectId, params],
    queryFn: () => api.getTasks(projectId, params).then(res => res.data),
    enabled: !!projectId,
  });
}

export function useTask(id) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => api.getTask(id).then(res => res.data),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const projectId = useProjectId();
  return useMutation({
    mutationFn: (data) => api.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats', projectId] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const projectId = useProjectId();
  return useMutation({
    mutationFn: ({ id, data }) => api.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats', projectId] });
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  const projectId = useProjectId();
  return useMutation({
    mutationFn: ({ id, status }) => api.updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats', projectId] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const projectId = useProjectId();
  return useMutation({
    mutationFn: (id) => api.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats', projectId] });
    },
  });
}

// ============ SUBTASKS ============
export function useCreateSubtask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, title }) => api.createSubtask(taskId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useToggleSubtask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, subtaskId }) => api.toggleSubtask(taskId, subtaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
    },
  });
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, subtaskId }) => api.deleteSubtask(taskId, subtaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

// ============ NOTES ============
export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, content, authorId }) => api.createNote(taskId, content, authorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, noteId, content }) => api.updateNote(taskId, noteId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, noteId }) => api.deleteNote(taskId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
    },
  });
}

// ============ DELIVERABLES ============
export function useCreateDeliverable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, label, type }) => api.createDeliverable(taskId, { label, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteDeliverable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, deliverableId }) => api.deleteDeliverable(taskId, deliverableId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

// ============ PHASES ============
export function usePhases() {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ['phases', projectId],
    queryFn: () => api.getPhases(projectId).then(res => res.data),
    enabled: !!projectId,
  });
}

export function useCreatePhase() {
  const queryClient = useQueryClient();
  const projectId = useProjectId();
  return useMutation({
    mutationFn: (data) => api.createPhase({ ...data, projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats', projectId] });
    },
  });
}

export function useUpdatePhase() {
  const queryClient = useQueryClient();
  const projectId = useProjectId();
  return useMutation({
    mutationFn: ({ id, data }) => api.updatePhase(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats', projectId] });
    },
  });
}

export function useDeletePhase() {
  const queryClient = useQueryClient();
  const projectId = useProjectId();
  return useMutation({
    mutationFn: (id) => api.deletePhase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats', projectId] });
    },
  });
}

// ============ ASSIGNEES ============
export function useAssignees() {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ['assignees', projectId],
    queryFn: () => api.getAssignees(projectId).then(res => res.data),
    enabled: !!projectId,
  });
}

export function useCreateAssignee() {
  const queryClient = useQueryClient();
  const projectId = useProjectId();
  return useMutation({
    mutationFn: (data) => api.createAssignee({ ...data, projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignees'] });
    },
  });
}

export function useUpdateAssignee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.updateAssignee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignees'] });
    },
  });
}

export function useDeleteAssignee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteAssignee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignees'] });
    },
  });
}
