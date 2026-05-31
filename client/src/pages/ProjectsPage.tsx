// client/src/pages/ProjectsPage.tsx
import { useState, useEffect } from 'react';
import { Plus, Folder, Trash2, Edit2, X, Save } from 'lucide-react';
import { Project } from '../types';
import { projectsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ProjectsPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | Project | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetchProjects() {
    setLoading(true);
    try { const { data } = await projectsApi.list(); setProjects(data.data); }
    catch { setProjects([]); } finally { setLoading(false); }
  }

  useEffect(() => { fetchProjects(); }, []);

  function openCreate() { setForm({ name: '', description: '' }); setModal('create'); setError(''); }
  function openEdit(p: Project) { setForm({ name: p.name, description: p.description ?? '' }); setModal(p); setError(''); }

  async function handleSave() {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError('');
    try {
      if (modal === 'create') await projectsApi.create(form);
      else await projectsApi.update((modal as Project)._id, form);
      setModal(null); fetchProjects();
    } catch (err: any) { setError(err.response?.data?.message ?? 'Failed'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this project and all its tasks?')) return;
    try { await projectsApi.delete(id); fetchProjects(); }
    catch (err: any) { alert(err.response?.data?.message ?? 'Delete failed'); }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Projects</h1>
        {canManage && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={15} /> New Project
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <Folder size={48} />
          <h3>No projects yet</h3>
          {canManage && <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> Create First Project</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
          {projects.map((p) => (
            <div key={p._id} className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent), #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Folder size={15} color="white" />
                  </div>
                  <h3 style={{ fontSize: '0.95rem' }}>{p.name}</h3>
                </div>
                {canManage && (
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(p)}><Edit2 size={13} /></button>
                    {user?.role === 'ADMIN' && <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(p._id)}><Trash2 size={13} /></button>}
                  </div>
                )}
              </div>
              {p.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{p.description}</p>}
              <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Created {new Date(p.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{modal === 'create' ? 'New Project' : 'Edit Project'}</h3>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setModal(null)}><X size={15} /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label>Project Name *</label>
                <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Alpha Sprint" autoFocus />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Save size={14} />}
                {modal === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
