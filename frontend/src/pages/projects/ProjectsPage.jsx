import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Modal from '../../components/common/Modal';
import { projectAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, FolderKanban, Users, Calendar, MoreVertical, Archive, Trash2, Edit } from 'lucide-react';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#8B5CF6'
  });

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectAPI.getAll({ status: 'active' })
  });

  const createMutation = useMutation({
    mutationFn: projectAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      toast.success('Проект создан успешно!');
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка создания проекта');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => projectAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      toast.success('Проект обновлен!');
      setEditingProject(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка обновления');
    }
  });

  const archiveMutation = useMutation({
    mutationFn: projectAPI.archive,
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      toast.success('Проект архивирован');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: projectAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      toast.success('Проект удален');
    }
  });

  const projects = data?.data?.data?.projects || [];

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#8B5CF6' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProject) {
      updateMutation.mutate({ id: editingProject._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      color: project.color || '#8B5CF6'
    });
    setIsCreateModalOpen(true);
  };

  const handleArchive = (id) => {
    if (confirm('Архивировать этот проект?')) {
      archiveMutation.mutate(id);
    }
  };

  const handleDelete = (id) => {
    if (confirm('Удалить этот проект? Это действие необратимо!')) {
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
          <h1 className="text-3xl font-bold mb-2">Проекты</h1>
          <p className="text-gray-600">Управление вашими проектами</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingProject(null);
            setIsCreateModalOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Создать проект
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card text-center py-12">
          <FolderKanban className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold mb-2">Нет проектов</h3>
          <p className="text-gray-600 mb-4">Создайте свой первый проект</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            Создать проект
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project._id}
              className="card hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => navigate(`/projects/${project._id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: project.color || '#8B5CF6' }}
                >
                  {project.name.charAt(0).toUpperCase()}
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const menu = e.currentTarget.nextElementSibling;
                      menu.classList.toggle('hidden');
                    }}
                    className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  <div className="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(project);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Редактировать
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchive(project._id);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Archive className="w-4 h-4" />
                      Архивировать
                    </button>
                    {project.role === 'Owner' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(project._id);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-error"
                      >
                        <Trash2 className="w-4 h-4" />
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-2">{project.name}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {project.description || 'Нет описания'}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {project.members?.length || 0}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(project.createdAt).toLocaleDateString('ru-RU')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingProject(null);
          resetForm();
        }}
        title={editingProject ? 'Редактировать проект' : 'Создать проект'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Название проекта *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Мой проект"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={4}
              placeholder="Описание проекта..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Цвет</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-12 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="input flex-1"
                placeholder="#8B5CF6"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingProject(null);
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
                editingProject ? 'Сохранить' : 'Создать'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default ProjectsPage;
