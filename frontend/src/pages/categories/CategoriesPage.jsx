import { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import './Categories.css';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#8B5CF6',
    description: '',
  });

  const colorOptions = [
    { value: '#8B5CF6', label: 'Фиолетовый' },
    { value: '#3B82F6', label: 'Синий' },
    { value: '#10B981', label: 'Зеленый' },
    { value: '#F59E0B', label: 'Оранжевый' },
    { value: '#EF4444', label: 'Красный' },
    { value: '#EC4899', label: 'Розовый' },
    { value: '#6366F1', label: 'Индиго' },
    { value: '#14B8A6', label: 'Бирюзовый' },
    { value: '#F97316', label: 'Оранжево-красный' },
    { value: '#84CC16', label: 'Лайм' },
    { value: '#06B6D4', label: 'Циан' },
    { value: '#8B5A3C', label: 'Коричневый' },
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, formData);
      } else {
        await api.post('/categories', formData);
      }
      closeModal();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      description: category.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (categoryId) => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию?')) return;
    try {
      await api.delete(`/categories/${categoryId}`);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      color: '#8B5CF6',
      description: '',
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="page-loading">
          <div className="spinner-large"></div>
          <p>Загрузка категорий...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="categories-page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Категории</h1>
            <p className="page-subtitle">
              Управление категориями задач
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => setShowModal(true)}
          >
            <span>+</span>
            Создать категорию
          </button>
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏷️</div>
            <h3>Нет категорий</h3>
            <p>Создайте первую категорию для организации задач</p>
            <button
              className="btn-primary"
              onClick={() => setShowModal(true)}
            >
              Создать категорию
            </button>
          </div>
        ) : (
          <div className="categories-grid">
            {categories.map((category) => (
              <div
                key={category._id}
                className="category-card"
                style={{ borderLeftColor: category.color }}
              >
                <div className="category-header">
                  <div
                    className="category-color-circle"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="category-info">
                    <h3 className="category-name">{category.name}</h3>
                    {category.description && (
                      <p className="category-description">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="category-stats">
                  <div className="category-stat">
                    <span className="stat-icon">📋</span>
                    <span className="stat-text">
                      {category.taskCount || 0} задач
                    </span>
                  </div>
                </div>

                <div className="category-actions">
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => handleEdit(category)}
                  >
                    ✏️ Редактировать
                  </button>
                  <button
                    className="btn-danger btn-sm"
                    onClick={() => handleDelete(category._id)}
                  >
                    🗑️ Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Category Modal */}
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title={editingCategory ? 'Редактировать категорию' : 'Создать категорию'}
        >
          <form onSubmit={handleSubmit} className="category-form">
            <div className="form-group">
              <label htmlFor="name">Название категории *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Введите название категории"
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
                placeholder="Введите описание категории"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="color">Цвет категории</label>
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
                onClick={closeModal}
              >
                Отмена
              </button>
              <button type="submit" className="btn-primary">
                {editingCategory ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default CategoriesPage;
