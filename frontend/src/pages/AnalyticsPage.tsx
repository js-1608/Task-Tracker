// client/src/pages/AnalyticsPage.tsx
import { useState, useEffect } from 'react';
import { BarChart2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { OverdueStats } from '../types';
import { analyticsApi } from '../api/client';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<OverdueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    analyticsApi.overdue()
      .then(({ data }) => setStats(data.data))
      .catch((err) => setError(err.response?.data?.message ?? 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  const maxOverdue = stats ? Math.max(...stats.overdueByUser.map((u) => u.overdueCount), 1) : 1;

  return (
    <div className="page-container">
      <div className="breadcrumbs">
        Analytics <span>/</span> Reports & Stats
      </div>

      <div className="page-header">
        <h1>Reports & Stats</h1>
        <span className="badge badge-admin" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <BarChart2 size={12} /> Admin / Manager Access
        </span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="stats-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 80 }} />
          ))}
        </div>
      ) : stats && (
        <>
          {/* Summary stats */}
          <div className="stats-grid">
            <div className="stat-card" style={{ borderColor: 'var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <AlertTriangle size={15} style={{ color: 'var(--danger)' }} />
                <span className="stat-label">Total Overdue Tasks</span>
              </div>
              <div className="stat-value" style={{ color: 'var(--danger)', marginTop: '0.25rem' }}>
                {stats.overdueByUser.reduce((s, u) => s + u.overdueCount, 0)}
              </div>
            </div>
            
            <div className="stat-card" style={{ borderColor: 'var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Clock size={15} style={{ color: 'var(--accent)' }} />
                <span className="stat-label">Avg Completion Time</span>
              </div>
              <div className="stat-value" style={{ color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {stats.avgCompletionHours !== null ? `${stats.avgCompletionHours}h` : '—'}
              </div>
            </div>

            <div className="stat-card" style={{ borderColor: 'var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <TrendingUp size={15} style={{ color: 'var(--success)' }} />
                <span className="stat-label">Users with Overdue Tasks</span>
              </div>
              <div className="stat-value" style={{ color: 'var(--success)', marginTop: '0.25rem' }}>
                {stats.overdueByUser.length}
              </div>
            </div>
          </div>

          {/* Overdue by user bar chart */}
          <div className="stat-card" style={{ padding: '1.5rem', width: '100%', borderColor: 'var(--border)' }}>
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 600 }}>
              <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
              Overdue Tasks by Assignee
            </h3>

            {stats.overdueByUser.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <TrendingUp size={32} style={{ color: 'var(--success)' }} />
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>All caught up! No overdue tasks 🎉</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {stats.overdueByUser.map((u) => (
                  <div key={u.userId}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div 
                          className="avatar" 
                          style={{ 
                            background: '#deebff', 
                            color: '#0052cc', 
                            fontWeight: 600,
                            width: '24px',
                            height: '24px',
                            fontSize: '0.7rem'
                          }}
                        >
                          {u.userName.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{u.userName}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({u.email})</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--danger)' }}>
                        {u.overdueCount} task{u.overdueCount > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div style={{ background: '#f4f5f7', borderRadius: 3, height: 6, overflow: 'hidden' }}>
                      <div style={{
                        width: `${(u.overdueCount / maxOverdue) * 100}%`,
                        height: '100%',
                        background: 'var(--danger)',
                        borderRadius: 3,
                        transition: 'width 0.4s ease-out',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
