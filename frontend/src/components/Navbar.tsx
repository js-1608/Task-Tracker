// client/src/components/Navbar.tsx
import { Link, useNavigate } from 'react-router-dom';
import { Layers, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onCreateTask?: () => void;
}

export default function Navbar({ onCreateTask }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  // Get project creation capability (Admins and Managers can create tasks)
  const canCreate = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <Link to="/" className="navbar-brand">
          <div className="navbar-brand-icon">
            <Layers size={14} color="#0747a6" />
          </div>
          <span style={{ fontWeight: 700, letterSpacing: '-0.01em', fontSize: '1.05rem' }}>
            TaskTracker
          </span>
        </Link>

        {canCreate && onCreateTask && (
          <button 
            onClick={onCreateTask}
            className="btn"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '3px',
              transition: 'background 0.12s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
          >
            Create
          </button>
        )}
      </div>

      <div className="navbar-right">
        <div className="navbar-user">
          <div className="avatar" style={{ background: '#ffab00', color: '#172b4d', fontWeight: 600 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, marginLeft: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#ffffff' }}>
              {user?.name}
            </span>
            <span style={{ fontSize: '0.65rem', color: '#deebff', opacity: 0.8 }}>
              {user?.role}
            </span>
          </div>
        </div>

        <button 
          className="btn" 
          onClick={handleLogout} 
          title="Log out"
          style={{
            background: 'transparent',
            color: '#deebff',
            padding: '6px',
            borderRadius: '3px',
            border: 'none',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}
