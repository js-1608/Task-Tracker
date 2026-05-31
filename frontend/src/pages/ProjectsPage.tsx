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
    try {
      const { data } = await projectsApi.list();
      setProjects(data.data);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  function openCreate() {
    setForm({ name: '', description: '' });
    setModal('create');
    setError('');
  }

  function openEdit(p: Project) {
    setForm({ name: p.name, description: p.description ?? '' });
    setModal(p);
    setError('');
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('Project name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (modal === 'create') await projectsApi.create(form);
      else await projectsApi.update((modal as Project)._id, form);
      setModal(null);
      fetchProjects();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to save project');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this project? This will delete all tasks assigned to it.')) return;
    try {
      await projectsApi.delete(id);
      fetchProjects();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Delete failed');
    }
  }

  return (
    <div className="page-container">
      <div className="breadcrumbs">
        Projects <span>/</span> All Projects
      </div>

      <div className="page-header">
        <h1>Projects</h1>
        {canManage && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={14} /> New Project
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 110 }} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state" style={{ background: '#ffffff', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <Folder size={40} style={{ color: 'var(--text-muted)' }} />
          <h3 style={{ margin: '0.5rem 0' }}>No projects yet</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Projects help you organize team tasks. Let's create your first one.
          </p>
          {canManage && (
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={14} /> Create First Project
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {projects.map((p) => (
            <div
              key={p._id}
              className="stat-card"
              style={{
                padding: '1.25rem',
                justifyContent: 'space-between',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                cursor: 'default'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-hover)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(9,30,66,0.08)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = '0 1px 1px rgba(9,30,66,0.15)';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 3,
                        background: 'rgba(9, 30, 66, 0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Folder size={14} color="#0052cc" />
                    </div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{p.name}</h3>
                  </div>
                  {canManage && (
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button
                        className="btn btn-secondary btn-icon btn-sm"
                        onClick={() => openEdit(p)}
                        title="Edit Project"
                        style={{ padding: '4px', background: 'transparent' }}
                        onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(9, 30, 66, 0.08)')}
                        onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Edit2 size={12} />
                      </button>
                      {user?.role === 'ADMIN' && (
                        <button
                          className="btn btn-danger btn-icon btn-sm"
                          onClick={() => handleDelete(p._id)}
                          title="Delete Project"
                          style={{ padding: '4px', background: 'transparent', color: 'var(--text-secondary)' }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#ffebe6';
                            e.currentTarget.style.color = 'var(--danger)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {p.description && (
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginTop: '0.5rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {p.description}
                  </p>
                )}
              </div>
              <div
                style={{
                  marginTop: '1rem',
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid rgba(9, 30, 66, 0.08)',
                  paddingTop: '0.5rem'
                }}
              >
                Created {new Date(p.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>{modal === 'create' ? 'Create project' : 'Edit project'}</h3>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setModal(null)}>
                <X size={15} />
              </button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label>Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Mobile Application"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe your project here..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Save size={12} />}
                {modal === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
