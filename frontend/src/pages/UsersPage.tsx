// client/src/pages/UsersPage.tsx
import { useState, useEffect } from 'react';
import { Shield, Trash2, Plus, X, Save } from 'lucide-react';
import { User, Role } from '../types';
import { usersApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ROLES: Role[] = ['ADMIN', 'MANAGER', 'MEMBER'];

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'MEMBER' as Role });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  async function fetchUsers() {
    setLoading(true);
    try { 
      const { data } = await usersApi.list(); 
      setUsers(data.data); 
    } catch { 
      setUsers([]); 
    } finally { 
      setLoading(false); 
    }
  }

  useEffect(() => { 
    fetchUsers(); 
  }, []);

  async function handleRoleChange(id: string, role: Role) {
    try { 
      await usersApi.updateRole(id, role); 
      fetchUsers(); 
    } catch (err: any) { 
      setError(err.response?.data?.message ?? 'Failed to update role'); 
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name} from the organization?`)) return;
    try { 
      await usersApi.delete(id); 
      fetchUsers(); 
    } catch (err: any) { 
      setError(err.response?.data?.message ?? 'Delete failed'); 
    }
  }

  const roleBadge = (role: Role) => {
    const cls = role === 'ADMIN' ? 'badge-admin' : role === 'MANAGER' ? 'badge-manager' : 'badge-member';
    return <span className={`badge ${cls}`}>{role}</span>;
  };

  const setFormKey = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      await usersApi.createUser(form);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'MEMBER' });
      fetchUsers();
    } catch (err: any) {
      setCreateError(err.response?.data?.message ?? 'Failed to add team member');
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div className="breadcrumbs">
        Administration <span>/</span> Team Members
      </div>

      <div className="page-header">
        <h1>Team Members</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {me?.role === 'ADMIN' && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={14} /> Add Member
            </button>
          )}
          <div className="badge badge-admin" style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Shield size={12} /> Admin Only
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 48 }} />
          ))}
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div 
                        className="avatar" 
                        style={{ 
                          width: '32px', 
                          height: '32px', 
                          fontSize: '0.85rem', 
                          fontWeight: 600,
                          background: u.role === 'ADMIN' ? '#ffab00' : u.role === 'MANAGER' ? '#0052cc' : '#f4f5f7',
                          color: u.role === 'MEMBER' ? '#42526e' : '#ffffff',
                          border: '1px solid #dfe1e6'
                        }}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{u.name}</div>
                        {u._id === me?.id && <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 500 }}>You</div>}
                      </div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    {u._id === me?.id ? (
                      roleBadge(u.role)
                    ) : (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value as Role)}
                          style={{ 
                            padding: '4px 20px 4px 8px', 
                            cursor: 'pointer', 
                            fontSize: '0.8rem',
                            height: '28px',
                            width: '110px'
                          }}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date((u as any).createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {u._id !== me?.id && (
                      <button 
                        className="btn btn-danger btn-icon btn-sm" 
                        onClick={() => handleDelete(u._id, u.name)} 
                        title="Remove member"
                        style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '4px' }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#ffebe6';
                          e.currentTarget.style.color = 'var(--danger)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div 
        style={{ 
          marginTop: '1rem', 
          padding: '0.75rem 1rem', 
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)', 
          borderRadius: 'var(--radius)', 
          fontSize: '0.8rem',
          color: 'var(--text-secondary)' 
        }}
      >
        <strong style={{ color: 'var(--text-primary)' }}>Information:</strong> Added members must be created by an Admin user. They can immediately log in to access the shared organization workspace.
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>Add team member</h3>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowModal(false)}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                {createError && <div className="alert alert-error">{createError}</div>}

                <div className="form-group">
                  <label htmlFor="modal-name">Name *</label>
                  <input id="modal-name" type="text" value={form.name} onChange={setFormKey('name')} placeholder="e.g. Sarah Smith" required />
                </div>

                <div className="form-group">
                  <label htmlFor="modal-email">Email *</label>
                  <input id="modal-email" type="email" value={form.email} onChange={setFormKey('email')} placeholder="sarah@company.com" required />
                </div>

                <div className="form-group">
                  <label htmlFor="modal-password">Password *</label>
                  <input id="modal-password" type="password" value={form.password} onChange={setFormKey('password')} placeholder="Min 8 chars, 1 uppercase, 1 number" required />
                </div>

                <div className="form-group">
                  <label htmlFor="modal-role">Role *</label>
                  <select id="modal-role" value={form.role} onChange={setFormKey('role')} required>
                    <option value="MEMBER">Member (Read & Edit assigned tasks)</option>
                    <option value="MANAGER">Manager (Full project & task access)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createLoading}>
                  {createLoading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Save size={12} />}
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
