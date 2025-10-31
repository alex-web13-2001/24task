import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';
import './Dashboard.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    totalProjects: 0,
    activeProjects: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch projects
      const projectsRes = await api.get('/projects');
      const projects = projectsRes.data.projects || [];
      
      // Fetch all tasks from all projects
      let allTasks = [];
      for (const project of projects) {
        try {
          const tasksRes = await api.get(`/projects/${project._id}/tasks`);
          allTasks = [...allTasks, ...(tasksRes.data.tasks || [])];
        } catch (err) {
          console.error(`Error fetching tasks for project ${project._id}:`, err);
        }
      }

      // Calculate statistics
      const now = new Date();
      const completedTasks = allTasks.filter(t => t.status === 'Выполнено');
      const inProgressTasks = allTasks.filter(t => t.status === 'В работе');
      const overdueTasks = allTasks.filter(t => {
        if (!t.dueDate || t.status === 'Выполнено') return false;
        return new Date(t.dueDate) < now;
      });

      setStats({
        totalTasks: allTasks.length,
        completedTasks: completedTasks.length,
        inProgressTasks: inProgressTasks.length,
        overdueTasks: overdueTasks.length,
        totalProjects: projects.length,
        activeProjects: projects.filter(p => !p.isArchived).length,
      });

      // Get recent tasks (last 5)
      const sortedTasks = allTasks
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentTasks(sortedTasks);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Новая': 'status-new',
      'В работе': 'status-progress',
      'На проверке': 'status-review',
      'Выполнено': 'status-done',
    };
    return colors[status] || 'status-new';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Низкий': 'priority-low',
      'Средний': 'priority-medium',
      'Высокий': 'priority-high',
    };
    return colors[priority] || 'priority-medium';
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="dashboard-loading">
          <div className="spinner-large"></div>
          <p>Загрузка данных...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Добро пожаловать, {user?.name}!</h1>
            <p className="dashboard-subtitle">
              Вот обзор ваших задач и проектов
            </p>
          </div>
          <Link to="/projects" className="btn-primary">
            <span>+</span>
            Создать проект
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalTasks}</div>
              <div className="stat-label">Всего задач</div>
            </div>
          </div>

          <div className="stat-card stat-success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.completedTasks}</div>
              <div className="stat-label">Выполнено</div>
            </div>
          </div>

          <div className="stat-card stat-warning">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-value">{stats.inProgressTasks}</div>
              <div className="stat-label">В работе</div>
            </div>
          </div>

          <div className="stat-card stat-danger">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <div className="stat-value">{stats.overdueTasks}</div>
              <div className="stat-label">Просрочено</div>
            </div>
          </div>

          <div className="stat-card stat-info">
            <div className="stat-icon">📁</div>
            <div className="stat-content">
              <div className="stat-value">{stats.activeProjects}</div>
              <div className="stat-label">Активных проектов</div>
            </div>
          </div>

          <div className="stat-card stat-secondary">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">
                {stats.totalTasks > 0
                  ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
                  : 0}%
              </div>
              <div className="stat-label">Прогресс</div>
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Последние задачи</h2>
            <Link to="/projects" className="section-link">
              Все задачи →
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>Нет задач</h3>
              <p>Создайте проект и добавьте первую задачу</p>
              <Link to="/projects" className="btn-primary">
                Создать проект
              </Link>
            </div>
          ) : (
            <div className="tasks-list">
              {recentTasks.map((task) => (
                <div key={task._id} className="task-item">
                  <div className="task-main">
                    <div className="task-title">{task.title}</div>
                    {task.description && (
                      <div className="task-description">{task.description}</div>
                    )}
                  </div>
                  <div className="task-meta">
                    <span className={`task-status ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    <span className={`task-priority ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span className="task-date">
                        📅 {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2>Быстрые действия</h2>
          <div className="quick-actions">
            <Link to="/projects" className="action-card">
              <div className="action-icon">📁</div>
              <div className="action-title">Проекты</div>
              <div className="action-description">
                Управление проектами и задачами
              </div>
            </Link>

            <Link to="/personal-tasks" className="action-card">
              <div className="action-icon">✏️</div>
              <div className="action-title">Личные задачи</div>
              <div className="action-description">
                Ваши персональные задачи
              </div>
            </Link>

            <Link to="/categories" className="action-card">
              <div className="action-icon">🏷️</div>
              <div className="action-title">Категории</div>
              <div className="action-description">
                Управление категориями
              </div>
            </Link>

            <Link to="/profile" className="action-card">
              <div className="action-icon">👤</div>
              <div className="action-title">Профиль</div>
              <div className="action-description">
                Настройки аккаунта
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
