// client/src/pages/UsersPage.tsx
import { useState, useEffect } from 'react';
import { Users, Shield, Trash2, ChevronDown } from 'lucide-react';
import { User, Role } from '../types';
import { usersApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ROLES: Role[] = ['ADMIN', 'MANAGER', 'MEMBER'];

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchUsers() {
    setLoading(true);
    try { const { data } = await usersApi.list(); setUsers(data.data); }
    catch { setUsers([]); } finally { setLoading(false); }
  }

  useEffect(() => { fetchUsers(); }, []);

  async function handleRoleChange(id: string, role: Role) {
    try { await usersApi.updateRole(id, role); fetchUsers(); }
    catch (err: any) { setError(err.response?.data?.message ?? 'Failed to update role'); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name} from the organization?`)) return;
    try { await usersApi.delete(id); fetchUsers(); }
    catch (err: any) { setError(err.response?.data?.message ?? 'Delete failed'); }
  }

  const roleBadge = (role: Role) => {
    const cls = role === 'ADMIN' ? 'badge-admin' : role === 'MANAGER' ? 'badge-manager' : 'badge-member';
    return <span className={`badge ${cls}`}>{role}</span>;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Team Members</h1>
        <div className="badge badge-admin" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          <Shield size={12} /> Admin Only
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56 }} />)}
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
                      <div className="avatar avatar-lg">{u.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                        {u._id === me?.id && <div style={{ fontSize: '0.7rem', color: 'var(--accent-light)' }}>You</div>}
                      </div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    {u._id === me?.id ? roleBadge(u.role) : (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value as Role)}
                          style={{ appearance: 'none', paddingRight: '1.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    )}
                  </td>
                  <td>{new Date((u as any).createdAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    {u._id !== me?.id && (
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(u._id, u.name)} title="Remove">
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

      <div style={{ marginTop: '1rem', padding: '0.875rem 1rem', background: 'var(--bg-card)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.8rem',
        color: 'var(--text-muted)' }}>
        <strong style={{ color: 'var(--text-secondary)' }}>Note:</strong> To add new members, they should register
        and contact you to be added to your organization.
      </div>
    </div>
  );
}
