import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Modal from '../common/Modal';
import { taskAPI, categoryAPI, projectAPI } from '../../services/api';
import socketService from '../../services/socket';
import toast from 'react-hot-toast';
import { Trash2, Upload, X } from 'lucide-react';

const TaskModal = ({ isOpen, onClose, task, projectId, initialStatus }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: initialStatus || 'To Do',
    priority: 'Medium',
    deadline: '',
    category: '',
    assignee: '',
    project: projectId || ''
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAll({})
  });

  const { data: projectData } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectAPI.getById(projectId),
    enabled: !!projectId
  });

  const categories = categoriesData?.data?.data?.categories || [];
  const project = projectData?.data?.data?.project;
  const members = project?.members || [];

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'To Do',
        priority: task.priority || 'Medium',
        deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
        category: task.category?._id || '',
        assignee: task.assignee?._id || '',
        project: task.project?._id || projectId || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: initialStatus || 'To Do',
        priority: 'Medium',
        deadline: '',
        category: '',
        assignee: '',
        project: projectId || ''
      });
    }
  }, [task, initialStatus, projectId]);

  const createMutation = useMutation({
    mutationFn: taskAPI.create,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['tasks']);
      if (projectId) {
        socketService.emitTaskCreated(projectId, response.data.data.task);
      }
      toast.success('Задача создана!');
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка создания задачи');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => taskAPI.update(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['tasks']);
      if (projectId) {
        socketService.emitTaskUpdated(projectId, response.data.data.task);
      }
      toast.success('Задача обновлена!');
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка обновления задачи');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: taskAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      if (projectId) {
        socketService.emitTaskDeleted(projectId, task._id);
      }
      toast.success('Задача удалена!');
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка удаления задачи');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      category: formData.category || undefined,
      assignee: formData.assignee || undefined,
      deadline: formData.deadline || undefined
    };

    if (task) {
      updateMutation.mutate({ id: task._id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = () => {
    if (confirm('Удалить эту задачу?')) {
      deleteMutation.mutate(task._id);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Редактировать задачу' : 'Создать задачу'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Название *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="input"
            placeholder="Название задачи"
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
            placeholder="Описание задачи..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Статус</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="input"
            >
              {project?.columns?.map((col) => (
                <option key={col} value={col}>{col}</option>
              )) || (
                <>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Приоритет</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="input"
            >
              <option value="Low">Низкий</option>
              <option value="Medium">Средний</option>
              <option value="High">Высокий</option>
              <option value="Urgent">Срочный</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Дедлайн</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Категория</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input"
            >
              <option value="">Без категории</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {projectId && (
          <div>
            <label className="block text-sm font-medium mb-2">Исполнитель</label>
            <select
              value={formData.assignee}
              onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
              className="input"
            >
              <option value="">Не назначен</option>
              {members.map((member) => (
                <option key={member.user._id} value={member.user._id}>
                  {member.user.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t">
          {task && (
            <button
              type="button"
              onClick={handleDelete}
              className="btn btn-danger"
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4" />
              Удалить
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <>
                <span className="spinner"></span>
                Сохранение...
              </>
            ) : (
              task ? 'Сохранить' : 'Создать'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskModal;
