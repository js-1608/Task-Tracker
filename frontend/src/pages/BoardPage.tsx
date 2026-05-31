// client/src/pages/BoardPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { Plus, Filter, RefreshCw, Search, X } from 'lucide-react';
import { Task, TaskStatus, Priority } from '../types';
import { tasksApi, projectsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import TaskModal from '../components/TaskModal';

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'TODO',        label: 'To Do',       color: 'var(--status-todo)' },
  { status: 'IN_PROGRESS', label: 'In Progress',  color: 'var(--status-inprogress)' },
  { status: 'IN_REVIEW',   label: 'In Review',    color: 'var(--status-inreview)' },
  { status: 'DONE',        label: 'Done',         color: 'var(--status-done)' },
  { status: 'BLOCKED',     label: 'Blocked',      color: 'var(--status-blocked)' },
];

function priorityBadge(p: Priority) {
  const cls = p === 'HIGH' ? 'badge-high' : p === 'LOW' ? 'badge-low' : 'badge-medium';
  return <span className={`badge ${cls}`}>{p}</span>;
}

function formatDate(d?: string | null) {
  if (!d) return null;
  const date = new Date(d);
  const now = new Date();
  const isOverdue = date < now && date.toDateString() !== now.toDateString();
  return (
    <span className={`due-date ${isOverdue ? 'overdue' : ''}`}>
      {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
    </span>
  );
}

function getAssigneeInitial(task: Task) {
  const a = task.assigneeId as any;
  return a?.name?.charAt(0).toUpperCase() ?? '?';
}

function getAssigneeName(task: Task) {
  const a = task.assigneeId as any;
  return a?.name ?? 'Unassigned';
}

export default function BoardPage() {
  const { user } = useAuth();
  const canCreate = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null | undefined>(undefined);
  const [filterPriority, setFilterPriority] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { limit: 200 };
      if (filterPriority) params.priority = filterPriority;
      if (filterProject) params.projectId = filterProject;
      const { data } = await tasksApi.list(params);
      setTasks(data.data);
    } catch { 
      setTasks([]); 
    } finally { 
      setLoading(false); 
    }
  }, [filterPriority, filterProject]);

  useEffect(() => {
    // Fetch projects for filter dropdown
    projectsApi.list().then((r) => setProjects(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Hook into global task-created events for immediate refresh
  useEffect(() => {
    const handleGlobalTaskCreated = () => {
      fetchTasks();
    };
    window.addEventListener('task-created', handleGlobalTaskCreated);
    return () => {
      window.removeEventListener('task-created', handleGlobalTaskCreated);
    };
  }, [fetchTasks]);

  const clearFilters = () => {
    setFilterPriority('');
    setFilterProject('');
    setSearchQuery('');
  };

  // Client-side filtering by search query on top of server filtered results
  const filteredTasks = tasks.filter((t) => {
    const matchQuery = searchQuery.trim().toLowerCase();
    if (!matchQuery) return true;
    return (
      t.title.toLowerCase().includes(matchQuery) ||
      (t.description && t.description.toLowerCase().includes(matchQuery))
    );
  });

  const byStatus = (status: TaskStatus) => filteredTasks.filter((t) => t.status === status);

  return (
    <div className="page-container">
      <div className="breadcrumbs">
        Projects <span>/</span> Active Board
      </div>
      
      <div className="page-header">
        <h1>Kanban Board</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchTasks} disabled={loading}>
            <RefreshCw size={12} className={loading ? 'spin' : ''} /> Refresh
          </button>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setSelectedTask(null)}>
              <Plus size={14} /> Create Task
            </button>
          )}
        </div>
      </div>

      {/* Filters (Jira Style) */}
      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: '180px', maxWidth: '260px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '32px', fontSize: '0.8rem', height: '32px' }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        <Filter size={14} style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }} />

        <select 
          value={filterProject} 
          onChange={(e) => setFilterProject(e.target.value)}
          style={{ height: '32px', fontSize: '0.8rem', padding: '4px 8px' }}
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>

        <select 
          value={filterPriority} 
          onChange={(e) => setFilterPriority(e.target.value)}
          style={{ height: '32px', fontSize: '0.8rem', padding: '4px 8px' }}
        >
          <option value="">All Priorities</option>
          <option value="HIGH">🔴 High</option>
          <option value="MEDIUM">🟡 Medium</option>
          <option value="LOW">🟢 Low</option>
        </select>

        {(filterPriority || filterProject || searchQuery) && (
          <button className="btn btn-secondary btn-sm" onClick={clearFilters} style={{ height: '32px' }}>
            Clear Filters
          </button>
        )}

        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {filteredTasks.length} of {tasks.length} tasks
        </span>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {COLUMNS.map(({ status, label, color }) => {
          const colTasks = byStatus(status);
          return (
            <div key={status} className="kanban-col">
              <div className="kanban-col-header" style={{ borderTop: `3px solid ${color}` }}>
                <h3>{label}</h3>
                <span className="kanban-count">{colTasks.length}</span>
              </div>
              <div className="kanban-cards">
                {loading ? (
                  <>
                    <div className="skeleton" style={{ height: 72 }} />
                    <div className="skeleton" style={{ height: 60 }} />
                  </>
                ) : colTasks.length === 0 ? (
                  <div className="empty-state" style={{ padding: '1rem', minHeight: 70 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No tasks</span>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div key={task._id} className="task-card" onClick={() => setSelectedTask(task)}>
                      <div className="task-card-title">{task.title}</div>
                      
                      {task.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.description}
                        </div>
                      )}

                      <div className="task-card-footer">
                        <div className="task-card-meta">
                          {priorityBadge(task.priority)}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {formatDate(task.dueDate)}
                          <div 
                            className="avatar" 
                            title={getAssigneeName(task)}
                            style={{ 
                              background: task.assigneeId ? '#0052cc' : '#f4f5f7', 
                              color: task.assigneeId ? '#ffffff' : '#8993a4',
                              border: '1px solid #dfe1e6',
                              width: '22px',
                              height: '22px',
                              fontSize: '0.6rem'
                            }}
                          >
                            {getAssigneeInitial(task)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal */}
      {selectedTask !== undefined && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(undefined)}
          onSaved={() => { 
            setSelectedTask(undefined); 
            fetchTasks(); 
          }}
        />
      )}
    </div>
  );
}
