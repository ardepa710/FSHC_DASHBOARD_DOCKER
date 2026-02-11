# FSHC Dashboard - Project Manager Application

## Repository
- **URL:** https://github.com/ardepa710/FSHC_DASHBOARD_APP
- **Local Path:** /home/ardepa/fshc_dashboard

## Tech Stack

### Frontend
- **Framework:** React 19 with Vite
- **Styling:** Tailwind CSS v4 with CSS Variables for theming
- **State Management:** Zustand (persisted to localStorage)
- **Data Fetching:** TanStack React Query
- **Icons:** Lucide React
- **Notifications:** React Hot Toast

### Backend
- **Runtime:** Node.js with Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma 5
- **Auth:** JWT (jsonwebtoken)
- **Real-time:** WebSocket (ws library)
- **File Uploads:** Multer

## Project Structure

```
fshc_dashboard/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Database models
│   ├── src/
│   │   ├── index.js           # Express server entry point
│   │   ├── websocket.js       # WebSocket server for real-time updates
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT authentication middleware
│   │   └── routes/
│   │       ├── auth.js        # Login, password change
│   │       ├── users.js       # User CRUD (admin only)
│   │       ├── projects.js    # Project CRUD
│   │       ├── tasks.js       # Task CRUD with subtasks, notes, deliverables
│   │       ├── phases.js      # Phase management
│   │       ├── assignees.js   # Team members per project
│   │       ├── comments.js    # Task comments (threaded)
│   │       ├── tags.js        # Task labels/tags
│   │       ├── timeTracking.js # Time entries
│   │       ├── notifications.js
│   │       ├── activities.js  # Activity log
│   │       ├── dependencies.js # Task dependencies
│   │       ├── templates.js   # Task templates
│   │       ├── customFields.js
│   │       ├── bulk.js        # Bulk operations
│   │       ├── attachments.js # File uploads
│   │       ├── recurring.js   # Recurring tasks
│   │       ├── reports.js     # Analytics & reports
│   │       ├── export.js      # JSON/CSV export
│   │       ├── filterPresets.js
│   │       ├── settings.js    # User settings (theme, etc.)
│   │       └── permissions.js # Granular permissions
│   └── uploads/               # File storage
│
└── frontend/
    ├── src/
    │   ├── main.jsx           # App entry with QueryClient
    │   ├── App.jsx            # Main app with routing logic
    │   ├── index.css          # Global styles, CSS variables, themes
    │   ├── api/
    │   │   └── client.js      # Axios client with all API functions
    │   ├── hooks/
    │   │   ├── useData.js     # React Query hooks for all entities
    │   │   └── useWebSocket.jsx # WebSocket provider & hooks
    │   ├── store/
    │   │   └── useStore.js    # Zustand store (auth, UI state)
    │   └── components/
    │       ├── LoginPage.jsx
    │       ├── ProjectSelector.jsx
    │       ├── UserManagement.jsx
    │       ├── Sidebar.jsx
    │       ├── TopBar.jsx
    │       ├── ListView.jsx
    │       ├── BoardView.jsx   # Kanban board
    │       ├── TimelineView.jsx
    │       ├── CalendarView.jsx
    │       ├── GanttView.jsx
    │       ├── DashboardView.jsx # Widget-based dashboard
    │       ├── MyTasksView.jsx
    │       ├── ReportsView.jsx
    │       ├── TaskDetail.jsx
    │       ├── TaskModal.jsx
    │       ├── MobileNav.jsx   # Bottom navigation for mobile
    │       ├── GlobalSearch.jsx # Cmd+K search modal
    │       ├── OnlineUsers.jsx # WebSocket presence indicator
    │       ├── PermissionsPanel.jsx
    │       ├── NotificationsPanel.jsx
    │       ├── BulkActionsBar.jsx
    │       ├── KeyboardShortcuts.jsx
    │       ├── ThemeProvider.jsx
    │       ├── ActivityLogPanel.jsx
    │       ├── ExportImportModal.jsx
    │       ├── TemplatesPanel.jsx
    │       ├── SettingsPanel.jsx
    │       ├── RecurringTaskConfig.jsx
    │       └── FilterPresetsDropdown.jsx
    └── dist/                  # Production build
```

## Database Models (Prisma)

