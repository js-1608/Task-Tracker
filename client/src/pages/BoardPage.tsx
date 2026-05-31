// client/src/pages/BoardPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { Plus, Filter, RefreshCw } from 'lucide-react';
import { Task, TaskStatus, Priority } from '../types';
import { tasksApi } from '../api/client';
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
  const isOverdue = date < now;
  return <span className={`due-date ${isOverdue ? 'overdue' : ''}`}>
    {isOverdue ? '⚠ ' : '📅 '}{date.toLocaleDateString()}
  </span>;
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
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null | undefined>(undefined);
  const [filterPriority, setFilterPriority] = useState('');
  const [filterProject, setFilterProject] = useState('');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { limit: 200 };
      if (filterPriority) params.priority = filterPriority;
      if (filterProject) params.projectId = filterProject;
      const { data } = await tasksApi.list(params);
      setTasks(data.data);
    } catch { setTasks([]); }
    finally { setLoading(false); }
  }, [filterPriority, filterProject]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const byStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Task Board</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchTasks} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setSelectedTask(null)}>
              <Plus size={15} /> New Task
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <Filter size={15} style={{ color: 'var(--text-muted)' }} />
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
          style={{ maxWidth: 150 }}>
          <option value="">All Priorities</option>
          <option value="HIGH">🔴 High</option>
          <option value="MEDIUM">🟡 Medium</option>
          <option value="LOW">🟢 Low</option>
        </select>
        <button className="btn btn-secondary btn-sm"
          onClick={() => { setFilterPriority(''); setFilterProject(''); }}>
          Clear
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {tasks.length} tasks
        </span>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {COLUMNS.map(({ status, label, color }) => {
          const colTasks = byStatus(status);
          return (
            <div key={status} className="kanban-col">
              <div className="kanban-col-header" style={{ borderTop: `2px solid ${color}` }}>
                <h3 style={{ color }}>{label}</h3>
                <span className="kanban-count">{colTasks.length}</span>
              </div>
              <div className="kanban-cards">
                {loading ? (
                  <>
                    <div className="skeleton" style={{ height: 80 }} />
                    <div className="skeleton" style={{ height: 60 }} />
                  </>
                ) : colTasks.length === 0 ? (
                  <div className="empty-state" style={{ padding: '1.5rem', minHeight: 80 }}>
                    <span style={{ fontSize: '0.8rem' }}>No tasks</span>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div key={task._id} className="task-card" onClick={() => setSelectedTask(task)}>
                      <div className="task-card-title">{task.title}</div>
                      <div className="task-card-meta">
                        {priorityBadge(task.priority)}
                        {task.description && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                            {task.description.slice(0, 50)}{task.description.length > 50 ? '…' : ''}
                          </span>
                        )}
                      </div>
                      <div className="task-card-footer">
                        {task.assigneeId ? (
                          <div className="task-assignee">
                            <div className="avatar">{getAssigneeInitial(task)}</div>
                            <span>{getAssigneeName(task)}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Unassigned</span>
                        )}
                        {formatDate(task.dueDate)}
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
          onSaved={() => { setSelectedTask(undefined); fetchTasks(); }}
        />
      )}
    </div>
  );
}
