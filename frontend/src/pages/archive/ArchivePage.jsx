import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/layout/Layout';
import { projectAPI, taskAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Archive, RotateCcw, FolderKanban, ListTodo, Trash2 } from 'lucide-react';

const ArchivePage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' or 'tasks'

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['archived-projects'],
    queryFn: () => projectAPI.getAll({ status: 'archived' })
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['archived-tasks'],
    queryFn: () => taskAPI.getArchived()
  });

  const restoreProjectMutation = useMutation({
    mutationFn: projectAPI.restore,
    onSuccess: () => {
      queryClient.invalidateQueries(['archived-projects']);
      queryClient.invalidateQueries(['projects']);
      toast.success('Проект восстановлен!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка восстановления');
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: projectAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['archived-projects']);
      toast.success('Проект удален!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка удаления');
    }
  });

  const restoreTaskMutation = useMutation({
    mutationFn: taskAPI.restore,
    onSuccess: () => {
      queryClient.invalidateQueries(['archived-tasks']);
      queryClient.invalidateQueries(['tasks']);
      toast.success('Задача восстановлена!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка восстановления');
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: taskAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['archived-tasks']);
      toast.success('Задача удалена!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка удаления');
    }
  });

  const archivedProjects = projectsData?.data?.data?.projects || [];
  const archivedTasks = tasksData?.data?.data?.tasks || [];

  const handleRestoreProject = (id) => {
    if (confirm('Восстановить этот проект?')) {
      restoreProjectMutation.mutate(id);
    }
  };

  const handleDeleteProject = (id) => {
    if (confirm('Удалить этот проект навсегда? Это действие необратимо!')) {
      deleteProjectMutation.mutate(id);
    }
  };

  const handleRestoreTask = (id) => {
    if (confirm('Восстановить эту задачу?')) {
      restoreTaskMutation.mutate(id);
    }
  };

  const handleDeleteTask = (id) => {
    if (confirm('Удалить эту задачу навсегда? Это действие необратимо!')) {
      deleteTaskMutation.mutate(id);
    }
  };

  const isLoading = projectsLoading || tasksLoading;

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Архив</h1>
        <p className="text-gray-600">Архивированные проекты и задачи</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'projects'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <FolderKanban className="w-5 h-5 inline mr-2" />
          Проекты ({archivedProjects.length})
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'tasks'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <ListTodo className="w-5 h-5 inline mr-2" />
          Задачи ({archivedTasks.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner" style={{ width: 40, height: 40 }}></div>
        </div>
      ) : (
        <>
          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <>
              {archivedProjects.length === 0 ? (
                <div className="card text-center py-12">
                  <Archive className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold mb-2">Нет архивных проектов</h3>
                  <p className="text-gray-600">Архивированные проекты появятся здесь</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {archivedProjects.map((project) => (
                    <div key={project._id} className="card">
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                          style={{ backgroundColor: project.color || '#8B5CF6' }}
                        >
                          {project.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="badge badge-primary">Архив</span>
                      </div>

                      <h3 className="text-lg font-semibold mb-2">{project.name}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {project.description || 'Нет описания'}
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRestoreProject(project._id)}
                          className="btn btn-outline btn-sm flex-1"
                          disabled={restoreProjectMutation.isPending}
                        >
                          <RotateCcw className="w-4 h-4" />
                          Восстановить
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project._id)}
                          className="btn btn-danger btn-sm"
                          disabled={deleteProjectMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <>
              {archivedTasks.length === 0 ? (
                <div className="card text-center py-12">
                  <Archive className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold mb-2">Нет архивных задач</h3>
                  <p className="text-gray-600">Архивированные задачи появятся здесь</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {archivedTasks.map((task) => (
                    <div
                      key={task._id}
                      className="card flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">{task.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          {task.project && (
                            <span className="flex items-center gap-1">
                              <FolderKanban className="w-4 h-4" />
                              {task.project.name}
                            </span>
                          )}
                          {task.priority && (
                            <span className={`badge ${
                              task.priority === 'Urgent' ? 'badge-error' :
                              task.priority === 'High' ? 'badge-warning' :
                              'badge-primary'
                            }`}>
                              {task.priority}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRestoreTask(task._id)}
                          className="btn btn-outline btn-sm"
                          disabled={restoreTaskMutation.isPending}
                        >
                          <RotateCcw className="w-4 h-4" />
                          Восстановить
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="btn btn-danger btn-sm"
                          disabled={deleteTaskMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </Layout>
  );
};

export default ArchivePage;
