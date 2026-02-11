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

// ============ COMMENTS ============
export const getComments = (taskId) => client.get(`/comments/task/${taskId}`);
export const createComment = (taskId, data) => client.post(`/comments/task/${taskId}`, data);
export const updateComment = (id, content) => client.put(`/comments/${id}`, { content });
export const deleteComment = (id) => client.delete(`/comments/${id}`);

// ============ TAGS ============
export const getTags = (projectId) => client.get(`/tags/project/${projectId}`);
export const createTag = (data) => client.post('/tags', data);
export const updateTag = (id, data) => client.put(`/tags/${id}`, data);
export const deleteTag = (id) => client.delete(`/tags/${id}`);
export const addTagToTask = (taskId, tagId) => client.post(`/tags/task/${taskId}/tag/${tagId}`);
export const removeTagFromTask = (taskId, tagId) => client.delete(`/tags/task/${taskId}/tag/${tagId}`);

// ============ TIME TRACKING ============
export const getTimeEntries = (taskId) => client.get(`/time-tracking/task/${taskId}`);
export const getActiveTimer = () => client.get('/time-tracking/active');
export const startTimer = (taskId, description) => client.post(`/time-tracking/task/${taskId}/start`, { description });
export const stopTimer = (entryId) => client.post(`/time-tracking/${entryId}/stop`);
export const createTimeEntry = (taskId, data) => client.post(`/time-tracking/task/${taskId}`, data);
export const deleteTimeEntry = (id) => client.delete(`/time-tracking/${id}`);
export const getProjectTimeSummary = (projectId) => client.get(`/time-tracking/project/${projectId}/summary`);

// ============ NOTIFICATIONS ============
export const getNotifications = () => client.get('/notifications');
export const getUnreadCount = () => client.get('/notifications/unread/count');
export const markNotificationRead = (id) => client.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => client.patch('/notifications/read-all');
export const deleteNotification = (id) => client.delete(`/notifications/${id}`);

// ============ ACTIVITIES ============
export const getProjectActivities = (projectId, params) => client.get(`/activities/project/${projectId}`, { params });
export const getTaskActivities = (taskId) => client.get(`/activities/task/${taskId}`);

// ============ DEPENDENCIES ============
export const getDependencies = (taskId) => client.get(`/dependencies/task/${taskId}`);
export const addDependency = (taskId, blockingTaskId) => client.post(`/dependencies/task/${taskId}`, { blockingTaskId });
export const removeDependency = (taskId, blockingTaskId) => client.delete(`/dependencies/task/${taskId}/blocking/${blockingTaskId}`);
export const checkDependenciesResolved = (taskId) => client.get(`/dependencies/task/${taskId}/check`);

// ============ TEMPLATES ============
export const getTemplates = (projectId) => client.get(`/templates/project/${projectId}`);
export const createTemplate = (data) => client.post('/templates', data);
export const createTemplateFromTask = (taskId, name) => client.post(`/templates/from-task/${taskId}`, { name });
export const createTaskFromTemplate = (templateId, data) => client.post(`/templates/${templateId}/create-task`, data);
export const updateTemplate = (id, data) => client.put(`/templates/${id}`, data);
export const deleteTemplate = (id) => client.delete(`/templates/${id}`);

// ============ CUSTOM FIELDS ============
export const getCustomFields = (projectId) => client.get(`/custom-fields/project/${projectId}`);
export const createCustomField = (data) => client.post('/custom-fields', data);
export const updateCustomField = (id, data) => client.put(`/custom-fields/${id}`, data);
export const deleteCustomField = (id) => client.delete(`/custom-fields/${id}`);
export const getTaskCustomValues = (taskId) => client.get(`/custom-fields/task/${taskId}`);
export const setCustomFieldValue = (taskId, fieldId, value) => client.post(`/custom-fields/task/${taskId}/field/${fieldId}`, { value });
export const bulkSetCustomValues = (taskId, values) => client.post(`/custom-fields/task/${taskId}/bulk`, { values });

// ============ BULK OPERATIONS ============
export const bulkUpdateStatus = (taskIds, status) => client.patch('/bulk/tasks/status', { taskIds, status });
export const bulkUpdateAssignee = (taskIds, assigneeId) => client.patch('/bulk/tasks/assignee', { taskIds, assigneeId });
export const bulkUpdatePriority = (taskIds, priority) => client.patch('/bulk/tasks/priority', { taskIds, priority });
export const bulkMoveToPhase = (taskIds, phaseId) => client.patch('/bulk/tasks/phase', { taskIds, phaseId });
export const bulkAddTag = (taskIds, tagId) => client.post('/bulk/tasks/tags', { taskIds, tagId });
export const bulkRemoveTag = (taskIds, tagId) => client.delete('/bulk/tasks/tags', { data: { taskIds, tagId } });
export const bulkDeleteTasks = (taskIds) => client.delete('/bulk/tasks', { data: { taskIds } });
export const bulkSetDueDate = (taskIds, dueDate) => client.patch('/bulk/tasks/dueDate', { taskIds, dueDate });
export const duplicateTasks = (taskIds, targetPhaseId) => client.post('/bulk/tasks/duplicate', { taskIds, targetPhaseId });

// ============ ATTACHMENTS ============
export const getAttachments = (taskId) => client.get(`/attachments/task/${taskId}`);
export const uploadAttachment = (taskId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return client.post(`/attachments/task/${taskId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const downloadAttachment = (id) => client.get(`/attachments/download/${id}`, { responseType: 'blob' });
export const deleteAttachment = (id) => client.delete(`/attachments/${id}`);

// ============ RECURRING TASKS ============
export const getRecurringConfig = (taskId) => client.get(`/recurring/task/${taskId}`);
export const getProjectRecurringTasks = (projectId) => client.get(`/recurring/project/${projectId}`);
export const setRecurringConfig = (taskId, data) => client.post(`/recurring/task/${taskId}`, data);
export const deleteRecurringConfig = (taskId) => client.delete(`/recurring/task/${taskId}`);
export const toggleRecurring = (taskId) => client.patch(`/recurring/task/${taskId}/toggle`);
export const processRecurringTasks = () => client.post('/recurring/process');

// ============ REPORTS ============
export const getProjectOverview = (projectId) => client.get(`/reports/project/${projectId}/overview`);
export const getWorkload = (projectId) => client.get(`/reports/project/${projectId}/workload`);
export const getTrend = (projectId, days) => client.get(`/reports/project/${projectId}/trend`, { params: { days } });
export const getMyTasks = () => client.get('/reports/my-tasks');
export const getBurndown = (projectId, days) => client.get(`/reports/project/${projectId}/burndown`, { params: { days } });
export const getTagAnalytics = (projectId) => client.get(`/reports/project/${projectId}/tags`);

export default client;
