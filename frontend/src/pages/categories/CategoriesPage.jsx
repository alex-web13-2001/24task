import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/layout/Layout';
import Modal from '../../components/common/Modal';
import { categoryAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';

const CategoriesPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#8B5CF6',
    description: ''
  });

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAll({})
  });

  const { data: statsData } = useQuery({
    queryKey: ['categories-stats'],
    queryFn: () => categoryAPI.getStats()
  });

  const createMutation = useMutation({
    mutationFn: categoryAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      queryClient.invalidateQueries(['categories-stats']);
      toast.success('Категория создана!');
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка создания категории');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => categoryAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      queryClient.invalidateQueries(['categories-stats']);
      toast.success('Категория обновлена!');
      setIsModalOpen(false);
      setEditingCategory(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка обновления');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: categoryAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      queryClient.invalidateQueries(['categories-stats']);
      toast.success('Категория удалена!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка удаления');
    }
  });

  const categories = data?.data?.data?.categories || [];
  const stats = statsData?.data?.data?.stats || {};

  const resetForm = () => {
    setFormData({ name: '', color: '#8B5CF6', description: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      description: category.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Удалить эту категорию? Она будет удалена из всех задач.')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="spinner" style={{ width: 40, height: 40 }}></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Категории</h1>
          <p className="text-gray-600">Управление категориями задач</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingCategory(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Создать категорию
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="card text-center py-12">
          <Tag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold mb-2">Нет категорий</h3>
          <p className="text-gray-600 mb-4">Создайте первую категорию для организации задач</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            Создать категорию
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const usageCount = stats[category._id] || 0;
            return (
              <div
                key={category._id}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.color }}
                    >
                      <Tag className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                      <p className="text-sm text-gray-500">
                        {usageCount} {usageCount === 1 ? 'задача' : 'задач'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(category._id)}
                      className="p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                {category.description && (
                  <p className="text-sm text-gray-600">{category.description}</p>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-xs text-gray-500 font-mono">
                      {category.color}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
          resetForm();
        }}
        title={editingCategory ? 'Редактировать категорию' : 'Создать категорию'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Название *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Название категории"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={3}
              placeholder="Описание категории..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Цвет</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-16 h-12 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="input flex-1"
                placeholder="#8B5CF6"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Выберите цвет для визуального различия категорий
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingCategory(null);
                resetForm();
              }}
              className="btn btn-secondary flex-1"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <span className="spinner"></span>
                  Сохранение...
                </>
              ) : (
                editingCategory ? 'Сохранить' : 'Создать'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default CategoriesPage;
