import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AppLayout from '../../components/layout/AppLayout';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import './Kanban.css';

// Task Card Component
const TaskCard = ({ task, isDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Низкий': '#10B981',
      'Средний': '#F59E0B',
      'Высокий': '#EF4444',
    };
    return colors[priority] || '#6B7280';
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-card ${isDragging ? 'dragging' : ''}`}
    >
      <div className="task-card-header">
        <h4 className="task-card-title">{task.title}</h4>
        <span
          className="task-priority-badge"
          style={{ backgroundColor: getPriorityColor(task.priority) }}
        >
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="task-card-description">{task.description}</p>
      )}

      <div className="task-card-footer">
        {task.category && (
          <span
            className="task-category"
            style={{ backgroundColor: task.category.color + '20', color: task.category.color }}
          >
            {task.category.name}
          </span>
        )}
        {task.dueDate && (
          <span className="task-due-date">
            📅 {formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
};

// Kanban Column Component
const KanbanColumn = ({ column, tasks }) => {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: 'column' },
  });

  return (
    <div className="kanban-column" ref={setNodeRef}>
      <div className="kanban-column-header">
        <h3>{column.title}</h3>
        <span className="task-count">{tasks.length}</span>
      </div>

      <SortableContext
        items={tasks.map(t => t._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="kanban-column-content">
          {tasks.length === 0 ? (
            <div className="empty-column">
              <p>Перетащите задачу сюда</p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

const ProjectKanbanPage = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Новая',
    priority: 'Средний',
    category: '',
    dueDate: '',
  });

  const columns = [
    { id: 'Новая', title: 'Новые' },
    { id: 'В работе', title: 'В работе' },
    { id: 'На проверке', title: 'На проверке' },
    { id: 'Выполнено', title: 'Выполнено' },
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectRes, tasksRes, categoriesRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/tasks`),
        api.get('/categories'),
      ]);

      setProject(projectRes.data.project);
      setTasks(tasksRes.data.tasks || []);
      setCategories(categoriesRes.data.categories || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t._id === active.id);
    setActiveTask(task);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;

    // Find the task
    const task = tasks.find(t => t._id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t._id === taskId ? { ...t, status: newStatus } : t
      )
    );

    // Update on server
    try {
      await api.put(`/projects/${projectId}/tasks/${taskId}`, {
        status: newStatus,
      });
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert on error
      fetchData();
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${projectId}/tasks`, formData);
      setShowTaskModal(false);
      setFormData({
        title: '',
        description: '',
        status: 'Новая',
        priority: 'Средний',
        category: '',
        dueDate: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="page-loading">
          <div className="spinner-large"></div>
          <p>Загрузка проекта...</p>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="empty-state">
          <h3>Проект не найден</h3>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="kanban-page">
        {/* Header */}
        <div className="kanban-header">
          <div>
            <h1>{project.name}</h1>
            {project.description && (
              <p className="project-description">{project.description}</p>
            )}
          </div>
          <button
            className="btn-primary"
            onClick={() => setShowTaskModal(true)}
          >
            <span>+</span>
            Создать задачу
          </button>
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="kanban-board">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={getTasksByStatus(column.id)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
          </DragOverlay>
        </DndContext>

        {/* Create Task Modal */}
        <Modal
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false);
            setFormData({
              title: '',
              description: '',
              status: 'Новая',
              priority: 'Средний',
              category: '',
              dueDate: '',
            });
          }}
          title="Создать задачу"
        >
          <form onSubmit={handleCreateTask} className="task-form">
            <div className="form-group">
              <label htmlFor="title">Название задачи *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Введите название задачи"
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
                placeholder="Введите описание задачи"
                rows="4"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">Статус</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Новая">Новая</option>
                  <option value="В работе">В работе</option>
                  <option value="На проверке">На проверке</option>
                  <option value="Выполнено">Выполнено</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="priority">Приоритет</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="Низкий">Низкий</option>
                  <option value="Средний">Средний</option>
                  <option value="Высокий">Высокий</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Категория</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Без категории</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="dueDate">Дедлайн</label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowTaskModal(false);
                  setFormData({
                    title: '',
                    description: '',
                    status: 'Новая',
                    priority: 'Средний',
                    category: '',
                    dueDate: '',
                  });
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
      </div>
    </AppLayout>
  );
};

export default ProjectKanbanPage;
