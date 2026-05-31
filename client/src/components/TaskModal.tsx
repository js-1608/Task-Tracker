// client/src/components/TaskModal.tsx
import { useState, useEffect, FormEvent } from 'react';
import { X, Save, Trash2, ArrowRight } from 'lucide-react';
import { Task, TaskStatus, Priority } from '../types';
import { tasksApi, projectsApi, usersApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Props {
  task?: Task | null;
  projectId?: string;
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ['IN_PROGRESS', 'BLOCKED'],
  IN_PROGRESS: ['IN_REVIEW', 'BLOCKED'],
  IN_REVIEW: ['DONE', 'BLOCKED'],
  DONE: [],
  BLOCKED: ['TODO', 'IN_PROGRESS'],
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done', BLOCKED: 'Blocked',
};

export default function TaskModal({ task, projectId, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const isNew = !task;
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    priority: (task?.priority ?? 'MEDIUM') as Priority,
    assigneeId: (task?.assigneeId as any)?._id ?? task?.assigneeId ?? '',
    projectId: (task?.projectId as any)?._id ?? task?.projectId ?? projectId ?? '',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
  });
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    projectsApi.list().then((r) => setProjects(r.data.data));
    if (canManage) usersApi.list().then((r) => setUsers(r.data.data));
  }, [canManage]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        assigneeId: form.assigneeId || undefined,
        projectId: form.projectId,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      };
      if (isNew) await tasksApi.create(body);
      else await tasksApi.update(task!._id, body);
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to save task');
    } finally { setLoading(false); }
  }

  async function handleStatusChange(status: TaskStatus) {
    setError(''); setLoading(true);
    try {
      await tasksApi.updateStatus(task!._id, status);
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Status transition failed');
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this task?')) return;
    try {
      await tasksApi.delete(task!._id);
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Delete failed');
    }
  }

  const currentStatus = task?.status;
  const nextStatuses = currentStatus ? STATUS_TRANSITIONS[currentStatus] : [];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{isNew ? 'New Task' : 'Edit Task'}</h3>
          <button className="btn btn-secondary btn-icon btn-sm" onClick={onClose}><X size={15} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label>Title *</label>
              <input value={form.title} onChange={set('title')} placeholder="Task title" required
                disabled={!canManage && !isNew} />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={set('description')}
                placeholder="Optional description..." disabled={!canManage && !isNew} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Priority</label>
                <select value={form.priority} onChange={set('priority')} disabled={!canManage && !isNew}>
                  <option value="LOW">🟢 Low</option>
                  <option value="MEDIUM">🟡 Medium</option>
                  <option value="HIGH">🔴 High</option>
                </select>
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={form.dueDate} onChange={set('dueDate')}
                  min={new Date().toISOString().slice(0, 10)} disabled={!canManage && !isNew} />
              </div>
            </div>

            <div className="form-group">
              <label>Project *</label>
              <select value={form.projectId} onChange={set('projectId')} required disabled={!isNew}>
                <option value="">Select project…</option>
                {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>

            {canManage && (
              <div className="form-group">
                <label>Assignee</label>
                <select value={form.assigneeId} onChange={set('assigneeId')}>
                  <option value="">Unassigned</option>
                  {users.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
            )}

            {/* Status transitions */}
            {!isNew && nextStatuses.length > 0 && (
              <div className="form-group">
                <label>Move to</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {nextStatuses.map((s) => (
                    <button key={s} type="button" className="btn btn-secondary btn-sm"
                      onClick={() => handleStatusChange(s)} disabled={loading}>
                      <ArrowRight size={12} /> {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            {!isNew && user?.role === 'ADMIN' && (
              <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>
                <Trash2 size={14} /> Delete
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Save size={14} />}
              {isNew ? 'Create Task' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
