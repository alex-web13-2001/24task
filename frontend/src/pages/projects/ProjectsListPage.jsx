import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import './Projects.css';

const ProjectsListPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#8B5CF6',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', formData);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', color: '#8B5CF6' });
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleEditProject = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/projects/${selectedProject._id}`, formData);
      setShowEditModal(false);
      setSelectedProject(null);
      setFormData({ name: '', description: '', color: '#8B5CF6' });
      fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleArchiveProject = async (projectId) => {
    if (!confirm('Вы уверены, что хотите архивировать этот проект?')) return;
    try {
      await api.put(`/projects/${projectId}/archive`);
      fetchProjects();
    } catch (error) {
      console.error('Error archiving project:', error);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!confirm('Вы уверены, что хотите удалить этот проект? Это действие нельзя отменить.')) return;
    try {
      await api.delete(`/projects/${projectId}`);
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const openEditModal = (project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      color: project.color || '#8B5CF6',
    });
    setShowEditModal(true);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const colorOptions = [
    { value: '#8B5CF6', label: 'Фиолетовый' },
    { value: '#3B82F6', label: 'Синий' },
    { value: '#10B981', label: 'Зеленый' },
    { value: '#F59E0B', label: 'Оранжевый' },
    { value: '#EF4444', label: 'Красный' },
    { value: '#EC4899', label: 'Розовый' },
    { value: '#6366F1', label: 'Индиго' },
    { value: '#14B8A6', label: 'Бирюзовый' },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className="page-loading">
          <div className="spinner-large"></div>
          <p>Загрузка проектов...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="projects-page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Проекты</h1>
            <p className="page-subtitle">
              Управление проектами и задачами
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <span>+</span>
            Создать проект
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h3>Нет проектов</h3>
            <p>Создайте свой первый проект для начала работы</p>
            <button
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              Создать проект
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <div
                key={project._id}
                className="project-card"
                style={{ borderLeftColor: project.color }}
              >
                <div
                  className="project-card-header"
                  onClick={() => navigate(`/projects/${project._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="project-info">
                    <h3 className="project-name">{project.name}</h3>
                    {project.description && (
                      <p className="project-description">{project.description}</p>
                    )}
                  </div>
                </div>

                <div className="project-card-body">
                  <div className="project-stats">
                    <div className="project-stat">
                      <span className="stat-icon">👥</span>
                      <span className="stat-text">
                        {project.members?.length || 0} участников
                      </span>
                    </div>
                    <div className="project-stat">
                      <span className="stat-icon">📅</span>
                      <span className="stat-text">
                        {formatDate(project.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="project-card-footer">
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => openEditModal(project)}
                  >
                    ✏️ Редактировать
                  </button>
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => handleArchiveProject(project._id)}
                  >
                    📦 Архивировать
                  </button>
                  <button
                    className="btn-danger btn-sm"
                    onClick={() => handleDeleteProject(project._id)}
                  >
                    🗑️ Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setFormData({ name: '', description: '', color: '#8B5CF6' });
          }}
          title="Создать проект"
        >
          <form onSubmit={handleCreateProject} className="project-form">
            <div className="form-group">
              <label htmlFor="name">Название проекта *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Введите название проекта"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Описание</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Введите описание проекта"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="color">Цвет проекта</label>
              <div className="color-picker">
                {colorOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`color-option ${
                      formData.color === option.value ? 'selected' : ''
                    }`}
                    style={{ backgroundColor: option.value }}
                    title={option.label}
                  >
                    <input
                      type="radio"
                      name="color"
                      value={option.value}
                      checked={formData.color === option.value}
                      onChange={handleChange}
                    />
                    {formData.color === option.value && <span>✓</span>}
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: '', description: '', color: '#8B5CF6' });
                }}
              >
                Отмена
              </button>
              <button type="submit" className="btn-primary">
                Создать
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Project Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProject(null);
            setFormData({ name: '', description: '', color: '#8B5CF6' });
          }}
          title="Редактировать проект"
        >
          <form onSubmit={handleEditProject} className="project-form">
            <div className="form-group">
              <label htmlFor="edit-name">Название проекта *</label>
              <input
                type="text"
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Введите название проекта"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-description">Описание</label>
              <textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Введите описание проекта"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-color">Цвет проекта</label>
              <div className="color-picker">
                {colorOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`color-option ${
                      formData.color === option.value ? 'selected' : ''
                    }`}
                    style={{ backgroundColor: option.value }}
                    title={option.label}
                  >
                    <input
                      type="radio"
                      name="color"
                      value={option.value}
                      checked={formData.color === option.value}
                      onChange={handleChange}
                    />
                    {formData.color === option.value && <span>✓</span>}
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedProject(null);
                  setFormData({ name: '', description: '', color: '#8B5CF6' });
                }}
              >
                Отмена
              </button>
              <button type="submit" className="btn-primary">
                Сохранить
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default ProjectsListPage;