### Core Models
- **User** - System users (ADMIN, USER roles)
- **Project** - Projects with color, icon
- **UserProject** - User-project relation (OWNER, MEMBER, VIEWER roles)
- **Phase** - Project phases with order, color, icon
- **Task** - Tasks with status, priority, due date
- **Assignee** - Team members per project (separate from users)
- **Subtask** - Task subtasks
- **Deliverable** - Task deliverables
- **Note** - Task notes

### Feature Models
- **TaskDependency** - Task blocking relationships
- **Comment** - Threaded comments with mentions
- **Attachment** - File attachments
- **Notification** - User notifications
- **ActivityLog** - Audit trail
- **Tag** / **TaskTag** - Task labels
- **TimeEntry** - Time tracking
- **RecurringTask** - Recurring task config
- **TaskTemplate** - Task templates
- **CustomField** / **CustomFieldValue** - Custom fields
- **FilterPreset** - Saved filter configurations
- **UserSettings** - User preferences (theme, etc.)
- **ProjectPermission** - Granular permissions per user per project

## Features Implemented

### HIGH Priority (Completed)
1. **Mobile Responsive Design** - Bottom nav, touch-friendly, responsive layouts
2. **Advanced Search** - Global search with Cmd/Ctrl+K, filters by status/priority/assignee/phase/tag
3. **Real-time Updates** - WebSocket for live collaboration, user presence
4. **Customizable Dashboard** - Widget-based, drag-and-drop, localStorage persistence
5. **Granular Permissions** - Per-user permission overrides per project

### MEDIUM Priority (Completed)
- Drag & drop task reordering
- Keyboard shortcuts
- Subtask management
- Comments with @mentions
- File attachments
- Notifications

### LOW Priority (Completed)
- Time tracking with timer
- Activity log
- Task templates
- Recurring tasks
- Filter presets
- Export/Import (JSON, CSV)
- Custom fields
- Task dependencies
- Bulk operations
- Theme (dark/light/system)

## API Endpoints

### Auth
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/password`

### Main Resources
- `/api/users` - User management (admin)
- `/api/projects` - Projects CRUD
- `/api/tasks` - Tasks CRUD
- `/api/phases` - Phases CRUD
- `/api/assignees` - Assignees CRUD
- `/api/comments` - Comments
- `/api/tags` - Tags
- `/api/time-tracking` - Time entries
- `/api/notifications` - Notifications
- `/api/activities` - Activity log
- `/api/dependencies` - Task dependencies
- `/api/templates` - Task templates
- `/api/custom-fields` - Custom fields
- `/api/bulk` - Bulk operations
- `/api/attachments` - File uploads
- `/api/recurring` - Recurring tasks
- `/api/reports` - Analytics
- `/api/export` - Export/Import
- `/api/filter-presets` - Saved filters
- `/api/settings` - User settings
- `/api/permissions` - Granular permissions

### WebSocket
- `ws://localhost:3001/ws`
- Messages: auth, join_project, task_update, task_create, task_delete, presence

## Running the Application

### Backend
```bash
cd backend
npm install
npx prisma db push
npx prisma generate
node src/index.js
# Runs on http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL="postgresql://user:pass@localhost:5432/fshc_dashboard"
JWT_SECRET="your-secret"
PORT=3001
```

## CSS Variables (Theming)

```css
:root, .theme-dark {
  --bg0: #0a0e1a;
  --bg1: #111827;
  --bg2: #1a2035;
  --bg3: #253050;
  --border: #1e2640;
  --text: #e0e0e0;
  --text2: #8892a4;
  --text3: #556;
  --blue: #6c8cff;
  --green: #10b981;
  --amber: #f59e0b;
  --red: #ef4444;
  --purple: #8b5cf6;
}

.theme-light {
  --bg0: #f8fafc;
  --bg1: #ffffff;
  --bg2: #f1f5f9;
  --bg3: #e2e8f0;
  --border: #cbd5e1;
  --text: #1e293b;
  --text2: #64748b;
  --text3: #94a3b8;
  --blue: #3b82f6;
}
```

## Keyboard Shortcuts
- `Cmd/Ctrl + K` - Global search
- `N` - New task
- `?` - Show shortcuts
- `1-5` - Switch views
- `Escape` - Close modals/panels
