import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AppLayout.css';

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      path: '/dashboard',
      icon: '📊',
      label: 'Дашборд',
    },
    {
      path: '/projects',
      icon: '📁',
      label: 'Проекты',
    },
    {
      path: '/personal-tasks',
      icon: '✓',
      label: 'Личные задачи',
    },
    {
      path: '/categories',
      icon: '🏷️',
      label: 'Категории',
    },
    {
      path: '/archive',
      icon: '📦',
      label: 'Архив',
    },
    {
      path: '/profile',
      icon: '👤',
      label: 'Профиль',
    },
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const closeSidebar = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="app-layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button
          className="hamburger-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <div className="mobile-header-logo">
          <span className="logo-icon">T24</span>
          <span className="logo-text">Task24</span>
        </div>

        <div className="mobile-header-user">
          <div className="user-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <span>{user?.name?.charAt(0) || 'U'}</span>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">T24</span>
            {!sidebarCollapsed && <span className="logo-text">Task24</span>}
          </div>
          
          <button
            className="sidebar-collapse-btn desktop-only"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* User Info */}
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <span>{user?.name?.charAt(0) || 'U'}</span>
            )}
          </div>
          {!sidebarCollapsed && (
            <div className="user-info">
              <div className="user-name">{user?.name || 'Пользователь'}</div>
              <div className="user-email">{user?.email || ''}</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={closeSidebar}
              title={sidebarCollapsed ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button
            className="logout-btn"
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Выход' : ''}
          >
            <span className="nav-icon">🚪</span>
            {!sidebarCollapsed && <span>Выход</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
