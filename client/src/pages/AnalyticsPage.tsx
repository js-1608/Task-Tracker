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
      <div className="page-header">
        <h1>Analytics</h1>
        <span className="badge badge-manager" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          <BarChart2 size={12} /> ADMIN / MANAGER
        </span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="stats-grid">
          {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 96 }} />)}
        </div>
      ) : stats && (
        <>
          {/* Summary stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
              <div className="stat-value" style={{ color: 'var(--danger)' }}>
                {stats.overdueByUser.reduce((s, u) => s + u.overdueCount, 0)}
              </div>
              <div className="stat-label">Total Overdue Tasks</div>
            </div>
            <div className="stat-card">
              <Clock size={18} style={{ color: 'var(--accent-light)' }} />
              <div className="stat-value" style={{ color: 'var(--accent-light)' }}>
                {stats.avgCompletionHours !== null ? `${stats.avgCompletionHours}h` : '—'}
              </div>
              <div className="stat-label">Avg Completion Time</div>
            </div>
            <div className="stat-card">
              <TrendingUp size={18} style={{ color: 'var(--success)' }} />
              <div className="stat-value" style={{ color: 'var(--success)' }}>
                {stats.overdueByUser.length}
              </div>
              <div className="stat-label">Members with Overdue Tasks</div>
            </div>
          </div>

          {/* Overdue by user bar chart */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
              Overdue Tasks by Assignee
            </h3>

            {stats.overdueByUser.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <TrendingUp size={40} />
                <p>No overdue tasks 🎉</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stats.overdueByUser.map((u) => (
                  <div key={u.userId}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="avatar">{u.userName.charAt(0).toUpperCase()}</div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{u.userName}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</span>
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--danger)' }}>
                        {u.overdueCount}
                      </span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                      <div style={{
                        width: `${(u.overdueCount / maxOverdue) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--danger), #f97316)',
                        borderRadius: 4,
                        transition: 'width 0.6s ease',
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
