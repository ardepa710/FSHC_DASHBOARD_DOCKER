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

// ============ COMMENTS ============
export function useComments(taskId) {
  return useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => api.getComments(taskId).then(res => res.data),
    enabled: !!taskId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, content, mentions }) => api.createComment(taskId, { content, mentions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

// ============ TAGS ============
export function useTags() {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ['tags', projectId],
    queryFn: () => api.getTags(projectId).then(res => res.data),
    enabled: !!projectId,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  const projectId = useProjectId();
  return useMutation({
    mutationFn: (data) => api.createTag({ ...data, projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useAddTagToTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, tagId }) => api.addTagToTask(taskId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useRemoveTagFromTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, tagId }) => api.removeTagFromTask(taskId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

// ============ TIME TRACKING ============
export function useTimeEntries(taskId) {
  return useQuery({
    queryKey: ['timeEntries', taskId],
    queryFn: () => api.getTimeEntries(taskId).then(res => res.data),
    enabled: !!taskId,
  });
}

export function useActiveTimer() {
  return useQuery({
    queryKey: ['activeTimer'],
    queryFn: () => api.getActiveTimer().then(res => res.data),
  });
}

export function useStartTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, description }) => api.startTimer(taskId, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeTimer'] });
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });
}

export function useStopTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId) => api.stopTimer(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeTimer'] });
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }) => api.createTimeEntry(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });
}

// ============ NOTIFICATIONS ============
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications().then(res => res.data),
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => api.getUnreadCount().then(res => res.data),
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
}

// ============ ACTIVITIES ============
export function useProjectActivities(params) {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ['activities', projectId, params],
    queryFn: () => api.getProjectActivities(projectId, params).then(res => res.data),
    enabled: !!projectId,
  });
}

export function useTaskActivities(taskId) {
  return useQuery({
    queryKey: ['taskActivities', taskId],
    queryFn: () => api.getTaskActivities(taskId).then(res => res.data),
    enabled: !!taskId,
  });
}

// ============ DEPENDENCIES ============
export function useDependencies(taskId) {
  return useQuery({
    queryKey: ['dependencies', taskId],
    queryFn: () => api.getDependencies(taskId).then(res => res.data),
    enabled: !!taskId,
  });
}

export function useAddDependency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, blockingTaskId }) => api.addDependency(taskId, blockingTaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependencies'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
    },
  });
}

export function useRemoveDependency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, blockingTaskId }) => api.removeDependency(taskId, blockingTaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependencies'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
    },
  });
}

// ============ TEMPLATES ============
export function useTemplates() {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ['templates', projectId],
    queryFn: () => api.getTemplates(projectId).then(res => res.data),
    enabled: !!projectId,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const projectId = useProjectId();
  return useMutation({
    mutationFn: (data) => api.createTemplate({ ...data, projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useCreateTemplateFromTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, name }) => api.createTemplateFromTask(taskId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useCreateTaskFromTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, phaseId }) => api.createTaskFromTemplate(templateId, { phaseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

// ============ CUSTOM FIELDS ============
export function useCustomFields() {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ['customFields', projectId],
    queryFn: () => api.getCustomFields(projectId).then(res => res.data),
    enabled: !!projectId,
  });
}

export function useCreateCustomField() {
  const queryClient = useQueryClient();
  const projectId = useProjectId();
  return useMutation({
    mutationFn: (data) => api.createCustomField({ ...data, projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
    },
  });
}

export function useDeleteCustomField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteCustomField(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
    },
  });
}

export function useTaskCustomValues(taskId) {
  return useQuery({
    queryKey: ['customValues', taskId],
    queryFn: () => api.getTaskCustomValues(taskId).then(res => res.data),
    enabled: !!taskId,
  });
}

export function useSetCustomValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, fieldId, value }) => api.setCustomFieldValue(taskId, fieldId, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customValues'] });
    },
  });
}

// ============ BULK OPERATIONS ============
export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskIds, status }) => api.bulkUpdateStatus(taskIds, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useBulkUpdateAssignee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskIds, assigneeId }) => api.bulkUpdateAssignee(taskIds, assigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useBulkDelete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskIds) => api.bulkDeleteTasks(taskIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDuplicateTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskIds, targetPhaseId }) => api.duplicateTasks(taskIds, targetPhaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

// ============ ATTACHMENTS ============
export function useAttachments(taskId) {
  return useQuery({
    queryKey: ['attachments', taskId],
    queryFn: () => api.getAttachments(taskId).then(res => res.data),
    enabled: !!taskId,
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, file }) => api.uploadAttachment(taskId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteAttachment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
    },
  });
}

// ============ RECURRING TASKS ============
export function useRecurringConfig(taskId) {
  return useQuery({
    queryKey: ['recurringConfig', taskId],
    queryFn: () => api.getRecurringConfig(taskId).then(res => res.data),
    enabled: !!taskId,
  });
}

export function useSetRecurringConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }) => api.setRecurringConfig(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringConfig'] });
    },
  });
}

export function useDeleteRecurringConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId) => api.deleteRecurringConfig(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringConfig'] });
    },
  });
}

// ============ REPORTS ============
export function useProjectOverview() {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ['projectOverview', projectId],
    queryFn: () => api.getProjectOverview(projectId).then(res => res.data),
    enabled: !!projectId,
  });
}

export function useWorkload() {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ['workload', projectId],
    queryFn: () => api.getWorkload(projectId).then(res => res.data),
    enabled: !!projectId,
  });
}

export function useTrend(days = 30) {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ['trend', projectId, days],
    queryFn: () => api.getTrend(projectId, days).then(res => res.data),
    enabled: !!projectId,
  });
}

export function useMyTasks() {
  return useQuery({
    queryKey: ['myTasks'],
    queryFn: () => api.getMyTasks().then(res => res.data),
  });
}

export function useBurndown(days = 30) {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ['burndown', projectId, days],
    queryFn: () => api.getBurndown(projectId, days).then(res => res.data),
    enabled: !!projectId,
  });
}

export function useTagAnalytics() {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ['tagAnalytics', projectId],
    queryFn: () => api.getTagAnalytics(projectId).then(res => res.data),
    enabled: !!projectId,
  });
}
