import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import Layout from '../../components/layout/Layout';
import TaskCard from '../../components/tasks/TaskCard';
import TaskModal from '../../components/tasks/TaskModal';
import { taskAPI } from '../../services/api';
import { Plus, ListTodo } from 'lucide-react';

const PersonalTasksPage = () => {
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

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['personal-tasks'],
    queryFn: () => taskAPI.getAll({ personal: true })
  });

  const tasks = tasksData?.data?.data?.tasks || [];

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }) => taskAPI.update(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['personal-tasks']);
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

  const columns = ['To Do', 'In Progress', 'Done'];

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

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Личные задачи</h1>
        <p className="text-gray-600">Управление вашими личными задачами</p>
      </div>

      {tasks.length === 0 ? (
        <div className="card text-center py-12">
          <ListTodo className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold mb-2">Нет личных задач</h3>
          <p className="text-gray-600 mb-4">Создайте первую личную задачу</p>
          <button
            onClick={() => handleCreateTask('To Do')}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            Создать задачу
          </button>
        </div>
      ) : (
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
      )}

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
          projectId={null}
          initialStatus={selectedColumn}
        />
      )}
    </Layout>
  );
};

export default PersonalTasksPage;
