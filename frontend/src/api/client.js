import axios from 'axios';

const API_BASE = '/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
client.interceptors.request.use((config) => {
  const stored = localStorage.getItem('fshc-dashboard-storage');
  if (stored) {
    const { state } = JSON.parse(stored);
    if (state?.token) {
      config.headers.Authorization = `Bearer ${state.token}`;
    }
  }
  return config;
});

// Handle 401 errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fshc-dashboard-storage');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ============ AUTH ============
export const login = (username, password) => client.post('/auth/login', { username, password });
export const getMe = () => client.get('/auth/me');
export const changePassword = (currentPassword, newPassword) =>
  client.put('/auth/password', { currentPassword, newPassword });

// ============ USERS (Admin only) ============
export const getUsers = () => client.get('/users');
export const getUser = (id) => client.get(`/users/${id}`);
export const createUser = (data) => client.post('/users', data);
export const updateUser = (id, data) => client.put(`/users/${id}`, data);
export const assignUserProjects = (id, projectIds, projectRole) =>
  client.put(`/users/${id}/projects`, { projectIds, projectRole });
export const deleteUser = (id) => client.delete(`/users/${id}`);

// ============ PROJECTS ============
export const getProjects = () => client.get('/projects');
export const getProject = (id) => client.get(`/projects/${id}`);
export const createProject = (data) => client.post('/projects', data);
export const updateProject = (id, data) => client.put(`/projects/${id}`, data);
export const assignProjectUsers = (id, userIds, projectRole) =>
  client.put(`/projects/${id}/users`, { userIds, projectRole });
export const deleteProject = (id) => client.delete(`/projects/${id}`);
export const getProjectStats = (id) => client.get(`/projects/${id}/stats`);

// ============ TASKS ============
export const getTasks = (projectId, params) => client.get(`/tasks/project/${projectId}`, { params });
export const getTask = (id) => client.get(`/tasks/${id}`);
export const createTask = (data) => client.post('/tasks', data);
export const updateTask = (id, data) => client.put(`/tasks/${id}`, data);
export const updateTaskStatus = (id, status) => client.patch(`/tasks/${id}/status`, { status });
export const deleteTask = (id) => client.delete(`/tasks/${id}`);

// ============ SUBTASKS ============
export const createSubtask = (taskId, title) => client.post(`/tasks/${taskId}/subtasks`, { title });
export const updateSubtask = (taskId, subtaskId, data) => client.put(`/tasks/${taskId}/subtasks/${subtaskId}`, data);
export const toggleSubtask = (taskId, subtaskId) => client.patch(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
export const deleteSubtask = (taskId, subtaskId) => client.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);

// ============ NOTES ============
export const createNote = (taskId, content, authorId) => client.post(`/tasks/${taskId}/notes`, { content, authorId });
export const updateNote = (taskId, noteId, content) => client.put(`/tasks/${taskId}/notes/${noteId}`, { content });
export const deleteNote = (taskId, noteId) => client.delete(`/tasks/${taskId}/notes/${noteId}`);

// ============ DELIVERABLES ============
export const createDeliverable = (taskId, data) => client.post(`/tasks/${taskId}/deliverables`, data);
export const updateDeliverable = (taskId, deliverableId, data) => client.put(`/tasks/${taskId}/deliverables/${deliverableId}`, data);
export const deleteDeliverable = (taskId, deliverableId) => client.delete(`/tasks/${taskId}/deliverables/${deliverableId}`);

// ============ PHASES ============
export const getPhases = (projectId) => client.get(`/phases/project/${projectId}`);
export const getPhase = (id) => client.get(`/phases/${id}`);
export const createPhase = (data) => client.post('/phases', data);
export const updatePhase = (id, data) => client.put(`/phases/${id}`, data);
export const deletePhase = (id) => client.delete(`/phases/${id}`);
export const reorderPhases = (phaseIds, projectId) => client.post('/phases/reorder', { phaseIds, projectId });

// ============ ASSIGNEES ============
export const getAssignees = (projectId) => client.get(`/assignees/project/${projectId}`);
export const getAssignee = (id) => client.get(`/assignees/${id}`);
export const createAssignee = (data) => client.post('/assignees', data);
export const updateAssignee = (id, data) => client.put(`/assignees/${id}`, data);
export const deleteAssignee = (id) => client.delete(`/assignees/${id}`);

export default client;
