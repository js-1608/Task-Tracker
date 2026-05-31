// client/src/components/Sidebar.tsx
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Layers, Folder, BarChart3, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const showAnalytics = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const showUsers = user?.role === 'ADMIN';

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <span className="sidebar-org-name">My Workspace</span>
        <button
          className="sidebar-toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar-menu">
        <div className="sidebar-section-title">Planning</div>
        
        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Layers size={18} />
          <span className="sidebar-link-text">Kanban Board</span>
        </NavLink>

        <NavLink to="/projects" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Folder size={18} />
          <span className="sidebar-link-text">Projects</span>
        </NavLink>

        {showAnalytics && (
          <>
            <div className="sidebar-section-title" style={{ marginTop: '1rem' }}>Analytics</div>
            <NavLink to="/analytics" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <BarChart3 size={18} />
              <span className="sidebar-link-text">Reports & Stats</span>
            </NavLink>
          </>
        )}

        {showUsers && (
          <>
            <div className="sidebar-section-title" style={{ marginTop: '1rem' }}>Administration</div>
            <NavLink to="/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span className="sidebar-link-text">Team Members</span>
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}
