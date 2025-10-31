import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import Layout from '../../components/layout/Layout';
import Modal from '../../components/common/Modal';
import TaskCard from '../../components/tasks/TaskCard';
import TaskModal from '../../components/tasks/TaskModal';
import { projectAPI, taskAPI } from '../../services/api';
import socketService from '../../services/socket';
import toast from 'react-hot-toast';
import { Plus, Settings, Users, ArrowLeft } from 'lucide-react';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectAPI.getById(id)
  });

  const { data: tasksData } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => taskAPI.getAll({ project: id })
  });

  const project = projectData?.data?.data?.project;
  const tasks = tasksData?.data?.data?.tasks || [];

  // Socket.IO integration
  useEffect(() => {
    if (id) {
      socketService.joinProject(id);

      const handleTaskUpdated = (task) => {
        queryClient.invalidateQueries(['tasks', id]);
      };

      const handleTaskCreated = (task) => {
        queryClient.invalidateQueries(['tasks', id]);
      };

      const handleTaskDeleted = () => {
        queryClient.invalidateQueries(['tasks', id]);
      };

      socketService.onTaskUpdated(handleTaskUpdated);
      socketService.onTaskCreated(handleTaskCreated);
      socketService.onTaskDeleted(handleTaskDeleted);

      return () => {
        socketService.leaveProject(id);
        socketService.off('task-updated', handleTaskUpdated);
        socketService.off('task-created', handleTaskCreated);
        socketService.off('task-deleted', handleTaskDeleted);
      };
    }
  }, [id, queryClient]);

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }) => taskAPI.update(taskId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['tasks', id]);
      socketService.emitTaskUpdated(id, variables.data);
    }
  });

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t._id === active.id);
    setActiveTask(task);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;

    const task = tasks.find(t => t._id === taskId);
    if (task && task.status !== newStatus) {
      updateTaskMutation.mutate({
        taskId,
        data: { status: newStatus }
      });
    }
  };

  const handleCreateTask = (columnName) => {
    setSelectedColumn(columnName);
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const columns = project?.columns || ['To Do', 'In Progress', 'Done'];

  const getTasksByColumn = (columnName) => {
    return tasks.filter(task => task.status === columnName);
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

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Проект не найден</p>
          <button onClick={() => navigate('/projects')} className="btn btn-primary">
            Вернуться к проектам
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Назад к проектам
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
              style={{ backgroundColor: project.color || '#8B5CF6' }}
            >
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <p className="text-gray-600">{project.description || 'Нет описания'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="btn btn-outline">
              <Users className="w-5 h-5" />
              Участники ({project.members?.length || 0})
            </button>
            <button className="btn btn-outline">
              <Settings className="w-5 h-5" />
              Настройки
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4">
          {columns.map((columnName) => {
            const columnTasks = getTasksByColumn(columnName);
            return (
              <div
                key={columnName}
                className="flex-shrink-0 w-80 bg-gray-100 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700">
                    {columnName} ({columnTasks.length})
                  </h3>
                  <button
                    onClick={() => handleCreateTask(columnName)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <SortableContext
                  id={columnName}
                  items={columnTasks.map(t => t._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3 min-h-[200px]">
                    {columnTasks.map((task) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onClick={() => handleEditTask(task)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="opacity-50">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedTask(null);
            setSelectedColumn(null);
          }}
          task={selectedTask}
          projectId={id}
          initialStatus={selectedColumn}
        />
      )}
    </Layout>
  );
};

export default ProjectDetailPage;
